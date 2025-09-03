/*
** quantum flick -- a sequence of waves
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

#include "qWave.h"

#define UNLOCKED  255
#define MAX_T_PROGRESSES 254
#define UNDECIDED -1;

struct qGrinder;

// Multiple complex buffers identical to the single qWave buffer.
// The qBuffer 'wave' var points to whichever wave in the sequence is the 'it' wave
struct qFlick : public qWave {
	qFlick(qSpace *space, int nWaves, int nTProgresses);
	~qFlick();

	void formatDirectOffsets(void);

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

