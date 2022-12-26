/*
** visscher integration testing
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/


#include "../debroglie/qWave.h"
#include "../spaceWave/qSpace.h"
#include "../testing/cppuMain.h"
#include "qAvatar.h"
#include "qGrinder.h"
#include "../debroglie/qFlick.h"

#include "CppUTest/TestHarness.h"

static bool traceOneStep = false;
static bool traceoneIntegration = false;

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
	qGrinder *grinder = new qGrinder(space4, avatar, "Visscher1Step");


	double dt = 0.01;
	if (traceOneStep) grinder->dumpObj("⚛️ before : one Visscher Step");
	grinder->stepReal(newWave4->wave, oldWave4->wave, dt);
	grinder->stepImaginary(newWave4->wave, oldWave4->wave, dt);
	if (traceOneStep) printf("⚛️ after : one Visscher Step\n");


	compareWaves(expectedWave4, newWave4);
	delete grinder;
	delete avatar;
}

/* ****************************************************************** one integration */

static qCx expectedArray[34] = {
qCx(    0.1719177767,     -0.0411565048),  // 0
qCx(    0.1766435610,     -0.0068256990),  // 1
qCx(    0.1745810323,      0.0277674145),  // 2
qCx(    0.1658094525,      0.0612934419),  // 3
qCx(    0.1506659083,      0.0924639967),  // 4
qCx(    0.1297323579,      0.1200812119),  // 5
qCx(    0.1038132656,      0.1430837736),  // 6
qCx(    0.0739046878,      0.1605877060),  // 7
qCx(    0.0411559943,      0.1719203429),  // 8
qCx(    0.0068256990,      0.1766461775),  // 9
qCx(   -0.0277669041,      0.1745835986),  // 10
qCx(   -0.0612924406,      0.1658118698),  // 11
qCx(   -0.0924625430,      0.1506680839),  // 12
qCx(   -0.1200793618,      0.1297342081),  // 13
qCx(   -0.1430815980,      0.1038147193),  // 14
qCx(   -0.1605852886,      0.0739056891),  // 15
qCx(   -0.1719177767,      0.0411565048),  // 16
qCx(   -0.1766435610,      0.0068256990),  // 17
qCx(   -0.1745810323,     -0.0277674145),  // 18
qCx(   -0.1658094525,     -0.0612934419),  // 19
qCx(   -0.1506659083,     -0.0924639967),  // 20
qCx(   -0.1297323579,     -0.1200812119),  // 21
qCx(   -0.1038132656,     -0.1430837736),  // 22
qCx(   -0.0739046878,     -0.1605877060),  // 23
qCx(   -0.0411559943,     -0.1719203429),  // 24
qCx(   -0.0068256990,     -0.1766461775),  // 25
qCx(    0.0277669041,     -0.1745835986),  // 26
qCx(    0.0612924406,     -0.1658118698),  // 27
qCx(    0.0924625430,     -0.1506680839),  // 28
qCx(    0.1200793618,     -0.1297342081),  // 29
qCx(    0.1430815980,     -0.1038147193),  // 30
qCx(    0.1605852886,     -0.0739056891),  // 31
qCx(    0.1719177767,     -0.0411565048),  // 32
qCx(    0.1766435610,     -0.0068256990),  // 33
};

static void regenerateOutput(qCx *psi, int nPoints) {
	printf("static qCx expectedArray[34] = {\n");
	for (int ix = 0; ix < nPoints; ix++) {
		printf("\tqCx(%16.10lf,  %16.10lf),  // %d\n",
			psi[ix].re, psi[ix].im, ix);
	}
	printf("};\n");

}

// everything turns into nans.  dunno what's wrong.
TEST(visscher, VisscherOneIntegration32)
{
	// simulate the app starting up
	qSpace *space = makeFullSpace(32);
	qAvatar *av = theSpace->mainAvatar;
	qGrinder *grinder = theSpace->grinder;
	grinder->qflick->setCircularWave(1.);

	grinder->qflick->dump("VisscherOneIntegration, before", true);

	// simulate the app taking one iter = 100 steps
	grinder->stepsPerFrame = 100;
	//grinder->stepsPerFrame = 100;
	grinder->dt = .01;
	grinder->lowPassFilter = 10;

	grinder->oneIntegration();

	grinder->qflick->dump("VisscherOneIntegration, after", true);

	// use this to regenerate the table, if needed
	regenerateOutput(grinder->qflick->wave, space->nPoints);

	// we'll use this to compare against
	qWave *expectedQWave = new qWave(space, expectedArray);
	compareWaves(expectedQWave, av->qwave);
	delete expectedQWave;

	// simulate the app ... will also delete avatar and grinder.
	deleteTheSpace(space);

	// anything i'm forgetting?
}

/* ******************************************************************     */
