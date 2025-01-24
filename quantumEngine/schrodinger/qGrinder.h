/*
** qGrinder -- the simulation of a quantum mechanical wave in a space
** Copyright (C) 2022-2024 Tactile Interactive, all rights reserved
*/

#include <pthread.h>
#include <emscripten/threading.h>

/* Some Calculation/Grinder terms:

a Frame: is an amount of calculation correspoinding to one refresh of
the video display. Doesn't have to be synchronized with the screen
refreshes; just the amount of calculation done for it.  Typically
hundreds of steps.

a Step: is a calculation to advance the model ∆t or dt time.

a Hit: advancement by dt of one of many parts of the calculation.  As of
this writing, there are four hits to a step: two Vischer real+imag, and
two Midpoint first+last.  (May be for whole buffer, or for just one pt)

a Point is one number in a buffer, one state of the qm system, and/or any
associated numbers in parallel buffers like voltage.

Some sortof overlapping terms on timing:

videoFP: video frame period is the period it takes the screen to do one
scan.  rAF calls you that many times.  Often 16⅔ or 20 ms.

chosenFP: period chosen from the 'frame rate' menu, which shows rates
not periods.  So user chooses 20 fps and the chosenFP would be 50ms.
chosenFP should be an even multiple of videoFP but isn't always.

*/

struct qThread;
struct qStage;
struct grWorker;

// TODO: I should break this up: spin off qIterator with the down and dirty
// stuff that has to be fast.
struct qGrinder {
	qGrinder(qSpace *, struct qAvatar *av, int nGrWorkers, const char *label);
	~qGrinder(void);
	void formatDirectOffsets(void);
	void dumpObj(const char *title);

	void copyFromAvatar(qAvatar *avatar);
	void copyToAvatar(qAvatar *avatar);

	/* ************************* error handling */

	const char *getExceptionMessage(void);
	// set integrationEx to exception with message; optionally set code, too
	void reportException(const char *message, const char *code = "reported");
	void reportException(std::runtime_error *ex, const char *code = "reported");

	/* ************************* FFT to checkout momentum */

	struct qSpectrum *getSpectrum(void);

	// set pleaseFFt from JS (only if in the middle of frame)
	void askForFFT(void);

	/* ************************* threads */

	// called once per frame, at the end after last thread finishes (by last thread).
	// Does several things needed to be done once per cycle.
	void threadsHaveFinished(void);

	/* ************************* grinding calculations */

	// called by JS to start a frame calc (maybe) now done in JS
	void triggerIteration(void);

	// figure out the total elapsed time for each thread, average of all, max of all...
	void aggregateCalcTime(void);

	// Actually do integration, single thread only.
	// must maintain stepsPerFrame to match videoFP, but not necessarily sync with it
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
	void measureDivergence(void);


	/* *********************************************** instance variables */
	// please keep alignment stable and correct!  See also eGrinder.js Keep
	// arranged from larger to smaller - often doubles (or pairs of ints), then
	// ints, then bools.  Give or take.
	int magic;

	/* ************************* pointers  for large blocks */
	qSpace *space;
	qAvatar *avatar;

	// a subclass of  qWave, it has multiple waves to do grinding with
	// this grinder OWNS the qFlick & is responsible for deleting it
	struct qFlick *qflick;

	// pointer grabbed from the space.  Same buffer as in space.
	double *voltage;

	// for the fourier filter.  Call the function first time you need it.
	// owned if non-null
	struct qSpectrum *qspect;

	/* ************************* timing */

	// number of integration steps executed for each frame
	// dynamically adjusted so integration calculation of a frame takes
	// about as much time as a screen refresh frame, as set by the user.
	int stepsPerFrame;

	// scan period of the screen = target rate for a frame of grinding
	// In milliseconds, with fractions.  comes from sAnimator.
	double videoFP;

	// the frame speed most recently chosen by user, as number of
	// milliseconds. should be a multiple of videoFP (?)  Actually
	// we use this as an indicator as to whether rate is
	// 'fastest' qeConsts.FASTEST  Otherwise, the JS triggers a new frame calc based on
	// rAF.
	double chosenFP;

	// how long (thread time) it took to do the latest frame, all threads added together
	double totalCalcTime;
	double maxCalcTime;  // and max of all threads

	/* ************************* grinding & integrating */

	// = dtStretch * space->dt
	double stretchedDt;

	double d2Coeff;

	double divergence;  // divergence measure

	// how much time we've integrated, from creation.  pseudo-pico-seconds.  Since we've eliminated
	// all the actual physical constants from the math, why not choose our own definition
	// of what a second is?  Resets to zero every so often.
	double elapsedTime;

	// total number of times (frames) thru the number cruncher.
	int frameSerial;

	// when trace msgs display just one point (to avoid overwhelming output),
	// this is the one.  (last i checked, 1/3 of the way)
	int samplePoint;

	// for the abacus or multithreaded integration which isn't even designed yet.
//	struct qStage *stages;
//	struct qThread *threads;

	static grWorker **grWorkers;

	int nGrWorkers;  // total number of grWorker threads we'll use for integrating
			// mostly constant, although there's plans to gradually add/remove threads

	// Starts at -1 = waiting at starting line, or set it to 0 to launch
	// an integration.  All the threads atomic_wait, waiting for this to turn
	// nonnegative.
	_Atomic int startAtomic;

	// starts at 0.  As each thread finishes their iteration work, they
	// atomically increment it.  The thread that increments it to
	// nGrWorkers, knows it's the last and starts threadsHaveFinished()
	_Atomic int finishAtomic;

	/* ************************* exceptions */

	// any exception thrown or discovered in a thread.  Message is human-readable.
	// I think this is 56 bytes, multiple of double float
	std::runtime_error integrationEx;

	// non-human error code for parts of the code that have to intercept
	// specific exceptions by exact spelling
	char exceptionCode[14];
	char _zero;  // make sure null byte at end

	// use this with integrationEx, which JS cannot read, but getExceptionMessage() can.
	bool hadException;  // aligned to 8 bytes again


	// mostly for debugging
	char label[MAX_LABEL_LEN + 1];

	/* ************************* booleans & bytes at end */
	// for alignment: put the rest of these last

	// true if thread(s) should start a new integration upon next event cycle, false if not
	// Synchronized with the interactive simulation switch, visible and changeable in JS.
	bool shouldBeIntegrating;

	// same as shouldBeIntegrating, except this is synchronized with the
	// integration threads. Does not change while integration frame being
	// calculated.  So all threads are on the same page.
	bool isIntegrating;

	// true = please do an FFT at some time... waiting for something fourier
	bool pleaseFFT;

	// grinding turns this on upon a new grind, so JS goes and repaints it
	bool needsRepaint;

	// this because I keep on forgetting to redo the direct accessors.
	// should  be grSENTINEL_VALUE
	byte sentinel;
};

/* ************************************************************ Units and Phys Constants */
// see definitionOfUnits.md

/* ************************************************************ JS interface */

// for JS to call.  Defined in jsSpace, qGrinder and elsewhere.
extern "C" {
	//void grinder_initThreadIntegration(qGrinder *grinder, int threadSerial);
	void grinder_oneFrame(qGrinder *grinder);
	//void grinder_triggerIteration(qGrinder *grinder);

	void grinder_askForFFT(qGrinder *grinder);

	void grinder_copyFromAvatar(qGrinder *grinder, qAvatar *avatar);
	void grinder_copyToAvatar(qGrinder *grinder, qAvatar *avatar);

	const char *grinder_getExceptionMessage(qGrinder *grinder);
}


