/*
** qAvatar -- the instance and simulation of a quantum mechanical wave in a space
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

#include <string.h>

#include <limits>
#include <cfenv>

#include "../spaceWave/qSpace.h"
#include "qAvatar.h"
#include "qGrinder.h"
#include "../debroglie/qWave.h"
#include "../fourier/qSpectrum.h"
#include "../greiman/qViewBuffer.h"
#include "../fourier/fftMain.h"
#include "../directAccessors.h"



static bool traceIteration = false;
static bool traceIterSteps = false;

static bool traceJustWave = false;
static bool traceJustInnerProduct = false;

static bool traceFourierFilter = false;

static bool dumpFFHiResSpectums = false;
static bool traceIProd = false;

static bool traceSpace = false;  // prints info about the space in the avatar constructor

// those apply to these tracing flags
static bool traceEachFFSquelch = false;
static bool traceEndingFFSpectrum = false;


/* *********************************************************************************** qAvatar */

// create new avatar, complete with its own wave and view buffers
// make sure these values are doable by the sliders' steps
qAvatar::qAvatar(qSpace *sp, const char *lab)
	: space(sp), magic('Avat') {

	qwave = new qWave(space);
	voltage = sp->voltage;
	voltageFactor = sp->voltageFactor;

	strncpy(label, lab, MAX_LABEL_LEN);
	label[MAX_LABEL_LEN] = 0;

	// we always need a view buffer; that's the whole idea behind an avatar
	qvBuffer = new qViewBuffer(space, this);
	vBuffer = qvBuffer->vBuffer;

	if (traceSpace) {
		printf("the qSpace for avatar %s:   magic=%c%c%c%c label=%s nDimesions=%d  "
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

	// enable this when qAvatar.h fields change
	//formatDirectOffsets();
};

qAvatar::~qAvatar(void) {
	// we delete any buffers hanging off the qAvatar here.
	// eAvatar will delete the Avatar object and any others needed.
	delete qwave;
	qwave = NULL;
	delete qvBuffer;
	qvBuffer = NULL;
};

// never called from JS
//void avatar_delete(qAvatar *avatar) {
//	delete avatar;
//}

// some uses never need these so wait till they do
//qWave *qAvatar::getScratchWave(void) {
//	if (!scratchQWave)
//		scratchQWave = new qWave(space);
//	return scratchQWave;
//};
//
//qSpectrum *qAvatar::getSpectrum(void) {
//	if (!qspect)
//		qspect = new qSpectrum(space);
//	return qspect;
//};

// need these numbers for the js interface to this object, to figure out the offsets.
// see eAvatar.js ;  usually this function isn't called.
// Insert this into the constructor and run this once.  Copy text output.
// Paste the output into class eAvatar, the class itself, to replace the existing ones
void qAvatar::formatDirectOffsets(void) {
	// don't need magic
	printf("🚦 🚦 --------------- starting qAvatar direct access JS getters & setters--------------\n\n");

	makePointerGetter(space);
	printf("\n");

	/* *********************************************** scalars */

	//makeDoubleGetter(elapsedTime);
	//makeDoubleSetter(elapsedTime);
	//makeDoubleGetter(iterateSerial);
	//makeDoubleSetter(iterateSerial);
	//printf("\n");
	//makeBoolGetter(isIterating);
	//makeBoolSetter(isIterating);
	//makeBoolGetter(pleaseFFT);
	//makeBoolSetter(pleaseFFT);

	//makeBoolGetter(needsIteration);
	//makeBoolSetter(needsIteration);
	//
	//makeBoolGetter(doingIteration);
	//makeBoolSetter(doingIteration);
	//printf("\n");
	//makeDoubleGetter(dt);
	//makeDoubleSetter(dt);
	//makeIntGetter(lowPassFilter);
	//makeIntSetter(lowPassFilter);
	//makeIntGetter(stepsPerIteration);
	//makeIntSetter(stepsPerIteration);

	/* *********************************************** waves & buffers */

	printf("\n");
	makePointerGetter(qwave);

	printf("\n");
	//makePointerGetter(voltage);
	//makeDoubleGetter(voltageFactor);
	//makeDoubleSetter(voltageFactor);

	//makePointerGetter(scratchQWave);
	//
	//// for the fourier filter.  Call the function first time you need it.
	//printf("\n");
	//makePointerGetter(qspect);

	// the view Buffer to be passed to webgl.  Just the buffer, not the qViewBuffer
	makePointerGetter(vBuffer);

	//makePointerGetter(stages);
	//makePointerGetter(threads);

	makeStringPointer(label);

	printf("\n🚦 🚦 --------------- done with qAvatar direct access --------------\n");
}

/* ********************************************************** dumpObj  */

// dump all the fields of an avatar
void qAvatar::dumpObj(const char *title) {
	printf("\n🌊🌊 ==== qAvatar | %s ", title);
	printf("        magic: %c%c%c%c   qSpace=%p '%s'   \n",
		magic>>3, magic>>2, magic>>1, magic, space, label);

	printf("        qwave %p, qViewBuffer %p\n", qwave, qvBuffer);

	printf("        ==== end of qAvatar ====\n\n");
}

/* ********************************************************** doing Iteration */

// Does several visscher steps (eg 100 or 500). Actually does
// stepsPerIteration+1 steps; half steps at start and finish to adapt and
// deadapt to Visscher timing
	//void qAvatar::oneIteration() {
	//isIterating = doingIteration = true;
	//
	//// now we need it
	//getScratchWave();
	//
	//// update this all the time cuz user might have changed it.  Well, actually,
	//// since it's a pointer, maybe not.... maybe just the factor...
	//voltage = space->voltage;
	//voltageFactor = space->voltageFactor;
	//
	//if (traceIteration) {
	//	printf("🚀 🚀 qAvatar::oneIteration() - dt=%lf   stepsPerIteration=%d ; voltageFactor=%lf  elapsed time: %lf\n",
	//		dt, stepsPerIteration,
	//		voltageFactor,
	//		getTimeDouble());
	//	}
	//
	//// half step in beginning to move Im forward dt/2
	//// cuz outside of here, re and im are for the same time.
	//// Note here the latest is in scratch; iterate continues this,
	//// and the halfwave at the end moves it back to main.
	//stepReal(scratchQWave->wave, qwave->wave, 0);
	//stepImaginary(scratchQWave->wave, qwave->wave, dt/2);
	//
	//int doubleSteps = stepsPerIteration / 2;
	//if (traceIteration)
	//	printf("      qAvatar: doubleSteps=%d   stepsPerIteration=%d\n",
	//		doubleSteps, stepsPerIteration);
	//
	//for (int tt = 0; tt < doubleSteps; tt++) {
	//	oneVisscherStep(qwave, scratchQWave);
	//	oneVisscherStep(scratchQWave, qwave);
	//
	//	if (traceIteration && 0 == tt % 32) {
	//		printf("       qAvatar: step every 64, step %d; elapsed time: %lf\n", tt * 2, getTimeDouble());
	//	}
	//
	//	if (traceIterSteps) {
	//		printf("step done %d; elapsed time: %lf \n", tt*2, getTimeDouble());////
	//	}
	//}
	//
	//if (traceIteration)
	//	printf("      qAvatar: %d steps done; elapsed time: %lf \n", stepsPerIteration, getTimeDouble());
	//
	//// half step at completion to move Re forward dt/2
	//// and copy back to Main
	//stepReal(qwave->wave, scratchQWave->wave, dt/2);
	//stepImaginary(qwave->wave, scratchQWave->wave, 0);
	//
	//
	//// ok the algorithm tends to diverge after thousands of iterations.  Hose it down.
	//if (this->pleaseFFT) analyzeWaveFFT(qwave, "before fourierFilter()");
	//fourierFilter(lowPassFilter);
	//if (this->pleaseFFT) analyzeWaveFFT(qwave, "after fourierFilter()");
	//this->pleaseFFT = false;
	//
	//
	//double iProd = qwave->normalize();
	//if (dumpFFHiResSpectums) qwave->dumpHiRes("wave END fourierFilter() after normalize");
	//if (traceIProd && ((int) iterateSerial & 0xf) == 0)
	//	printf("      qAvatar: iProd= %lf \n", iProd);
	//
	//if (iProd > 1.01) {
	//	char buf[64];
	//	sprintf(buf, "🔥 🧨 wave is diverging, iProd=%10.4g 🔥 🧨", iProd);
	//	if (iProd > 3) {
	//		qwave->dump(buf);
	//		throw std::runtime_error("diverged");  // js code intercepts this exact spelling
	//	}
	//}
	//
	//
	//if (traceJustWave) {
	//	qwave->dump("     qAvatar  traceJustWave at end of iteration", true);
	//}
	//if (traceJustInnerProduct) {
	//	printf("      qAvatar traceJustInnerProduct: finished one iteration (%d steps, N=%d), iProduct: %lf\n",
	//		stepsPerIteration, space->nStates, qwave->innerProduct());
	//}
	//
	//iterateSerial++;
	//
	//if (traceIteration)
	//	printf("      iteration done; elapsed time: %lf \n", getTimeDouble());
	//isIterating = doingIteration = false;
	//}
	//
	//
	//// FFT the wave, cut down the high frequencies, then iFFT it back.
	//// lowPassFilter is .. kinda changes but maybe #frequencies we zero out
	//// Can't we eventually find a simple convolution to do this instead of FFT/iFFT?
	//// maye after i get more of this working and fine toon it
	//// lowPassFilter = number of freqs to squelch on BOTH sides, excluding nyquist
	//// range 0...N/2-1
	//void qAvatar::fourierFilter(int lowPassFilter) {
	//// this is when the wave tends to come apart with high frequencies
	//qspect = getSpectrum();
	//qspect->generateSpectrum(qwave);
	//if (dumpFFHiResSpectums) qspect->dumpSpectrum("qspect right at start of fourierFilter()");
	//
	//// the high frequencies are in the middle
	//int nyquist = qspect->nPoints/2;
	//qCx *s = qspect->wave;
	//
	//// the nyquist freq is at N/2, ALWAYS block that!!
	//s[nyquist] = 0;
	//
	//if (traceFourierFilter)
	//	printf("🌈  fourierFilter: nPoints=%d  nyquist=%d    lowPassFilter=%d\n",
	//		qspect->nPoints, nyquist, lowPassFilter);
	//
	//for (int k = 1; k <= lowPassFilter; k++) {
	//	s[nyquist + k] = 0;
	//	s[nyquist - k] = 0;
	//}
	//
	//if (dumpFFHiResSpectums) qspect->dumpSpectrum("qspect right at END of fourierFilter()");
	//qspect->generateWave(qwave);
	//if (dumpFFHiResSpectums) qwave->dumpHiRes("wave END fourierFilter() b4 normalize");
	//}

/* ********************************************************** misc  */


// user button to print it out now, while not running.  See also pleaseFFT for when it is
//void qAvatar::askForFFT(void) {
//	analyzeWaveFFT(qwave, "askForFFT while idle");
//}
//
//// if iterating, FFT as the current iterate finishes, before and after fourierFilter().
//// If stopped, fft current wave. now.
//void avatar_askForFFT(qAvatar *pointer) { pointer->askForFFT(); }
//
//void avatar_oneIteration(qAvatar *pointer) { pointer->oneIteration(); }
//
//
//void qAvatar::initIterationLoop(int a, int b, int c) {
//	// to e imprelmented
//}
//
//void avatar_initIterationLoop(qAvatar *pointer, int a, int b, int c) {pointer ->initIterationLoop(a, b, c);}


/* **********************************************************  */
