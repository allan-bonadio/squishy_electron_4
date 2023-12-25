/*
** qGrinder -- the simulation of a quantum mechanical wave in a space
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

#include <pthread.h>

struct qThread;
struct qStage;

struct qGrinder {
	qGrinder(qSpace *, struct qAvatar *av, const char *label);
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

	// how much time we've integrated, from creation.  pseudo-seconds.  Since we've eliminated
	// all the actual physical constants from the math, why not choose our own definition
	// of what a second is?  Resets to zero every so often.
	double elapsedTime;

	// total number of times thru the number cruncher. (should always be an integer;
	// it's a double cuz I don't know how big it'll get)
	double frameSerial;

	// params that the user can set/get
	double dt;
	int lowPassFilter;
	int stepsPerFrame;

	/* *********************************************** integrating */

	// a subclass of  qWave, it has multiple waves to do grinding with
	// this grinder OWNS the qFlick & is responsible for deleting it
	struct qFlick *qflick;

	// pointer grabbed from the space.  Same buffer as in space.
	double *voltage;
	double voltageFactor;  // aligned by 8

	double reversePercent;

	// for the fourier filter.  Call the function first time you need it.
	// owned if non-null
	struct qSpectrum *qspect;
	qSpectrum *getSpectrum(void);

	struct qStage *stages;
	struct qThread *threads;
	void initThreadIntegration(int threadSerial);

	// 1 if thread(s) should start a new integration asap, 0 if they should wait
	int needsIntegration;

	pthread_cond_t masterSwitch;
	pthread_mutex_t masterMutex;

	// for alignment: put the rest of these last

	// mostly for debugging
	char label[MAX_LABEL_LEN + 1];


	// true if frame is running; set/unset in ::oneFrame()
	// For the interactive simulation switch, see isRunning in JS.
	bool isIntegrating;

	// what's the diff between this and isIntegrating?  not much.
	bool integrationFrameInProgress;

	// set pleaseFFt from JS (only if in the middle of frame)
	void askForFFT(void);

	// true = please do an FFT after the current frame ends
	bool pleaseFFT;
	// make sure the subsequent fields are aligned!  or frame is painfully slow.

	// multiple steps; ≈ stepsPerFrame, for old same-thread
	void oneFrame(void);

	// multi-threaded
	void startAFrame(void);

	// visscher.  Calculate new from old; use hamiltonian to calculate d𝜓
	// often oldW and hamiltonianW are the same
	void stepReal(qCx *newW, qCx *oldW, qCx *hamiltW, double dt);
	void stepImaginary(qCx *newW, qCx *oldW, qCx *hamiltW, double dt);

	// just one after the other
	void stepRealImaginary(qCx *newW, qCx *oldW, qCx *hamiltW, double dt);

	void stepMidpoint(qCx *newW, qCx *oldW, qCx *scratch, double dt);

	// kill high frequencies via FFTs
	void fourierFilter(int lowPassFilter);

	void tallyUpReversals(struct qWave *qwave);
};


/* ************************************************************ Units and Phys Constants */
// distances measured in nanometers, nm
// time measured in picoseconds, ps
// emergy measured in eV
// 1 kg = 6.241509074460763e+24 eV ps^2 / nm^2



/* ************************************************************ JS interface */

// for JS to call.  Defined in jsSpace and elsewhere.
extern "C" {
	void grinder_initThreadIntegration(qGrinder *grinder, int threadSerial);
	void grinder_oneFrame(qGrinder *grinder);

	void grinder_askForFFT(qGrinder *grinder);

	void grinder_copyFromAvatar(qGrinder *grinder, qAvatar *avatar);
	void grinder_copyToAvatar(qGrinder *grinder, qAvatar *avatar);

	void grinder_startAFrame(qGrinder *);
}


