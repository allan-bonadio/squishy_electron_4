/*
** qGrinder -- the simulation of a quantum mechanical wave in a space
** Copyright (C) 2022-2024 Tactile Interactive, all rights reserved
*/

#include <pthread.h>

// so are we doing atomics or mutexes?
#define USING_ATOMICS
#ifdef USING_ATOMICS
#include <emscripten/atomic.h>
#else
// nope - it's all in pthread.h
#endif


/* Some terms:
a Frame: is an amount of calculation correspoinding to one refresh of the display.
	Doesn't have to be synchronized with the screen refreshes; just the amount of
	calculation done for it.

a Step: is an mount of calculation to advance the model dt time.
	(Really ∆t but it's tedious entering the delta character.)

a Hit: advancement by dt of one of many parts of the calculation.  As of this writing,
	there are four hits to a step: two Vischer real imag,
	and two Midpoint first and last.

*/

struct qThread;
struct qStage;
struct grWorker;

struct qGrinder {
	qGrinder(qSpace *, struct qAvatar *av, int nGrinderThreads, const char *label);
	~qGrinder(void);
	void formatDirectOffsets(void);
	void dumpObj(const char *title);

	void copyFromAvatar(qAvatar *avatar);
	void copyToAvatar(qAvatar *avatar);

	int magic;
	qSpace *space;
	qAvatar *avatar;

	/* *********************************************** JS accessible */
	// please keep alignment stable and correct!  See also eGrinder.js
	// Keep arranged from larger to smaller - doubles (or pairs of ints), then ints, then bools

	// total number of times thru the number cruncher.
	int frameSerial;

	// how much time we've integrated, from creation.  pseudo-pico-seconds.  Since we've eliminated
	// all the actual physical constants from the math, why not choose our own definition
	// of what a second is?  Resets to zero every so often.
	double elapsedTime;

	// = dtStretch * space->dt
	double stretchedDt;

	double d2Coeff;

	// any exception thrown or discovered in a thread.  Message is human-readable.
	std::runtime_error integrationEx;

	// non-human error code for parts of the code that have to intercept
	// specific exceptions by exact spelling
	char exceptionCode[14];
	char _zero;

	// use this with integrationEx, which JS cannot read, but getExceptionMessage() can.
	bool hadException;  // aligned to 8 bytes again
	const char *getExceptionMessage(void);

	// set integrationEx to exception with message; optionally set code, too
	void reportException(const char *message, const char *code = "reported");
	void reportException(std::runtime_error *ex, const char *code = "reported");

	// number of integration steps executed for each
	// dynamically adjusted so integration calculation of a frame takes
	// about as much time as a screen refresh frame, as set by the user.
	int stepsPerFrame;

	/* *********************************************** integrating */

	// scan period of the screen = target rate for a frame of grinding
	// In seconds, with fractions.  comes from sAnimator.
	double animationFP;

	// a subclass of  qWave, it has multiple waves to do grinding with
	// this grinder OWNS the qFlick & is responsible for deleting it
	struct qFlick *qflick;

	// pointer grabbed from the space.  Same buffer as in space.
	double *voltage;

	// how long (thread time) it took to do the latest frame, all threads added together
	double totalCalcTime;
	double maxCalcTime;  // and max of all threads

	double divergence;  // divergence measure

	// for the fourier filter.  Call the function first time you need it.
	// owned if non-null
	struct qSpectrum *qspect;
	qSpectrum *getSpectrum(void);

	struct qStage *stages;
	struct qThread *threads;

	int nGrinderThreads;  // total number of gThread threads we'll use for integrating
			// mostly constant, although there's plans to gradually add/remove threads

	// Although isIntegrating, do only this many more frames before
	// stopping.  Like 1 for single step.  Ought to change this.  TODO
	int justNFrames;

	#ifdef USING_ATOMICS
	// Starts at -1 = waiting at starting line, or set it to 0 to launch
	// a frame.  All the threads atomic_wait, waiting for this to turn
	// nonnegative.
	_Atomic int startAtomic;

	// starts at 0.  As each thread finishes their iteration work, they
	// atomically increment it.  The thread that increments it to
	// nGrinderThreads, knows it's the last and calls threadsHaveFinished()
	_Atomic int finishAtomic;

	#else

	// All threads start (roughly) all at once when this is unlocked.
	// Then, each gThread thread, who have all requested an lock of the
	// startMx, each get to lock it, add one to nStartedThreads, and
	// immediately unlock it, and proceed to integration.
	pthread_mutex_t startMx;

	// guards grinder->nFinishedThreads, frameCalcTime, etc
	pthread_mutex_t finishMx;

	// number of grWorker s that have started/finished integration yet; incremented up to nGrinderThreads
	int nStartedThreads;
	int nFinishedThreads;
	#endif

	void triggerIteration(void);

	// called once per frame, at the end after last thread finishes (by last thread).
	// Does several things needed to be done once per cyclle.
	void threadsHaveFinished(void);

	// figure out the total elapsed time for each thread, average of all, max of all...
	void aggregateCalcTime(void);

	static grWorker **gThreads;

	// when trace msgs display just one point (to avoid overwhelming output),
	// this is the one.
	int samplePoint;

	// mostly for debugging
	char label[MAX_LABEL_LEN + 1];

	// for alignment: put the rest of these last

	// true if thread(s) should start a new integration upon next event cycle, false if not
	// Synchronized with the interactive simulation switch, visible and changeable in JS.
	bool shouldBeIntegrating;

	// same as shouldBeIntegrating, except this is synchronized with the integration threads.
	// Does not change while integration frame being calculated.  So all threads are on the same page.
	bool isIntegrating;

	// set pleaseFFt from JS (only if in the middle of frame)
	void askForFFT(void);

	// true = please do an FFT after the current frame ends
	bool pleaseFFT;

	// grinding turns this on upon a new grind, so JS goes and repaints it
	bool needsRepaint;

	// make sure the subsequent fields are aligned!  or frame is painfully slow.

	// Actually do integration, single thread only.
	// must maintain stepsPerFrame to match animationFP, but not necessarily sync with it
	void oneFrame(void);

	// visscher.  Calculate new from old; use hamiltonian to calculate d𝜓
	// sometimes oldW and hamiltonianW are the same
	void pointReal(qCx *newW, qCx *oldW, qCx *hamiltW, double volts, double dt);
	void pointImaginary(qCx *newW, qCx *oldW, qCx *hamiltW, double volts, double dt);
	void hitReal(qCx *newW, qCx *oldW, qCx *hamiltW, double dt);
	void hitImaginary(qCx *newW, qCx *oldW, qCx *hamiltW, double dt);

	// just one after the other
	void hitRealImaginary(qCx *newW, qCx *oldW, qCx *hamiltW, double dt);

	void stepMidpoint(qCx *newW, qCx *oldW, qCx *scratch, double dt);

	// kill high frequencies via FFTs
	//void fourierFilter(int lowPassFilter);

	void tallyUpKinks(struct qWave *qwave);

	// this because I keep on forgetting to do the direct accessors
	bool sentinel;
};

/* ************************************************************ Units and Phys Constants */
// see definitionOfUnits.md

/* ************************************************************ JS interface */

// for JS to call.  Defined in jsSpace, qGrinder and elsewhere.
extern "C" {
	//void grinder_initThreadIntegration(qGrinder *grinder, int threadSerial);
	void grinder_oneFrame(qGrinder *grinder);
	void grinder_triggerIteration(qGrinder *grinder);

	void grinder_askForFFT(qGrinder *grinder);

	void grinder_copyFromAvatar(qGrinder *grinder, qAvatar *avatar);
	void grinder_copyToAvatar(qGrinder *grinder, qAvatar *avatar);

	const char *grinder_getExceptionMessage(qGrinder *grinder);
}


