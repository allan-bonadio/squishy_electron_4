/*
** quantum Wave buffer testing -- an organized wave that represents a QM state
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

//#include <string>
//#include "../spaceWave/qCx.h"
//#include <cmath>
#include "qSpace.h"
#include "../schrodinger/Avatar.h"
#include "qWave.h"
#include "../testing/cppuMain.h"

#include "CppUTest/TestHarness.h"


TEST_GROUP(qWave)
{
};

static void tryOutWave(int N) {
	//printf("🌊🌊🌊  starting tryOutWave(N=%d)\n", N);
//	printf("🌊🌊🌊      tryOutWave:%d freeBufferList: %p\n", __LINE__, theSpace ? theSpace->freeBufferList : (void *) 0x99);
	qSpace *space = makeBareSpace(N);
//	printf("🌊🌊🌊      tryOutWave:%d freeBufferList: %p\n", __LINE__, space->freeBufferList);

	qWave *waveWave = new qWave(space);
//	printf("🌊🌊🌊      tryOutWave:%d freeBufferList: %p\n", __LINE__, space->freeBufferList);

	LONGS_EQUAL_TEXT('qWav', waveWave->magic, "qwave magic");
	CHECK_TEXT(waveWave->wave, "qwave wave");
	CHECK_TEXT(waveWave->dynamicallyAllocated, "qwave dynamicallyAllocated");

	LONGS_EQUAL_TEXT(1, waveWave->start, "qwave start");
	LONGS_EQUAL_TEXT(N+1, waveWave->end, "qwave end");
	LONGS_EQUAL_TEXT(N+2, waveWave->nPoints, "qwave nPoints");

	proveItsMine(waveWave->wave, waveWave->nPoints * sizeof(qCx));

	delete waveWave;
	delete space;
//	printf("🌊🌊🌊      tryOutWave:%d freeBufferList: %p\n", __LINE__, theSpace ? theSpace->freeBufferList : (void *) 0x99);
}

// unfortunately these all have to be powers of 2
TEST(qWave, WaveConstructDestruct4) { tryOutWave(4); }
TEST(qWave, WaveConstructDestruct16) { tryOutWave(16); }
TEST(qWave, WaveConstructDestruct32) { tryOutWave(32); }
TEST(qWave, WaveConstructDestruct32again) { tryOutWave(32); }
TEST(qWave, WaveConstructDestruct128) { tryOutWave(128); }
TEST(qWave, WaveConstructDestruct512) { tryOutWave(512); }
TEST(qWave, WaveConstructDestruct1024) { tryOutWave(1024); }

