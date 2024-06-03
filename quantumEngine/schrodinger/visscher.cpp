/*
** visscher -- schrodinger ODE integration by staggering re and im
**			by half dt, Visscher second order accuracy
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

#include "../hilbert/qSpace.h"
#include "../greiman/qAvatar.h"
#include "qGrinder.h"
#include "../debroglie/qFlick.h"


static bool traceRealStep = false;  // in detail
static bool traceImaginaryStep = false;  // in detail
static bool traceVischerBench = false;
static bool traceMidpoint = false;


/*
--- reinterpreted from the article
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

Half a tick before, at a half odd integer multiple of dt,
	𝜓.im(t + dt/2) = 𝜓.im(t - dt/2) - dt H 𝜓.re(t)

Or later,
	𝜓.im(t + 3dt/2) = 𝜓.im(t + dt/2) - dt H 𝜓.re(t + dt)

where H is hamiltonian, typically ( potential + ∂²/∂x² )

--- We do the hamiltonian custom here and sometimes omit the potential
 */

/*
this is our second derivative wrt x:
	qCxd2 = wave[ix-1] + wave[ix+1] - wave[ix] * 2;

ix is the integer index into each length dimension.  The actual distance is dx * ix; determined by
the length (supplied by user) and N, for each dimension of the space.

// The following uses nanometers, picoseconds, etc as described in definiionOfUnits.md
//
// squish units:
// ℏ = 105.4571817 pfg nm^2 / ps
// m_e = .91093837015 pfg
//
// The coefficient on the rhs for the second derivative is
// ℏ² / 2m_e = 6.10426431e-39  kg m^4 / s^2  = 1 cuz of the rhs of schrodinger's we use
//
// wait try this, ℏ = 1, right, so 1 / 2m_e = 1  and m_e = 1/2 = 9.1093837015e-31 kg
// and 1 kg = 5.4888455287888166e+29

See definitionOfUnits in articles directory for latest believable work.
Here, we use ix as a surrogate for x, x = ix * dx = 𝜉 ix.
dx is a field on the qDimension in the qSpace.

*/



// ******************************************************** single point methods
int usedIx;  // trace only

// Thes functions do a single point of a hit.  They are handed pointers
// to THE point they are to do.  The hamiltonian (to be split off in the
// future) accesses the points on each side of the point, too.

void qGrinder::pointReal(qCx *newW, qCx *oldW, qCx *hamiltW, double volts, double dt) {
	// second deriv wrt x of psi
	double d2𝜓i = (hamiltW[-1].im + hamiltW[+1].im - hamiltW->im * 2) * d2Coeff;

	if (traceRealStep && samplePoint == usedIx) speedyLog(
		"    🧶 pointReal[%d] d2𝜓i=%3.8lf  hamiltons=%5.5lf %5.5lf %5.5lf and d2Coeff %3.8lf\n",
		samplePoint, d2𝜓i, hamiltW[-1].im, hamiltW[+1].im, hamiltW->im, d2Coeff);

	// total hamiltonian including voltage
	double H𝜓 = d2𝜓i + volts * voltageFactor * hamiltW->re * inverseℏ;

	// new = old + 𝛥 dt   note subtraction
	newW->re = oldW->re - dt * H𝜓;
	if (traceRealStep && samplePoint == usedIx)
		speedyLog("    🧶 pointReal[%d] oldW->re=%3.8lf  newW->re=%3.8lf  H𝜓=%3.8lf\n",
		samplePoint, oldW->re, newW->re, H𝜓);

	qCheck(*newW, "vischer pointReal done for ix=", usedIx);
}

// second step: advance the Imaginaries of 𝜓 one dt, from ½ dt to ³⧸₂ dt
// given the reals we just generated in hitReal(), but don't change them
void qGrinder::pointImaginary(qCx *newW, qCx *oldW, qCx *hamiltW, double volts, double dt) {
	// second deriv d2𝜓.re / dx**2
	double d2𝜓r = (hamiltW[-1].re + hamiltW[+1].re - hamiltW->re * 2) * d2Coeff;
	if (traceImaginaryStep) speedyLog("    🧶 pointImaginary\n");

	// total hamiltonian
	double H𝜓 = d2𝜓r + volts * voltageFactor * hamiltW->im * inverseℏ;

	// note addition
	if (traceImaginaryStep) speedyLog("    🧶 pointImaginary\n");
	newW->im = oldW->im + dt * H𝜓;
	if (traceImaginaryStep) speedyLog("    🧶 pointImaginary\n");

	qCheck(*newW, "vischer pointImaginary");
}


// ******************************************************** whole wave methods

// first step: advance the 𝜓.re one dt, from t to t + dt
// oldW points to buffer with real = 𝜓.re(t)    imag = 𝜓.im(t + dt/2)
// newW points to buffer with real = 𝜓.re(t + dt)   imag unchanged = 𝜓.im(t + dt/2)
// hamiltW is what we calculate the derivitives from
// here we will calculate the 𝜓.re(t + dt) values in a new buffer only, and fill them in.
// the 𝜓.im values in buffer oldW are still uncalculated
void qGrinder::hitReal(qCx *newW, qCx *oldW, qCx *hamiltW, double dt) {
	qDimension *dims = space->dimensions;
	if (traceRealStep) speedyLog("🧶 start of hitReal nStates=%d, nPoints=%d, start=%d, end=%d\n",
			space->nStates, space->nPoints, dims->start, dims->end);

	// someday I should check for dt==0 and do a copy() instead of this calc
	// must make versions of qBuffer::copyThatWave() that only copy real or imag parts
	// or better, make substitutes for hitReal and stepImag
	for (int ix = dims->start; ix < dims->end; ix++) {
		usedIx = ix;
		pointReal(newW + ix, oldW + ix, hamiltW + ix, voltage[ix],dt);
	}
	qflick->fixThoseBoundaries(newW);
	//elapsedTime += dt/2;  // could be 0 or already dt/2

	if (traceVischerBench) speedyLog("      hitReal, done: time=%lf\n",
		getTimeDouble());
	if (traceRealStep) speedyLog("🧶 end of hitReal\n");
}

// second step: advance the Imaginaries of 𝜓 one dt, from ½ dt to ³⧸₂ dt
// given the reals we just generated in hitReal(), but don't change them
void qGrinder::hitImaginary(qCx *newW, qCx *oldW, qCx *hamiltW, double dt) {
	qDimension *dims = space->dimensions;
	if (traceImaginaryStep) speedyLog("🧶 start of stepImag nStates=%d, nPoints=%d, start=%d, end=%d\n",
			space->nStates, space->nPoints, dims->start, dims->end);

	// someday I should check for dt==0 and do a copyThatWave() instead of this calc
	for (int ix = dims->start; ix < dims->end; ix++) {
		usedIx = ix;
		pointImaginary(newW + ix, oldW + ix, hamiltW + ix, voltage[ix], dt);
	}

	qflick->fixThoseBoundaries(newW);
	//elapsedTime += dt/2;  // could be 0 or already dt/2

	if (traceVischerBench) speedyLog("      hitImaginary done: time=%lf\n",
		getTimeDouble());
	if (traceImaginaryStep) speedyLog("🧶 end of hitImaginary");

}

// this is what will be replaced to make Midpoint.  except midpoint also uses this.
// Cuz, you can't really do two Real steps in a row; must do an Imag step in between.  And vice versa.
void qGrinder::hitRealImaginary(qCx *newW, qCx *oldW, qCx *hamiltW, double dt) {
	qflick->fixThoseBoundaries(oldW);
	if (oldW != hamiltW)
		qflick->fixThoseBoundaries(hamiltW);

	hitReal(newW, oldW, hamiltW, dt);
	hitImaginary(newW, oldW, hamiltW, dt);
}

/* ********************************************************** midpoint method */

// this will go forward calculating dPsi based on derivatives at the front AND back of dx
void qGrinder::stepMidpoint(qCx *newW, qCx *oldW, qCx *scratch, double dt) {
	// first calculate the normal step taking derivatives at the beginning of dt
	// already done in hit func qflick->fixThoseBoundaries(oldW);
	hitReal(scratch, oldW, oldW, dt);
	hitImaginary(scratch, oldW, oldW, dt);

	// now do it again with the derivatives at the end
	// already done in hit func qflick->fixThoseBoundaries(scratch);
	hitReal(newW, oldW, scratch, dt);
	hitImaginary(newW, oldW, scratch, dt);

	// now average them into new
	qDimension *dims = space->dimensions;
	for (int ix = dims->start; ix < dims->end; ix++) {
		newW[ix] = (newW[ix] + scratch[ix]) / 2;
	}

	// and that's the midpoint method
	if (traceMidpoint) speedyLog("🧶 end of stepMidpoint");

}

