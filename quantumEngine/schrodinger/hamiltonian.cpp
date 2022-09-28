/*
** Hamiltonian -- calculate the energy of the wave, H | 𝜓 >
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/


#include "../spaceWave/qSpace.h"
#include "./qAvatar.h"

// not used right now, hopefullly soon


// this is only for continuum dimension.  Ultimately, these should be per-dimension,
// and each dimension should have a function that does the honors.
// or, per-view or per-space.
// btw, this is really Hψ not just H.  Isn't H supposed to be real?
// real eigenvalues.
qCx hamiltonian(qCx *wave, int x) {
	// so at location x, if dx = 1,
	// the derivative would be (𝜓[x+1] - 𝜓[x])
	//                      or (𝜓[x] - 𝜓[x-1])
	// so second deriv would be 𝜓[x+1] + 𝜓[x-1] - 2* 𝜓[x]
	qCx d2 = wave[x-1] + wave[x+1] - wave[x] * 2;
	qCheck("hamiltonian d2", d2);

	//printf("c++ d2= %lf %lf\n", d2.re, d2.im);

	qCx pot = wave[x] * thePotential[x];
	qCheck("hamiltonian pot", pot);
	qCx rate = pot - d2;

	//printf("c++ hamiltonian= %lf %lf\n", rate.re, rate.im);

	return rate;
}

