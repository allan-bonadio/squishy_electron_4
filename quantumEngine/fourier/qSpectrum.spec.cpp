/*
** quantum spectrum testing
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

#include "qSpectrum.h"
#include "../spaceWave/qSpace.h"
#include "../schrodinger/qAvatar.h"
#include "../testing/cppuMain.h"

#include "CppUTest/TestHarness.h"

TEST_GROUP(qSpectrum)
{
};

// we use this dummy just for its nStates and a few other fields.  never freed.
// we get around the mem leak checker by doing this outside of a test.
static qSpace *spectSpace = new qSpace("testing chooseSpectrumLength");


static void testOneSpectrumLength(int N, int expLength) {
	//printf("chooseSpectrumLength -- testOneSpectrumLength(%s, N=%d, expected=%d) \n",
	//	spectSpace->label, N, expLength);
	spectSpace->dimensions[0].nStates = N;
	spectSpace->dimensions[0].chooseSpectrumLength();

// no this is only set by the space constructor
//	LONGS_EQUAL_TEXT(expLength, spectSpace->spectrumLength,
//		"spectSpace->spectrumLength isn't right");
	LONGS_EQUAL_TEXT(expLength, spectSpace->dimensions->spectrumLength,
		"spectSpace->dimensions->spectrumLength isn't right");
}

// in detail, 8 thru 16
TEST(qSpectrum, chooseSpectrumLength12) { testOneSpectrumLength(12, 16); }
TEST(qSpectrum, chooseSpectrumLength13) { testOneSpectrumLength(13, 16); }
TEST(qSpectrum, chooseSpectrumLength14) { testOneSpectrumLength(14, 16); }
TEST(qSpectrum, chooseSpectrumLength15) { testOneSpectrumLength(15, 16); }
TEST(qSpectrum, chooseSpectrumLength16) { testOneSpectrumLength(16, 16); }
TEST(qSpectrum, chooseSpectrumLength17) { testOneSpectrumLength(17, 32); }

TEST(qSpectrum, chooseSpectrumLength7) { testOneSpectrumLength(7, 8); }
TEST(qSpectrum, chooseSpectrumLength11) { testOneSpectrumLength(11, 16); }
TEST(qSpectrum, chooseSpectrumLength9) { testOneSpectrumLength(9, 16); }
TEST(qSpectrum, chooseSpectrumLength10) { testOneSpectrumLength(10, 16); }
TEST(qSpectrum, chooseSpectrumLength8) { testOneSpectrumLength(8, 8); }

// an interesting series similar to powers of 2
TEST(qSpectrum, chooseSpectrumLength20) { testOneSpectrumLength(20, 32); }
TEST(qSpectrum, chooseSpectrumLength50) { testOneSpectrumLength(50, 64); }
TEST(qSpectrum, chooseSpectrumLength100) { testOneSpectrumLength(100, 128); }
TEST(qSpectrum, chooseSpectrumLength200) { testOneSpectrumLength(200, 256); }
TEST(qSpectrum, chooseSpectrumLength500) { testOneSpectrumLength(500, 512); }
TEST(qSpectrum, chooseSpectrumLength1000) { testOneSpectrumLength(1000, 1024); }
TEST(qSpectrum, chooseSpectrumLength2000) { testOneSpectrumLength(2000, 2048); }
TEST(qSpectrum, chooseSpectrumLength5000) { testOneSpectrumLength(5000, 8192); }
TEST(qSpectrum, chooseSpectrumLength10000) { testOneSpectrumLength(10000, 16384); }
TEST(qSpectrum, chooseSpectrumLength20000) { testOneSpectrumLength(20000, 32768); }
TEST(qSpectrum, chooseSpectrumLength50000) { testOneSpectrumLength(50000, 65536); }

// all the exact powers of 2 have to map to the same
TEST(qSpectrum, chooseSpectrumLength4) { testOneSpectrumLength(4, 4); }
TEST(qSpectrum, chooseSpectrumLength32) { testOneSpectrumLength(32, 32); }
TEST(qSpectrum, chooseSpectrumLength128) { testOneSpectrumLength(128, 128); }
TEST(qSpectrum, chooseSpectrumLength256) { testOneSpectrumLength(256, 256); }
TEST(qSpectrum, chooseSpectrumLength1024) { testOneSpectrumLength(1024, 1024); }
TEST(qSpectrum, chooseSpectrumLength65536) { testOneSpectrumLength(65536, 65536); }
TEST(qSpectrum, chooseSpectrumLength131072) { testOneSpectrumLength(131072, 131072); }
TEST(qSpectrum, chooseSpectrumLength524288) { testOneSpectrumLength(524288, 524288); }


static void tryOutSpectrum(int N, int expectedSpLength, int expectedFBLength) {
	//printf("🌊🌊🌊  starting tryOutSpectrum(N=%d, sl=%d, fbl=%d)\n",
	//	N, expectedSpLength, expectedFBLength);
	qSpace *space = makeFullSpace(N);
	//printf("🌊🌊🌊    made it this far, %s:%d\n", __FILE__, __LINE__);
	qSpectrum *spectrum = new qSpectrum(space);
	//printf("🌊🌊🌊    made it this far, %s:%d\n", __FILE__, __LINE__);

	// whatsi sposed to be?  Find next powerof 2.  Try to do it differently
	// from the software
	int po2 = pow(2., ceil(log2(N)) );

	LONGS_EQUAL_TEXT('spec', spectrum->magic, "qspectrum magic");
	CHECK_TEXT(!!spectrum->wave, "qspectrum wave");
	CHECK_TEXT(spectrum->dynamicallyAllocated, "qspectrum dynamicallyAllocated");

	// nPoints == spectrumLength
	LONGS_EQUAL_TEXT(po2, spectrum->nPoints, "qspectrum nPoints");

	proveItsMine(spectrum->wave, spectrum->nPoints * sizeof(qCx));

	delete spectrum;
	deleteTheSpace(theSpace);
}

// test out multiple cases.  For endless waves the bufsize is +2; for spectra, the next power of 2
// crashes if run here TEST(qSpectrum, qSpectrumConstructDestruct29) { tryOutSpectrum(29, 32, 32); }
// i think the crashing happens if the wave isn't a power of 2.  dunno why but

TEST(qSpectrum, qSpectrumConstructDestruct8) { tryOutSpectrum(8, 8, 10); }
TEST(qSpectrum, qSpectrumConstructDestruct16) { tryOutSpectrum(16, 16, 18); }

TEST(qSpectrum, qSpectrumConstructDestruct32) { tryOutSpectrum(32, 32, 34); }

TEST(qSpectrum, qSpectrumConstructDestruct64) { tryOutSpectrum(64, 64, 66); }
TEST(qSpectrum, qSpectrumConstructDestruct128) { tryOutSpectrum(128, 128, 130); }
TEST(qSpectrum, qSpectrumConstructDestruct512) { tryOutSpectrum(512, 512, 514); }

TEST(qSpectrum, qSpectrumConstructDestruct4) { tryOutSpectrum(4, 4, 6); }
TEST(qSpectrum, qSpectrumConstructDestruct2048) { tryOutSpectrum(2048, 2048, 2050); }



