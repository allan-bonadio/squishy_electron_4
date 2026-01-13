/*
** fftMain - top level for FFT code for Squishy Electron
** Copyright (C) 2022-2026 Tactile Interactive, all rights reserved
*/

#include <string.h>
#include <stdexcept>

#include "../hilbert/qSpace.h"
#include "../greiman/qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "../debroglie/qCavity.h"
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


/* ********************************************************* qCavity interface */

// Calculate the FFT of this qCavity and deposit it in the spectrum.
// must make/free your own qSpectrum *spect = new qSpectrum(origSpace);
void qSpectrum::generateSpectrum(qCavity *inputCavity) {
	int start = inputCavity->start;
	int N = inputCavity->end - start;
	if (traceGenerate) printf("🌈 about to generateSpectrum... start=%d  end-start=%d\n",
		start, N);

	cooleyTukeyFFT(wave, inputCavity->wave + start, N);
}

// do an inverse FFT to reconstruct the wave from generateSpectrum()
void qSpectrum::generateCavity(qCavity *outputCavity) {
	// dumpSpectrum("start of generateCavity()", true);
	// outputCavity->dump("start of generateCavity()");
	if (traceGenerate) printf("🌈 qSpectrum::generateCavity  outputCavity=%p\n", outputCavity);
	int start = outputCavity->start;
	int N = outputCavity->end - start;
	if (traceGenerate) printf("🌈 about to generateCavity: target wave=%p  start=%d  N=%d\n",
		outputCavity->wave, start, N);

	cooleyTukeyIFFT(outputCavity->wave + start, wave, N);

	outputCavity->fixBoundaries();

	if (traceGenerate) outputCavity->dump("🌈 generateCavity completed\n");
}


// take this wave in and FFT it and dump the result to console
void analyzeCavityFFT(qCavity *original, const char *title) {
	if (!original)
		throw std::runtime_error("null original in analyzeCavityFFT()");
	if (!original->space)
		throw std::runtime_error("null space in analyzeCavityFFT()");
	qSpectrum *spect = new qSpectrum(original->space, NULL);
	spect->generateSpectrum(original);

	char buf[200];
	strcpy(buf, "🌈  analyze spectrum: ");
	strcat(buf, title);
	spect->dumpSpectrum(buf);
	delete spect;
}


