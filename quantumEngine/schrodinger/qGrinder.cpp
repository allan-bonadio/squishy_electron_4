/*
** qGrinder -- the calculation of a simulation of a quantum mechanical wave
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/
#include <string.h>
#include <ctime>
#include <limits>
#include <cfenv>
#include <stdexcept>

// #include <stdatomic.h>
// stdatomic.h should have this #include <__atomic/atomic_flag.h>
//#include <condition_variable>
#include <pthread.h>
// looking for emscripten_futex_wait() - it's not here #include <emscripten/atomic.h>

#include "../hilbert/qSpace.h"
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

static bool traceConstructor = false;

static bool traceThread = false;
static bool traceReversals = false;

#define MIDPOINT_METHOD

/* *********************************************************************************** qGrinder */

// create new grinder, complete with its own stage buffers
// make sure these values are doable by the sliders' steps
qGrinder::qGrinder(qSpace *sp, qAvatar *av, const char *lab)
	: space(sp), avatar(av), elapsedTime(0), frameSerial(0),
		dt(1e-3), lowPassFilter(1), stepsPerFrame(100),
		isIntegrating(false), needsIntegration(false), pleaseFFT(false) {

	magic = 'Grnd';

	// number of waves; number of threads
	qflick = new qFlick(space, this, 3, 0);

	// so wave in the qflick points to the zero-th wave

	qspect = NULL;  // until used

	voltage = sp->voltage;
	voltageFactor = sp->voltageFactor;

	strncpy(label, lab, MAX_LABEL_LEN);
	label[MAX_LABEL_LEN] = 0;

	elapsedTime = 0.;
	frameSerial = 0;



	// initialize masterSwitch and masterMutex.  Maybe they're already initted.



	if (traceConstructor) {
		dumpObj(" 🪓 constructed");

		printf("      the qSpace for 🪓 grinder %s:   magic=%c%c%c%c spacelabel=%s\n",
			label,
			space->magic >> 24,  space->magic >> 16, space->magic >> 8, space->magic,
			space->label);
		printf("         nDimesions=%d   nStates=%d nPoints=%d voltage=%p voltageFactor=%lf spectrumLength=%d  \n",
			space->nDimensions, space->nStates, space->nPoints,
			space->voltage, space->voltageFactor, space->spectrumLength);

		qDimension *dims = space->dimensions;
		printf("          its qDimension:   N=%d start=%d end=%d ",
			dims->N, dims->start, dims->end);
		printf("        nStates=%d nPoints=%d\n", dims->nStates, dims->nPoints);
		printf("        its continuum=%d spectrumLength=%d label=%s\n",
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

	makeIntGetter(needsIntegration);
	makeIntSetter(needsIntegration);

	makeOffset(needsIntegration)

	makeBoolGetter(integrationFrameInProgress);
	makeBoolSetter(integrationFrameInProgress);
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

// dump all the fields of an grinder
void qGrinder::dumpObj(const char *title) {
	printf("\n🪓🪓 ==== qGrinder | %s ", title);
	printf("        magic: %c%c%c%c   qSpace=%p '%s'   \n",
		magic>>24, magic>>16, magic>>8, magic, space, label);

	printf("        elapsedTime %lf, frameSerial  %lf, dt  %lf, lowPassFilter %d, stepsPerFrame %d\n",
		elapsedTime, frameSerial, dt, lowPassFilter, stepsPerFrame);

	printf("        qflick %p, voltage  %p, voltageFactor  %lf, qspect %p\n",
		qflick, voltage, voltageFactor, qspect);

	printf("        isIntegrating: %hhu   pleaseFFT=%hhu \n", isIntegrating, pleaseFFT);

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

// Integrates one Frame, one iteration.  Does several visscher steps (eg 10 or
// 100 or 500). Actually does stepsPerFrame+½ steps; two half steps, at start
// and other part at finish, to adapt to Visscher timing, then synchronized timing.
void qGrinder::oneFrame() {
	if (traceIntegration)
		qGrinder::dumpObj("starting oneFrame");
	isIntegrating = integrationFrameInProgress = true;
	qCx *wave0 = qflick->waves[0];
	qCx *wave1 = qflick->waves[1];
	qCx *wave2 = qflick->waves[2];
	double dt_ = dt;  // don't change even if user slides it

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
		stepMidpoint(wave0, wave1, wave2, dt_);
		stepMidpoint(wave1, wave0, wave2, dt_);
		#else
		stepRealImaginary(wave0, wave1, wave1, dt_);
		stepRealImaginary(wave1, wave0, wave0, dt_);
		#endif
	}

	// half step at completion to move Re forward dt / 2
	// and copy back to Main
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

	// just an expt: see how many alternating values we have
	tallyUpReversals(qflick);

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
	isIntegrating = integrationFrameInProgress = false;
	qCheckReset();
}


// start integrating a frame in a thread, assuming everything is all set up first.
void qGrinder::startAFrame(void) {
	printf("🪓 qGrinder::startAFrame, about to notify");
	// just a sec here .... atomic_notify_all(&startAll);
	printf("🪓 qGrinder::startAFrame, notified!");


	// after they've all started... is this right?
	// no i think the integrating thread does this after it's over.  ?? startAll.acquire();

}

void grinder_startAFrame(qGrinder *grinder) {
	grinder->startAFrame();

	// does this let all the threads run?
	pthread_cond_broadcast(&grinder->masterSwitch);

}

/* ********************************************************** fourierFilter */


// FFT the wave, cut down the high frequencies, then iFFT it back.
// lowPassFilter (aka lpf) is  #frequencies we zero out
// Can't we eventually find a simple convolution to do this instead of FFT/iFFT?
// maybe after i get more of this working and fine tune it.
// Or maybe FFT is the fastest way anyway?
// lowPassFilter = number of freqs to squelch on BOTH sides, excluding nyquist
// which is always filtered out.  range 0...N/2-1
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

/* ********************************************************** threaded integration  */

// This runs, endlessly in worker, to do integration as needed by main thread.
// Use this for single-thread integration.
void qGrinder::initThreadIntegration(int serial) {

//	if (traceThread)
//		printf("🪓🪓 qGrinder thread %d in grinder %p %s about to enter loop\n", serial, this, label);
	while (true) {
		if (traceThread)
			printf("🪓🪓 qGrinder thread %d in grinder %p %s waiting for futex..\n.", serial, this, label);

		// wait until the main thread needs us to do another.  (May have already
		// happened by the time we get here.)
		//emscripten_futex_wait(&needsIntegration, 0, -1.);

		if (traceThread)
			printf("🪓🪓 qGrinder thread %d in got padst  futex..\n.", serial);

//	printf("\n🪓🪓 ==== qGrinder | %s ", "blah blah blah");
//	printf("        magic: %c%c%c%c \n",magic>>3, magic>>2, magic>>1, magic);
//	printf("       qSpace=%p   \n",space);
//	printf("        '%s'   \n",label);
//	printf("        elapsedTime %lf, frameSerial  %lf, dt  %lf, lowPassFilter %d, stepsPerFrame %d\n",
//		elapsedTime, frameSerial, dt, lowPassFilter, stepsPerFrame);
//	printf("        qflick %p, voltage  %p, voltageFactor  %lf, qspect %p\n",
//		qflick, voltage, voltageFactor, qspect);
//		if (traceIntegration)
//			qGrinder::dumpObj("before starting oneFrame");


		// then do it!
		oneFrame();

		if (traceThread)
			printf("🪓🪓 qGrinder thread %d finished oneFrame(), continuing onward\n", serial);
	}
}

void grinder_initThreadIntegration(qGrinder *grinder, int serial) {
	printf("🪓🪓 grinder_initThreadIntegration divingf in, %p=this,  serial=%d \n",grinder,  serial);
	grinder ->initThreadIntegration(serial);
	printf("🪓🪓 grinder_initThreadIntegration came out other side, %p=this,  serial=%d \n",grinder,  serial);
	//qGrinder::me ->initThreadIntegration(serial, b, c);
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
