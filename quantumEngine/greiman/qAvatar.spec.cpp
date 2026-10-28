/*
** quantum qAvatar tests
** Copyright (C) 2022-2026 Tactile Interactive, all rights reserved
*/


#include "../hilbert/qSpace.h"
#include "qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "../debroglie/qCavity.h"
#include "../fourier/qSpectrum.h"

#include "../testing/testingHelpers.h"
#include "../testing/cppuMain.h"

#include "CppUTest/TestHarness.h"


TEST_GROUP(qAvatar)
{
};


/* ************************************************************** boring constructor test */
#define N_POINTZ  100
#define N_COORDS  4

// just the constructor; it's not even fully created
TEST(qAvatar, CheckAvatarConstructor)
{
	//qSpace *space = makeBareSpace(8, contENDLESS);
	qAvatar *avatar = new qAvatar("outcome");
	avatar->attachViewBuffer(0, NULL, N_COORDS, N_POINTZ);
	float *fArray = avatar->viewBuffers[0].fArray;

	// LONGS_EQUAL(space->nPoints, avatar->cavity->nPoints);
	// proveItsMine(avatar->cavity->wave	, space->nPoints * sizeof(qCx));
	proveItsMine(fArray, N_POINTZ * N_COORDS);

	LONGS_EQUAL('Avat', avatar->magic);
	//POINTERS_EQUAL(space, avatar->space);

	LONGS_EQUAL(N_POINTZ, avatar->viewBuffers[0].nVertices);
	LONGS_EQUAL(N_COORDS, avatar->viewBuffers[0].nCoords);

	//POINTERS_EQUAL(space->voltage, avatar->voltage);

	// POINTERS_EQUAL(avatar, avatar->qvBuffer->avatar);
	// POINTERS_EQUAL(avatar->vBuffer, avatar->qvBuffer->vBuffer);

	STRCMP_EQUAL("outcome", avatar->label);

	delete avatar;
	//delete space;
}


