/*
** qAvatar -- the instance and simulation of a quantum mechanical wave in a space
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

// formerly called: Manifestation, Incarnation, Timeline, ... formerly part of qSpace
// Although many of these seem to belong to iteration, they also have to display.
// Hence the Avatar object.  see also JS eAvatar

struct qThread;
struct qStage;

struct qAvatar {
	qAvatar(qSpace *, const char *label);
	~qAvatar(void);
	void formatDirectOffsets(void);
	void dumpObj(const char *title);

	int magic;
	qSpace *space;

	/* *********************************************** JS accessible */
	// please keep alignment stable and correct!  See also eAvatar.js
	// Keep arranged from larger to smaller - doubles, then ints, then bools

	// how much time we've iterated, from creation.  pseudo-seconds.  Since we've eliminated
	// all the actual physical constants from the math, why not choose our own definition
	// of what a second is?  Resets to zero every so often.
	double elapsedTime;

	// total number of times thru the number cruncher. (should always be an integer;
	// it's a double cuz I don't know how big it'll get)
	double iterateSerial;


	// params that the user can set/get
	double dt;
	int lowPassFilter;
	int stepsPerIteration;

	/* *********************************************** iteration */

	// our main qWave, either for the WaveView or the SetWave tab
	// this avatar OWNS the qWave & is responsible for deleting it
	struct qWave *qwave;

	// pointer grabbed from the space, often.  Same buffer as in space.
	double *potential;
	double potentialFactor;  // aligned by 8

	// and a scratch wave for stepping. Call the function first time you need it.
	// owned if non-null
	struct qWave *scratchQWave;
	struct qWave *getScratchWave(void);

	// for the fourier filter.  Call the function first time you need it.
	// owned if non-null
	struct qSpectrum *qspect;
	qSpectrum *getSpectrum(void);

	// the qViewBuffer to be passed to webgl.  qAvatar is a visual thing after all.
	// Avatar owns the qViewBuffer
	struct qViewBuffer *qvBuffer;
	float *vBuffer;  // aligned by 4, not 8

	struct qStage *stages;
	struct qThread *threads;
	void initIterationLoop(int nThreads, int nStages);

	// for alignment: put the rest of these last

	// mostly for debugging
	char label[MAX_LABEL_LEN + 1];


	// true if an iteration is running; set/unset in ::oneIteration()
	// For the interactive simulation switch, see isTimeAdvancing in JS.
	bool isIterating;

	// this is different now; js DOES pleaseIterate()
	//	JS calls pleaseIterate() from a worker whenever it's time to start an
	//	iteration. If it's already doing one, it'll remember to do another
	//	immediately after the current iteration, using needsIteration, and
	//	pleaseIterate() will return false. Otherwise, it'll do an iteration
	//	immediately, and return true after the last iteration (which could be
	//	a long time).
	//bool pleaseIterate(void);
	bool needsIteration;

	// what's the diff between this and isIterating?  not much.
	bool doingIteration;

	// set pleaseFFt from JS (only if in the middle of an iteration)
	void askForFFT(void);

	// true = please do an FFT after the current iteration ends
	bool pleaseFFT;
	// make sure the subsequent fields are aligned!  or iteration is painfully slow.

	// multiple steps; ≈ stepsPerIteration
	void oneIteration(void);

	//void oneRk2Step(qWave *oldQWave, qWave *newQWave);  // obsolete
	//void oneRk4Step(qWave *oldQWave, qWave *newQWave);  // obsolete
	//void visscherHalfStep(qWave *oldQWave, qWave *newQWave);  // obsolete

	// visscher
	void stepReal(qCx *newW, qCx *oldW, double dt);
	void stepImaginary(qCx *newW, qCx *oldW, double dt);
	void oneVisscherStep(qWave *newQWave, qWave *oldQWave);

	// kill high frequencies via FFTs
	void fourierFilter(int lowPassFilter);
};


/* ************************************************************ JS interface */

// for JS to call.  Defined in jsSpace and elsewhere.
extern "C" {
	//void avatar_initIterationLoop(qAvatar *avatar, int nStages);
	void avatar_oneIteration(qAvatar *avatar);
	//int avatar_pleaseIterate(qAvatar *avatar);

	void avatar_askForFFT(qAvatar *avatar);

	// a qSpace does not contain any qAvatars
	// an eSpace DOES contain two eAvatars; this how it deletes them from JS
	void avatar_delete(qAvatar *avatar);
}


