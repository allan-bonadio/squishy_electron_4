/*
** abacus -- a sequence of waves, each representing a step in integration of the PDE
** Copyright (C) 2023-2025 Tactile Interactive, all rights reserved
*/

#define UNLOCKED  255
#define MAX_THREADS 254
//#define UNDECIDED -1


Not currently in use



struct progress;
struct abacus;

// one of these for every segment of the buffer, for every wave, therefore nThreads * n generations
// Segment starts at this boundary, extends to next boundary.
// wraps around after nThreads segments.
// each thread is concerned with the same two edges of the wave
// eg thread 3 is concerned with edges 3 and 4
// and integrates the points between them
struct edge {
	// upon creation, edge #0 is the left most.  May move around as integration proceeds.
	void init(abacus *, int serial);
	void dump(void) ;

	void reset(void) ;

	// not sure if I need these, but see if I do
	struct abacus *abac;
	int serial;

	// start of this segment as an ix index into the wave, or -1 if not yet decided.
	// Decided by first thread who gets here. Wraps around modulo N,
	// but always has start added in (eg 1-64 not 0-63).
	short boundary;

	// protect boundary, loDone and hiDone while being atomically set/read
	bool lock;
	bool spinLock();  // delays until it's gotten the lock
	bool spinUnlock();  // releases the lock; almost no overhead

	// true if we have WELL continuum and this is edge 0 for a given wave
	bool isFixed;

	// tells if the point at [boundary-1] and [boundary] are done iterating
	// if so, the ahead thread doesn't have to change the boundary to claim it.
	bool loDone;  // [boundary-1]
	bool hiDone;

	// at start of iterating a new wave, each thread tries this for each boundary.
	// it returns ... the new boundary ix?  you can get it from boundary.
	// or just a bool?
	int claim(void);

	bool reserved1;
	short reserved2;

	// locks the two edges, and iterates all points in between
	void iterate(void);
};

// one for each thread, keeps track of where it is.
struct progress {
	void init(abacus *abac, int serial);
	void dump(void) ;

	void reset(edge *b, edge *a);

	abacus *abac;
	int serial;  // thread serial #

	edge *behind;  // we are the 'hi' end of this boundary
	edge *ahead; // we are the 'lo' end of this boundary

	qCx *oldWave;
	qCx *newWave;

	void next();
};

// creating an abacus, you can set your own functions to integrate one point re and im
typedef 	void (*integrator)(qCx *newWave, qCx *oldWave, qCx *hamiltWave, double dt);

// Multiple real buffers for the real & im parts of  eg. a single qWave buffer.
struct abacus {
	abacus(qSpace *space, qGrinder *qgr, int nWaves, int nThreads);
	~abacus();
	int magic;

	qSpace *space;
	qGrinder *qgrinder;
	qFlick *qflick;
	qCx **waves;  // copy from qFlick
	int nWaves;

	// array of nThreads x nWaves segmentBoundaries
	int nEdges;
	edge *edges;
	edge *endEdge;
	void dumpEdges(int start = 0, int end = 1e9);

	// list of progresses - that's an awkward word so in many places I say nThreads instead
	int nThreads;
	progress *progresses;
	void dumpProgress(void);

	// used to calculate mod N easily
	int statesMask;

	int waitAllThreds;
	void triggerIteration(void);

	// set up our edges and progresses to get ready for a new frame
	void reset(void);

	// u can plug in your own integrator functions here
	void setIntegrators(integrator reIntegrator, integrator imIngegrator);
	void (*stepOneReal)(qCx *newWave, qCx *oldWave, qCx *hamiltWave, double dt);
	void (*stepOneImaginary)(qCx *newWave, qCx *oldWave, qCx *hamiltWave, double dt);
};
