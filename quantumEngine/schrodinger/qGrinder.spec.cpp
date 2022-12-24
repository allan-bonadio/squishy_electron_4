/*
** quantum qGrinder tests
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/


#include "../spaceWave/qSpace.h"
#include "../schrodinger/qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "../debroglie/qFlick.h"
#include "../greiman/qViewBuffer.h"
#include "../testing/cppuMain.h"
#include "../fourier/qSpectrum.h"

#include "CppUTest/TestHarness.h"


TEST_GROUP(qGrinder)
{
};


/* ******************************************************************************************** boring constructor tests */
// just the constructor; it's not even fully created
TEST(qGrinder, CheckGrinderConstructor)
{
	qSpace *space = makeBareSpace(8, contENDLESS);
	qAvatar *avatar = new qAvatar(space, "grindAway");
	qGrinder *grinder = new qGrinder(space, avatar, "myGrinder");

	LONGS_EQUAL('Grin', grinder->magic);
	POINTERS_EQUAL(space, grinder->space);
	POINTERS_EQUAL(avatar, grinder->avatar);

	DOUBLES_EQUAL(0., grinder->elapsedTime, ERROR_RADIUS);
	DOUBLES_EQUAL(0., grinder->frameSerial, ERROR_RADIUS);
	DOUBLES_EQUAL(1e-3, grinder->dt, ERROR_RADIUS);


	LONGS_EQUAL(1, grinder->lowPassFilter);
	LONGS_EQUAL(100, grinder->stepsPerFrame);

	LONGS_EQUAL(space->nPoints, grinder->qflick->nPoints);
	proveItsMine(grinder->qflick->waves[0], space->nPoints * sizeof(qCx));
	proveItsMine(grinder->qflick->waves[1], space->nPoints * sizeof(qCx));

	POINTERS_EQUAL(space->voltage, grinder->voltage);
	DOUBLES_EQUAL(space->voltageFactor, grinder->voltageFactor, ERROR_RADIUS);

	POINTERS_EQUAL(NULL, grinder->qspect);
	qSpectrum *spect = grinder->getSpectrum();
	POINTERS_EQUAL(spect, grinder->qspect);
	proveItsMine(grinder->qspect->wave, space->nStates * sizeof(qCx));


	LONGS_EQUAL(false, grinder->isIntegrating);
	LONGS_EQUAL(false, grinder->needsIntegration);
	LONGS_EQUAL(false, grinder->doingIntegration);
	LONGS_EQUAL(false, grinder->pleaseFFT);

	STRCMP_EQUAL("myGrinder", grinder->label);

	delete grinder;
	delete avatar;
	delete space;
}


/* ******************************************************************************************** FourierFilter */
static bool traceFourierFilter = false;

// try out FF on a mix of frequencies; should filter out
// goodFreq should stay there, while badFreq should be filtered out.
static void tryFourierFilter(int N, int goodFreq, int badFreq, int lowPassFilter, bool shouldFail)
{
	if (traceFourierFilter) printf("🌈  tryFourierFilter(N=%d, freq=%d & %d,  lowPassFilter=%d)\n",
		 N,  goodFreq, badFreq,  lowPassFilter);

	qSpace *space = makeBareSpace(N, contENDLESS);
	qAvatar *avatar = new qAvatar(space, "tryFourierAva");
	qGrinder *grinder = new qGrinder(space, avatar, "tryFourierGri");
	qFlick *qf = grinder->qflick;
	qWave *addOn = new qWave(space);
	qSpectrum *rainbow = grinder->getSpectrum();

	qf->setCircularWave(goodFreq);
	addOn->setCircularWave(badFreq);

	qf->add(1., qf->wave + qf->start, 1., addOn->wave + addOn->start);
	rainbow->generateSpectrum(qf);
	if (traceFourierFilter)
		rainbow->dumpSpectrum("spectrum before FourierFilter(), input wave:");

	// now the actual filter, do it!
	grinder->fourierFilter(lowPassFilter);

	// now take a look at what we got
	rainbow->generateSpectrum(qf);
	if (traceFourierFilter)
		rainbow->dumpSpectrum("after fourierFilter()");

	CHECK(shouldFail ^ isAllZeroesExceptFor(rainbow, goodFreq));

	delete addOn;
	delete grinder;
	delete avatar;
	delete space;
}

// arguments are: N, good freq to retain, bad freq to filter out.
// lowPassFilter, expeted goodFreq height as a result.

// example: 16 states.  Initially has waves of frequencies 3 & 6.
// filter out frequencies 5, 6, 7, ... *8* ... 9, 10, 11.   8 is the nyquist freq
// So expect only freq 3 left, value=4 on fft.
//TEST(qGrinder, foFi16_3_6) { tryFourierFilter(16, 3, 6, 3); }
//
//TEST(qGrinder, foFi16_1_8) { tryFourierFilter(16, 1, 8, 1); }
//
//TEST(qGrinder, foFi16_2_7) { tryFourierFilter(16, 2, 7, 3); }


// ok we have a freq 1 carrier.  We stick in a freq 5 noise.  When does it cut off?
// these are not cut off
TEST(qGrinder, foFi16_1_LPFscan0) { tryFourierFilter(16, 1, 5, 0, true); }
TEST(qGrinder, foFi16_1_LPFscan1) { tryFourierFilter(16, 1, 5, 1, true); }
TEST(qGrinder, foFi16_1_LPFscan2) { tryFourierFilter(16, 1, 5, 2, true); }

// these ARE cut off
TEST(qGrinder, foFi16_1_LPFscan3) { tryFourierFilter(16, 1, 5, 3, false); }
TEST(qGrinder, foFi16_1_LPFscan4) { tryFourierFilter(16, 1, 5, 4, false); }
TEST(qGrinder, foFi16_1_LPFscan5) { tryFourierFilter(16, 1, 5, 5, false); }
TEST(qGrinder, foFi16_1_LPFscan6) { tryFourierFilter(16, 1, 5, 6, false); }

// also wipes out freq 1 so should fail the test
TEST(qGrinder, foFi16_1_LPFscan7) { tryFourierFilter(16, 1, 5, 7, true); }

//TEST(qGrinder, foFi16_1_3_LPFscan7) { tryFourierFilter(16, 1, 3, 7); }

//TEST(qGrinder, foFi64_5_22) { tryFourierFilter(64, 5, 22, 16); }


/* ********************************************************************** random experimentatiojn */

static void fourierExperiments(int N) {
	qSpace *space = makeBareSpace(N, contENDLESS);
	qAvatar *avatar = new qAvatar(space, "fourExpAv");
	qGrinder *grinder = new qGrinder(space, avatar, "fourExpGrind");

	qSpectrum *allOnes = new qSpectrum(space);
	allOnes->fill();

	allOnes->wave[N/2 - 1] = 1;

	allOnes->dumpSpectrum("all ones");

	qWave *onesWave = new qWave(space);
	allOnes->generateWave(onesWave);
	onesWave->dump("onesWave after conversion", true);

	delete allOnes;
	delete onesWave;
	delete grinder;
	delete space;
}

IGNORE_TEST(qGrinder, fourierExperiments)
{
	fourierExperiments(16);

}


