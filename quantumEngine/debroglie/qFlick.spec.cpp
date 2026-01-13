/*
** Flick -- unit tests for qFlick
** Copyright (C) 2023-2026 Tactile Interactive, all rights reserved
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
	qFlick *flick = new qFlick(space, nW, 1);

	LONGS_EQUAL_TEXT('Flic', flick->magic, "qFlick magic");
	CHECK_TEXT(flick->wave, "qFlick wave");
	CHECK_TEXT(flick->dynamicallyAllocated, "qFlick dynamicallyAllocated");
	CHECK_TEXT(flick->waves, "waves");

	for (int w = 0; w < nW; w++) {
		qCx *wave = flick->waves[w];
		CHECK_TEXT(wave, "wave w exists");
		proveItsMine(wave, space->nPoints * sizeof(qCx));
	}

	LONGS_EQUAL_TEXT(1, flick->start, "qFlick start");
	LONGS_EQUAL_TEXT(N+1, flick->end, "qFlick end");
	LONGS_EQUAL_TEXT(N+2, flick->nPoints, "qFlick nPoints");

	delete flick;
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
static void proveIt(qFlick *flick, int nWaves, int allocWaves) {
	LONGS_EQUAL_TEXT(nWaves, flick->nWaves, "SetNWaves nWaves wrong");
	LONGS_EQUAL_TEXT(allocWaves, flick->allocWaves, "SetNWaves allocWaves wrong");

	// verify waves are there
	for (int w = 0; w < nWaves; w++)
		proveItsMine(flick->waves[w], 18 * sizeof(qCx));

	// make sure the rest are null
	for (int w = nWaves; w < allocWaves; w++)
		POINTERS_EQUAL(NULL, flick->waves[w]);
}

static void testSetNWaves(int size0, int size1, int size2) {
	qSpace *space = makeBareSpace(16);
	qFlick *flick = new qFlick(space, size0, 1);
	proveIt(flick, size0, size0);
	int maxW = size0;

	flick->setNWaves(size1);
	maxW = maxi(maxW, size1);
	proveIt(flick, size1, maxW);

	flick->setNWaves(size2);
	maxW = maxi(maxW, size2);
	proveIt(flick, size2, maxW);

	delete flick;
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


