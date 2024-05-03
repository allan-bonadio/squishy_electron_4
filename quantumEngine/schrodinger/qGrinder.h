/*
** qGrinder -- the simulation of a quantum mechanical wave in a space
** Copyright (C) 2022-2024 Tactile Interactive, all rights reserved
*/

#include <pthread.h>

/* Some terms:
a Frame: is an amount of calculation correspoinding to one refresh of the display.
	Doesn't have to be synchronized with the screen refreshes; just the amount of
	calculation done for it.

a Step: is an mount of calculation to advance the model dt time.
	(Really ∆t but it's tedious entering the delta character.)

a Hit: advancement by dt of one of many parts of the calculation.  As of this writing,
	there are four hits to a step: two split by the Vischer algorithm,
	and two split doing the Midpoint method.

*/

struct qThread;
struct qStage;
struct slaveThread;

struct qGrinder {
	qGrinder(qSpace *, struct qAvatar *av, int nThreads, const char *label);
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
	// Keep arranged from larger to smaller - doubles, then ints, then bools

	// how much time we've integrated, from creation.  pseudo-pico-seconds.  Since we've eliminated
	// all the actual physical constants from the math, why not choose our own definition
	// of what a second is?  Resets to zero every so often.
	double elapsedTime;

	// total number of times thru the number cruncher. (should always be an integer;
	// it's a double cuz I don't know how big it'll get)
	double frameSerial;

	// dynamically adjusted so integration calculation of a frame takes
	// about as much time as a screen refresh frame, as set by the user.
	// No direct connection with UI.
	double stepsPerFrame;

	// = dtStretch * space->dt
	double stretchedDt;

	double d2Coeff;

	// any exception thrown in a
	std::runtime_error& integrationEx;

	/* *********************************************** integrating */

	// a subclass of  qWave, it has multiple waves to do grinding with
	// this grinder OWNS the qFlick & is responsible for deleting it
	struct qFlick *qflick;

	// pointer grabbed from the space.  Same buffer as in space.
	double *voltage;
	double voltageFactor;  // aligned by 8

	// how long (thread time) it took to do the latest frame, all threads added together
	double frameCalcTime;
	double maxCalcTime;  // and max of all threads

	double reversePercent;

	// when screen refresh rate changes, use these to tell C++.  Normally zeroes.
	double newIntegrationFP;
	int newFrameFactor;
	int frameFactor;

	// for the fourier filter.  Call the function first time you need it.
	// owned if non-null
	struct qSpectrum *qspect;
	qSpectrum *getSpectrum(void);

	struct qStage *stages;
	struct qThread *threads;

	int nThreads;
	int nSlaveThreads;  // mostly static, total number of slave threads we'll use

	// number of slaveThread s that have started/finished integration yet; incremented up to nSlaveThreads
	int nStartedThreads;
	int nFinishedThreads;

	// Although isIntegrating, do only this many more frames before stopping.  Like 1 for single step.
	int justNFrames;

	// guards grinder->nFinishedThreads, frameCalcTime, etc
	pthread_mutex_t finishMx;

	// All threads start (roughly) all at once when this is unlocked.  Then, each slave thread, who have all requested an lock of the startMx, each get to lock it, add one to nStartedThreads, and immediately unlock it, and proceed to integration.
	pthread_mutex_t startMx;

	// called once per frame, at the start after last thread locks and unlocks startMx (by last thread to start)
	void threadsHaveStarted(void);

	// called once per frame, at the end after last thread finishes (by last thread)
	void threadsHaveFinished(void);


//	void startingWork(qGrinder *grinder);
//	void endingWork(qGrinder *grinder);

	// the lock that launches each frame integration
	//pthread_rwlock_t masterLock;
	// pthread_cond_t masterCond;
	// pthread_mutex_t masterMutex;

	// for alignment: put the rest of these last

	static slaveThread **slaves;

	void aggregateCalcTime(void);

	// mostly for debugging
	char label[MAX_LABEL_LEN + 1];


	// true if thread(s) should start a new integration upon next event cycle, false if not
	// Synchronized with the interactive simulation switch, visible and changeable in JS.
	bool shouldBeIntegrating;

	// same as shouldBeIntegrating, except this is synchronized with rAF.
	// Does not change while integration frame being calculated.  So all threads are on the same page.
	bool isIntegrating;

	// set pleaseFFt from JS (only if in the middle of frame)
	void askForFFT(void);

	// true = please do an FFT after the current frame ends
	bool pleaseFFT;
	// make sure the subsequent fields are aligned!  or frame is painfully slow.

	// multiple steps; ≈ stepsPerFrame???, for old same-thread
	void oneFrame(void);

	// multi-threaded
	void startAFrame(void);

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

	void tallyUpReversals(struct qWave *qwave);

	// called after all slaves are done, by last thread
	void resetForNextFrame();


};


/* ************************************************************ Units and Phys Constants */
// distances measured in nanometers, nm
// time measured in picoseconds, ps
// emergy measured in eV
// 1 kg = 6.241509074460763e+24 eV ps^2 / nm^2



/* ************************************************************ JS interface */

// for JS to call.  Defined in jsSpace and elsewhere.
extern "C" {
	//void grinder_initThreadIntegration(qGrinder *grinder, int threadSerial);
	void grinder_oneFrame(qGrinder *grinder);
	void grinder_triggerIteration(qGrinder *grinder);

	void grinder_askForFFT(qGrinder *grinder);

	void grinder_copyFromAvatar(qGrinder *grinder, qAvatar *avatar);
	void grinder_copyToAvatar(qGrinder *grinder, qAvatar *avatar);

	//void grinder_startAFrame(qGrinder *);
}


