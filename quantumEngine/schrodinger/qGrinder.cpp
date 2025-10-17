/*
** qGrinder -- the calculation of a simulation of a quantum mechanical wave
** Copyright (C) 2022-2025 Tactile Interactive, all rights reserved
*/
#include <string.h>
#include <ctime>
#include <limits>
#include <cfenv>
#include <stdexcept>

#include <pthread.h>
#include <stdatomic.h>

#include "../hilbert/qSpace.h"
//#include "../greiman/qAvatar.h"
#include "qThread.h"
#include "qGrinder.h"
#include "grWorker.h"
#include "../debroglie/qFlick.h"
#include "../fourier/qSpectrum.h"
#include "../fourier/fftMain.h"
#include "../directAccessors.h"



static bool traceTrigger = false;

static bool traceIntegration = false;
static bool traceIntegrationDetailed = false;

static bool traceJustWave = false;

static bool dumpFFHiResSpectums = false;
static bool traceIProd = false;

static bool traceConstructor = false;

static bool traceDivergence = false;
static bool traceKinks = false;

static bool traceAggregate = false;
static bool traceThreadsHaveFinished = false;
static bool traceTHFBenchmarks = false;

// RK2
#define MIDPOINT_METHOD

static std::runtime_error nullException("");


// create new grinder, complete with its own stage buffers. make sure
// these values are doable by the sliders' steps. Space is definitely
// created by creation time here, although a few details left  to do.
qGrinder::qGrinder(qSpace *sp, int nGrWorkers, const char *lab)
	: magic('Grnd'), space(sp), spect(NULL),
		stepsPerFrame(48), videoFP(.05), stretchedDt(60),
		elapsedTime(0), frameSerial(0), nGrWorkers(nGrWorkers),
		integrationEx(nullException), exceptionCode(""), _zero(0), hadException(false),
		shouldBeIntegrating(false), isIntegrating(false),
		pleaseFFT(false), sentinel(grSENTINEL_VALUE) {

	// number of waves
	flick = new qFlick(space, 3);

	// recieves wave after a frame is done; then vbufs generated from that
	stage = new qWave(space, NULL);

	// so wave in the flick points to the zero-th wave

	// use these for grinding
	voltage = sp->voltage;
	d2Coeff = sp->dimensions[0].d2Coeff;

	strncpy(label, lab, MAX_LABEL_LEN);
	label[MAX_LABEL_LEN] = 0;
	atomic_init(&startAtomic, -1);
	atomic_init(&finishAtomic, 0);

	// should this come earlier?
	grWorker::createGrWorkers(this);

	samplePoint = space->dimensions[0].N / 3 + space->dimensions[0].start;

	if (traceConstructor) {
		dumpObj(" qGrinder 🪓 constructed");

		qDimension *dims = space->dimensions;
		printf("          its qDimension:   N=%d start=%d end=%d ",
			dims[0].N, dims[0].start, dims[0].end);
		printf("        nStates=%d nPoints=%d\n", dims[0].nStates, dims[0].nPoints);
		printf("        its continuum=%d spectrumLength=%d label=%s\n",
			dims[0].continuum, dims[0].spectrumLength, dims[0].label);

		printf("      the qSpace for 🪓 grinder %s:   magic=" MAGIC_FORMAT " spacelabel=%s\n",
			label, MAGIC_ARGS, space->label);
		printf("         nDimesions=%d   nStates=%d nPoints=%d voltage=%p spectrumLength=%d  samplePoint=%d\n",
			space->nDimensions, space->nStates, space->nPoints,
			space->voltage, space->spectrumLength,
			samplePoint);
	}
	if (sentinel != grSENTINEL_VALUE)
		printf("qGrinder: sentinel should be equal: %d %d\n", (int) sentinel, (int) grSENTINEL_VALUE);

	FORMAT_DIRECT_OFFSETS;
};

qGrinder::~qGrinder(void) {
	// we delete any buffers hanging off the qGrinder here.
	// eGrinder will delete the Grinder object and any others needed.

	delete flick;
	flick = NULL;

	// these may or may not have been allocated, depending on whether they were needed
	if (spect)
		delete spect;
	spect = NULL;
};

// need these numbers for the js interface to this object, to figure out
// the offsets. see eGrinder.js ;  usually this function isn't called.
// See directAccessors.h to change FORMAT_DIRECT_OFFSETS to insert this
// into the constructor and run this once.  Copy text output. Paste the
// output into class eGrinder.js , the class itself, to replace the
// existing ones I'mm sure we don't need all of these; I'll thin them
// out when it all works.
void qGrinder::formatDirectOffsets(void) {
	// don't need magic
	printf("🪓 🪓 --------------- starting 🥽 eGrinder direct access 🥽 JS getters & setters--------------\n\n");
	// these can come in any order; the .h file determines the memory layout
	// but keep in same order as the .h file so I don't go crazy.  Commented ones don't have js accessors.

	/* ************************* pointers  for large blocks */
	makePointerGetter(space);
	makePointerGetter(flick);

	makePointerGetter(voltage);
	makePointerGetter(spect);
	makePointerGetter(stage);
	printf("\n");

	/* ************************* timing */

	makeIntGetter(stepsPerFrame);
	makeIntSetter(stepsPerFrame);

	makeDoubleGetter(videoFP);
	makeDoubleSetter(videoFP);
	makeDoubleGetter(chosenFP);
	makeDoubleSetter(chosenFP);

	makeDoubleGetter(totalCalcTime);
	makeDoubleGetter(maxCalcTime);
	printf("\n");

	/* ************************* grinding */

	makeDoubleGetter(stretchedDt);
	makeDoubleSetter(stretchedDt);
	// d2Coeff
	makeDoubleGetter(divergence);
	makeDoubleGetter(elapsedTime);
	makeDoubleSetter(elapsedTime);
	makeIntGetter(frameSerial);
	makeIntSetter(frameSerial);
	// samplePoint
	// grWorkers
	makeIntGetter(nGrWorkers);

	makeIntOffset(startAtomic);
	makeIntGetter(startAtomic);
	// finishAtomic
	printf("\n");

	/* ************************* exceptions */

	// integrationEx
	makeStringPointer(exceptionCode);

	makeBoolGetter(hadException);
	makeBoolSetter(hadException);
	// _zero

	makeStringPointer(label);
	printf("\n");

	/* ************************* booleans & bytes at end */

	makeBoolGetter(shouldBeIntegrating);
	makeBoolSetter(shouldBeIntegrating);
	makeBoolGetter(isIntegrating);
	makeBoolSetter(isIntegrating);

	makeBoolGetter(pleaseFFT);
	makeBoolSetter(pleaseFFT);

	makeBoolGetter(needsRepaint);
	makeBoolSetter(needsRepaint);

	makeByteGetter(sentinel);  // should always be value grSENTINEL_VALUE; only for validation
	makeByteSetter(sentinel);

	printf("\n🪓 🪓 --------------- done with 🥽 eGrinder direct access 🥽 --------------\n");
}

/* ********************************************************** dumpObj  */

// dump all the fields of a grinder
void qGrinder::dumpObj(const char *title) {
	speedyLog("\n🪓🪓 ==== qGrinder | %s ", title);
	speedyLog("        magic: " MAGIC_FORMAT "   qSpace=%p '%s'   \n",
		MAGIC_ARGS, space, label);

	speedyLog("        elapsedTime=%lf, frameSerial=%d, dt=%lf, \n",
		elapsedTime, frameSerial, space->dt);

	speedyLog("        flick=%p, voltage=%p, spect=%p\n",
		flick, voltage, spect);

	speedyLog("        shouldBeIntegrating: %hhu   isIntegrating: %hhu   pleaseFFT=%hhu \n",
		shouldBeIntegrating, isIntegrating, pleaseFFT);

	speedyLog("        ==== end of qGrinder::dumpObj(%s) ====\n\n", title);
}

/* ********************************************************** grinder */

// some uses never need this so wait till they do
qSpectrum *qGrinder::getSpectrum(void) {
	if (!spect)
		spect = new qSpectrum(space);
	return spect;
};

void qGrinder::copyFromStage(void) {
	//throw std::runtime_error("qGrinder::copyFromStage() not implenented)";
	flick->copyBuffer(flick, stage);  // to buffer zero
}

// JS interface
//void grinder_copyFromAvatar(qGrinder *grinder, qAvatar *avatar) {
//	grinder->copyFromStage(avatar);
//}

void qGrinder::qGrinder::copyToStage(void) {
	//throw std::runtime_error("qGrinder::copyFromStage() not implenented");
	flick->copyBuffer(stage, flick);  // from flick buffer zero
}

// JS interface
//void grinder_copyToStage(qGrinder *grinder, qAvatar *avatar) {
//	grinder->copyToStage(avatar);
//}

/* *********************************************** divergence & tallying  */

// sloppy sloppy
static int tally = 0;

// if these two derivatives differ in sign, increment the tally.
// In other words, if there's a kink.
static void difft(double p, double q, double r) {
	if (p > q && q < r) tally++;
	if (p < q && q > r) tally++;
}

// count up how many sign reversals, for the derivative, in consecutive cells we
// have
void qGrinder::tallyUpKinks(qWave *qwave) {
	tally = 0;
	qCx *wave = qwave->wave;
	qCx a = wave[qwave->start];
	qCx b = wave[qwave->start + 1];
	qCx c;
	for (int ix = qwave->start + 2; ix <= qwave->end; ix++) {
		c = wave[ix];

		difft(a.re, b.re, c.re);
		difft(a.im, b.im, c.im);
		a = b;
		b = c;
	}

	// NO!  percent is higher for smaller buffers.  I think number of kinks is better
	//double percent = 100.0 * tally / N / 2.;
	// figure rate.  ÷2 for real, imag
	int N = qwave->end - qwave->start;
	divergence = tally/2;

	if (traceKinks) {
		speedyLog("🪓 tallyUpKinks result: tally/2= %d out of %d or %5.1f %%\n",
			divergence, N, 100.0 * divergence / N);
	}
}

// see how many alternating derivatives we have.  Then convert to a user-visible
// number and issue errors or warnings
void qGrinder::measureDivergence() {
	tallyUpKinks(flick);
	if (divergence > 20) {
		int N = space->dimensions[0].N;

		if (divergence > N * 15 / 16) {
			char buf[64];
			snprintf(buf, 64, "🪓 🪓 wave is DIVERGING, =%4.4g %% 🔥 🧨", divergence);
			isIntegrating = false;

			// js code intercepts this exact spelling, in sAnimate
			reportException("Sorry, your wave integration diverged! Try a shorter "
				"stretch factor for ∆t.  Click Start Over to try again.", "diverged");
		}
		else {
			// not bad yet
			if (traceDivergence) {
				speedyLog("🪓 wave starting to Diverge, divergence=%4.4g / %d 🧨",
					divergence, N);
			}
		}
	}
}

/* ********************************************************** doing Integration */

// Integrates one Frame, one iteration, on single thread.  Does several
// visscher steps (eg 10 or 100 or 500). Actually does stepsPerFrame + ½
// steps; four half hits, im at start and re at finish, to adapt to
// Visscher timing, then synchronized timing. Maybe this should be in
// grWorker?  Multi-threads will have to be done with totally different code.
void qGrinder::oneFrame() {
	if (traceIntegration) {
		speedyLog("qGrinder 🪓 starting oneFrame() "
			"shouldBeIntegrating: %hhu   isIntegrating: %hhu\n",
			shouldBeIntegrating, isIntegrating);
	}
	if (traceIntegrationDetailed)
		qGrinder::dumpObj("qGrinder 🪓 starting oneFrame()");
	qCx *wave0 = flick->waves[0];
	qCx *wave1 = flick->waves[1];
	qCx *wave2 = flick->waves[2];

	double dt = stretchedDt;
	double dtHalf = dt / 2;

	// half step in beginning to move Im forward dt/2 = dtHalf
	// cuz outside of here, re and im are synchronized.
	flick->fixThoseBoundaries(wave0);
	hitReal(wave1, wave0, wave0, 0);
	hitImaginary(wave1, wave0, wave0, dtHalf);

	// do stepsPerFrame steps of  integration.
	// Note here the latest is in [1]; frame continues this,
	// and the halfwave at the end moves it back to [0]].
	// midpoint uses [2] in between.
	for (int step = 0; step < stepsPerFrame; step++) {

		#ifdef MIDPOINT_METHOD
		stepMidpoint(wave0, wave1, wave2, dt);
		stepMidpoint(wave1, wave0, wave2, dt);
		#else
		hitRealImaginary(wave0, wave1, wave1, dt);
		hitRealImaginary(wave1, wave0, wave0, dt);
		#endif
	}

	// we
	elapsedTime += dt * (stepsPerFrame + .5);  // is this right?
	frameSerial++;

	// half hit at completion to move Re forward dt / 2
	// and copy back to Main
	flick->fixThoseBoundaries(wave1);
	hitReal(wave0, wave1, wave1, dtHalf);
	hitImaginary(wave0, wave1, wave1, 0);

	// normalize it and return the old inner product, see how close to 1.000 it is
	double iProd = flick->normalize();
	if (dumpFFHiResSpectums) flick->dumpHiRes("wave END fourierFilter() after normalize");
	if (traceIProd && ((int) frameSerial & 31) == 0)
		speedyLog("      🪓 qGrinder frame %d elapsed %4.6lf  iProd= %lf \n",
			frameSerial, elapsedTime, iProd);

	if (traceJustWave)
		flick->dump("     🪓 qGrinder traceJustWave at end of frame", true);

	if (traceIntegration) {
		speedyLog("🪓 qGrinder::oneFrame() done; shouldBeIntegrating: %hhu   isIntegrating: %hhu \n"
			"  dt in use=%lf  stretchedDt=%8.6lf stepsPerFrame=%d  wave0[5]=%lf\n",
			shouldBeIntegrating, isIntegrating, dt, stretchedDt, stepsPerFrame,
			wave0[5]);
	}

	//frameSerial++;
	qCheckReset();
}

void grinder_oneFrame(qGrinder *pointer) { pointer->oneFrame(); }


/* ********************************************************** threaded integration  */

// add up ALL the threads' frameCalcTime and keep a running average
void qGrinder::aggregateCalcTime(void) {
	totalCalcTime = 0;
	maxCalcTime = 0;
	for (int ix = 0; ix < nGrWorkers; ix++) {
		grWorker *sl = grWorkers[ix];
		if (sl) {
			totalCalcTime += sl->frameCalcTime;
			maxCalcTime = fmax(maxCalcTime, sl->frameCalcTime);
		}
	}

	// now compare it to the screen and adjust so it's just about the frame time.
	stepsPerFrame += (int) (stepsPerFrame * (videoFP - maxCalcTime)  / maxCalcTime);

	if (traceAggregate) {
		speedyLog(" qGrinder 🪓 aggregate time summed: %5.6lf ms, maxed: %5.6lf ms\n",
			totalCalcTime, maxCalcTime);
		speedyLog("       videoFP: %5.6lf  new stepsPerFrame: %d time per step: %5.8lf µs\n",
			videoFP, stepsPerFrame, maxCalcTime/stepsPerFrame * 1e6);
	}
}


// runs in the thread loop, only in the last thread to finish integration in an
// integration frame.  Eventually I'll have a 'tail' thread, that does this so
// the worker threads can quickly get back to work.
void qGrinder::threadsHaveFinished() {
	double thfTime;
	if (traceThreadsHaveFinished || (traceTHFBenchmarks && 0 == (frameSerial & 63))) {
		thfTime = getTimeDouble();
		speedyLog("🪓 qGrinder::threadsHaveFinished() starts\n");
	}
	aggregateCalcTime();

	if (traceTHFBenchmarks && 0 == (frameSerial & 63)) {
		speedyLog("🪓 threadsHaveFinished()— aggregateCalcTime()÷64 at %10.6lf ms - needsRepaint=%hhu"
			" shouldBeIntegrating=%hhu   isIntegrating=%hhu\n",
			getTimeDouble() - thfTime, needsRepaint, shouldBeIntegrating, isIntegrating);
	}

	// isIntegrating is on otherwise we wouldn't be here.
	// if shouldBeIntegrating has turned off (by user), time to stop.  So all threads
	// are synchronized.  turned on again when triggered.
	if (!shouldBeIntegrating)
		isIntegrating = false;

	if (traceIntegration)  {
		speedyLog("🪓 synch up isIntegrating with shouldBeIntegrating sortof. "
				"shouldBeIntegrating=%hhu   isIntegrating=%hhu\n",
				shouldBeIntegrating, isIntegrating);
	}

	// now, copy it to the stage wave buffer, so it can copy it to
	// its avatar, so webgl can pick it up.  quick!  No mutexes or anything;
	// this here runs in thread time.  webgl runs in UI time.  Worst
	// thing that'll happen is the image will be part one frame and part
	// the next frame.
	// THis tail thread should also snarf off a copy of the raw wave, and do an FFT on it,
	// for display on the frequency chart
	copyToStage();
	needsRepaint = true;

	if (traceTHFBenchmarks && 0 == (frameSerial & 63)) {
		speedyLog("🪓 threadsHaveFinished()— copyToStage()÷64 at %10.6lf ms - needsRepaint=%hhu"
			" shouldBeIntegrating=%hhu   isIntegrating=%hhu\n",
			getTimeDouble() - thfTime, needsRepaint, shouldBeIntegrating, isIntegrating);
	}

	// what is this doing here?  Prob should be done in another thread.
	if (this->pleaseFFT)
		analyzeWaveFFT(flick, "latest fft");
	this->pleaseFFT = false;

	measureDivergence();

	// ready for new frame
	// check whether we've stopped and leave it locked or unlocked for the next cycle.
	// this retriggers every frametime, if the chosenFP is FASTEST.
	// if (isIntegrating && FASTEST == chosenFP)
	// 	emscripten_atomic_store_u32(&startAtomic, 0);  // start next iteration ASAP
	// else

	// now in grWorker emscripten_atomic_store_u32(&startAtomic, -1);
	emscripten_atomic_store_u32(&finishAtomic, 0);

	if (traceTHFBenchmarks && 0 == (frameSerial & 63)) {
		speedyLog("🪓  threadsHaveFinished() finished÷64 at %10.6lf ms; startAtomic=%d finishAtomic=%d "
			"needsRepaint=%hhu  shouldBeIntegrating=%hhu   isIntegrating=%hhu frSerial=%d\n",
			getTimeDouble() - thfTime,
			emscripten_atomic_load_u32(&startAtomic), emscripten_atomic_load_u32(&finishAtomic),
			needsRepaint, shouldBeIntegrating, isIntegrating, frameSerial);
	}

	// only print now after benchmarks have been measured
	speedyFlush();
}


// start a new frame calculating by starting each/all gThread threads.
// This can be called from JS, therefore the UI thread.
// Each frame will trigger the next to continue integration
// We can do this also from JS with Atomic.store and .notify instead
void qGrinder::triggerIteration() {
	if (traceTrigger)  {
		speedyLog("🪓 qGrinder::triggerIteration(): shouldBeIntegrating=%hhu   isIntegrating=%hhu\n",
				shouldBeIntegrating, isIntegrating);
	}

	isIntegrating = true;

	// start next iteration
	emscripten_atomic_store_u32(&startAtomic, 0);

	// this is like notify_all
	emscripten_futex_wake(&startAtomic, 999999);
}

// start iterating, starting each/all gThread threads. Iteration will
// trigger the next frame, and so on.  This starts it, and
// shouldBeIntegrating should also be true.
// This is called from JS, therefore the UI thread.  (or alternate: via js atomics)
void grinder_triggerIteration(qGrinder *grinder) {
	grinder->triggerIteration();
}

/* ********************************************************** birth and death  */

qGrinder *grinder_create(qSpace *space, int nGrWorkers, const char *label) {
	return new	qGrinder(space, nGrWorkers, label);
}

void grinder_delete(qGrinder *grinder) {
	delete grinder;
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
	analyzeWaveFFT(flick, "askForFFT while idle");
}

// if integrating, FFT as the current frame finishes, before and after fourierFilter().
// If stopped, fft current wave. now.
void grinder_askForFFT(qGrinder *pointer) { pointer->askForFFT(); }

