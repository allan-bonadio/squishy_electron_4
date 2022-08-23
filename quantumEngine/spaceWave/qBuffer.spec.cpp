/*
** quantum buffer testing
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/
#include "qBuffer.h"

#include "../testing/cppuMain.h"

#include "CppUTest/TestHarness.h"

TEST_GROUP(qBuffer)
{
};

// create and destroy a buffer of length complex nums.
// in the middle, check several values that should be right
// and make sure we own the bytes we think we do.
static void testABufferLength(int length, qCx *useThisBuffer = NULL) {
	// uncomment this if you want to see which one failed
	//printf("🧨: testing %d point buffer with %p\n", length, useThisBuffer);

	qBuffer *qBuf = new qBuffer();
	LONGS_EQUAL_TEXT('qBuf', qBuf->magic, "qbuffer magic");
	POINTERS_EQUAL_TEXT(NULL, qBuf->wave, "qbuffer wave null");

	qBuf->initBuffer(length, useThisBuffer);
	LONGS_EQUAL_TEXT(length, qBuf->nPoints, "qbuffer nPoints");

	if (useThisBuffer){
		CHECK_TEXT(! qBuf->dynamicallyAllocated, "qbuffer !dynamicallyAllocated");
	}
	else {
		CHECK_TEXT(qBuf->dynamicallyAllocated, "qbuffer dynamicallyAllocated");
	}

	CHECK_TEXT(qBuf->wave, "qbuffer wave nonnull");

	proveItsMine(qBuf->wave, length * sizeof(qCx));

	delete qBuf;
}


TEST(qBuffer, BufferConstructDestruct1) { testABufferLength(1); }
TEST(qBuffer, BufferConstructDestruct4) { testABufferLength(4); }
TEST(qBuffer, BufferConstructDestruct8) { testABufferLength(8); }
TEST(qBuffer, BufferConstructDestruct16) { testABufferLength(16); }
TEST(qBuffer, BufferConstructDestruct32) { testABufferLength(32); }
TEST(qBuffer, BufferConstructDestruct34) { testABufferLength(34); }
TEST(qBuffer, BufferConstructDestruct1024) { testABufferLength(1024); }
TEST(qBuffer, BufferConstructDestruct1026) { testABufferLength(1026); }
TEST(qBuffer, BufferConstructDestruct3233) { testABufferLength(3233); }

TEST(qBuffer, BufferUseThisBufferMallocTwoAtOnce)
{
	// make sure there isn't anything shared between them.
	qCx *buf555 = (qCx *) malloc(555 * sizeof(qCx));
	qCx *buf8 = (qCx *) malloc(8 * sizeof(qCx));

	testABufferLength(8, buf8);
	testABufferLength(555, buf555);

	free(buf555);
	free(buf8);
}

TEST(qBuffer, BufferUseThisBufferAllocateTwoAtOnce)
{
	// make sure there isn't anything shared between them.
	qCx *buf27 = allocateWave(27);
	qCx *buf999 = allocateWave(999);

	testABufferLength(999, buf999);
	testABufferLength(27, buf27);

	freeWave(buf27);
	freeWave(buf999);
}

