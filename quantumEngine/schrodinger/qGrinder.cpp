/*
** qGrinder -- the calculation of a simulation of a quantum mechanical wave
** Copyright (C) 2022-2024 Tactile Interactive, all rights reserved
*/
#include <string.h>
#include <ctime>
#include <limits>
#include <cfenv>
#include <stdexcept>

//#include <stdatomic.h>
// stdatomic.h should have this #include <__atomic/atomic_flag.h>
#include <condition_variable>
#include <pthread.h>
// looking for emscripten_futex_wait() - it's not here #include <emscripten/atomic.h>

#include "../hilbert/qSpace.h"
#include "../greiman/qAvatar.h"
#include "qThread.h"
#include "qGrinder.h"
#include "slaveThread.h"
#include "../debroglie/qFlick.h"
#include "../fourier/qSpectrum.h"
#include "../fourier/fftMain.h"
#include "../directAccessors.h"



static bool traceRunner = false;

static bool traceIntegration = false;
static bool traceIntegrationDetailed = false;

static bool traceJustWave = false;

static bool traceFourierFilter = false;

static bool dumpFFHiResSpectums = false;
static bool traceIProd = false;

static bool traceConstructor = false;

static bool traceReversals = false;

static bool traceAggregate = false;
static bool traceSingleStep = false;

// RK2
#define MIDPOINT_METHOD

static std::runtime_error nullException("");


// create new grinder, complete with its own stage buffers
// make sure these values are doable by the sliders' steps
qGrinder::qGrinder(qSpace *sp, qAvatar *av, int nThreads, const char *lab)
	: space(sp), avatar(av), elapsedTime(0), frameSerial(0), stretchedDt(.01),
		integrationEx(nullException),
		isIntegrating(false), shouldBeIntegrating(false), justNFrames(0),
		stepsPerFrame(10),
		pleaseFFT(false), newFrameFactor(3), newIntegrationFP(.05),
		nThreads(nThreads), nSlaveThreads(nThreads) {

	magic = 'Grnd';

	// number of waves; number of threads
	qflick = new qFlick(space, 3, 0);

	// so wave in the qflick points to the zero-th wave

	qspect = NULL;  // until used

	voltage = sp->voltage;
	voltageFactor = sp->voltageFactor;

	strncpy(label, lab, MAX_LABEL_LEN);
	label[MAX_LABEL_LEN] = 0;

	pthread_mutex_init(&finishMx, NULL);
	pthread_mutex_init(&startMx, NULL);

	// should this come earlier?
	slaveThread::createSlaves(this);

	if (traceConstructor) {
		dumpObj(" qGrinder 🪓 constructed");

		qDimension *dims = space->dimensions;
		printf("          its qDimension:   N=%d start=%d end=%d ",
			dims[0].N, dims[0].start, dims[0].end);
		printf("        nStates=%d nPoints=%d\n", dims[0].nStates, dims[0].nPoints);
		printf("        its continuum=%d spectrumLength=%d label=%s\n",
			dims[0].continuum, dims[0].spectrumLength, dims[0].label);

		printf("      the qSpace for 🪓 grinder %s:   magic=%c%c%c%c spacelabel=%s\n",
			label,
			space->magic >> 24,  space->magic >> 16, space->magic >> 8, space->magic,
			space->label);
		printf("         nDimesions=%d   nStates=%d nPoints=%d voltage=%p voltageFactor=%lf spectrumLength=%d  \n",
			space->nDimensions, space->nStates, space->nPoints,
			space->voltage, space->voltageFactor, space->spectrumLength);
	}

	FORMAT_DIRECT_OFFSETS;
};

qGrinder::~qGrinder(void) {
	// we delete any buffers hanging off the qGrinder here.
	// eGrinder will delete the Grinder object and any others needed.

	delete qflick;
	qflick = NULL;

	//pthread_rwlock_destroy(&masterLock);

	// these may or may not have been allocated, depending on whether they were needed
	if (qspect)
		delete qspect;
	qspect = NULL;
};

// some uses never need this so wait till they do
qSpectrum *qGrinder::getSpectrum(void) {
	if (!qspect)
		qspect = new qSpectrum(space);
	return qspect;
};

void qGrinder::copyFromAvatar(qAvatar *avatar) {
	qflick->copyBuffer(qflick, avatar->qwave);
}

void qGrinder::copyToAvatar(qAvatar *avatar) {
	qflick->copyBuffer(avatar->qwave, qflick);
}

// need these numbers for the js interface to this object, to figure out the offsets.
// see eGrinder.js ;  usually this function isn't called.
// See directAccessors.h to change FORMAT_DIRECT_OFFSETS to
// insert this into the constructor and run this once.  Copy text output.
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
	makeIntGetter(justNFrames);
	makeIntSetter(justNFrames);

	makeDoubleGetter(frameCalcTime);
	makeDoubleGetter(maxCalcTime);

	makeBoolGetter(shouldBeIntegrating);
	makeBoolSetter(shouldBeIntegrating);
	makeBoolGetter(isIntegrating);
	makeBoolSetter(isIntegrating);

	makeBoolGetter(pleaseFFT);
	makeBoolSetter(pleaseFFT);

	makeOffset(shouldBeIntegrating)

	printf("\n");
	makeDoubleGetter(stretchedDt);
	makeDoubleSetter(stretchedDt);
	// makeIntGetter(lowPassFilter);
	// makeIntSetter(lowPassFilter);
// 	makeIntGetter(stepsPerFrame);
// 	makeIntSetter(stepsPerFrame);

//	makeIntGetter(integrationEx);
//	makeIntSetter(integrationEx);

	makeIntGetter(nSlaveThreads);

	makeIntGetter(newFrameFactor);
	makeIntSetter(newFrameFactor);
	makeDoubleGetter(newIntegrationFP);
	makeDoubleSetter(newIntegrationFP);

	/* *********************************************** waves & buffers */

	printf("\n");
	makePointerGetter(qflick);

	printf("\n");
	makePointerGetter(voltage);
	makeDoubleGetter(voltageFactor);
	makeDoubleSetter(voltageFactor);

	makeDoubleGetter(reversePercent);

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

// dump all the fields of a grinder
void qGrinder::dumpObj(const char *title) {
	printf("\n🪓🪓 ==== qGrinder | %s ", title);
	printf("        magic: %c%c%c%c   qSpace=%p '%s'   \n",
		magic>>24, magic>>16, magic>>8, magic, space, label);

	printf("        elapsedTime=%lf, frameSerial=%lf, dt=%lf, \n",
		elapsedTime, frameSerial, space->dt);

	printf("        qflick=%p, voltage=%p, voltageFactor=%lf, qspect=%p\n",
		qflick, voltage, voltageFactor, qspect);

	printf("        shouldBeIntegrating: %hhu   isIntegrating: %hhu   pleaseFFT=%hhu \n",
		shouldBeIntegrating, isIntegrating, pleaseFFT);

	printf("        ==== end of qGrinder::dumpObj(%s) ====\n\n", title);
}

/* ********************************************************** tally & measure divergence */

// this tally stuff, it's not detecting divergence explosion early enough.
// I need to start counting reversals of derivative of norm.
// DO this in innerproduct when you're already calculating norms.
static int tally = 0;

// if these two reals differ in sign, increment the tally
static void difft(double a, double b) {
	if (a > 0 && b < 0) tally++;
	if (b > 0 && a < 0) tally++;
}

// count up how many sign reversals in consecutive cells we have
// should be about 4 * freq if healthy
void qGrinder::tallyUpReversals(qWave *qwave) {
	tally = 0;
	qCx *wave = qwave->wave;
	qCx prevOne = wave[qwave->start];
	for (int ix = qwave->start + 1; ix < qwave->end; ix++) {
		qCx thisOne = wave[ix];
		difft(thisOne.re, prevOne.re);
		difft(thisOne.im, prevOne.im);
		prevOne = thisOne;
	}

	// figure rate.  ÷2 for real, imag
	int N = qwave->end - qwave->start;
	double percent = 100.0 * tally / N / 2.;
	if (traceReversals)
		printf("🖼 tallyUpReversals result: %d out of %d or %5.1f %%\n",
			tally, N, percent);
	this->reversePercent = percent;
}

/* ********************************************************** doing Integration */

// Integrates one Frame, one iteration, on one thread.  Does several
// visscher steps (eg 10 or 100 or 500). Actually does stepsPerFrame+½
// steps; two half steps, im at start and re at finish, to adapt to
// Visscher timing, then synchronized timing. Maybe this should be in
// slaveThread?  Multi-threads will have to be done with totally different code.
void qGrinder::oneFrame() {
	if (traceIntegration)
		printf("starting oneFrame\n");
	if (traceIntegrationDetailed)
		qGrinder::dumpObj("starting oneFrame");
//	isIntegrating = frameInProgress = true;
	qCx *wave0 = qflick->waves[0];
	qCx *wave1 = qflick->waves[1];
	qCx *wave2 = qflick->waves[2];

	double dt = space->dt;
	double dtHalf = dt / 2;

	// half step in beginning to move Im forward dt/2
	// cuz outside of here, re and im are interlaced.
	qflick->fixThoseBoundaries(wave0);
	stepReal(wave1, wave0, wave0, 0);
	stepImaginary(wave1, wave0, wave0, dt/2);

	// Note here the latest is in [1]; frame continues this,
	// and the halfwave at the end moves it back to [0]].
	// midpoint uses [2] in between.
	int doubleSteps = stepsPerFrame / 2;
	for (int step = 0; step < doubleSteps; step++) {

		#ifdef MIDPOINT_METHOD
		stepMidpoint(wave0, wave1, wave2, dt);
		stepMidpoint(wave1, wave0, wave2, dt);
		#else
		stepRealImaginary(wave0, wave1, wave1, dt);
		stepRealImaginary(wave1, wave0, wave0, dt);
		#endif
	}

	// half step at completion to move Re forward dt / 2
	// and copy back to Main
	qflick->fixThoseBoundaries(wave1);
	stepReal(wave0, wave1, wave1, dt/2);
	stepImaginary(wave0, wave1, wave1, 0);

	// ok the algorithm tends to diverge after thousands of frames.  Hose it down.
	if (this->pleaseFFT) analyzeWaveFFT(qflick, "before fourierFilter()");
	//fourierFilter(lowPassFilter);
	//if (this->pleaseFFT) analyzeWaveFFT(qflick, "after fourierFilter()");
	this->pleaseFFT = false;

	// normalize it and return the old inner product, see how close to 1.000 it is
	double iProd = qflick->normalize();
	if (dumpFFHiResSpectums) qflick->dumpHiRes("wave END fourierFilter() after normalize");
	if (traceIProd && ((int) frameSerial & 0xf) == 0)
		printf("      qGrinder: iProd= %lf \n", iProd);

	// just an expt: see how many alternating values we have
	tallyUpReversals(qflick);

	if (iProd > 1.01) {
		char buf[64];
		snprintf(buf, 64, "🪓 🪓 wave is diverging, iProd=%10.4g 🔥 🧨", iProd);
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
		printf("      qGrinder frame done; time: %lf \n", getTimeDouble());

	frameSerial++;
//	frameInProgress = false;
	qCheckReset();
}


/* ********************************************************** fourierFilter */
//
//
// // FFT the wave, cut down the high frequencies, then iFFT it back.
// ///// lowPassFilter (aka lpf) is  #frequencies we zero out
// // Can't we eventually find a simple convolution to do this instead of FFT/iFFT?
// // maybe after i get more of this working and fine tune it.
// // Or maybe FFT is the fastest way anyway?
// // lowPassFilter = number of freqs to squelch on BOTH sides, excluding nyquist
// // which is always filtered out.  range 0...N/2-1
// void qGrinder::fourierFilter(int lowPassFilter) {
// 	qspect = getSpectrum();
// 	qspect->generateSpectrum(qflick);
// 	if (dumpFFHiResSpectums) qspect->dumpSpectrum("qspect right at start of fourierFilter()");
//
// 	// the high frequencies are in the middle
// 	int nyquist = qspect->nPoints/2;
// 	qCx *s = qspect->wave;
//
// 	// the nyquist freq is at N/2, ALWAYS block that!!
// 	s[nyquist] = 0;
//
// 	if (traceFourierFilter)
// 		printf("🪓 🌈  fourierFilter: nPoints=%d  nyquist=%d    lowPassFilter=%d\n",
// 			qspect->nPoints, nyquist, lowPassFilter);
//
// 	for (int k = 1; k <= lowPassFilter; k++) {
// 		s[nyquist + k] = 0;
// 		s[nyquist - k] = 0;
// 	}
//
// 	if (dumpFFHiResSpectums) qspect->dumpSpectrum("qspect right at END of fourierFilter()");
// 	qspect->generateWave(qflick);
// 	if (dumpFFHiResSpectums) qflick->dumpHiRes("wave END fourierFilter() b4 normalize");
// }

/* ********************************************************** threaded integration  */

void qGrinder::aggregateCalcTime(void) {
	// add up ALL the threads' frameCalcTime and keep a running average
	//double frameCalcTime;
	frameCalcTime = 0;
	maxCalcTime = 0;
	for (int ix = 0; ix < nSlaveThreads; ix++) {
		slaveThread *sl = slaves[ix];
		if (sl) {
			frameCalcTime += sl->frameCalcTime;
			maxCalcTime = fmax(maxCalcTime, sl->frameCalcTime);
		}
	}
	if (traceAggregate) {
		speedyLog(" qGrinder 🪓 aggregate time summed: %15.6lf  maxed: %15.6lf\n",
			frameCalcTime, maxCalcTime);
	}
}



// runs in the thread loop, only in the last thread to start, in an integration frame.
//void qGrinder::threadsHaveStarted() {
//}


// runs in the thread loop, only in the last thread to finish integration in an integration frame.
void qGrinder::threadsHaveFinished() {
	aggregateCalcTime();

	// single step (or a few steps): are we done yet?
	if (justNFrames) {
		if (traceSingleStep) speedyLog("ss: justNFrames = %d\n", justNFrames);
		--justNFrames;
		if (0 >= justNFrames) {
			shouldBeIntegrating = false;
			if (traceSingleStep) speedyLog("ss turned off sbi: justNFrames = %d\n", justNFrames);
		}
	}

	if (traceRunner)  {
		speedyLog("🔪                ...in threadsHaveFinished().  justNFrames=%d and shouldBeIntegrating=%d\n",
				justNFrames, shouldBeIntegrating);
	}

	// set isIntegrating here so all threads get it at the same time
	isIntegrating = shouldBeIntegrating;

	// ready for new frame
	nStartedThreads = 0;
	nFinishedThreads = 0;

}


// start a new frame calculating by starting each/all slave threads
void grinder_triggerIteration(qGrinder *grinder) {

	grinder->isIntegrating = grinder->shouldBeIntegrating;
	pthread_mutex_unlock(&grinder->startMx);
}

/* ********************************************************** misc  */


// user button to print it out now, while not running.  See also pleaseFFT for when it is
void qGrinder::askForFFT(void) {
	analyzeWaveFFT(qflick, "askForFFT while idle");
}

// if integrating, FFT as the current frame finishes, before and after fourierFilter().
// If stopped, fft current wave. now.
void grinder_askForFFT(qGrinder *pointer) { pointer->askForFFT(); }

void grinder_oneFrame(qGrinder *pointer) { pointer->oneFrame(); }

void grinder_copyFromAvatar(qGrinder *qgrinder, qAvatar *avatar) {qgrinder->copyFromAvatar(avatar);}
//	printf("grinder_copyFromAvatar; qgrinder='%s', avatar='%s'\n", (char *) qgrinder, (char *) avatar);

void grinder_copyToAvatar(qGrinder *qgrinder, qAvatar *avatar) {qgrinder->copyToAvatar(avatar);}




