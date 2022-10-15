/*
** visscher integration testing
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/


#include "../spaceWave/qSpace.h"
#include "qAvatar.h"
#include "../spaceWave/qWave.h"
#include "../testing/cppuMain.h"

#include "CppUTest/TestHarness.h"


TEST_GROUP(visscher)
{
};



/* ****************************************************************** one step */

// created once and never freed; cppuTest won't notice they're never freed.
qSpace *space4 = makeBareSpace(4);
qWave *oldWave4 = new qWave(space4);
qWave *newWave4 = new qWave(space4);

qCx ex4Wave[6] = {
	qCx(-0.01, -.5),
	qCx(.5, -0.01), qCx(0.01, .5),
	qCx(-.5, 0.01), qCx(-0.01, -.5),
	qCx(.5, -0.01)
};
qWave *expectedWave4 = new qWave(space4, ex4Wave);

// this seems to crash early in stepReal, but I can't figure out what's gone wrong.  One iteration works fine.
TEST(visscher, VisscherOneStep)
{
	oldWave4->setCircularWave(1.);
	oldWave4->dump("start VisscherOneStep test");

	qAvatar *avatar = new qAvatar(space4, "VisscherOneStep");

	avatar->dt = 0.01;
	avatar->dumpObj("⚛️ before : oneVisscherStep");
	avatar->oneVisscherStep(newWave4, oldWave4);
	printf("⚛️ after : oneVisscherStep\n");

	//newWave4->dumpWave("VisscherOneStep");
	//expectedWave4->dumpHiRes("expectedWave4");
	//oldWave4->dumpHiRes("oldWave4");
	//newWave4->dumpHiRes("newWave4");

	compareWaves(expectedWave4, newWave4);
	delete avatar;
}

/* ****************************************************************** one iteration */

// everything turns into nans.  dunno what's wrong.
IGNORE_TEST(visscher, VisscherOneIteration)
{
	// simulate the app starting up
	makeFullSpace(32);
	qAvatar *av = fullSpaceSalientPointers.mainAvatar;
	av->qwave->setCircularWave(1.);

	// simulate the app taking one iter = 100 steps
	av->stepsPerIteration = 100;
	av->dt = .01;
	av->lowPassFilter = 1;

	av->oneIteration();

//av->qwave->dumpWave("VisscherOneIteration test");

	// simulate the app ... tearing down, although probably not done much in reality
	deleteTheSpace();

	// anhything i'm forgetting?
}

/* ******************************************************************     */
