/*
** quantum qAvatar tests
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/


#include "../spaceWave/qSpace.h"
#include "../schrodinger/qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "../debroglie/qWave.h"
#include "../greiman/qViewBuffer.h"
#include "../testing/cppuMain.h"
#include "../fourier/qSpectrum.h"

#include "CppUTest/TestHarness.h"


TEST_GROUP(qAvatar)
{
};


/* ******************************************************************************************** boring constructor test */
// just the constructor; it's not even fully created
TEST(qAvatar, CheckAvatarConstructor)
{
	qSpace *space = makeBareSpace(8, contENDLESS);
	qAvatar *avatar = new qAvatar(space, "outcome");

	LONGS_EQUAL(space->nPoints, avatar->qwave->nPoints);
	proveItsMine(avatar->qwave->wave	, space->nPoints * sizeof(qCx));
	proveItsMine(avatar->qvBuffer->vBuffer, space->nPoints * sizeof(float) * 8);

	LONGS_EQUAL('Avat', avatar->magic);
	POINTERS_EQUAL(space, avatar->space);

	LONGS_EQUAL(space->nPoints, avatar->qwave->nPoints);

	POINTERS_EQUAL(space->voltage, avatar->voltage);
	DOUBLES_EQUAL(space->voltageFactor, avatar->voltageFactor, ERROR_RADIUS);

	POINTERS_EQUAL(avatar, avatar->qvBuffer->avatar);
	POINTERS_EQUAL(avatar->vBuffer, avatar->qvBuffer->vBuffer);

	STRCMP_EQUAL("outcome", avatar->label);

	delete avatar;
	delete space;
}


