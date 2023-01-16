/*
** qGrinder -- the simulation of a quantum mechanical wave in a space
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/
#include <string.h>
#include <ctime>
#include <limits>
#include <cfenv>
#include <stdexcept>

#include "../spaceWave/qSpace.h"
#include "../greiman/qAvatar.h"
#include "qGrinder.h"
#include "../debroglie/qFlick.h"
#include "../fourier/qSpectrum.h"
#include "../fourier/fftMain.h"
#include "../directAccessors.h"



static bool traceIntegration = false;

static bool traceJustWave = false;

static bool traceFourierFilter = false;

static bool dumpFFHiResSpectums = false;
static bool traceIProd = false;

static bool traceSpace = false;  // prints info about the space in the grinder constructor

// those apply to these tracing flags
static bool traceEachFFSquelch = false;
static bool traceEndingFFSpectrum = false;


/* *********************************************************************************** qGrinder */

// create new grinder, complete with its own stage buffers
// make sure these values are doable by the sliders' steps
qGrinder::qGrinder(qSpace *sp, qAvatar *av, const char *lab)
	: space(sp), avatar(av), elapsedTime(0), frameSerial(0),
		dt(1e-3), lowPassFilter(1), stepsPerFrame(100),
		isIntegrating(false), needsIntegration(false), pleaseFFT(false) {

	magic = 'Grin';

	qflick = new qFlick(space, this, 2, 2);

	// so wave in the flick points to the zero-th wave

	qspect = NULL;  // until used

	voltage = sp->voltage;
	voltageFactor = sp->voltageFactor;

	strncpy(label, lab, MAX_LABEL_LEN);
	label[MAX_LABEL_LEN] = 0;

	elapsedTime = 0.;
	frameSerial = 0;

	if (traceSpace) {
		printf("the qSpace for 🪓 grinder %s:   magic=%c%c%c%c label=%s nDimesions=%d  "
			"nStates=%d nPoints=%d voltage=%p voltageFactor=%lf spectrumLength=%d  \n",
			label,
			space->magic >> 24,  space->magic >> 16, space->magic >> 8, space->magic,
			space->label, space->nDimensions, space->nStates, space->nPoints,
			space->voltage, space->voltageFactor, space->spectrumLength);
		qDimension *dims = space->dimensions;
		printf("      its qDimension:   N=%d start=%d end=%d ",
			dims->N, dims->start, dims->end);
		printf("      nStates=%d nPoints=%d\n", dims->nStates, dims->nPoints);
		printf("      its continuum=%d spectrumLength=%d label=%s\n",
			dims->continuum, dims->spectrumLength, dims->label);
	}

	FORMAT_DIRECT_OFFSETS;
};

qGrinder::~qGrinder(void) {
	// we delete any buffers hanging off the qGrinder here.
	// eGrinder will delete the Grinder object and any others needed.

	delete qflick;
	qflick = NULL;

	// these may or may not have been allocated, depending on whether they were needed
	if (qspect)
		delete qspect;
	qspect = NULL;
};

// no - deleteSpace() deletes this
//void grinder_delete(qGrinder *grinder) {
//	delete grinder;
//}

// some uses never need this so wait till they do
qSpectrum *qGrinder::getSpectrum(void) {
	if (!qspect)
		qspect = new qSpectrum(space);
	return qspect;
};

void qGrinder::copyFromAvatar(qAvatar *avatar) {
	//printf("qGrinder(%p)::copyFromAvatar(qAvatar *%p) \n", this, avatar);
	//printf("    qAvatar-  qwave=%p   voltageFactor=%lf  label=%s\n", avatar->qwave, avatar->voltageFactor, avatar->label);
	//printf("    qGrinder-    qflick=%p   voltageFactor=%lf  label=%s \n", this->qflick, this->voltageFactor, this->label);
	qflick->copyBuffer(qflick, avatar->qwave);
}

void qGrinder::copyToAvatar(qAvatar *avatar) {
	qflick->copyBuffer(avatar->qwave, qflick);
}

// need these numbers for the js interface to this object, to figure out the offsets.
// see eGrinder.js ;  usually this function isn't called.
// Insert this into the constructor and run this once.  Copy text output.
// Paste the output into class eGrinder, the class itself, to replace the existing ones
void qGrinder::formatDirectOffsets(void) {
	// don't need magic
	printf("🪓 🪓 --------------- starting qGrinder direct access JS getters & setters--------------\n\n");

	makePointerGetter(space);
	printf("\n");

	/* *********************************************** scalars */

	makeDoubleGetter(elapsedTime);
	makeDoubleSetter(elapsedTime);
	makeDoubleGetter(frameSerial);
	makeDoubleSetter(frameSerial);
	printf("\n");
	makeBoolGetter(isIntegrating);
	makeBoolSetter(isIntegrating);
	makeBoolGetter(pleaseFFT);
	makeBoolSetter(pleaseFFT);

	makeBoolGetter(needsIntegration);
	makeBoolSetter(needsIntegration);

	makeBoolGetter(doingIntegration);
	makeBoolSetter(doingIntegration);
	printf("\n");
	makeDoubleGetter(dt);
	makeDoubleSetter(dt);
	makeIntGetter(lowPassFilter);
	makeIntSetter(lowPassFilter);
	makeIntGetter(stepsPerFrame);
	makeIntSetter(stepsPerFrame);

	/* *********************************************** waves & buffers */

	printf("\n");
	makePointerGetter(qflick);

	printf("\n");
	makePointerGetter(voltage);
	makeDoubleGetter(voltageFactor);
	makeDoubleSetter(voltageFactor);

//	printf("\n");
//	makePointerGetter(scratchQWave);

	// for the fourier filter.  Call the function first time you need it.
	printf("\n");
	makePointerGetter(qspect);

	makePointerGetter(stages);
	makePointerGetter(threads);

	makeStringPointer(label);

	printf("\n🖼 🖼 --------------- done with qGrinder direct access --------------\n");
}

/* ********************************************************** dumpObj  */

// dump all the fields of an grinder
void qGrinder::dumpObj(const char *title) {
	printf("\n🪓🪓 ==== qGrinder | %s ", title);
	printf("        magic: %c%c%c%c   qSpace=%p '%s'   \n",
		magic>>3, magic>>2, magic>>1, magic, space, label);

	printf("        elapsedTime %lf, frameSerial  %lf, dt  %lf, lowPassFilter %d, stepsPerFrame %d\n",
		elapsedTime, frameSerial, dt, lowPassFilter, stepsPerFrame);

	printf("        qflick %p, voltage  %p, voltageFactor  %lf, qspect %p\n",
		qflick, voltage, voltageFactor, qspect);

	printf("        isIntegrating: %hhu   pleaseFFT=%hhu \n", isIntegrating, pleaseFFT);

	printf("        ==== end of qGrinder ====\n\n");
}

/* ********************************************************** doing Integration */

// return elapsed real time since last page reload, in seconds, only for tracing
// seems like it's down to miliseconds or even a bit smaller
//double getTimeDouble()
//{
//    struct timespec ts;
//    clock_gettime(CLOCK_MONOTONIC, &ts);
//    return ts.tv_sec + ts.tv_nsec / 1e9;
//}

// Does several visscher steps (eg 100 or 500). Actually does
// stepsPerFrame+1 steps; half steps at start and finish to adapt and
// deadapt to Visscher timing
void qGrinder::oneIntegration() {
	isIntegrating = doingIntegration = true;
	qCx *wave0 = qflick->waves[0];
	qCx *wave1 = qflick->waves[1];


	// half step in beginning to move Im forward dt/2
	// cuz outside of here, re and im are synchronized.
	qflick->fixThoseBoundaries(wave0);
	stepReal(wave1, wave0, wave0, 0);
	stepImaginary(wave1, wave0, wave0, dt/2);

	// now the latest is in wave1; the loop continues this,

	int doubleSteps = stepsPerFrame / 2;
	for (int step = 0; step < doubleSteps; step++) {

		qflick->fixThoseBoundaries(wave1);
		stepReal(wave0, wave1, wave1, dt);
		stepImaginary(wave0, wave1, wave1, dt);

		qflick->fixThoseBoundaries(wave0);
		stepReal(wave1, wave0, wave0, dt);
		stepImaginary(wave1, wave0, wave0, dt);
	}

	// and the halfwave at the end moves it back to [0]].
	qflick->fixThoseBoundaries(wave1);
	stepReal(wave0, wave1, wave1, dt/2);
	stepImaginary(wave0, wave1, wave1, 0);


	// ok the algorithm tends to diverge after thousands of frames.  Hose it down.
	if (this->pleaseFFT) analyzeWaveFFT(qflick, "before fourierFilter()");
	fourierFilter(lowPassFilter);
	if (this->pleaseFFT) analyzeWaveFFT(qflick, "after fourierFilter()");
	this->pleaseFFT = false;

	// normalize it and return the old inner product, see how close to 1.000 it is
	double iProd = qflick->normalize();
	if (dumpFFHiResSpectums) qflick->dumpHiRes("wave END fourierFilter() after normalize");
	if (traceIProd && ((int) frameSerial & 0xf) == 0)
		printf("      qGrinder: iProd= %lf \n", iProd);

	if (iProd > 1.01) {
		char buf[64];
		sprintf(buf, "🪓 🪓 wave is diverging, iProd=%10.4g 🔥 🧨", iProd);
		if (iProd > 3) {
			qflick->dump(buf);
			throw std::runtime_error("diverged");  // js code intercepts this exact spelling
		}
	}


	if (traceJustWave)
		qflick->dump("      qGrinder traceJustWave at end of frame", true);

	// now, copy it to the Avatar's wave buffer, so iit can copy it to its ViewBuffer, so webgl can pick it up
	copyToAvatar(avatar);

	if (traceIntegration)
		printf("      qGrinder frame done; elapsed time: %lf \n", getTimeDouble());

	frameSerial++;
	isIntegrating = doingIntegration = false;
}


/* ********************************************************** fourierFilter */


// FFT the wave, cut down the high frequencies, then iFFT it back.
// lowPassFilter is .. kinda changes but maybe #frequencies we zero out
// Can't we eventually find a simple convolution to do this instead of FFT/iFFT?
// maye after i get more of this working and fine toon it
// lowPassFilter = number of freqs to squelch on BOTH sides, excluding nyquist
// range 0...N/2-1
void qGrinder::fourierFilter(int lowPassFilter) {
	qspect = getSpectrum();
	qspect->generateSpectrum(qflick);
	if (dumpFFHiResSpectums) qspect->dumpSpectrum("qspect right at start of fourierFilter()");

	// the high frequencies are in the middle
	int nyquist = qspect->nPoints/2;
	qCx *s = qspect->wave;

	// the nyquist freq is at N/2, ALWAYS block that!!
	s[nyquist] = 0;

	if (traceFourierFilter)
		printf("🪓 🌈  fourierFilter: nPoints=%d  nyquist=%d    lowPassFilter=%d\n",
			qspect->nPoints, nyquist, lowPassFilter);

	for (int k = 1; k <= lowPassFilter; k++) {
		s[nyquist + k] = 0;
		s[nyquist - k] = 0;
	}

	if (dumpFFHiResSpectums) qspect->dumpSpectrum("qspect right at END of fourierFilter()");
	qspect->generateWave(qflick);
	if (dumpFFHiResSpectums) qflick->dumpHiRes("wave END fourierFilter() b4 normalize");
}

/* ********************************************************** misc  */


// user button to print it out now, while not running.  See also pleaseFFT for when it is
void qGrinder::askForFFT(void) {
	analyzeWaveFFT(qflick, "askForFFT while idle");
}

// if integrating, FFT as the current frame finishes, before and after fourierFilter().
// If stopped, fft current wave. now.
void grinder_askForFFT(qGrinder *pointer) { pointer->askForFFT(); }

void grinder_oneIntegration(qGrinder *pointer) { pointer->oneIntegration(); }


void qGrinder::initIntegrationLoop(int a, int b, int c) {
	// to e imprelmented
}

void grinder_initIntegrationLoop(qGrinder *pointer, int a, int b, int c) {pointer ->initIntegrationLoop(a, b, c);}

void grinder_copyFromAvatar(qGrinder *grinder, qAvatar *avatar) {grinder->copyFromAvatar(avatar);}
//	printf("grinder_copyFromAvatar; grinder='%s', avatar='%s'\n", (char *) grinder, (char *) avatar);

void grinder_copyToAvatar(qGrinder *grinder, qAvatar *avatar) {grinder->copyToAvatar(avatar);}
