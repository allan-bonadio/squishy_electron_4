/*
** quantum qGrinder tests
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

#include <cstring>

#include "../hilbert/qSpace.h"
#include "../greiman/qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "../debroglie/qFlick.h"
#include "../greiman/qViewBuffer.h"
#include "../fourier/qSpectrum.h"

#include "../testing/testingHelpers.h"
#include "../testing/cppuMain.h"

#include "CppUTest/TestHarness.h"

static bool traceFourierFilter = false;

TEST_GROUP(qGrinder)
{
};


/* ******************************************************************************************** boring constructor tests */
// just the constructor; it's not even fully created
TEST(qGrinder, CheckGrinderConstructor)
{
	qSpace *space = makeBareSpace(8, contENDLESS);
	qAvatar *avatar = new qAvatar(space, "grindAway");
	qGrinder *qgrinder = new qGrinder(space, avatar, "myGrinder");

	LONGS_EQUAL('Grin', qgrinder->magic);
	POINTERS_EQUAL(space, qgrinder->space);
	POINTERS_EQUAL(avatar, qgrinder->avatar);

	DOUBLES_EQUAL(0., qgrinder->elapsedTime, ERROR_RADIUS);
	DOUBLES_EQUAL(0., qgrinder->frameSerial, ERROR_RADIUS);
	DOUBLES_EQUAL(1e-3, qgrinder->dt, ERROR_RADIUS);


	LONGS_EQUAL(1, qgrinder->lowPassFilter);
	LONGS_EQUAL(100, qgrinder->stepsPerFrame);

	LONGS_EQUAL(space->nPoints, qgrinder->qflick->nPoints);
	proveItsMine(qgrinder->qflick->waves[0], space->nPoints * sizeof(qCx));
	proveItsMine(qgrinder->qflick->waves[1], space->nPoints * sizeof(qCx));

	POINTERS_EQUAL(space->voltage, qgrinder->voltage);
	DOUBLES_EQUAL(space->voltageFactor, qgrinder->voltageFactor, ERROR_RADIUS);

	POINTERS_EQUAL(NULL, qgrinder->qspect);
	qSpectrum *spect = qgrinder->getSpectrum();
	POINTERS_EQUAL(spect, qgrinder->qspect);
	proveItsMine(qgrinder->qspect->wave, space->nStates * sizeof(qCx));


	LONGS_EQUAL(false, qgrinder->isIntegrating);
	LONGS_EQUAL(false, qgrinder->shouldBeIntegrating);
	LONGS_EQUAL(false, qgrinder->pleaseFFT);

	// how does this get turned on!??!!?
	LONGS_EQUAL(true, qgrinder->frameInProgress);

	STRCMP_EQUAL("myGrind", qgrinder->label);

	delete qgrinder;
	delete avatar;
	delete space;
}


/* ******************************************************************************************** FourierFilter */

// need this to verify waves have a certain specific frequency.  Do this to the spectrum.
static void isAllZeroesExceptFor(qBuffer *qwave, int except1, bool shouldFail, const char *msg) {
	qCx *wave = qwave->wave;
	int start = qwave->start;
	int end = qwave->end;
	char buf[100];

	buf[0] = 0;
	for (int ix = start; ix < end; ix++) {
		qCx cx = wave[ix];

		// prepare for a possible error message.  but cppu throws away this message!

		// for the excepted frequency, we don't care.	 error radius ~ 1e-12; roundoff norm ~ 1e-31
		// so if there's a value that's too big, we'll get a message in buf
		if (ix != except1) {
			double norm = cx.norm();
			if ( norm> ERROR_RADIUS) {
				sprintf(buf, "\n wave at [%d]  😢 value = %8.8lf %8.8lf  norm=%8.8lg   shouldFail=%d ",
					ix, cx.re, cx.im, norm, shouldFail);
			}
		}


		if (buf[0]) {
			if (shouldFail) {
				// annoying printf("%s... shoulda failed, and it did.  OK.\n", buf);
			}
			else {
				strcat(buf, "...should have been zero instead\n");
				FAIL(buf);
			}
		}

//		if (ix != except1) {
//			if ((cx.norm() > ERROR_RADIUS) ^ shouldFail) {
//				strcat(buf, "not zero, should be\n");
//				FAIL(buf);
//			}
//		}
//		else {
//			if ((cx.norm() < ERROR_RADIUS) ^ shouldFail) {
//				strcat(buf, "is zero, shouldn't be\n");
//				FAIL(buf);
//			}
//		}
	}

}


// try out FF on a mix of frequencies goodFreq & badFreq, then filter.
// goodFreq should stay there, while badFreq should be filtered out.
static void tryFourierFilter(int N, int goodFreq, int badFreq, int lowPassFilter, bool shouldFail)
{
	if (traceFourierFilter) printf("🌈  tryFourierFilter(N=%d, freq=%d & %d,  lowPassFilter=%d)\n",
		 N,  goodFreq, badFreq,  lowPassFilter);

	qSpace *space = makeBareSpace(N, contENDLESS);
	qAvatar *avatar = new qAvatar(space, "tryFourierAva");
	qGrinder *qgrinder = new qGrinder(space, avatar, "tryFourierGri");
	qFlick *qf = qgrinder->qflick;
	qWave *addOn = new qWave(space);
	qSpectrum *rainbow = qgrinder->getSpectrum();

	qf->setCircularWave(goodFreq);
	addOn->setCircularWave(badFreq);

	qf->add(1., qf->wave + qf->start, 1., addOn->wave + addOn->start);
	rainbow->generateSpectrum(qf);
	if (traceFourierFilter)
		rainbow->dumpSpectrum("spectrum before FourierFilter(), input wave:");

	// now the actual filter, do it!
	qgrinder->fourierFilter(lowPassFilter);

	// now take a look at what we got
	rainbow->generateSpectrum(qf);
	if (traceFourierFilter)
		rainbow->dumpSpectrum("after fourierFilter()");

	isAllZeroesExceptFor(rainbow, goodFreq, shouldFail, "unfiltered frequency");

	delete addOn;
	delete qgrinder;
	delete avatar;
	delete space;
}

// arguments are: N, good freq to retain, bad freq to filter out.
// lowPassFilter, expeted goodFreq height as a result.

// example: 16 states.  Initially has waves of frequencies 3 & 6.
// filter out frequencies 5, 6, 7, ... *8* ... 9, 10, 11.   8 is the nyquist freq
// So expect only freq 3 left, value=4 on fft.
// TEST(qGrinder, fourFilt16_3_6) { tryFourierFilter(16, 3, 6, 3); }
// TEST(qGrinder, fourFilt16_1_8) { tryFourierFilter(16, 1, 8, 1); }
// TEST(qGrinder, fourFilt16_2_7) { tryFourierFilter(16, 2, 7, 3); }


// ok we have a freq 1 carrier.  We stick in a freq 5 noise.  When does it cut off?
// these are not cut off
TEST(qGrinder, fourFilt16_1_LPFscan0) { tryFourierFilter(16, 1, 5, 0, true); }
TEST(qGrinder, fourFilt16_1_LPFscan1) { tryFourierFilter(16, 1, 5, 1, true); }
TEST(qGrinder, fourFilt16_1_LPFscan2) { tryFourierFilter(16, 1, 5, 2, true); }

// these ARE cut off
TEST(qGrinder, fourFilt16_1_LPFscan3) { tryFourierFilter(16, 1, 5, 3, false); }
TEST(qGrinder, fourFilt16_1_LPFscan4) { tryFourierFilter(16, 1, 5, 4, false); }
TEST(qGrinder, fourFilt16_1_LPFscan5) { tryFourierFilter(16, 1, 5, 5, false); }
TEST(qGrinder, fourFilt16_1_LPFscan6) { tryFourierFilter(16, 1, 5, 6, false); }

// also wipes out freq 1 so should fail the test
TEST(qGrinder, fourFilt16_1_LPFscan7) { tryFourierFilter(16, 1, 5, 7, true); }

TEST_SKIP(qGrinder, fourFilt16_1_3_LPFscan7) { tryFourierFilter(16, 1, 3, 7); }

TEST_SKIP(qGrinder, fourFilt64_5_22) { tryFourierFilter(64, 5, 22, 16); }


/* ********************************************************************** random experimentatiojn */

static void fourierExperiments(int N) {
	qSpace *space = makeBareSpace(N, contENDLESS);
	qAvatar *avatar = new qAvatar(space, "fourExpAv");
	qGrinder *qgrinder = new qGrinder(space, avatar, "fourExpGrind");

	qSpectrum *allOnes = new qSpectrum(space);
	allOnes->fill();

	allOnes->wave[N/2 - 1] = 1;

	allOnes->dumpSpectrum("all ones");

	qWave *onesWave = new qWave(space);
	allOnes->generateWave(onesWave);
	onesWave->dump("onesWave after conversion", true);

	delete allOnes;
	delete onesWave;
	delete qgrinder;
	delete space;
}

IGNORE_TEST(qGrinder, fourierExperiments)
{
	fourierExperiments(16);

}


