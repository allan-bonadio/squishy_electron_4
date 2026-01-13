/*
** quantum Wave buffer testing -- an organized wave that represents a QM state
** Copyright (C) 2022-2026 Tactile Interactive, all rights reserved
*/

#include "../hilbert/qSpace.h"
#include "../greiman/qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "qCavity.h"

#include "../testing/testingHelpers.h"
#include "../testing/cppuMain.h"

#include "CppUTest/TestHarness.h"


TEST_GROUP(qCavity)
{
};

static void tryOutWave(int N) {
	qSpace *space = makeBareSpace(N);

	qCavity *cavity = new qCavity(space);

	LONGS_EQUAL_TEXT('Wave', cavity->magic, "qCavity magic");
	CHECK_TEXT(cavity->wave, "qCavity wave");
	CHECK_TEXT(cavity->dynamicallyAllocated, "qCavity dynamicallyAllocated");

	LONGS_EQUAL_TEXT(1, cavity->start, "qCavity start");
	LONGS_EQUAL_TEXT(N+1, cavity->end, "qCavity end");
	LONGS_EQUAL_TEXT(N+2, cavity->nPoints, "qCavity nPoints");

	proveItsMine(cavity->wave, cavity->nPoints * sizeof(qCx));

	delete cavity;
	delete space;
}

// unfortunately these all have to be powers of 2
TEST(qCavity, WaveConstructDestruct4) { tryOutWave(4); }
TEST(qCavity, WaveConstructDestruct16) { tryOutWave(16); }
TEST(qCavity, WaveConstructDestruct32) { tryOutWave(32); }
TEST(qCavity, WaveConstructDestruct32again) { tryOutWave(32); }
TEST(qCavity, WaveConstructDestruct128) { tryOutWave(128); }
TEST(qCavity, WaveConstructDestruct512) { tryOutWave(512); }
TEST(qCavity, WaveConstructDestruct1024) { tryOutWave(1024); }

