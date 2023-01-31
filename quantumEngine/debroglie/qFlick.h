/*
** quantum flick -- a sequence of waves, each representing a step in integration of the PDE
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

#include <atomic>
#include "qWave.h"

// one of these for every segment, for every wave.
// Segment starts at this boundary, extends to next boundary.
// wraps around after nWorkers segments.
// each thread is concerned with the same two serial segments for each wave
// eg thread 3 is concerned with segmentBoundaries 3 and 4
// and integrates the points between them
struct edge {
	// true to protect boundary, loDone and hiDone while being set/read
	// read/write lock?  0=unlocked, 1=readLock, 3=writeLock
	// maybe not; the pthreads book describes how complex they are.
	// meanwhile, only two threads will contend for a given boundary.
	std::atomic_int lock;
	//short nReadLocks;

	// start of this segment as an ix index into the wave, or -1 if not yet decided.
	// Decided by first thread who gets here. Wraps around modulo N,
	// but always has start added in.
	short boundary;

	// tells if the point at [boundary-1] and [boundary] are done iterating
	// if so, the ahead thread doesn't have to change the boundary to claim it.
	bool loDone;  // [boundary-1]
	bool hiDone;

	void init(void);  // restarts it as boundary=-1 (undecided) and unlocked

	// at start of iterating a new wave, each thread tries this for each boundary.
	// it returns ... the new boundary ix?  you can get it from boundary.
	// or just a bool?
	int claim(void);

	// true if we have WELL continuum and this is edge 0 for a given wave
	bool isFixed;

	bool reserved1;
	short reserved2;

	// locks the two edges, and iterates all points in between
	void iterate(void);
};

// one for each thread, keeps track of where it is.
struct worker {
	worker(struct qFlick *flick);

	struct qFlick *flick;
	edge *behind;  // we are the 'hi' end of this boundary
	edge *ahead; // we are the 'lo' end of this boundary

	void next();
};

// Multiple complex buffers identical to the single qWave buffer.
// The qBuffer 'wave' var points to whichever wave in the sequence is the 'it' wave
struct qFlick : public qWave {
	qFlick(qSpace *space, qGrinder *qgr, int nWaves, int nWorkers);
	~qFlick();

	qGrinder *qgrinder;

	// dump
	double dumpRow(char *buf, int doubleSerial, int ix, double *pPrevPhase, bool withExtras);
	void dumpOneSerial(const char *title, int doubleSerial, bool withExtras);
	void dumpLatest(const char *titleIn, bool withExtras);
	void dumpAllWaves(const char *title);
	void dumpOverview(const char *title);

	// them, all dynamically allocated
	qCx **waves;
	int nWaves;

	// array of nWorkers x nWaves segmentBoundaries
	int nEdges;
	edge *edges;

	// list of workers
	int nWorkers;
	worker *workers;

	// create and add a new buffer, zeroed, at the 0 position, pushing the others up
	void pushWave(void);

	// make a new wave, copy of wave (can't have duplicate waves in the
	// flick or it'll be confusing deallocating?)
	//void pushCopy(qCx *wave);
	//void installWave(qCx *wave);

	// the current one is === the one pointed to by wave.  usually zero for the first one.
	// this is not always used as anything can access waves array
	int currentWave;
	void setCurrent(int which);

	int waitAllThreds;
	void startAllThreads(void);

	// retrieve properly interpolated values here while in vischer mode
	double magnitude(int doubleSerial, int ix = 1);
	qCx value(int doubleSerial, int ix = 1);
	double magnitude(int ix = 1) { return magnitude(1, ix); }
	qCx value(int ix = 1) { return value(1, ix); }

	// set up our edges and threads to get ready for a new integration
	void setup(void);
};

