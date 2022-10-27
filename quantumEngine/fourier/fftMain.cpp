/*
** fftMain - top level for FFT code for Squishy Electron
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

#include <string.h>
#include "../spaceWave/qSpace.h"
#include "../schrodinger/qAvatar.h"
#include "../debroglie/qWave.h"
#include "qSpectrum.h"
#include "fftMain.h"



/* ****************************************************** small utilities */

// find next largest integer that we can fft these days
// these days it's a power of 2.  called by qSpace constructor.
void qDimension::chooseSpectrumLength(void) {
	int powerOf2;
	for (powerOf2 = 1; powerOf2 < nStates; powerOf2 += powerOf2)
		continue;
	spectrumLength = powerOf2;
}


/* ********************************************************* qWave interface */

static bool traceGenerate = false;

// Calculate the FFT of this qWave and deposit it in the spectrum.
// must make/free your own qSpectrum *qspect = new qSpectrum(origSpace);
void qSpectrum::generateSpectrum(qWave *inputQWave) {
	int start = inputQWave->start;
	int N = inputQWave->end - start;
	if (traceGenerate) printf("🌈 about to generateSpectrum... start=%d  end-start=%d\n",
		start, N);

	cooleyTukeyFFT(wave, inputQWave->wave + start, N);

	//printf("    generateSpectrum completed\n");
}

// do an inverse FFT to reconstruct the wave from generateSpectrum()
void qSpectrum::generateWave(qWave *outputQWave) {
	int start = outputQWave->start;
	int N = outputQWave->end - start;
	if (traceGenerate) printf("🌈 about to generateWavestart=%d  e-s=%d\n", start, N);

	cooleyTukeyIFFT(outputQWave->wave + start, wave, N);
	outputQWave->fixBoundaries();

	if (traceGenerate) outputQWave->dump("🌈 generateWave completed\n");
}


// take this wave in and FFT it and dump the result to console
void analyzeWaveFFT(qWave *original, const char *title) {
	if (!original)
		throw std::runtime_error("null original in analyzeWaveFFT()");
	if (!original->space)
		throw std::runtime_error("null space in analyzeWaveFFT()");
	qSpectrum *qspect = new qSpectrum(original->space, NULL);
	qspect->generateSpectrum(original);

	char buf[150];
	strcpy(buf, "🌈  analyze spectrum: ");
	strcat(buf, title);
	qspect->dumpSpectrum(buf);
	delete qspect;
}


