/*
** qAvatar -- the instance and simulation of a quantum mechanical wave in a space
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

#include <ctime>
#include <limits>
#include <cfenv>

#include "../spaceWave/qSpace.h"
#include "qAvatar.h"
#include "../spaceWave/qWave.h"
#include "../fourier/qSpectrum.h"
#include "../spaceWave/qViewBuffer.h"
#include "../fourier/fftMain.h"
#include "../directAccessors.h"


static bool useFourierFilter = true;

static bool traceIteration = false;
static bool traceIterSteps = false;

static bool traceJustWave = false;
static bool traceJustInnerProduct = false;

static bool traceFourierFilter = false;

static bool dumpFFHiResSpectums = false;

static bool traceSpace = true;

// only do some traces if we're past where it's a problem
static int dangerousSerial = 4000;  // for the chord pulse
static int dangerousRate = 250;

//static int dangerousSerial = 50;  // for the short gaussian pulse
//static int dangerousRate = 25;

// those apply to these tracing flags
static bool traceEachFFSquelch = false;
static bool traceEndingFFSpectrum = false;
static bool traceB4nAfterFFSpectrum = false;


/* *********************************************************************************** qAvatar */

// create new avatar, complete with its own wave and view buffers
// make sure these values are doable by the sliders' steps
qAvatar::qAvatar(qSpace *sp)
	: dt(1e-3), stepsPerIteration(100), lowPassFilter(1),
		space(sp), magic('Avat'), pleaseFFT(false), isIterating(false) {

	mainQWave = new qWave(space);
	scratchQWave = NULL;  // until used
	spect = NULL;  // until used

	resetCounters();

	// we always need a view buffer; that's the whole idea behind an avatar
	qvBuffer = new qViewBuffer(space, this);

	if (traceSpace) {
		printf("the qSpace just created:   magic=%c label=%s nDimesions=%d nStates=%d nPoints=%d "
			"potential=%p potentialFactor=%lf spectrumLength=%d  \n",
			space->magic, space->label, space->nDimensions, space->nStates, space->nPoints,
			space->potential, space->potentialFactor, space->spectrumLength);
		qDimension *dims = space->dimensions;
		printf("      its qDimension:   N=%d start=%d end=%d ",
			dims->N, dims->start, dims->end);
		printf("      nStates=%d nPoints=%d\n", dims->nStates, dims->nPoints);
		printf("      its continuum=%d spectrumLength=%d label=%s\n",
			dims->continuum, dims->spectrumLength, dims->label);
	}

	//dumpOffsets();
};

// some uses never need these so wait till they do
qWave *qAvatar::getScratchWave(void) {
	if (!scratchQWave)
		scratchQWave = new qWave(space);
	return scratchQWave;
};

qSpectrum *qAvatar::getSpectrum(void) {
	if (!spect)
		spect = new qSpectrum(space);
	return spect;
};

qAvatar::~qAvatar(void) {
	delete mainQWave;
	delete qvBuffer;

	// these may or may not have been allocated, depending on whether they were needed
	if (scratchQWave)
		delete scratchQWave;
	if (spect)
		delete spect;
};

// need these numbers for the js interface to this object, to figure out the offsets.
// see eAvatar.js ;  usually this function isn't called.
// Insert this into the constructor and run this once.  Copy text output.
// Paste the output into class eAvatar, the class itself, to replace the existing ones
void qAvatar::dumpOffsets(void) {
	// don't need magic
	printf("🚦 🚦 --------------- starting qAvatar direct access --------------\n");

	makeIntGetter(space);
	makeIntSetter(space);

	/* *********************************************** scalars */

	makeDoubleGetter(elapsedTime);
	makeDoubleSetter(elapsedTime);
	makeDoubleGetter(iterateSerial);
	makeDoubleSetter(iterateSerial);
	printf("\n");
	makeBoolGetter(isIterating);
	makeBoolSetter(isIterating);
	makeBoolGetter(pleaseFFT);
	makeBoolSetter(pleaseFFT);
	printf("\n");
	makeDoubleGetter(dt);
	makeDoubleSetter(dt);
	makeIntGetter(lowPassFilter);
	makeIntSetter(lowPassFilter);
	makeIntGetter(stepsPerIteration);
	makeIntSetter(stepsPerIteration);

	/* *********************************************** waves & buffers */

	printf("\n");
	makeIntGetter(mainQWave);
	makeIntSetter(mainQWave);

	printf("\n");
	makeIntGetter(potential);
	makeIntSetter(potential);
	makeDoubleGetter(potentialFactor);
	makeDoubleSetter(potentialFactor);

	printf("\n");
	makeIntGetter(scratchQWave);
	makeIntSetter(scratchQWave);

	// for the fourier filter.  Call the function first time you need it.
	printf("\n");
	makeIntGetter(spect);
	makeIntSetter(spect);

	// the qViewBuffer to be passed to webgl.  This is a visual thing after all.
	printf("\n");
	makeIntGetter(qvBuffer);
	makeIntSetter(qvBuffer);

	printf("🚦 🚦 --------------- done with qAvatar direct access --------------\n");
}

void qAvatar::resetCounters(void) {
	elapsedTime = 0.;
	iterateSerial = 0;
}

/* ********************************************************** integration */

// return elapsed time siince last page reload, in seconds,
// seems like it's down to miliseconds
double getTimeDouble()
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return ts.tv_sec + ts.tv_nsec / 1e9;
}


// Does several visscher steps (eg 100 or 500). Actually does
// stepsPerIteration+1 steps; half steps at start and finish to adapt and
// deadapt to Visscher timing
void qAvatar::oneIteration() {
	int tt;
	bool dangerousTimes = (iterateSerial >= dangerousSerial)
		&& (((int) iterateSerial % dangerousRate) == 0);

	// now we need it
	getScratchWave();

	// update this all the time cuz user might have changed it.  Well, actually,
	// since it's a pointer, maybe not.... maybe just the factor...
	potential = space->potential;
	potentialFactor = space->potentialFactor;

	if (traceIteration)
		printf("🚀 🚀 qAvatar::oneIteration() - dt=%lf   stepsPerIteration=%d  %s; potentialFactor=%lf  elapsed time: %lf\n",
			dt, stepsPerIteration, dangerousTimes ? "dangerous times" : "",
			potentialFactor,
			getTimeDouble());
	isIterating = true;

	// half step in beginning to move Im forward dt/2
	// cuz outside of here, re and im are for the same time.
	// Note here the latest is in scratch; iterate continues this,
	// and the halfwave at the end moves it back to main.
	stepReal(scratchQWave->wave, mainQWave->wave, 0);
	stepImaginary(scratchQWave->wave, mainQWave->wave, dt/2);

	int doubleSteps = stepsPerIteration / 2;
	if (traceIteration)
		printf("      qAvatar: doubleSteps=%d   stepsPerIteration=%d\n",
			doubleSteps, stepsPerIteration);

	for (tt = 0; tt < doubleSteps; tt++) {
		oneVisscherStep(mainQWave, scratchQWave);
		oneVisscherStep(scratchQWave, mainQWave);

		if (traceIteration && 0 == tt % 32) {
			printf("       qAvatar: step every 64, step %d; elapsed time: %lf\n", tt * 2, getTimeDouble());
		}

		if (traceIterSteps) {
			printf("step done %d; elapsed time: %lf \n", tt*2, getTimeDouble());////
		}
	}

	if (traceIteration)
		printf("      qAvatar: %d steps done; elapsed time: %lf \n", stepsPerIteration, getTimeDouble());

	// half step at completion to move Re forward dt/2
	// and copy back to Main
	stepReal(mainQWave->wave, scratchQWave->wave, dt/2);
	stepImaginary(mainQWave->wave, scratchQWave->wave, 0);

	isIterating = false;

	iterateSerial++;

	// ok the algorithm tends to diverge after thousands of iterations.  Hose it down.
	if (useFourierFilter) {
		if (traceB4nAfterFFSpectrum && dangerousTimes) analyzeWaveFFT(mainQWave, "before FF");
		fourierFilter(lowPassFilter);
		if (traceB4nAfterFFSpectrum && dangerousTimes) analyzeWaveFFT(mainQWave, "after FF");
	}

	// need it; somehow? not done in JS.  YES IT IS!  remove this when you have the oppty
	//theQViewBuffer->loadViewBuffer();

	if (traceJustWave) {
		mainQWave->dump("      traceJustWave at end of iteration", true);
	}
	if (traceJustInnerProduct) {
		printf("      traceJustInnerProduct: finished one iteration (%d steps, N=%d), iProduct: %lf\n",
			stepsPerIteration, space->nStates, mainQWave->innerProduct());
	}

	if (this->pleaseFFT) {
		analyzeWaveFFT(mainQWave, "pleaseFFT at end of iteration");
		this->pleaseFFT = false;
	}

	if (traceIteration)
		printf("      iteration done; elapsed time: %lf \n", getTimeDouble());
}



// FFT the wave, cut down the high frequencies, then iFFT it back.
// lowPassFilter is .. kinda changes but maybe #frequencies we zero out
// Can't we eventually find a simple convolution to do this instead of FFT/iFFT?
// maye after i get more of this working and fine toon it
void qAvatar::fourierFilter(int lowPassFilter) {
	// this is when the wave tends to come apart with high frequencies
	bool dangerousTimes = (iterateSerial >= dangerousSerial)
		&& (((int) iterateSerial % dangerousRate) == 0);

	spect = getSpectrum();
	spect->generateSpectrum(mainQWave);
	if (dumpFFHiResSpectums) spect->dumpSpectrum("spect right at start of fourierFilter()");

	// the high frequencies are in the middle
	int nyquist = spect->nPoints/2;
	qCx *s = spect->wave;

	// the nyquist freq is at N/2, ALWAYS block that!!
	s[nyquist] = 0;

	if (traceFourierFilter)
		printf("🌈  fourierFilter: nPoints=%d  nyquist=%d    lowPassFilter=%d\n",
			spect->nPoints, nyquist, lowPassFilter);

	for (int k = 0; k < lowPassFilter; k++) {
		s[nyquist + k] = 0;
		s[nyquist - k] = 0;
		if (traceEachFFSquelch && dangerousTimes) {
			printf("🌈  fourierFilter: smashed in lowPassFilter=%d   [freq: %d which was %lf], "
				"and [freq: %d which was %lf]\n",
				lowPassFilter, nyquist - k, s[nyquist - k].norm(), nyquist + k, s[nyquist + k].norm());
		}
	}

	if (traceEndingFFSpectrum && dangerousTimes) {
			spect->dumpSpectrum("🐠  finished fourierFilter: spectrum");
			//printf("frame iterateSerial=%lf, dangerousSerial=%d,  dangerousRate=%d\n",
			//	iterateSerial, dangerousSerial, dangerousRate);
	}


	if (dumpFFHiResSpectums) spect->dumpSpectrum("spect right at END of fourierFilter()");
	spect->generateWave(mainQWave);
	if (dumpFFHiResSpectums) mainQWave->dumpHiRes("wave END fourierFilter() b4 normalize");
	mainQWave->normalize();
	if (dumpFFHiResSpectums) mainQWave->dumpHiRes("wave END fourierFilter() after normalize");
}



// user button to print it out now, or at end of the next iteration
void qAvatar::askForFFT(void) {
	if (isIterating)
		this->pleaseFFT = true;
	else
		analyzeWaveFFT(mainQWave, "askForFFT while idle");
}

/* **********************************************************  */

/* **********************************************************  */
