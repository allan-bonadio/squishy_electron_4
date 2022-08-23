/*
** quantum Avatar tests
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/


#include "../spaceWave/qSpace.h"
#include "../schrodinger/Avatar.h"
#include "../spaceWave/qWave.h"
#include "../spaceWave/qViewBuffer.h"
#include "../testing/cppuMain.h"
#include "../fourier/qSpectrum.h"

#include "CppUTest/TestHarness.h"


TEST_GROUP(Avatar)
{
};


/* ******************************************************************************************** boring constructor tests */
// just the constructor; it's not even fully created
TEST(Avatar, CheckConstructor)
{
	qSpace *space = makeBareSpace(8, contENDLESS);
	Avatar *avatar = new Avatar(space);

	LONGS_EQUAL(1, avatar->lowPassFilter);

	LONGS_EQUAL(false, avatar->pleaseFFT);
	LONGS_EQUAL(false, avatar->isIterating);

	delete avatar;
	delete space;
}



// boring, just copied from the space test script

// this tests the whole shebang, as created from JS
static void completeNewAvatarGauntlet(int N, int expectedSpectrumLength, int expectedFreeBufferLength) {
//	printf("🧨 🧨 starting completeNewAvatarGauntlet(N=%d, sl=%d, fbl=%d)\n",
//		N, expectedSpectrumLength, expectedFreeBufferLength);
	qSpace *space = makeFullSpace(N);
//	printf("🧨 🧨       created the space and all the buffers; freeBufferList=%p\n", space->freeBufferList);
	int nPoints = space->nPoints;

	LONGS_EQUAL(0, theAvatar->elapsedTime);
	LONGS_EQUAL(0, theAvatar->iterateSerial);
	//pointless DOUBLES_EQUAL(1.0, theAvatar->dt, 1e-12);
	LONGS_EQUAL(100, theAvatar->stepsPerIteration);
	DOUBLES_EQUAL(N/8, theAvatar->lowPassFilter, 1e-12);
	LONGS_EQUAL(false, theAvatar->isIterating);


	// lets see if the buffers are all large enough
//	printf("🧨 🧨       lets see if the buffers are all large enough freeBufferList=%p\n", space->freeBufferList);
	proveItsMine(theAvatar->mainQWave->wave	, nPoints * sizeof(qCx));

	theAvatar->getScratchWave();
	proveItsMine(theAvatar->scratchQWave->wave, nPoints * sizeof(qCx));

	theAvatar->getSpectrum();
	proveItsMine(theAvatar->qvBuffer->vBuffer, nPoints * sizeof(float) * 8);

	// will also delete the avatar and other buffers
	deleteTheSpace();
}

TEST(Avatar, Avatar_completeNewAvatarGauntlet4000) { completeNewAvatarGauntlet(4096, 4096, 4098); }
TEST(Avatar, Avatar_completeNewAvatarGauntlet254) { completeNewAvatarGauntlet(256, 256, 258); }
TEST(Avatar, Avatar_completeNewAvatarGauntlet63) { completeNewAvatarGauntlet(64, 64, 66); }
TEST(Avatar, Avatar_completeNewAvatarGauntlet32) { completeNewAvatarGauntlet(32, 32, 34); }
TEST(Avatar, Avatar_completeNewAvatarGauntlet32x) { completeNewAvatarGauntlet(32, 32, 34); }
TEST(Avatar, Avatar_completeNewAvatarGauntlet4) { completeNewAvatarGauntlet(4, 4, 6); }




/* ******************************************************************************************** FourierFilter */
static bool traceFourierFilter = true;

// try out FF on a mix of frequencies; should filter out
// goodFreq should stay there, while badFreq should be filtered out.
static void tryFourierFilter(int N, int goodFreq, int badFreq, int lowPassFilter)
{
	if (traceFourierFilter) printf("🌈  tryFourierFilter(N=%d, freq=%d & %d,  lowPassFilter=%d)\n",
		 N,  goodFreq, badFreq,  lowPassFilter);

	qSpace *space = makeBareSpace(N, contENDLESS);
	Avatar *avatar = new Avatar(space);
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

	isAllZeroesExceptFor(rainbow, goodFreq);


	//qw->dump("avatar wave AFTER fourierFilter()", true);

	delete avatar;
	delete space;
}

// arguments are: N, good freq to retain, bad freq to filter out.
// lowPassFilter, expeted goodFreq height as a result.

// example: 16 states.  Initially has waves of frequencies 3 & 6.
// filter out frequencies 5, 6, 7, ... *8* ... 9, 10, 11.   8 is the nyquist freq
// So expect only freq 3 left, value=4 on fft.
//TEST(Avatar, fourierFilter16_3_6) { tryFourierFilter(16, 3, 6, 3); }
//
//TEST(Avatar, fourierFilter16_1_8) { tryFourierFilter(16, 1, 8, 1); }
//
//TEST(Avatar, fourierFilter16_2_7) { tryFourierFilter(16, 2, 7, 3); }


// ok we have a freq 1 carrier.  We stick in a freq 5 noise.  When does it cut off?
TEST(Avatar, fourierFilter16_1_LPFscan2) { tryFourierFilter(16, 1, 5, 2); }
TEST(Avatar, fourierFilter16_1_LPFscan3) { tryFourierFilter(16, 1, 5, 3); }
TEST(Avatar, fourierFilter16_1_LPFscan4) { tryFourierFilter(16, 1, 5, 4); }
TEST(Avatar, fourierFilter16_1_LPFscan5) { tryFourierFilter(16, 1, 5, 5); }
TEST(Avatar, fourierFilter16_1_LPFscan6) { tryFourierFilter(16, 1, 5, 6); }
TEST(Avatar, fourierFilter16_1_LPFscan7) { tryFourierFilter(16, 1, 5, 7); }

//TEST(Avatar, fourierFilter16_1_3_LPFscan7) { tryFourierFilter(16, 1, 3, 7); }

//TEST(Avatar, fourierFilter64_5_22) { tryFourierFilter(64, 5, 22, 16); }


/* ********************************************************************** random experimentatiojn */

static void fourierExperiments(int N) {
	qSpace *space = makeBareSpace(N, contENDLESS);
	Avatar *avatar = new Avatar(space);

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

TEST(Avatar, fourierExperiments)
{
	fourierExperiments(16);

}


