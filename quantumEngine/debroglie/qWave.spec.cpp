/*
** quantum Wave buffer testing -- an organized wave that represents a QM state
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

//#include <string>
//#include "qCx.h"
//#include <cmath>
#include "../spaceWave/qSpace.h"
#include "../schrodinger/qAvatar.h"
#include "qWave.h"
#include "../testing/cppuMain.h"

#include "CppUTest/TestHarness.h"


TEST_GROUP(qWave)
{
};

static void tryOutWave(int N) {
	qSpace *space = makeBareSpace(N);

	qWave *waveWave = new qWave(space);

	LONGS_EQUAL_TEXT('wave', waveWave->magic, "qWave magic");
	CHECK_TEXT(waveWave->wave, "qWave wave");
	CHECK_TEXT(waveWave->dynamicallyAllocated, "qWave dynamicallyAllocated");

	LONGS_EQUAL_TEXT(1, waveWave->start, "qWave start");
	LONGS_EQUAL_TEXT(N+1, waveWave->end, "qWave end");
	LONGS_EQUAL_TEXT(N+2, waveWave->nPoints, "qWave nPoints");

	proveItsMine(waveWave->wave, waveWave->nPoints * sizeof(qCx));

	delete waveWave;
	delete space;
}

// unfortunately these all have to be powers of 2
TEST(qWave, WaveConstructDestruct4) { tryOutWave(4); }
TEST(qWave, WaveConstructDestruct16) { tryOutWave(16); }
TEST(qWave, WaveConstructDestruct32) { tryOutWave(32); }
TEST(qWave, WaveConstructDestruct32again) { tryOutWave(32); }
TEST(qWave, WaveConstructDestruct128) { tryOutWave(128); }
TEST(qWave, WaveConstructDestruct512) { tryOutWave(512); }
TEST(qWave, WaveConstructDestruct1024) { tryOutWave(1024); }

