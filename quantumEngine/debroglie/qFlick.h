/*
** quantum flick -- a sequence of waves
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

#include "qWave.h"

#define UNLOCKED  255
#define MAX_T_PROGRESSES 254
#define UNDECIDED -1;

// one of these for every segment, for every wave.
// Segment starts at this boundary, extends to next boundary.
// wraps around after nTProgresses segments.
// each thread is concerned with the same two serial segments for each wave
// eg thread 3 is concerned with segmentBoundaries 3 and 4
// and integrates the points between them
struct edge {
	// not sure if I need these, but see if I do
	struct qFlick *flick;
	int serial;

	// start of this segment as an ix index into the wave, or -1 if not yet decided.
	// Decided by first thread who gets here. Wraps around modulo N,
	// but always has start added in.
	short boundary;

	// 0-254 to indicate locked by thread lock.
	// protect boundary, loDone and hiDone while being atomically set/read
	// not really sure what i'm gonna do with this
	bool lock;

	// true if we have WELL continuum and this is edge 0 for a given wave
	bool isFixed;

	// tells if the point at [boundary-1] and [boundary] are done iterating
	// if so, the ahead thread doesn't have to change the boundary to claim it.
	bool loDone;  // [boundary-1]
	bool hiDone;

	// upon creation
	void init(struct qFlick *, int serial);
	void dump(void) ;

	void reset(void) ;

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
struct tProgress {
	void init(struct qFlick *flick, int serial);
	void dump(void) ;

	void reset(edge *b, edge *a);

	struct qFlick *flick;
	int serial;

	edge *behind;  // we are the 'hi' end of this boundary
	edge *ahead; // we are the 'lo' end of this boundary

	void next();
};

// Multiple complex buffers identical to the single qWave buffer.
// The qBuffer 'wave' var points to whichever wave in the sequence is the 'it' wave
struct qFlick : public qWave {
	qFlick(qSpace *space, qGrinder *qgr, int nWaves, int nTProgresses);
	~qFlick();

	// dump
	double dumpRow(char *buf, int doubleSerial, int ix, double *pPrevPhase, bool withExtras);
	void dumpOneSerial(const char *title, int doubleSerial, bool withExtras);
	void dumpLatest(const char *titleIn, bool withExtras);
	void dumpAllWaves(const char *title);
	void dumpOverview(const char *title);
	void dumpEdges(int start = 0, int end = 1e9);
	void dumpTProgress(void);

	// them, all dynamically allocated
	qCx **waves;
	int nWaves;

	// how long waves array really is.  Unused entries are nulled out.
	int allocWaves;
	void setNWaves(int newNW);

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

	// retrieve properly interpolated values here while in vischer mode
	double magnitude(int doubleSerial, int ix = 1);
	qCx value(int doubleSerial, int ix = 1);
	double magnitude(int ix = 1) { return magnitude(1, ix); }
	qCx value(int ix = 1) { return value(1, ix); }

	// set up our edges and tProgresses to get ready for a new integration
	void reset(void);


};

