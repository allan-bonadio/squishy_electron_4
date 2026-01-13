/*
** quantum spectrum testing
** Copyright (C) 2022-2026 Tactile Interactive, all rights reserved
*/

#include "qSpectrum.h"
#include "../hilbert/qSpace.h"
#include "../greiman/qAvatar.h"
#include "../schrodinger/qGrinder.h"

#include "../testing/testingHelpers.h"
#include "../testing/cppuMain.h"

#include "CppUTest/TestHarness.h"

TEST_GROUP(qSpectrum)
{
};


static void tryOutSpectrum(int N, int expectedFBLength) {
	qSpace *space = makeFullSpace(N);
	qSpectrum *spectrum = new qSpectrum(space);

	LONGS_EQUAL_TEXT('Spec', spectrum->magic, "qspectrum magic");
	CHECK_TEXT(!!spectrum->wave, "qspectrum wave");
	CHECK_TEXT(spectrum->dynamicallyAllocated, "qspectrum dynamicallyAllocated");

	// nPoints == spectrumLength
	LONGS_EQUAL_TEXT(N, spectrum->nPoints, "qspectrum nPoints");
	LONGS_EQUAL_TEXT(N, spectrum->end - spectrum->start, "qspectrum end-start");

	proveItsMine(spectrum->wave, spectrum->nPoints * sizeof(qCx));

	delete spectrum;
	deleteFullSpace(space);
}

// test out multiple cases.  For endless waves the bufsize is +2; for spectra, the next power of 2
// crashes if run here TEST(qSpectrum, qSpectrumConstructDestruct29) { tryOutSpectrum(29, 32, 32); }
// i think the crashing happens if the wave isn't a power of 2.  dunno why but

TEST(qSpectrum, qSpectrumConstructDestruct2048) { tryOutSpectrum(2048, 2050); }
TEST(qSpectrum, qSpectrumConstructDestruct512) { tryOutSpectrum(512, 514); }
TEST(qSpectrum, qSpectrumConstructDestruct128) { tryOutSpectrum(128, 130); }
TEST(qSpectrum, qSpectrumConstructDestruct64) { tryOutSpectrum(64, 66); }

TEST(qSpectrum, qSpectrumConstructDestruct32) { tryOutSpectrum(32, 34); }


TEST(qSpectrum, qSpectrumConstructDestruct16) { tryOutSpectrum(16, 18); }
TEST(qSpectrum, qSpectrumConstructDestruct8) { tryOutSpectrum(8, 10); }
TEST(qSpectrum, qSpectrumConstructDestruct4) { tryOutSpectrum(4, 6); }



