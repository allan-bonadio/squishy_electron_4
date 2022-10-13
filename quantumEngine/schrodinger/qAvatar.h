/*
** qAvatar -- the instance and simulation of a quantum mechanical wave in a space
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

// formerly called: Manifestation, Incarnation, Timeline, ... formerly part of qSpace
// Although many of these seem to belong to iteration, they also have to display.
// Hence the Avatar object.  see also JS eAvatar

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
	// this OWNS the qWave
	struct qWave *mainQWave;

	// pointer grabbed from the space, often.  Same buffer as in space.
	double *potential;
	double potentialFactor;  // aligned by 8

	//  and a scratch wave for stepping. Call the function first time you need it.
	// owned if non-null
	struct qWave *scratchQWave;
	qWave *getScratchWave(void);

	// for the fourier filter.  Call the function first time you need it.
	// owned if non-null
	struct qSpectrum *qspect;
	qSpectrum *getSpectrum(void);

	// the qViewBuffer to be passed to webgl.  qAvatar is a visual thing after all.
	// Avatar owns the qViewBuffer
	struct qViewBuffer *qvBuffer;
	// aligned by 4, not 8

	// mostly for debugging
	char label[LABEL_LEN + 1];

	// for alignment, put these last
	bool isIterating;

	// please do an FFT after the current iteration ends
	bool pleaseFFT;
	// make sure the subsequent things are aligned!  or iteration is painfully slow.

	// set the elapsedTime and iterateSerial to zero
	// this is obsoleted by DirectAccess
	void resetCounters(void);

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

	// set pleaseFFt from JS (only if in the middle of an iteration)
	void askForFFT(void);
};

extern qAvatar *theAvatar;

/* ************************************************************ JS interface */

// for JS to call
extern "C" {

	// obsoleted by DirectAccess
	//float *avatar_getViewBuffer(qAvatar *avatar);
	//double Avatar_getElapsedTime(void);
	//double Avatar_getIterateSerial(void);


	void avatar_oneIteration(qAvatar *avatar);

	void avatar_askForFFT(qAvatar *avatar);
	void avatar_normalize(qAvatar *avatar);

	// a qSpace does not contain any qAvatars
	// an eSpace DOES contain two eAvatars; this how it deletes them from JS
	void avatar_delete(qAvatar *avatar);
}


