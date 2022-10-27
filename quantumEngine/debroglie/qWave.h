/*
** quantum Wave -- an organized wave and space pointer &tc that represents a QM state
**            This file also has qFlick  in it
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

#include "qBuffer.h"


struct qWave : public virtual qBuffer {

	// create a qWave, dynamically allocated or hand in a buffer to use
	qWave(qSpace *space, qCx *useThisBuffer = NULL);

	virtual ~qWave();

	// used for low pass; need general buffer for arithmetic.  obsolete.
	// and qWave::nyquistFilter().  See scratchQWave in avatar
	qCx *scratchBuffer;

	// never even tried any of these
	void forEachPoint(void (*callback)(qCx, int));
	void forEachState(void (*callback)(qCx, int));

	void prune(void);
	//void lowPassFilter(double dilution = 0.01);
	//void nyquistFilter(void);

	void formatDirectOffsets(void);
};




// (maybe obsolete...)
// a flick is a sequence of Wave buffers.  Used for visscher waves.
// Multiple complex buffers; they all share the same characteristics in the qWave fields.
// Acts like a qWave that only points to the 'current' buffer.
struct qFlick : public qWave {
	qFlick(qSpace *space, int maxWaves);
	~qFlick();

	// dump
	double dumpRow(char *buf, int doubleAge, int ix, double *pPrevPhase, bool withExtras);
	void dumpOneAge(const char *title, int doubleAge, bool withExtras);
	void dumpLatest(const char *titleIn, bool withExtras);
	void dumpAllWaves(const char *title);
	void dumpOverview(const char *title);

	// them, all dynamically allocated
	qCx **waves;
	int maxWaves;  // how long waves is, in pointiers
	int nWaves;  // how many are actually in use (those behond should be null!)

	// create and add a new buffer, zeroed, at the 0 position, pushing the others up
	void pushWave(void);

	// make a new wave, copy of wave (can't have duplicate waves in the
	// flick or it'll be confusing deallocating?)
	//void pushCopy(qCx *wave);
	//void installWave(qCx *wave);

	// the current one is === the one pointed to by buffer.  usually zero for the first one.
	int currentIx;
	void setCurrent(int which);

	// for vischer
	double innerProduct(void);
	void normalize(void);

	// retrieve properly interpolated values here
	double magnitude(int doubleAge, int ix = 1);
	qCx value(int doubleAge, int ix = 1);
	double magnitude(int ix = 1) { return magnitude(1, ix); }
	qCx value(int ix = 1) { return value(1, ix); }

	void fixBoundaries(void);  // on latest two buffers
};

// for JS to call
extern "C" {
	// js thinks it's a qWave but we know it's really a qBuf cuz that's where
	// the method is.  Maybe I shouldn't be doing this?
	void wave_normalize(qWave *qw);
}

