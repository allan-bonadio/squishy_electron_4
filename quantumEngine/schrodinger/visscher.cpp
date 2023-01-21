/*
** visscher -- schrodinger ODE integration by staggering re and im
**			by half dt, Visscher second order accuracy
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

#include "../spaceWave/qSpace.h"
#include "../greiman/qAvatar.h"
#include "qGrinder.h"
#include "../debroglie/qFlick.h"


static bool traceRealStep = false;  // in detail
static bool traceImaginaryStep = false;  // in detail
static bool traceVischerBench = false;

/*
reinterpreted from the article
A fast explicit algorithm for the time-dependent Schrodinger equation
P. B. Visscher (emeritus)
Department of Physics and Astronomy, University of Alabama, Tuscaloosa, Alabama 35487-0324

The present algorithm is motivated by writing the Schrodinger equation in terms
of the real and imaginary parts R and I of the wave function.

We will define
		• R = 𝜓.re at times O,dt,2dt,..., and
		• I = 𝜓.im at times .5dt, 1.5dt, ...
so that in our buffers of complex numbers, the Im part is dt/2 ahead of the Re part:

              real components    imag components
initial wave:   𝜓.re(t)              𝜓.im(t + dt/2)
1st iter wave:  𝜓.re(t + dt)         𝜓.im(t + 3dt/2)

The natural discretization of Eqs. 6 (visscher paper) is therefore
	𝜓.re(t + dt) = 𝜓.re(t) + dt H 𝜓.im(t + dt/2)

Half a tick later, at a half odd integer multiple of dt,
	𝜓.im(t + dt/2) = 𝜓.im(t - dt/2) - dt H 𝜓.re(t)
or
	𝜓.im(t + 3dt/2) = 𝜓.im(t + dt/2) - dt H 𝜓.re(t + dt)

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



// ******************************************************** Grinder methods

// first step: advance the 𝜓.re a dt, from t to t + dt
// oldW points to buffer with real = 𝜓.re(t)    imag = 𝜓.im(t + dt/2)
// newW points to buffer with real = 𝜓.re(t + dt)   imag unchanged = 𝜓.im(t + dt/2)
// here we will calculate the 𝜓.re(t + dt) values in a new buffer only, and fill them in.
// the 𝜓.im values in buffer oldW are still uncalculated
void qGrinder::stepReal(qCx *newW, qCx *oldW, double dt_) {
	qDimension *dims = space->dimensions;
	if (traceRealStep) printf("⚛️ start of stepReal nStates=%d, nPoints=%d, start=%d, end=%d\n",
			space->nStates, space->nPoints, dims->start, dims->end);

	for (int ix = dims->start; ix < dims->end; ix++) {
		// second deriv wrt x of psi
		double d2𝜓i = oldW[ix-1].im + oldW[ix+1].im - oldW[ix].im * 2;
		if (traceRealStep) printf("⚛️ stepReal ix=%d\n", ix);

		// total hamiltonian including voltage
		double H𝜓 = d2𝜓i + voltage[ix] * voltageFactor * oldW[ix].re;

		// note subtraction
		if (traceRealStep) printf("⚛️ stepReal ix=%d\n", ix);
		newW[ix].re = oldW[ix].re - dt_ * H𝜓;
		if (traceRealStep) printf("⚛️ stepReal ix=%d\n", ix);

		qCheck(newW[ix], "vischer stepReal", ix);
	}
	qflick->fixThoseBoundaries(newW);
	elapsedTime += dt_/2;  // could be 0 or already dt_/2

	if (traceVischerBench) printf("      stepReal, done: time=%lf\n",
		getTimeDouble());
	if (traceRealStep) printf("⚛️ end of stepReal:");
}

// second step: advance the Imaginaries of 𝜓 a dt, from dt/2 to 3 dt/2
// given the reals we just generated in stepReal(), but don't change them
void qGrinder::stepImaginary(qCx *newW, qCx *oldW, double dt_) {
	qDimension *dims = space->dimensions;
	if (traceImaginaryStep) printf("⚛️ start of stepImaginary nStates=%d, nPoints=%d, start=%d, end=%d\n",
			space->nStates, space->nPoints, dims->start, dims->end);

	for (int ix = dims->start; ix < dims->end; ix++) {
		// second deriv d2𝜓.re / dx**2
		double d2𝜓r = oldW[ix-1].re + oldW[ix+1].re - oldW[ix].re * 2;
		if (traceImaginaryStep) printf("⚛️ stepImaginary ix=%d\n", ix);

		// total hamiltonian
		double H𝜓 = d2𝜓r + voltage[ix] * voltageFactor * oldW[ix].im;

		// note addition
		if (traceImaginaryStep) printf("⚛️ stepImaginary ix=%d\n", ix);
		newW[ix].im = oldW[ix].im + dt_ * H𝜓;
		if (traceImaginaryStep) printf("⚛️ stepImaginary ix=%d\n", ix);

		qCheck(newW[ix], "vischer stepImaginary", ix);
	}

	qflick->fixThoseBoundaries(newW);
	elapsedTime += dt_/2;  // could be 0 or already dt_/2

	if (traceVischerBench) printf("      stepImaginary done: time=%lf\n",
		getTimeDouble());
	if (traceImaginaryStep) printf("⚛️ end of stepImaginary:");
}

