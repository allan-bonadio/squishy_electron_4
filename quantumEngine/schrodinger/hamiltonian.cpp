/*
** Hamiltonian -- calculate the energy of the wave, H | 𝜓 >
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/


#include "../spaceWave/qSpace.h"
#include "../greiman/qAvatar.h"
#include "./qGrinder.h"

// not used right now, hopefullly soon


// this is only for continuum dimension.  Ultimately, these should be per-dimension,
// and each dimension should have a function that does the honors.
// or, per-view or per-space.
// btw, this is really Hψ not just H.  Isn't H supposed to be real?  real eigenvalues
// real eigenvalues.
//					qCx hamiltonian(qSpace *space, qCx *wave, int ix) {
//						// so at location ix, if dx = 1,
//						// the derivative would be (𝜓[ix+1] - 𝜓[ix])
//						//                      or (𝜓[ix] - 𝜓[ix-1])
//						// so second deriv would be 𝜓[ix+1] + 𝜓[ix-1] - 2* 𝜓[ix]
//						qCx d2 = wave[ix-1] + wave[ix+1] - wave[ix] * 2;
//						qCheck(d2, "hamiltonian d2", ix);
//
//						// theVoltage no longer e3xists qCx pot = wave[ix] * theVoltage[ix];
//						double pot = space->voltageBuffer[ix];
//						qCheck(pot, "hamiltonian pot", ix);
//						qCx rate = pot - d2;
//
//						return rate;
//					}

