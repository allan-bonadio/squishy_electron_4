/*
** fft spec - testing FFT code for Squishy Electron
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

//#include <string>
//#include "../spaceWave/qCx.h"

#include <cmath>
//#include <cstdlib>
#include "../spaceWave/qSpace.h"
#include "../schrodinger/Avatar.h"
#include "../spaceWave/qWave.h"
#include "qSpectrum.h"
#include "../testing/cppuMain.h"

#include "CppUTest/TestHarness.h"

bool traceDumpWaves = true;
bool tracing = false;

TEST_GROUP(FFT)
{
};


/* **************************************************** fft of various pure e^ix waves */

static void tryOutFFT(int N, double freq) {
	if (tracing) printf("\n🌈 🌈 starting tryOutFFT(%d, %1.2lf) line%d\n", N, freq, __LINE__);

	// this also tests contDISCRETE a little
	qSpace *space = makeBareSpace(N, contDISCRETE);
	//printf("     tryOutFFT:%d freeBufferList: %p\n", __LINE__, space->freeBufferList);

	qWave *original = new qWave(space);
	original->setCircularWave(freq);
	if (traceDumpWaves) original->dump("    tryOutFFT:  orignal wave set", true);

	qSpectrum *spect = new qSpectrum(space);
	spect->generateSpectrum(original);
	if (traceDumpWaves) spect->dumpSpectrum("    tryOutFFT: generated spectrum");

	// now there should be 1 number that's nonzero; we should be able to predict what and where
	// should be real and should be at position freq from whichever end
	double expected = sqrt(N);
	int pos;
	if (freq < 0.)
		pos = round(N + freq);
	else
		pos = round(freq);
	if (tracing) printf("     tryOutFFT: ... pos=%d  expected=%lf\n", pos, expected);

	// now verify that
	qCx *sw = spect->wave;
	for (int ix = 0; ix < N; ix++) {
		char reBuf[100], imBuf[100];
		qCx s = sw[ix];
		snprintf(reBuf, 100, "Real[%d] failed, %lf, %lf", ix, s.re, s.im);
		snprintf(imBuf, 100, "Im[%d] failed, %lf, %lf", ix, s.re, s.im);
		if (ix == pos) {
			DOUBLES_EQUAL_TEXT(expected, s.re, 1e-10, reBuf);
		}
		else {
			DOUBLES_EQUAL_TEXT(0, s.re, 1e-10, reBuf);
		}
		DOUBLES_EQUAL_TEXT(0, s.im, 1e-10, imBuf);
	}

	delete original;
	delete spect;
	delete space;
	if (tracing) printf("     finished tryOutFFT\n");
}

TEST(FFT, SpectrumFFT8_1) { tryOutFFT(8, 1.); }
TEST(FFT, SpectrumFFT8_2) { tryOutFFT(8, 2.); }
TEST(FFT, SpectrumFFT8_3) { tryOutFFT(8, 3.); }
TEST(FFT, SpectrumFFT8__1) { tryOutFFT(8, -1.); }
TEST(FFT, SpectrumFFT8__4) { tryOutFFT(8, -4.); }
TEST(FFT, SpectrumFFT8_0) { tryOutFFT(8, 0.); }

TEST(FFT, SpectrumFFT32_1) { tryOutFFT(32, 1); }
TEST(FFT, SpectrumFFT32__8) { tryOutFFT(32, -8); }

TEST(FFT, SpectrumFFT64_2) { tryOutFFT(64., 2); }
//TEST(FFT, SpectrumFFT1024) { tryOutFFT(1024); }

/* ********************************************************************** Square Wave */

static void trySquareWaveFFT(int N) {
	if (tracing) printf("\n🌈 🌈 starting trySquareWaveFFT(%d)\n", N);

	// this also tests contDISCRETE a little
	qSpace *space = makeBareSpace(N, contDISCRETE);
	//printf("     tryOutFFT:%d freeBufferList: %p\n", __LINE__, space->freeBufferList);

	qWave *original = new qWave(space);

	// now fill it with a square wave
	qCx *o = original->wave;
	for (int ix = 0; ix < N/2; ix++)
		o[ix] = qCx(1);
	for (int ix = N/2; ix < N; ix++)
		o[ix] = qCx(-1);

	// make a spectrum and FFT it
	qSpectrum *spect = new qSpectrum(space);
	spect->generateSpectrum(original);
	if (traceDumpWaves) spect->dumpSpectrum("    trySquareWaveFFT: generated spectrum");

	// resulting spectrum looks like this: alternating 2s (-1...1) and zeroes for the real
	// imaginary has different values that are mirrored in negative in the complementary point
	//	[0] (  0.0000,  0.0000)
	//	[1] (  2.0000,-20.3063)
	//	[2] (  0.0000,  0.0000)
	//	[3] (  2.0000, -6.5931) ...

	// two rows at a time:
	qCx *sw = spect->wave;
	for (int ix = 0; ix < N; ix += 2) {
		char reBuf[100], imBuf[100];
		qCx pt = sw[ix];
		CHECK_EQUAL_TEXT(qCx(), sw[ix], "point wasn't zero");

		// the zero-th complementary point is at N, off the end of the buffer.  avoid.
		pt = sw[ix+1];
		qCx cpt = sw[N - (ix+1)];
		snprintf(reBuf, 100, "trySquareWaveFFT: Real[%d] failed, %lf, should be 2", ix+1, pt.re);
		snprintf(imBuf, 100, "trySquareWaveFFT: Im[%d] failed, %lf %+lf ≠ 0", ix+1, cpt.im, pt.im);

		DOUBLES_EQUAL_TEXT(2., pt.re, 1e-10, reBuf);
		DOUBLES_EQUAL_TEXT(-cpt.im, pt.im, 1e-10, imBuf);
	}

	delete original;
	delete spect;
	delete space;
	if (tracing) printf("      finished trySquareWaveFFT\n");
}


TEST(FFT, SquareWaveFFT4) {trySquareWaveFFT(4);}
TEST(FFT, SquareWaveFFT8) {trySquareWaveFFT(8);}
TEST(FFT, SquareWaveFFT16) {trySquareWaveFFT(16);}
TEST(FFT, SquareWaveFFT32) {trySquareWaveFFT(32);}



/* ********************************************************************* invrse FFT */


// take a 'random' wave, then FFT and IFFT it, and make sure they equal.
// seed = 0...1   The wave is a random walk rather than purely random.
static void tryInverseFFT(int N, double seed) {
	if (tracing) printf("\n🌈 🌈 starting tryInverseFFT(%d, %lf)\n", N, seed);
	rando = seed;

	qSpace *space = makeBareSpace(N, contDISCRETE);

	qWave *original = new qWave(space);

	// now fill it using a repeatable 'random' sequence
	qCx *o = original->wave;
	qCx here = qCx(nextRando(), nextRando());
	for (int ix = 0; ix < N; ix++) {
		o[ix] = here;
		here += qCx(nextRando(), nextRando());
	}
	if (traceDumpWaves) original->dump("    tryInverseFFT:  orignal wave set", true);

	// make a spectrum and FFT it
	qSpectrum *spect = new qSpectrum(space);
	spect->generateSpectrum(original);
	if (traceDumpWaves) spect->dumpSpectrum("    tryInverseFFT: generated spectrum");

	// now convert it back
	qWave *result = new qWave(space);
	spect->generateWave(result);

	// make sure it's the same
	qCx *r = result->wave;
	for (int ix = 0; ix < N; ix++) {
		char mBuf[200];
		snprintf(mBuf, 200, "tryInverseFFT: point %d was different: %lf, %lf ≠ %lf, %lf",
			ix, o[ix].re, o[ix].im, r[ix].re, r[ix].im);

		CHECK_EQUAL_TEXT(o[ix], r[ix], mBuf);
	}

	delete result;
	delete original;
	delete spect;
	delete space;
	if (tracing) printf("     finished tryInverseFFT\n");
}

// a variety of situations
TEST(FFT, InverseFFT8_234) {tryInverseFFT(8, .234);}
TEST(FFT, InverseFFT16_771) {tryInverseFFT(16, .771);}
TEST(FFT, InverseFFT32_909) {tryInverseFFT(32, .909);}
TEST(FFT, InverseFFT64_699) {tryInverseFFT(64, .699);}
TEST(FFT, InverseFFT256_006) {tryInverseFFT(256, .006);}
TEST(FFT, InverseFFT2048_500) {tryInverseFFT(2048, .500);}



