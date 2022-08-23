/*
** Spectrum -- a qBuffer that represents the DFT of a wave
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

#include "../spaceWave/qBuffer.h"

struct qSpectrum : public virtual  qBuffer {

	// create a qWave, dynamically allocated or hand in a buffer to use
	qSpectrum(qSpace *space, qCx *useThisBuffer = NULL);

	~qSpectrum();

	void dumpThatSpectrum(qCx *wave, bool withExtras = false);
	void dumpSpectrum(const char *title, bool withExtras = false);
	void dump(const char *title = "a spectrum", bool withExtras = false)
		{this->dumpSpectrum(title, withExtras);};

	// do fft
	void generateSpectrum(qWave *inputQWave);

	// do inverse fft
	void generateWave(qWave *outputWave);
};



