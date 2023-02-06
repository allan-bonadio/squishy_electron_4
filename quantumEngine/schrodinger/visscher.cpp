/*
** visscher -- schrodinger ODE integration by staggering re and im
**			by half dt, Visscher second order accuracy
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

#include "../hilbert/qSpace.h"
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
We do the hamiltonian custom here and sometimes omit the potential
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

See definitionOfUnits in docGen/docSrc for latest believable work.
Here, we use dx=1 for ease of calculation, and fold the conversion factors into other nubmers.

*/



// ******************************************************** Grinder methods

// first step: advance the 𝜓.re a dt, from t to t + dt
// oldW points to buffer with real = 𝜓.re(t)    imag = 𝜓.im(t + dt/2)
// newW points to buffer with real = 𝜓.re(t + dt)   imag unchanged = 𝜓.im(t + dt/2)
// hamiltW is what we calculate the derivitives from
// here we will calculate the 𝜓.re(t + dt) values in a new buffer only, and fill them in.
// the 𝜓.im values in buffer oldW are still uncalculated
void qGrinder::stepReal(qCx *newW, qCx *oldW, qCx *hamiltW, double dt_) {
	qDimension *dims = space->dimensions;
	if (traceRealStep) printf("⚛️ start of stepReal nStates=%d, nPoints=%d, start=%d, end=%d\n",
			space->nStates, space->nPoints, dims->start, dims->end);

	for (int ix = dims->start; ix < dims->end; ix++) {
		// second deriv wrt x of psi
		double d2𝜓i = hamiltW[ix-1].im + hamiltW[ix+1].im - hamiltW[ix].im * 2;
		if (traceRealStep) printf("⚛️ stepReal ix=%d\n", ix);

		// total hamiltonian including voltage
		double H𝜓 = d2𝜓i + voltage[ix] * voltageFactor * hamiltW[ix].re;

		// new = old + 𝛥 dt   note subtraction
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
void qGrinder::stepImaginary(qCx *newW, qCx *oldW, qCx *hamiltW, double dt_) {
	qDimension *dims = space->dimensions;
	if (traceImaginaryStep) printf("⚛️ start of stepImaginary nStates=%d, nPoints=%d, start=%d, end=%d\n",
			space->nStates, space->nPoints, dims->start, dims->end);

	for (int ix = dims->start; ix < dims->end; ix++) {
		// second deriv d2𝜓.re / dx**2
		double d2𝜓r = hamiltW[ix-1].re + hamiltW[ix+1].re - hamiltW[ix].re * 2;
		if (traceImaginaryStep) printf("⚛️ stepImaginary ix=%d\n", ix);

		// total hamiltonian
		double H𝜓 = d2𝜓r + voltage[ix] * voltageFactor * hamiltW[ix].im;

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

// this is what will be replaced to make Midpoint.  except midpoint also uses this.
// Cuz, you can't really do two Real steps in a row; must do an Imag step in between.  And vice versa.
void qGrinder::stepRealImaginary(qCx *newW, qCx *oldW, qCx *hamiltW, double dt) {
	qflick->fixThoseBoundaries(oldW);
	if (oldW != hamiltW)
		qflick->fixThoseBoundaries(hamiltW);

	stepReal(newW, oldW, hamiltW, dt);
	stepImaginary(newW, oldW, hamiltW, dt);
}

/* ********************************************************** midpoint method */

// this will go forward calculating dPsi based on derivatives at the front AND back of dx
void qGrinder::stepMidpoint(qCx *newW, qCx *oldW, qCx *scratch, double dt) {
	// first calculate the normal step taking derivatives at the beginning of dt
	qflick->fixThoseBoundaries(oldW);
	stepReal(scratch, oldW, oldW, dt);
	stepImaginary(scratch, oldW, oldW, dt);

	// now do it again with the derivatives at the end
	qflick->fixThoseBoundaries(scratch);
	stepReal(newW, oldW, scratch, dt);
	stepImaginary(newW, oldW, scratch, dt);

	// now average them into new
	qDimension *dims = space->dimensions;
	for (int ix = dims->start; ix < dims->end; ix++) {
		newW[ix] = (newW[ix] + scratch[ix]) / 2;
	}

	// and that's the midpoint method
}

