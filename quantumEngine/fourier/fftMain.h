/*
** fftMain - includes for FFT code for Squishy Electron
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/


//extern "C" {
//
//	void testFFT(void);
//
//	// UI requests FFT immediate, or at end of next iteration
//	void askForFFT(void);
//}

//extern void askForFFT(void);

extern void cooleyTukeyFFT(qCx *dest, qCx *src, int N);
extern void cooleyTukeyIFFT(qCx *dest, qCx *src, int N);

extern void paChineseFFT(qCx *dest, qCx *src, int N);
extern void paChineseIFFT(qCx *dest, qCx *src, int N);

// nice console dump of wave and FFT centered at zero.  For iteration.
extern void analyzeWaveFFT(qWave *qw, const char *title = "untitled");

// rounds up to the nearest power of two or whatever
extern int chooseSpectrumLength(qSpace *);

