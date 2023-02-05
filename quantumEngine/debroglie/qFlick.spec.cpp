/*
** Flick -- unit tests for qFlick
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

#include "qFlick.h"


#include "../testing/testingHelpers.h"
#include "../testing/cppuMain.h"

#include "CppUTest/TestHarness.h"

TEST_GROUP(qFlick)
{
};

/* ***************************************************************************** Alloc */
static void testAnAlloc(int N, int nW) {
	qSpace *space = makeBareSpace(N);
	qFlick *qflick = new qFlick(space, nW);

	LONGS_EQUAL_TEXT('Flic', qflick->magic, "qFlick magic");
	CHECK_TEXT(qflick->wave, "qFlick wave");
	CHECK_TEXT(qflick->dynamicallyAllocated, "qFlick dynamicallyAllocated");
	CHECK_TEXT(qflick->waves, "waves");

	for (int w = 0; w < nW; w++) {
		qCx *wave = qflick->waves[w];
		CHECK_TEXT(wave, "wave w exists");
		proveItsMine(wave, space->nPoints * sizeof(qCx));
	}

	LONGS_EQUAL_TEXT(1, qflick->start, "qFlick start");
	LONGS_EQUAL_TEXT(N+1, qflick->end, "qFlick end");
	LONGS_EQUAL_TEXT(N+2, qflick->nPoints, "qFlick nPoints");

	delete qflick;
	delete space;
}


TEST(qFlick, FlickAlloc4_2) { testAnAlloc(4, 2); }
TEST(qFlick, FlickAlloc8_5) { testAnAlloc(8, 5); }
TEST(qFlick, FlickAlloc64_41) { testAnAlloc(64, 41); }

/* ***************************************************************************** Re-Alloc */

static int maxi(int a, int b) {
	if (a < b) return b;
	return a;
}

// pass what nWaves and allocWaves should be; this will verify
static void proveIt(qFlick *qflick, int nWaves, int allocWaves) {
	LONGS_EQUAL_TEXT(nWaves, qflick->nWaves, "SetNWaves nWaves wrong");
	LONGS_EQUAL_TEXT(allocWaves, qflick->allocWaves, "SetNWaves allocWaves wrong");

	// verify waves are there
	for (int w = 0; w < nWaves; w++)
		proveItsMine(qflick->waves[w], 18 * sizeof(qCx));

	// make sure the rest are null
	for (int w = nWaves; w < allocWaves; w++)
		POINTERS_EQUAL(NULL, qflick->waves[w]);
}

static void testSetNWaves(int size0, int size1, int size2) {
	qSpace *space = makeBareSpace(16);
	qFlick *qflick = new qFlick(space, size0);
	proveIt(qflick, size0, size0);
	int maxW = size0;

	qflick->setNWaves(size1);
	maxW = maxi(maxW, size1);
	proveIt(qflick, size1, maxW);

	qflick->setNWaves(size2);
	maxW = maxi(maxW, size2);
	proveIt(qflick, size2, maxW);

	delete qflick;
	delete space;
}


// different patterns of enlarging and reducing
TEST(qFlick, FlickSetNWaves5_10_15) { testSetNWaves(5, 10, 15); }
TEST(qFlick, FlickSetNWaves8_5_2) { testSetNWaves(8, 5, 2); }
TEST(qFlick, FlickSetNWaves7_10_3) { testSetNWaves(7, 10, 3); }
TEST(qFlick, FlickSetNWaves9_4_6) { testSetNWaves(9, 4, 6); }

// various patterns with no change
TEST(qFlick, FlickSetNWaves8_8_6) { testSetNWaves(8, 8, 6); }
TEST(qFlick, FlickSetNWaves8_6_6) { testSetNWaves(8, 6, 6); }
TEST(qFlick, FlickSetNWaves9_14_14) { testSetNWaves(9, 14, 14); }
TEST(qFlick, FlickSetNWaves9_9_14) { testSetNWaves(9, 9, 14); }

TEST(qFlick, FlickSetNWaves2_2_2) { testSetNWaves(2, 2, 2); }


