/*
** fftMain - top level for FFT code for Squishy Electron
** Copyright (C) 2022-2024 Tactile Interactive, all rights reserved
*/

#include <string.h>
#include <stdexcept>

#include "../hilbert/qSpace.h"
#include "../greiman/qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "../debroglie/qWave.h"
#include "qSpectrum.h"
#include "fftMain.h"


static bool traceGenerate = false;


/* ****************************************************** small utilities */

// find next largest integer that we can fft these days
// these days it's a power of 2.  called by qSpace constructor.
// hmmm obsolete?!?!
void qDimension::chooseSpectrumLength(void) {
	int powerOf2;
	for (powerOf2 = 1; powerOf2 < nStates; powerOf2 += powerOf2)
		continue;
	spectrumLength = powerOf2;
}


/* ********************************************************* qWave interface */

// Calculate the FFT of this qWave and deposit it in the spectrum.
// must make/free your own qSpectrum *qspect = new qSpectrum(origSpace);
void qSpectrum::generateSpectrum(qWave *inputQWave) {
	int start = inputQWave->start;
	int N = inputQWave->end - start;
	if (traceGenerate) printf("🌈 about to generateSpectrum... start=%d  end-start=%d\n",
		start, N);

	cooleyTukeyFFT(wave, inputQWave->wave + start, N);
}

// do an inverse FFT to reconstruct the wave from generateSpectrum()
void qSpectrum::generateWave(qWave *outputQWave) {
	// dumpSpectrum("start of generateWave()", true);
	// outputQWave->dump("start of generateWave()");
	if (traceGenerate) printf("🌈 qSpectrum::generateWave  outputQWave=%p\n", outputQWave);
	int start = outputQWave->start;
	int N = outputQWave->end - start;
	if (traceGenerate) printf("🌈 about to generateWave: target wave=%p  start=%d  N=%d\n",
		outputQWave->wave, start, N);

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


