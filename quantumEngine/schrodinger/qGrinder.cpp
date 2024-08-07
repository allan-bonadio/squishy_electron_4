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
//#include <condition_variable>
#include <pthread.h>
#include <stdatomic.h>
//#include <emscripten/wasm_worker.h>

// looking for emscripten_futex_wait() - it's not here #include <emscripten/atomic.h>

#include "../hilbert/qSpace.h"
#include "../greiman/qAvatar.h"
#include "qThread.h"
#include "qGrinder.h"
#include "grinderThread.h"
#include "../debroglie/qFlick.h"
#include "../fourier/qSpectrum.h"
#include "../fourier/fftMain.h"
#include "../directAccessors.h"



static bool traceIntegration = false;
static bool traceIntegrationDetailed = false;

static bool traceJustWave = false;

static bool dumpFFHiResSpectums = false;
static bool traceIProd = true;

static bool traceConstructor = false;

static bool traceKinks = false;

static bool traceAggregate = false;
static bool traceSingleStep = false;
static bool traceThreadsHaveFinished = false;

// RK2
#define MIDPOINT_METHOD

static std::runtime_error nullException("");


// create new grinder, complete with its own stage buffers. make sure
// these values are doable by the sliders' steps. Space is definitely
// created by creation time here, although a few details left  to do.
qGrinder::qGrinder(qSpace *sp, qAvatar *av, int nGrinderThreads, const char *lab)
	: space(sp), avatar(av), elapsedTime(0), frameSerial(0), stretchedDt(60),
		integrationEx(nullException), exceptionCode(""), _zero(0), hadException(false),
		shouldBeIntegrating(false), isIntegrating(false), justNFrames(0),
		stepsPerFrame(10),
		pleaseFFT(false), animationFP(.05),
		nGrinderThreads(nGrinderThreads) {

	magic = 'Grnd';

	// number of waves; number of threads
	qflick = new qFlick(space, 3, 0);

	// so wave in the qflick points to the zero-th wave

	qspect = NULL;  // until used

	// use these for grinding
	voltage = sp->voltage;
	voltageFactor = sp->voltageFactor;
	d2Coeff = sp->dimensions[0].d2Coeff;

	strncpy(label, lab, MAX_LABEL_LEN);
	label[MAX_LABEL_LEN] = 0;
	#ifdef USING_ATOMICS
	atomic_init(&startAtomic, -1);
	atomic_init(&finishAtomic, 0);
	#else
	pthread_mutex_init(&startMx, NULL);
	pthread_mutex_lock(&startMx);  // don't let a spurious frame start
	pthread_mutex_init(&finishMx, NULL);
	#endif


	// should this come earlier?
	grinderThread::createGrinderThreads(this);

	samplePoint = space->dimensions[0].N / 3 + space->dimensions[0].start;

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
		printf("         nDimesions=%d   nStates=%d nPoints=%d voltage=%p voltageFactor=%lf spectrumLength=%d  samplePoint=%d\n",
			space->nDimensions, space->nStates, space->nPoints,
			space->voltage, space->voltageFactor, space->spectrumLength,
			samplePoint);
	}
	sentinel = true;

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
	makeIntGetter(frameSerial);
	makeIntSetter(frameSerial);
	printf("\n");
	makeIntGetter(justNFrames);
	makeIntSetter(justNFrames);

	makeDoubleGetter(totalCalcTime);
	makeDoubleGetter(maxCalcTime);
	makeDoubleGetter(divergence);

	makeBoolGetter(shouldBeIntegrating);
	makeBoolSetter(shouldBeIntegrating);
	makeBoolGetter(isIntegrating);
	makeBoolSetter(isIntegrating);

	makeBoolGetter(pleaseFFT);
	makeBoolSetter(pleaseFFT);

	makeBoolGetter(needsRepaint);
	makeBoolSetter(needsRepaint);

	makeBoolGetter(hadException);
	makeBoolSetter(hadException);
	makeStringPointer(exceptionCode);


	printf("\n");
	makeDoubleGetter(stretchedDt);
	makeDoubleSetter(stretchedDt);

	makeIntGetter(nGrinderThreads);

	makeDoubleGetter(animationFP);
	makeDoubleSetter(animationFP);

	/* *********************************************** waves & buffers */

	printf("\n");
	makePointerGetter(qflick);

	printf("\n");
	makePointerGetter(voltage);
	makeDoubleGetter(voltageFactor);
	//makeDoubleSetter(voltageFactor);

	makeDoubleGetter(divergence);

//	printf("\n");
//	makePointerGetter(scratchQWave);

	printf("\n");
	makePointerGetter(qspect);

	makePointerGetter(stages);
	makePointerGetter(threads);

	makeStringPointer(label);

	makeBoolGetter(sentinel);  // should always be value true


	printf("\n🪓 🪓 --------------- done with qGrinder direct access --------------\n");
}

/* ********************************************************** dumpObj  */

// dump all the fields of a grinder
void qGrinder::dumpObj(const char *title) {
	speedyLog("\n🪓🪓 ==== qGrinder | %s ", title);
	speedyLog("        magic: %c%c%c%c   qSpace=%p '%s'   \n",
		magic>>24, magic>>16, magic>>8, magic, space, label);

	speedyLog("        elapsedTime=%lf, frameSerial=%d, dt=%lf, \n",
		elapsedTime, frameSerial, space->dt);

	speedyLog("        qflick=%p, voltage=%p, voltageFactor=%lf, qspect=%p\n",
		qflick, voltage, voltageFactor, qspect);

	speedyLog("        shouldBeIntegrating: %hhu   isIntegrating: %hhu   pleaseFFT=%hhu \n",
		shouldBeIntegrating, isIntegrating, pleaseFFT);

	speedyLog("        ==== end of qGrinder::dumpObj(%s) ====\n\n", title);
}

/* ********************************************************** avatar and view buffer */

// some uses never need this so wait till they do
qSpectrum *qGrinder::getSpectrum(void) {
	if (!qspect)
		qspect = new qSpectrum(space);
	return qspect;
};

void qGrinder::copyFromAvatar(qAvatar *avatar) {
	qflick->copyBuffer(qflick, avatar->qwave);  // to buffer zero
}

void qGrinder::copyToAvatar(qAvatar *avatar) {
	qflick->copyBuffer(avatar->qwave, qflick);  // from buffer zero
}

/* ********************************************************** tally & measure divergence */

static int tally = 0;

// if these two derivatives differ in sign, increment the tally.
// In other words, if there's a kink.
static void difft(double p, double q, double r) {
	if (p > q && q < r) tally++;
	if (p < q && q > r) tally++;
}

// count up how many sign reversals, for the derivative, in consecutive cells we have
void qGrinder::tallyUpKinks(qWave *qwave) {
	tally = 0;
	qCx *wave = qwave->wave;
	qCx a = wave[qwave->start - 1];
	qCx b = wave[qwave->start];
	qCx c;
	for (int ix = qwave->start + 1; ix <= qwave->end; ix++) {
		c = wave[ix];

		difft(a.re, b.re, c.re);
		difft(a.im, b.im, c.im);
		a = b;
		b = c;
	}

	// figure rate.  ÷2 for real, imag
	int N = qwave->end - qwave->start;
	double percent = 100.0 * tally / N / 2.;
	if (traceKinks)
		speedyLog("🪓 tallyUpKinks result: %d out of %d or %5.1f %%\n",
			tally, N, percent);
	divergence = percent;
}

/* ********************************************************** doing Integration */

// Integrates one Frame, one iteration, on single thread.  Does several
// visscher steps (eg 10 or 100 or 500). Actually does stepsPerFrame + ½
// steps; four half hits, im at start and re at finish, to adapt to
// Visscher timing, then synchronized timing. Maybe this should be in
// grinderThread?  Multi-threads will have to be done with totally different code.
void qGrinder::oneFrame() {
	if (traceIntegration) {
		speedyLog("qGrinder 🪓 starting oneFrame() "
			"shouldBeIntegrating: %hhu   isIntegrating: %hhu\n",
			shouldBeIntegrating, isIntegrating);
	}
	if (traceIntegrationDetailed)
		qGrinder::dumpObj("qGrinder 🪓 starting oneFrame()");
	qCx *wave0 = qflick->waves[0];
	qCx *wave1 = qflick->waves[1];
	qCx *wave2 = qflick->waves[2];

	double dt = stretchedDt;
	double dtHalf = dt / 2;

	// half step in beginning to move Im forward dt/2
	// cuz outside of here, re and im are interlaced.
	qflick->fixThoseBoundaries(wave0);
	hitReal(wave1, wave0, wave0, 0);
	hitImaginary(wave1, wave0, wave0, dt/2);

	// Note here the latest is in [1]; frame continues this,
	// and the halfwave at the end moves it back to [0]].
	// midpoint uses [2] in between.
	int doubleSteps = stepsPerFrame / 2;
	for (int step = 0; step < doubleSteps; step++) {

		#ifdef MIDPOINT_METHOD
		stepMidpoint(wave0, wave1, wave2, dt);
		stepMidpoint(wave1, wave0, wave2, dt);
		#else
		hitRealImaginary(wave0, wave1, wave1, dt);
		hitRealImaginary(wave1, wave0, wave0, dt);
		#endif
	}
	elapsedTime += dt * (doubleSteps * 2 + .5);
	frameSerial++;

	// half hit at completion to move Re forward dt / 2
	// and copy back to Main
	qflick->fixThoseBoundaries(wave1);
	hitReal(wave0, wave1, wave1, dt/2);
	hitImaginary(wave0, wave1, wave1, 0);

	// normalize it and return the old inner product, see how close to 1.000 it is
	double iProd = qflick->normalize();
	if (dumpFFHiResSpectums) qflick->dumpHiRes("wave END fourierFilter() after normalize");
	if (traceIProd && ((int) frameSerial & 0x7) == 0)
		speedyLog("      🪓 qGrinder frame %d elapsed %4.6lf  iProd= %lf \n",
			frameSerial, elapsedTime, iProd);

	if (traceJustWave)
		qflick->dump("     🪓 qGrinder traceJustWave at end of frame", true);

	if (traceIntegration)
		speedyLog("🪓 qGrinder::oneFrame() done; shouldBeIntegrating: %hhu   isIntegrating: %hhu \n"
			"  dt in use=%lf  stretchedDt=%8.6lf stepsPerFrame=%d  wave0[5]=%lf\n",
			shouldBeIntegrating, isIntegrating, dt, stretchedDt, stepsPerFrame,
			wave0[5]);

	frameSerial++;
	qCheckReset();
}


/* ********************************************************** threaded integration  */

void qGrinder::aggregateCalcTime(void) {
	// add up ALL the threads' frameCalcTime and keep a running average
	totalCalcTime = 0;
	maxCalcTime = 0;
	for (int ix = 0; ix < nGrinderThreads; ix++) {
		grinderThread *sl = gThreads[ix];
		if (sl) {
			totalCalcTime += sl->frameCalcTime;
			maxCalcTime = fmax(maxCalcTime, sl->frameCalcTime);
		}
	}

	// now compare it to the screen and adjust so it's just about the frame  time
	stepsPerFrame += (stepsPerFrame / maxCalcTime) * (animationFP - maxCalcTime);

	if (traceAggregate) {
		speedyLog(" qGrinder 🪓 aggregate time summed: %5.6lf  maxed: %5.6lf\n",
			totalCalcTime, maxCalcTime);
		speedyLog("       animationFP: %5.6lf  new stepsPerFrame: %d time per step: %5.8lf µs\n",
			animationFP, stepsPerFrame, maxCalcTime/stepsPerFrame * 1e6);
	}
}


// runs in the thread loop, only in the last thread to finish integration in an integration frame.
void qGrinder::threadsHaveFinished() {
	if (traceThreadsHaveFinished) speedyLog("🪓 qGrinder::threadsHaveFinished starts\n");
	aggregateCalcTime();

	// single step (or a few steps): are we done yet?
	if (justNFrames) {
		if (traceSingleStep) speedyLog("🪓 ss: justNFrames = %d\n", justNFrames);
		--justNFrames;
		if (0 >= justNFrames) {
			shouldBeIntegrating = false;
			if (traceSingleStep) speedyLog("🪓 ss turned off sbi: justNFrames = %d\n", justNFrames);
		}
	}

	if (traceIntegration)  {
		speedyLog("🪓                ...in threadsHaveFinished().  justNFrames=%d and "
			"shouldBeIntegrating=%d   isIntegrating=%d\n",
			justNFrames, shouldBeIntegrating, isIntegrating);
	}

	// isIntegrating is on otherwise we wouldn't be here.
	// if shouldBeIntegrating has turned off (by user), time to stop.  So all threads
	// are synchronized.  turned on again when triggered.
	if (!shouldBeIntegrating)
		isIntegrating = false;

	if (traceIntegration)  {
		speedyLog("🪓 finished threadsHaveFinished() sortof. shouldBeIntegrating=%d   isIntegrating=%d\n",
				shouldBeIntegrating, isIntegrating);
	}
	speedyFlush();

	// now, copy it to the Avatar's wave buffer, so it can copy it to
	// its ViewBuffer, so webgl can pick it up.  quick!  No mutexes or anything;
	// this here runs in thread time.  webgl runs in UI time.  Worst
	// thing that'll happen is the image will be part one frame and part
	// the next frame.
	copyToAvatar(avatar);
	needsRepaint = true;
	if (traceThreadsHaveFinished) speedyLog("🪓 threadsHaveFinished()— copied latest wave"
		" to avatar needsRepaint=%d  shouldBeIntegrating=%d   isIntegrating=%d\n",
			needsRepaint, shouldBeIntegrating, isIntegrating);

	if (this->pleaseFFT) analyzeWaveFFT(qflick, "before fourierFilter()");
	this->pleaseFFT = false;

	// see how many alternating derivatives we have
	tallyUpKinks(qflick);
	if (divergence > 10) {
		if (divergence > 95) {
			char buf[64];
			snprintf(buf, 64, "🪓 🪓 wave is DIVERGING, divergence=%4.4g %% 🔥 🧨", divergence);
			shouldBeIntegrating = isIntegrating = false;

			// js code intercepts this exact spelling
			reportException("Sorry, your wave integration diverged! Try a shorter "
				"stretch factor for ∆t.  Click Start Over to try again.", "diverged");
		}
		else {
			speedyLog("🪓 wave starting to Diverge, divergence=%4.4g %% 🔥 🧨", divergence);
		}
	}

	// ready for new frame
	// check whether we've stopped and leave it locked or unlocked for the next cycle.
	#ifdef USING_ATOMICS
	// this retriggers every frametime.  see how that goes.
	if (isIntegrating)
		emscripten_atomic_store_u32(&startAtomic, 0);  // start next iteration
	else
		emscripten_atomic_store_u32(&startAtomic, -1);  // stop integration at starting line
	emscripten_atomic_store_u32(&finishAtomic, 0);
	if (traceThreadsHaveFinished) speedyLog("🪓  so now startAtomic=%d   and finishAtomic=%d\n",
		emscripten_atomic_load_u32(&startAtomic), emscripten_atomic_load_u32(&finishAtomic));


	#else
	nStartedThreads = 0;
	nFinishedThreads = 0;

	// unlock for starting next cycle
	if (isIntegrating) {
		if (traceThreadsHaveFinished) speedyLog("unlocking startMx to lauch the next cycle\n");
		pthread_mutex_unlock(&startMx);
	}
	#endif

}


// start a new frame calculating by starting each/all gThread threads.
// This is called from JS, therefore the UI thread.
// Each frame will trigger the next to continue integration?
void qGrinder::triggerIteration() {
	if (traceIntegration)  {
		speedyLog("🪓 qGrinder::triggerIteration(): shouldBeIntegrating=%d   isIntegrating=%d\n",
				shouldBeIntegrating, isIntegrating);
	}

	// don't let it trigger if already running; might scrw up timing
	if (isIntegrating) return;

	//emscripten_debugger();
	isIntegrating = true;

	// start next iteration
	#ifdef USING_ATOMICS
	emscripten_atomic_store_u32(&startAtomic, 0);

	// this is like notify_all
	emscripten_atomic_notify(&startAtomic, EMSCRIPTEN_NOTIFY_ALL_WAITERS);
	#else
	pthread_mutex_unlock(&startMx);
	#endif

}

// start a new frame calculating by starting each/all gThread threads.
// This is called from JS, therefore the UI thread.
void grinder_triggerIteration(qGrinder *grinder) {
	grinder->triggerIteration();
}

/* ********************************************************** exceptions  */

// any error in the threads, send it here and the UI thread will grab it.
// set integrationEx to exception or string with message
void qGrinder::reportException(std::runtime_error *ex, const char *code) {
	integrationEx = *ex;  // copy it.  hope I'm doing this right.
	strncpy(exceptionCode, code, sizeof(exceptionCode));
	hadException = true;  // tells js to call grinder_getExceptionMessage
}

// no fancy exception objects; just an error message string
void qGrinder::reportException(const char *message, const char *code) {
	std::runtime_error ex(message);
	reportException(&ex, code);
}

// JUST the message from the C++ exception; not the code.  that's just a string.
const char *qGrinder::getExceptionMessage(void) {
	return integrationEx.what();
}

// called from JS to get a message
const char *grinder_getExceptionMessage(qGrinder *grinder) {
	return grinder->integrationEx.what();
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

void grinder_copyToAvatar(qGrinder *qgrinder, qAvatar *avatar) {qgrinder->copyToAvatar(avatar);}




