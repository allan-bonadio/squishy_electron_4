/*
** quantum space tests
** Copyright (C) 2022-2025 Tactile Interactive, all rights reserved
*/


#include "qSpace.h"
#include "../greiman/qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "../debroglie/qWave.h"
#include "../greiman/qViewBuffer.h"

#include "../testing/testingHelpers.h"
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


// the 3-part constructor, full test
TEST(qSpace, qSpace_1DConstructorGauntlet)
{
	qSpace *space = new qSpace("AliBaba");
	STRCMP_EQUAL("AliBaba", space->label);

	LONGS_EQUAL(0, space->nDimensions);
	// hmm must be something else to test...
	LONGS_EQUAL_TEXT('Spac', space->magic, "qSpace magic");


	// should change one of these to discrete someday or
	// make a func to try combinations
	space->addDimension(64, contENDLESS, 2.2, "x");
	LONGS_EQUAL(1, space->nDimensions);

	space->initSpace();

	LONGS_EQUAL(64, space->nStates);
	LONGS_EQUAL(66, space->nPoints);

	qDimension *dims = space->dimensions;

	LONGS_EQUAL(64, dims[0].nStates);
	LONGS_EQUAL(66, dims[0].nPoints);
	LONGS_EQUAL(64, dims[0].N);
	LONGS_EQUAL(1, dims[0].start);
	LONGS_EQUAL(65, dims[0].end);
	LONGS_EQUAL(contENDLESS, dims[0].continuum);
	DOUBLES_EQUAL(2.2, dims[0].dx, ERROR_RADIUS)
	STRCMP_EQUAL("x", dims[0].label);

	delete space;
}

// the 3-part constructor, creating a 2D space, not even using that yet!
TEST(qSpace, qSpace_2DConstructorGauntlet)
{
	qSpace *space = new qSpace("ShowRoo");
	STRCMP_EQUAL("ShowRoo", space->label);

	LONGS_EQUAL(0, space->nDimensions);
	// hmm must be something else to test...
	LONGS_EQUAL_TEXT('Spac', space->magic, "qSpace magic");


	// should change one of these to discrete someday or
	// make a func to try combinations
	space->addDimension(16, contENDLESS, 11, "x");
	LONGS_EQUAL(1, space->nDimensions);

	space->addDimension(8, contENDLESS, 7, "y");
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

// this tests the whole shebang, as it is created from JS
void completeNewSpaceGauntlet(int N) {
	qSpace *space = makeFullSpace(N);
	int nPoints = space->nPoints;

	STRCMP_EQUAL_TEXT(MAKEFULLSPACE_LABEL, space->label, "space label");

	// these are for the dimension, of which there's only one
	LONGS_EQUAL_TEXT(1, space->dimensions->start, "space start");
	LONGS_EQUAL_TEXT(N+1, space->dimensions->end, "space end");
	LONGS_EQUAL_TEXT(N, space->dimensions->N, "space N");
	LONGS_EQUAL_TEXT(contENDLESS, space->dimensions->continuum, "space continuum");
	LONGS_EQUAL_TEXT(N+2, space->dimensions->nPoints, "space nPoints");
	LONGS_EQUAL_TEXT(N, space->dimensions->nStates, "space nStates");
	LONGS_EQUAL_TEXT(N, space->dimensions->spectrumLength, "space spectrumLength");
	STRCMP_EQUAL_TEXT("x", space->dimensions->label, "space label");

	LONGS_EQUAL_TEXT(1, space->nDimensions, "space nDimensions");

	// lets see if the buffers are all large enough
	proveItsMine(space->voltage, nPoints * sizeof(double));

	// and the avatars' waves and vbufs
	proveItsMine(space->mainAvatar->qwave->wave, nPoints * sizeof(qCx));
	proveItsMine(space->mainAvatar->vBuffer, nPoints * 8 * sizeof(float));
	proveItsMine(space->miniGraphAvatar->qwave->wave, nPoints * sizeof(qCx));
	proveItsMine(space->miniGraphAvatar->vBuffer, nPoints * 8 * sizeof(float));

	deleteFullSpace(space);
}

TEST(qSpace, qSpace_CompleteNewSpaceGauntlet4096) { completeNewSpaceGauntlet(4096); }
TEST(qSpace, qSpace_CompleteNewSpaceGauntlet256) { completeNewSpaceGauntlet(256); }
TEST(qSpace, qSpace_CompleteNewSpaceGauntlet64) { completeNewSpaceGauntlet(64); }
TEST(qSpace, qSpace_CompleteNewSpaceGauntlet32) { completeNewSpaceGauntlet(32); }
TEST(qSpace, qSpace_CompleteNewSpaceGauntlet32again) { completeNewSpaceGauntlet(32); }
TEST(qSpace, qSpace_CompleteNewSpaceGauntlet4) { completeNewSpaceGauntlet(4); }

