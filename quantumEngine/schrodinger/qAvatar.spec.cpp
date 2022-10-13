/*
** quantum qAvatar tests
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/


#include "../spaceWave/qSpace.h"
#include "../schrodinger/qAvatar.h"
#include "../spaceWave/qWave.h"
#include "../spaceWave/qViewBuffer.h"
#include "../testing/cppuMain.h"
#include "../fourier/qSpectrum.h"

#include "CppUTest/TestHarness.h"


TEST_GROUP(qAvatar)
{
};


/* ******************************************************************************************** boring constructor tests */
// just the constructor; it's not even fully created
TEST(qAvatar, qAvatar_CheckConstructor)
{
	qSpace *space = makeBareSpace(8, contENDLESS);
	qAvatar *avatar = new qAvatar(space, "CheckConst");

	LONGS_EQUAL(1, avatar->lowPassFilter);

	LONGS_EQUAL(false, avatar->pleaseFFT);
	LONGS_EQUAL(false, avatar->isIterating);

	delete avatar;
	delete space;
}



// boring, just copied from the space test script

// this tests the whole shebang, as created from JS
static void completeNewAvatarGauntlet(int N) {
	qSpace *space = makeBareSpace(N);
	qAvatar *avatar = new qAvatar(space, "AvGa");
	int nPoints = space->nPoints;

	LONGS_EQUAL(0, avatar->elapsedTime);
	LONGS_EQUAL(0, avatar->iterateSerial);
	//pointless DOUBLES_EQUAL(1.0, avatar->dt, 1e-12);
	LONGS_EQUAL(100, avatar->stepsPerIteration);
	// long story DOUBLES_EQUAL(N/8, avatar->lowPassFilter, 1e-12);
	LONGS_EQUAL(false, avatar->isIterating);


	// lets see if the buffers are all large enough
	proveItsMine(avatar->mainQWave->wave	, nPoints * sizeof(qCx));
	proveItsMine(avatar->qvBuffer->vBuffer, nPoints * sizeof(float) * 8);

	qWave *scrWave = avatar->getScratchWave();
	CHECK_TEXT(scrWave == avatar->scratchQWave, "scratch wave not the same");
	proveItsMine(avatar->scratchQWave->wave, nPoints * sizeof(qCx));

	qSpectrum *qspect = avatar->getSpectrum();
	CHECK_TEXT(qspect == avatar->qspect, "spectrum not the same");
	qCx *swave = qspect->wave;
	proveItsMine(swave, space->nStates * sizeof(qCx));

	delete avatar;
	delete space;
}

TEST(qAvatar, qAvatar_completeNewAvatarGauntlet4096) { completeNewAvatarGauntlet(4096); }
TEST(qAvatar, qAvatar_completeNewAvatarGauntlet256) { completeNewAvatarGauntlet(256); }
TEST(qAvatar, qAvatar_completeNewAvatarGauntlet64) { completeNewAvatarGauntlet(64); }
TEST(qAvatar, qAvatar_completeNewAvatarGauntlet32) { completeNewAvatarGauntlet(32); }
TEST(qAvatar, qAvatar_completeNewAvatarGauntlet32x) { completeNewAvatarGauntlet(32); }
TEST(qAvatar, qAvatar_completeNewAvatarGauntlet4) { completeNewAvatarGauntlet(4); }




/* ******************************************************************************************** FourierFilter */
static bool traceFourierFilter = true;

// try out FF on a mix of frequencies; should filter out
// goodFreq should stay there, while badFreq should be filtered out.
static void tryFourierFilter(int N, int goodFreq, int badFreq, int lowPassFilter, bool shouldFail)
{
	if (traceFourierFilter) printf("🌈  tryFourierFilter(N=%d, freq=%d & %d,  lowPassFilter=%d)\n",
		 N,  goodFreq, badFreq,  lowPassFilter);

	qSpace *space = makeBareSpace(N, contENDLESS);
	qAvatar *avatar = new qAvatar(space, "tryFourierFil");
	qWave *qw = avatar->mainQWave;
	qWave *addOn = avatar->getScratchWave();
	qSpectrum *rainbow = avatar->getSpectrum();

	qw->setCircularWave(goodFreq);
	addOn->setCircularWave(badFreq);

	qw->add(qw, 1., addOn, 1.);
	rainbow->generateSpectrum(qw);
	rainbow->dumpSpectrum("before FourierFilter(), input wave:");
	//qw->dump("avatar wave BEFORE fourierFilter()", true);

	avatar->fourierFilter(lowPassFilter);

	rainbow->generateSpectrum(qw);
	rainbow->dumpSpectrum("tryFourierFilter() done");
	//rainbow->dumpHiRes("tryFourierFilter() done");

	CHECK(shouldFail ^ isAllZeroesExceptFor(rainbow, goodFreq));
	//qw->dump("avatar wave AFTER fourierFilter()", true);

	delete avatar;
	delete space;
}

// arguments are: N, good freq to retain, bad freq to filter out.
// lowPassFilter, expeted goodFreq height as a result.

// example: 16 states.  Initially has waves of frequencies 3 & 6.
// filter out frequencies 5, 6, 7, ... *8* ... 9, 10, 11.   8 is the nyquist freq
// So expect only freq 3 left, value=4 on fft.
//TEST(qAvatar, qAvatar_foFi16_3_6) { tryFourierFilter(16, 3, 6, 3); }
//
//TEST(qAvatar, qAvatar_foFi16_1_8) { tryFourierFilter(16, 1, 8, 1); }
//
//TEST(qAvatar, qAvatar_foFi16_2_7) { tryFourierFilter(16, 2, 7, 3); }


// ok we have a freq 1 carrier.  We stick in a freq 5 noise.  When does it cut off?
// these are not cut off
TEST(qAvatar, qAvatar_foFi16_1_LPFscan0) { tryFourierFilter(16, 1, 5, 0, true); }
TEST(qAvatar, qAvatar_foFi16_1_LPFscan1) { tryFourierFilter(16, 1, 5, 1, true); }
TEST(qAvatar, qAvatar_foFi16_1_LPFscan2) { tryFourierFilter(16, 1, 5, 2, true); }

// these ARE cut off
TEST(qAvatar, qAvatar_foFi16_1_LPFscan3) { tryFourierFilter(16, 1, 5, 3, false); }
TEST(qAvatar, qAvatar_foFi16_1_LPFscan4) { tryFourierFilter(16, 1, 5, 4, false); }
TEST(qAvatar, qAvatar_foFi16_1_LPFscan5) { tryFourierFilter(16, 1, 5, 5, false); }
TEST(qAvatar, qAvatar_foFi16_1_LPFscan6) { tryFourierFilter(16, 1, 5, 6, false); }

// also wipes out freq 1 so should fail the test
TEST(qAvatar, qAvatar_foFi16_1_LPFscan7) { tryFourierFilter(16, 1, 5, 7, true); }

//TEST(qAvatar, qAvatar_foFi16_1_3_LPFscan7) { tryFourierFilter(16, 1, 3, 7); }

//TEST(qAvatar, qAvatar_foFi64_5_22) { tryFourierFilter(64, 5, 22, 16); }


/* ********************************************************************** random experimentatiojn */

static void fourierExperiments(int N) {
	qSpace *space = makeBareSpace(N, contENDLESS);
	qAvatar *avatar = new qAvatar(space, "fourierExp");

	qSpectrum *allOnes = new qSpectrum(space);
	allOnes->fill();

	//allOnes->wave[N/4] = 1;
	//allOnes->wave[1] = 1;
	//allOnes->wave[0] = 1;
	allOnes->wave[N/2 - 1] = 1;

	allOnes->dumpSpectrum("all ones");


	qWave *onesWave = new qWave(space);
	allOnes->generateWave(onesWave);
	onesWave->dump("onesWave after conversion", true);

	//isAllZeroes(allOnes);
	delete allOnes;
	delete onesWave;
	delete avatar;
	delete space;
}

IGNORE_TEST(qAvatar, fourierExperiments)
{
	fourierExperiments(16);

}

