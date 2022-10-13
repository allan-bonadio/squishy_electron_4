/*
** visscher -- schrodinger ODE integration by staggering re and im
**			by half dt, Visscher second order accuracy
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

#include "../spaceWave/qSpace.h"
#include "qAvatar.h"
#include "../spaceWave/qWave.h"


static bool traceOneStep = false;
static bool traceRealStep = false;  // in detail
static bool debugHalfway = false;  // confusing, not reccommended
static bool traceVischerBench = false;

/*
A fast explicit algorithm for the time-dependent Schrodinger equation
P. B. Visscher (emeritus)
Department of Physics and Astronomy, University of Alabama, Tuscaloosa, Alabama 35487-0324

reinterpreted from the article
" A fast explicit algorithm for the time-dependent Schrodinger Equation"
Computers in Physics 5, 596 (1991); doi: 10.1063/1.168415

The present algorithm is motivated by writing the Schrodinger equation in terms
of the real and imaginary parts R and I of the wave function.

We will define
		• R = 𝜓.re at times O,dt,2dt,..., and
		• I = 𝜓.im at times .5dt, 1.5dt, ...
so that in our buffers of complex numbers, the Im part is dt/2 ahead of the Re part:

              real components    imag components
initial wave:   𝜓r(t)              𝜓i(t + dt/2)
1st iter wave:  𝜓r(t + dt)         𝜓i(t + 3dt/2)

The natural discretization of Eqs. 6 (visscher paper) is therefore
	𝜓r(t + dt) = 𝜓r(t) + dt H 𝜓i(t + dt/2)

Half a tick later, at a half odd integer multiple of dt,
	𝜓i(t + dt/2) = 𝜓i(t - dt/2) - dt H 𝜓r(t)
or
	𝜓i(t + 3dt/2) = 𝜓i(t + dt/2) - dt H 𝜓r(t + dt)

where H is hamiltonian, typically ( potential + ∂2/∂x2 )
We do the hamiltonian custom here instead of using the function in hamiltonian.cpp
and sometimes omit the potential
 */

/*
this is our second derivative wrt x:
	qCxd2 = wave[x-1] + wave[x+1] - wave[x] * 2;
because dx  is always chosen to be 1.

real units:
ℏ = 1.054571817e-34 kg m^2 / s = 1 cuz of the lhs of schrodinger's we use
m_e = 9.1093837015e-31 kg
ℏ / 2m_e = 5.78838180e-5  m^2/s = 1 cuz of the rhs of schrodinger's we use
therefore, 1s = 5.7...e-5 m^2   ???
and 1ps = 1e-12s = 5.78838180e-17 m^2 - yeah i think so.
or 1ns corresponds to 5.78838180e-14 m^2
or  2.4059056091210226e-7 m or about 241 µm ??

no do it this way
ℏ^2 / 2m_e = 6.10426431e-39  kg m^4 / s^2  = 1 cuz of the rhs of schrodinger's we use

wait try this, ℏ = 1, right, so 1 / 2m_e = 1  and m_e = 1/2 = 9.1093837015e-31 kg
and 1 kg = 5.4888455287888166e+29

... ok i'm confused again... the whole eq is units of energy, kg m^2 / s^2
Definitely, dx is always 1 in our units.

so schrodinger's eq, just units, is kindof like d/dt = d^2/dx^2 or dt = dx^2
every step, dx=1 is used to calculate a rate of change over dt.

therefore, 1s = 5.78838180e-5 m^2   ???
and 1ps = 1e-12s = 5.78838180e-17 m^2 - yeah i think so.
or 1ns corresponds to 5.78838180e-14 m^2
or  2.4059056091210226e-7 m or about 241 µm ??

other way: 1nm = 1e-9m   square = 1e-18 m^2 times that number = 1.7275985492180218e-14 seconds.  thisi isn't right.
*/


// first step: advance the 𝜓r a dt, from t to t + dt
// oldW points to buffer with real = 𝜓r(t)    imag = 𝜓i(t + dt/2)
// newW points to buffer with real = 𝜓r(t + dt)   imag unchanged = 𝜓i(t + dt/2)
// here we will calculate the 𝜓r(t + dt) values in a new buffer only, and fill them in.
// the 𝜓i values in buffer 0 are still uncalculated
void qAvatar::stepReal(qCx *newW, qCx *oldW, double dt) {
	qDimension *dims = space->dimensions;
	if (traceRealStep) printf("⚛️ start of stepReal nStates=%d, nPoints=%d, start=%d, end=%d\n",
			space->nStates, space->nPoints, dims->start, dims->end);
	//dumpThat(oldW, true);

	for (int ix = dims->start; ix < dims->end; ix++) {
		// second deriv wrt x of psi
		double d2𝜓i = oldW[ix-1].im + oldW[ix+1].im - oldW[ix].im * 2;
		if (traceRealStep) printf("⚛️ stepReal ix=%d\n", ix);

		// total hamiltonian including potential
		double H𝜓 = d2𝜓i + potential[ix] * potentialFactor * oldW[ix].re;
		//double H𝜓 = d2𝜓i;   // without potential

		// note subtraction
		if (traceRealStep) printf("⚛️ stepReal ix=%d\n", ix);
		newW[ix].re = oldW[ix].re - dt * H𝜓;
		if (traceRealStep) printf("⚛️ stepReal ix=%d\n", ix);
		qCheck("vischer stepReal", newW[ix]);
	}
	if (traceVischerBench) printf("      stepReal, on to fix boundaries: time=%lf\n",
		getTimeDouble());
	mainQWave->fixThoseBoundaries(newW);
	if (traceRealStep) printf("⚛️ end of stepReal:");
}

// second step: advance the Imaginaries of 𝜓 a dt, from dt/2 to 3dt/2
// given the reals we just generated in stepReal() but don't change them
void qAvatar::stepImaginary(qCx *newW, qCx *oldW, double dt) {
	qDimension *dims = space->dimensions;
	//printf("⚛︎ start of stepImaginary(), oldWave=");
	//dumpThat(oldW, true);

	for (int ix = dims->start; ix < dims->end; ix++) {
		// second deriv d2𝜓r / dx**2
		double d2𝜓r = oldW[ix-1].re + oldW[ix+1].re - oldW[ix].re * 2;

		// total hamiltonian
		double H𝜓 = d2𝜓r + potential[ix] * potentialFactor * oldW[ix].im;
		//double H𝜓 = d2𝜓r;  // without potential

		// note addition
		newW[ix].im = oldW[ix].im + dt * H𝜓;

		qCheck("vischer stepImaginary", newW[ix]);
	}
	if (traceVischerBench) printf("      stepImaginary, on to fix boundaries: time=%lf\n",
		getTimeDouble());

	mainQWave->fixThoseBoundaries(newW);
	//printf("⚛️ end of stepImaginary - result wave:");
}

// form the new wave from the old wave, in separate buffers, chosen by our caller.
void qAvatar::oneVisscherStep(qWave *newQWave, qWave *oldQWave) {
	qWave *oldQW = oldQWave;
	qCx *oldW = oldQWave->wave;
	qWave *newQW = newQWave;
	qCx *newW = newQWave->wave;

	if (traceVischerBench) printf("❇️ oneVisscherStep, new=%p, old=%p, start: time=%lf\n",
		newQWave, oldQWave, getTimeDouble());
	if (traceVischerBench) printf("                   consecutive: time=%lf\n", getTimeDouble());

	qDimension *dims = space->dimensions;
	oldQW->fixBoundaries();
	if (traceOneStep) oldQW->dump("starting oneVisscherStep: old wave", true);

	if (traceVischerBench) printf("         oneVisscherStep, about to stepReal: time=%lf\n",
		getTimeDouble());
	stepReal(newW, oldW, dt);
	if (debugHalfway) newQWave->dump("Visscher wave after the Re step", true);
	// now at an half-odd fraction of dt

	if (traceVischerBench) printf("         oneVisscherStep, about to stepImaginary: time=%lf\n",
		getTimeDouble());
	stepImaginary(newW, oldW, dt);
	// now at an integer fraction of dt

	// ok so after this, the time has advanced dt, and real is at elapsedTime and
	// imaginary is at elapsedTime + dt/2.  Yes the re and the im are not synchronized.
	// it was Visscher's idea.  I think he got it from ballistics calculations.
	elapsedTime += dt;

	if (traceOneStep) {
		char msg[100];
		snprintf(msg, 100, "at end of Visscher:new, frame %1.0lf | ", iterateSerial);
		newQW->dump(msg, true);
	}
	if (traceVischerBench) printf("         oneVisscherStep, done: time=%lf\n", getTimeDouble());
}

