/*
** quantum space tests
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/


#include "qSpace.h"
#include "../schrodinger/Avatar.h"
#include "qWave.h"
#include "qViewBuffer.h"
#include "../testing/cppuMain.h"

#include "CppUTest/TestHarness.h"


TEST_GROUP(qSpace)
{
};

TEST(qSpace, qSpace_BareGauntlet)
{
	qSpace *space = makeBareSpace(4);
	STRCMP_EQUAL(MAKEBARESPACE_LABEL, space->label);

	LONGS_EQUAL(1, space->dimensions->start);
	LONGS_EQUAL(5, space->dimensions->end);
	LONGS_EQUAL(4, space->dimensions->N);
	LONGS_EQUAL(contENDLESS, space->dimensions->continuum);
	LONGS_EQUAL(6, space->dimensions->nPoints);
	LONGS_EQUAL(4, space->dimensions->nStates);
	STRCMP_EQUAL(MAKEBARE1DDIM_LABEL, space->dimensions->label);

	LONGS_EQUAL(1, space->nDimensions);

	// overall for whole space
	LONGS_EQUAL(6, space->nPoints);
	LONGS_EQUAL(4, space->nStates);

	delete space;

}


// just the constructor; it's not even fully created
TEST(qSpace, qSpace_ConstructorGauntlet)
{
	qSpace *space = new qSpace("ShowRoo");
	STRCMP_EQUAL("ShowRoo", space->label);

	LONGS_EQUAL(0, space->nDimensions);
	// hmm must be something else to test...

	// should change one of these to discrete someday or
	// make a func to try combinations
	space->addDimension(16, contENDLESS, "x");
	LONGS_EQUAL(1, space->nDimensions);

	space->addDimension(8, contENDLESS, "y");
	LONGS_EQUAL(2, space->nDimensions);

	space->initSpace();

	LONGS_EQUAL(128, space->nStates);
	LONGS_EQUAL(180, space->nPoints);

	qDimension *dims = space->dimensions;

	LONGS_EQUAL(128, dims[0].nStates);
	LONGS_EQUAL(180, dims[0].nPoints);
	LONGS_EQUAL(16, dims[0].N);
	LONGS_EQUAL(1, dims[0].start);
	LONGS_EQUAL(17, dims[0].end);
	LONGS_EQUAL(contENDLESS, dims[0].continuum);
	STRCMP_EQUAL("x", dims[0].label);

	LONGS_EQUAL(8, dims[1].nStates);
	LONGS_EQUAL(10, dims[1].nPoints);
	LONGS_EQUAL(8, dims[1].N);
	LONGS_EQUAL(1, dims[1].start);
	LONGS_EQUAL(9, dims[1].end);
	LONGS_EQUAL(contENDLESS, dims[1].continuum);
	STRCMP_EQUAL("y", dims[1].label);



	delete space;
}

// this tests the whole shebang, as created from JS
void completeNewSpaceGauntlet(int N, int expectedSpectrumLength, int expectedFreeBufferLength) {
//	printf("🧨 🧨 starting completeNewSpaceGauntlet(N=%d, sl=%d, fbl=%d)\n",
//		N, expectedSpectrumLength, expectedFreeBufferLength);
	qSpace *space = makeFullSpace(N);
//	printf("🧨 🧨       created the space and all the buffers; freeBufferList=%p\n", space->freeBufferList);
	int nPoints = space->nPoints;

	STRCMP_EQUAL_TEXT(MAKEFULLSPACE_LABEL, space->label, "space label");

	// these are for the dimension, of which there's only one
	LONGS_EQUAL_TEXT(1, space->dimensions->start, "space start");
	LONGS_EQUAL_TEXT(N+1, space->dimensions->end, "space end");
	LONGS_EQUAL_TEXT(N, space->dimensions->N, "space N");
	LONGS_EQUAL_TEXT(contENDLESS, space->dimensions->continuum, "space continuum");
	LONGS_EQUAL_TEXT(N+2, space->dimensions->nPoints, "space nPoints");
	LONGS_EQUAL_TEXT(N, space->dimensions->nStates, "space nStates");
	STRCMP_EQUAL_TEXT("x", space->dimensions->label, "space label");
	LONGS_EQUAL_TEXT(expectedSpectrumLength, space->dimensions->spectrumLength, "space spectrumLength");

	LONGS_EQUAL_TEXT(expectedFreeBufferLength, space->freeBufferLength, "space freeBufferLength");

	LONGS_EQUAL_TEXT(1, space->nDimensions, "space nDimensions");

	// lets see if the buffers are all large enough
//	printf("🧨 🧨       lets see if the buffers are all large enough freeBufferList=%p\n", space->freeBufferList);
	proveItsMine(theSpace->potential, nPoints * sizeof(double));

//	printf("🧨 🧨       we're done, deleting freeBufferList=%p\n", space->freeBufferList);

	deleteTheSpace();

//	printf("🧨 🧨       completeNewSpaceGauntlet() completed\n");
}

TEST(qSpace, qSpace_CompleteNewSpaceGauntlet4000) { completeNewSpaceGauntlet(4000, 4096, 4096); }
TEST(qSpace, qSpace_CompleteNewSpaceGauntlet254) { completeNewSpaceGauntlet(254, 256, 256); }
TEST(qSpace, qSpace_CompleteNewSpaceGauntlet63) { completeNewSpaceGauntlet(63, 64, 65); }
TEST(qSpace, qSpace_CompleteNewSpaceGauntlet48) { completeNewSpaceGauntlet(48, 64, 64); }
TEST(qSpace, qSpace_CompleteNewSpaceGauntlet32) { completeNewSpaceGauntlet(32, 32, 34); }
TEST(qSpace, qSpace_CompleteNewSpaceGauntlet32x) { completeNewSpaceGauntlet(32, 32, 34); }
TEST(qSpace, qSpace_CompleteNewSpaceGauntlet4) { completeNewSpaceGauntlet(4, 4, 6); }

