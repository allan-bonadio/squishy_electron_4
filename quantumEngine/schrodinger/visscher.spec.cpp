/*
** visscher integration testing
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/


#include "../spaceWave/qSpace.h"
#include "qAvatar.h"
#include "../debroglie/qWave.h"
#include "../testing/cppuMain.h"

#include "CppUTest/TestHarness.h"

bool traceOneStep = false;
bool traceOneIteration = true;

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
	if (traceOneStep) oldWave4->dump("start VisscherOneStep test");

	qAvatar *avatar = new qAvatar(space4, "VisscherOneStep");

	avatar->dt = 0.01;
	if (traceOneStep) avatar->dumpObj("⚛️ before : oneVisscherStep");
	avatar->oneVisscherStep(newWave4, oldWave4);
	if (traceOneStep) printf("⚛️ after : oneVisscherStep\n");

	//newWave4->dumpWave("VisscherOneStep");
	//expectedWave4->dumpHiRes("expectedWave4");
	//oldWave4->dumpHiRes("oldWave4");
	//newWave4->dumpHiRes("newWave4");

	compareWaves(expectedWave4, newWave4);
	delete avatar;
}

/* ****************************************************************** one iteration */

static qCx expectedArray[34] = {
qCx(    0.1719190461333459,   -0.04115680867662573),
qCx(    0.1766448653389613,  -0.006825749407538643),
qCx(    0.1745823214331821,     0.0277676195833559),
qCx(    0.1658106768216196,    0.06129389452592257),
qCx(    0.1506670208875011,    0.09246467947586984),
qCx(    0.1297333158357147,     0.1200820986483493),
qCx(    0.1038140322116433,     0.1430848301125895),
qCx(   0.07390523354925881,     0.1605888917984998),
qCx(   0.04115629820810851,     0.1719216124318822),
qCx(  0.006825749407538592,     0.1766474819142581),
qCx(  -0.02776710911483864,     0.1745848877317183),
qCx(  -0.06129289320590692,     0.1658130942219815),
qCx(  -0.09246322578452253,     0.1506691964903487),
qCx(   -0.1200802484502134,     0.1297351660338505),
qCx(   -0.1430826545097418,     0.1038154859029908),
qCx(   -0.1605864743981379,    0.07390623486927438),
qCx(   -0.1719190461333459,     0.0411568086766257),
qCx(   -0.1766448653389613,     0.0068257494075386),
qCx(   -0.1745823214331821,   -0.02776761958335584),
qCx(   -0.1658106768216196,   -0.06129389452592256),
qCx(    -0.150667020887501,   -0.09246467947586982),
qCx(   -0.1297333158357147,    -0.1200820986483493),
qCx(   -0.1038140322116434,    -0.1430848301125894),
qCx(  -0.07390523354925868,    -0.1605888917984999),
qCx(  -0.04115629820810852,    -0.1719216124318821),
qCx( -0.006825749407538635,     -0.176647481914258),
qCx(   0.02776710911483869,    -0.1745848877317183),
qCx(   0.06129289320590688,    -0.1658130942219816),
qCx(   0.09246322578452253,    -0.1506691964903487),
qCx(    0.1200802484502134,    -0.1297351660338505),
qCx(    0.1430826545097418,    -0.1038154859029908),
qCx(    0.1605864743981379,    -0.0739062348692744),
qCx(    0.1719190461333459,   -0.04115680867662573),
qCx(    0.1766448653389613,  -0.006825749407538643)
};

// everything turns into nans.  dunno what's wrong.
TEST(visscher, VisscherOneIteration)
{
	// simulate the app starting up
	qSpace *space = makeFullSpace(32);
	qAvatar *av = theSpace->mainAvatar;
	av->qwave->setCircularWave(1.);



	// simulate the app taking one iter = 100 steps
	av->stepsPerIteration = 100;
	av->dt = .01;
	av->lowPassFilter = 10;

	av->oneIteration();

	// activate this to regenerate the expected table above
	//av->qwave->dumpHiRes("VisscherOneIteration test");

	// we'll use this to compare against
	qWave *expectedQWave = new qWave(space, expectedArray);
	compareWaves(expectedQWave, av->qwave);
	delete expectedQWave;

	// simulate the app ... tearing down, although probably not done much in reality
	deleteTheSpace(theSpace);

	// anything i'm forgetting?
}

/* ******************************************************************     */
