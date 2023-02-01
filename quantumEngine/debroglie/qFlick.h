/*
** quantum flick -- a sequence of waves
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

#include "qWave.h"

// Multiple complex buffers identical to the single qWave buffer.
// The qBuffer 'wave' var points to whichever wave in the sequence is the 'it' wave
struct qFlick : public qWave {
	qFlick(qSpace *space, int nWaves);
	~qFlick();

	// dump
	double dumpRow(char *buf, int doubleSerial, int ix, double *pPrevPhase, bool withExtras);
	void dumpOneSerial(const char *title, int doubleSerial, bool withExtras);
	void dumpLatest(const char *titleIn, bool withExtras);
	void dumpAllWaves(const char *title);
	void dumpOverview(const char *title);

	// them, all dynamically allocated
	qCx **waves;
	int nWaves;

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
};

