/*
** cooley-tuckey fft algorithm -- spectral analysis for Squishy Electron
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

// buffer sizes ONLY POWERS OF 2
// adapted from
// https://tfetimes.com/c-fast-fourier-transform/

#include "../hilbert/qSpace.h"
#include "../greiman/qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "../debroglie/qWave.h"
#include "qSpectrum.h"
#include "fftMain.h"

// in case I ever need it const long double PI = 3.141592653589793238460;


// Cooley–Tukey FFT from src to dest
// src and dest can be different or the same.  N better be a power of 2.
void cooleyTukeyFFT(qCx *dest, qCx *src, int N)
{
	if (N <= 1) return;

	// make we can do this with first-stride-length objects
	// divide
	int N2 = N/2;
	qCx even[N2];
	qCx odd[N2];
	for (size_t k = 0; k < N; k++) {  // do this two rows at a time
		if (k & 1)
			odd[(k-1)/2] = src[k];
		else
			even[k/2] = src[k];
	}

	// conquer
	cooleyTukeyFFT(even, even, N2);
	cooleyTukeyFFT(odd, odd, N2);

	// combine
	for (size_t k = 0; k < N2; ++k)
	{
		double angle = -2 * PI * k / N;
		qCx t = qCx(cos(angle), sin(angle)) * odd[k];  // make a table to look these up
		dest[k    ] = even[k] + t;
		dest[k+N2] = even[k] - t;
	}
}


static bool traceIFFT = false;

// inverse fft, same rules as fft(),
// DON'T  trash the src coming in
void cooleyTukeyIFFT(qCx *dest, qCx *src, int N)
{
	qCx altSrc[N];

	// conjugate the qCx numbers
	if (traceIFFT) printf("input altSrc heading into cooleyTukeyFFT() \n");
	for (int i = 0; i < N; i++) {
		altSrc[i].re = src[i].re;
		altSrc[i].im = -src[i].im;
		if (traceIFFT) printf("altSrc[%3d] = %10.5lf %10.5lf\n", i, altSrc[i].re , altSrc[i].im);
	}

	// forward cooleyTukeyFFT
	cooleyTukeyFFT(dest, altSrc, N);

	// conjugate the qCx numbers again, and scale (fft+ifft multiplies by N)
	if (traceIFFT) printf("output dest fresh out of cooleyTukeyFFT() \n");
	for (int i = 0; i < N; i++) {
		if (traceIFFT) printf("dest bfore[%3d] = %10.5lf %10.5lf\n", i, dest[i].re , dest[i].im);
		dest[i].re = dest[i].re / N;
		dest[i].im = -dest[i].im / N;
		if (traceIFFT) printf("dest after[%3d] = %10.5lf %10.5lf\n", i, dest[i].re , dest[i].im);
	}
}



