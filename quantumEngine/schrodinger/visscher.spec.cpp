/*
** visscher integration testing
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/


#include "../debroglie/qWave.h"
#include "../hilbert/qSpace.h"
#include "../greiman/qAvatar.h"
#include "qGrinder.h"
#include "../debroglie/qFlick.h"

#include "../testing/testingHelpers.h"
#include "../testing/cppuMain.h"

#include "CppUTest/TestHarness.h"

static bool traceOneStep = false;
static bool traceOneFrame = false;

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

// this seems to crash early in stepReal, but I can't figure out what's gone wrong.  One integration works fine.
TEST(visscher, VisscherOneStep4)
{
	oldWave4->setCircularWave(1.);
	if (traceOneStep) oldWave4->dump("start VisscherOneStep test");

	qAvatar *avatar = new qAvatar(space4, "VisscherOneStep");
	qGrinder *grinder = new qGrinder(space4, avatar, 1, "Visscher1Step");


	double dt = 0.01;
	if (traceOneStep) grinder->dumpObj("⚛️ before : one Visscher Step");
	grinder->stepReal(newWave4->wave, oldWave4->wave, oldWave4->wave, dt);
	grinder->stepImaginary(newWave4->wave, oldWave4->wave, oldWave4->wave, dt);
	if (traceOneStep) printf("⚛️ after : one Visscher Step\n");


	compareWaves(expectedWave4, newWave4);
	delete grinder;
	delete avatar;
}

/* ****************************************************************** one integration */

static qCx expectedArray[34] = {
qCx(    0.1719177765,     -0.0411565053),  // 0
qCx(    0.1766435609,     -0.0068256995),  // 1
qCx(    0.1745810324,      0.0277674140),  // 2
qCx(    0.1658094526,      0.0612934415),  // 3
qCx(    0.1506659086,      0.0924639963),  // 4
qCx(    0.1297323582,      0.1200812116),  // 5
qCx(    0.1038132660,      0.1430837733),  // 6
qCx(    0.0739046883,      0.1605877058),  // 7
qCx(    0.0411559948,      0.1719203428),  // 8
qCx(    0.0068256995,      0.1766461775),  // 9
qCx(   -0.0277669036,      0.1745835987),  // 10
qCx(   -0.0612924401,      0.1658118700),  // 11
qCx(   -0.0924625426,      0.1506680842),  // 12
qCx(   -0.1200793614,      0.1297342084),  // 13
qCx(   -0.1430815977,      0.1038147197),  // 14
qCx(   -0.1605852884,      0.0739056896),  // 15
qCx(   -0.1719177765,      0.0411565053),  // 16
qCx(   -0.1766435609,      0.0068256995),  // 17
qCx(   -0.1745810324,     -0.0277674140),  // 18
qCx(   -0.1658094526,     -0.0612934415),  // 19
qCx(   -0.1506659086,     -0.0924639963),  // 20
qCx(   -0.1297323582,     -0.1200812116),  // 21
qCx(   -0.1038132660,     -0.1430837733),  // 22
qCx(   -0.0739046883,     -0.1605877058),  // 23
qCx(   -0.0411559948,     -0.1719203428),  // 24
qCx(   -0.0068256995,     -0.1766461775),  // 25
qCx(    0.0277669036,     -0.1745835987),  // 26
qCx(    0.0612924401,     -0.1658118700),  // 27
qCx(    0.0924625426,     -0.1506680842),  // 28
qCx(    0.1200793614,     -0.1297342084),  // 29
qCx(    0.1430815977,     -0.1038147197),  // 30
qCx(    0.1605852884,     -0.0739056896),  // 31
qCx(    0.1719177765,     -0.0411565053),  // 32
qCx(    0.1766435609,     -0.0068256995),  // 33
};


// everything turns into nans.  dunno what's wrong.
TEST(visscher, VisscherOneFrame32)
{
	// simulate the app starting up
	qSpace *space = makeFullSpace(32);
	qAvatar *av = space->mainAvatar;
	qGrinder *qgrinder = space->qgrinder;
	qFlick *fl = qgrinder->qflick;
	fl->setCircularWave(1.);
	for (int ix = fl->start; ix < fl->end; ix++) space->voltage[ix] = 0;

	if (traceOneFrame)
		fl->dump("VisscherOneFrame, before", true);

	// simulate the app taking one iter = 100 steps
	// qgrinder->stepsPerFrame = 100;
	// qgrinder->dt = .01;
	// qgrinder->lowPassFilter = 10;  // num freqs to eliminate on each side

	// one frame
	qgrinder->oneFrame();

	if (traceOneFrame)
		fl->dump("VisscherOneFrame, after", true);

	// dumps the wave in case you want to paste it back in here
	// probably you should comment it out for normal use
	if (traceOneFrame)
		dumpWaveInitializer("expectedArray", fl->wave, space->nPoints);

	// we'll use this to compare against
	qWave *expectedQWave = new qWave(space, expectedArray);
	compareWaves(expectedQWave, av->qwave);
	delete expectedQWave;

	// simulate the app ... will also delete avatar and grinder.
	deleteFullSpace(space);

	// anything i'm forgetting?
}

/* ******************************************************************     */
