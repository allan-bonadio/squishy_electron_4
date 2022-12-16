/*
** quantum Spectrum -- quantum Spectrum buffer, for FFTs
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/


//#include <cmath>
#include "../spaceWave/qSpace.h"
#include "../schrodinger/qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "qSpectrum.h"

/* ************************************************************ birth & death & basics */

// This produces a spectrum ready to hold an FFT transformed wave
qSpectrum::qSpectrum(qSpace *sp, qCx *useThisBuffer)
	: qBuffer() {

	space = sp;
	magic = 'spec';
	continuum = contDISCRETE;  // always zero for spectrum
	start = 0;
	end = nPoints = sp->spectrumLength;

	if (! space)
		throw std::runtime_error("qSpectrum::qSpectrum null space");

	//printf("🌈 🌈 qSpectrum::qSpectrum(%s)  utb=%p => this %p\n", space->label,
	//	useThisBuffer, this);
	initBuffer(space->spectrumLength, useThisBuffer);
}

qSpectrum::~qSpectrum(void) {
}


/* ******************************************************** diagnostic dump **/
// only a wave knows how to traverse its states

// this is spectrum-independent.  This prints N+1 lines.
void qSpectrum::dumpThatSpectrum(qCx *wave, bool withExtras) {
	int N = nPoints;
	int halfN = N/2;
	if (N <= 0) throw std::runtime_error("qSpace::dumpThatSpectrum() with zero points");

	// zeroth entry is freq 0, same both sides
	double norm = wave[0].norm() / N;
	double totalNorm = norm;
	printf("[%3d] (%8.4lf,%8.4lf)     %8.4lf m𝜓/nm\n",
		0, wave[0].re, wave[0].im, norm * 1000);

	// in-between rows shows ix frequency, complementary both sides, except:
	for (int ix = 1; ix < halfN; ix++) {
		int cix = (N - ix);
		norm = (wave[ix].norm() + wave[cix].norm()) / N;
		totalNorm += norm;
		printf("[%3d] (%8.4lf,%8.4lf)  (%8.4lf,%8.4lf)    %12.8lf m𝜓/nm\n",
			ix, wave[ix].re, wave[ix].im, wave[cix].re, wave[cix].im, norm * 1000);
	}

	// N/2-th entry is nyquist freq, same both sides
	norm = wave[halfN].norm() / N;
	totalNorm += norm;
	printf("[%3d]                      (%8.4lf,%8.4lf)     %8.4lf m𝜓/nm  total: %8.4lf 𝜓\n",
		halfN, wave[halfN].re, wave[halfN].im, norm * 1000, totalNorm);
}

// this is the member function that dumps its own Spectrum and space
void qSpectrum::dumpSpectrum(const char *title, bool withExtras) {
	printf("🌈 🌈 ==== Spectrum | %s\n", title);
	dumpThatSpectrum(wave, withExtras);
	printf("🌈 🌈 ==== end of Spectrum ====\n");
}



