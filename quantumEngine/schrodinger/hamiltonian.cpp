/*
** Hamiltonian -- calculate the energy of the wave, H | 𝜓 >
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/


#include "../hilbert/qSpace.h"
#include "../greiman/qAvatar.h"
#include "./qGrinder.h"


/* ************************************************************ step functions
Each generation uses different functions to produce the next generation in a cycle.
There's 4 steps— steps —  of a cycle, and 6 buffers used, each holding alternately Real and Imag points.
buffers 0 and 1: real and imaginary, olds and hamiltonians from -2 and -1
buffers 2 and 3: real and imaginary, olds from -2 and -1, and hamiltonians from 0 and 1
buffers 4 and 5: averaged from 0&1, and 2&3

steps 0 and 1: calculate from -2 and -1 to store in 0 and 1
steps 2 and 3: calculate from -2 thru +1, to store in buffers 2 and 3,
step 4 then average 0&1 with 2&3 and put those in 4&5

Note that claiming borders in steps 2 & 3 claims in both 2&4 for real, 3&5 for imag
therefore there's 4 layers of edges but 6 real buffers (6 complex) in each cycle

maybe we allocate buffers in blocs of 6 * nPoints doubles, so they're easier to jump between
*/

// stuff missing: boundaries wraparound, incrementing elapsed time
// steps 2 and 3 should add the two - so no need for steps 4 and 5 and the associated thread stuff
// how to get at real/imag given a pointer to imag/real
// not N, but N + (0 or 2) call it Nb

struct {
	int N;
	buffer offset = how to get from one buffer to the next/previous
	int rowOffset = Im pointer - Re pointer for same point
	double dFactor = ℏ^2 / 2m_e, with a conversion factor because of the dx not really being 1
	double vFactor is multipled onto V 𝜓, I guess primarily 1 / ℏ
	//oh yeah, that ℏ on the d𝜓/dt has to be divided out of both factors
	//yeah, also dt, would be nice if that was handy

	//double *buf0;
	//double *buf1;
	//double *buf2;
	//double *buf3;
	//double *buf4;
	//double *buf5;
} handy;


// hamilt pointers are pointers in to the 𝜓 arrays being used for calculation of the hamiltonian
void stepOneReal(qCx *newWave, qCx *newWave, newWave *hamiltWave, int ix, double dt) {
	// sec deriv d^2 𝜓 / dx^2
	double d2𝜓 = hamiltWave[ix-1].im + hamiltWave[ix+1].im - hamiltWave[ix].im * 2;

	// total hamiltonian including voltage
	double H𝜓 = d2𝜓 + voltage[ix] * hamiltWave[ix].re;

	// new = old + 𝛥𝜓 dt   note subtraction
	newWave[ix].re = oldWave[ix].re - dt * H𝜓;

	qCheck(newW[ix], "vischer stepOneReal", ix);
}

void stepOneImag(qCx *newWave, qCx *newWave, newWave *hamiltWave, int ix, double dt) {
	// second deriv d2𝜓 / dx**2
	double d2𝜓 = hamiltWave[ix-1].re + hamiltWave[ix+1].re - hamiltWave[ix].re * 2;

	// total hamiltonian
	double H𝜓 = d2𝜓 + voltage[ix] * hamiltWave[ix].im;

	// note addition
	newWave[ix].im = oldWave[ix].im + dt * H𝜓;

	qCheck(newW[ix], "vischer stepImaginary", ix);
}

lastBuffer and penultimateBuffer

void step0(int ix) {
	stepOneReal(buf0, penultimateBuffer, penultimateBuffer, lastBuffer, ix, dt)  ???
}

void step1(int ix) {
	stepOneImag(buf1, lastBuffer, penultimateBuffer, lastBuffer, ix, dt)???

}

void step2(int ix) {
	stepOneReal(buf2, penultimateBuffer, buf0, buf1, ix, dt)???
	also, buf4 = (buf0 + buf2) / 2
}

void step3(int ix) {
	stepOneImag(buf3, lastBuffer, buf0, buf1, ix, dt)???
	also, buf5 = (buf1 + buf32) / 2
}

static void (*stepFunctions)[4];
stepFunctions[0] = step0;
stepFunctions[1] = step1;
stepFunctions[2] = step2;
stepFunctions[3] = step3;


//double *bufferSix = (double *) malloc(Nb * sizeof(double) * 6)
//buf0 = bufferSix;
//buf1 = bufferSix + Nb;
//buf2 = bufferSix + 2*Nb;
//buf3 = bufferSix + 3*Nb;
//buf4 = bufferSix + 4*Nb;
//buf5 = bufferSix + 5*Nb;


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
//						// qCx pot = wave[ix] * voltage[ix];
//						double pot = space->voltageBuffer[ix];
//						qCheck(pot, "hamiltonian pot", ix);
//						qCx rate = pot - d2;
//
//						return rate;
//					}

