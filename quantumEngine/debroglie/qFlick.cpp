/*
** Flick -- a qWave that contains a dynamic sequence of waves
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

#include <cstring>
#include <stdexcept>

#include "../hilbert/qSpace.h"
#include "../schrodinger/qGrinder.h"
#include "qWave.h"
#include "qFlick.h"
#include "../directAccessors.h"

static bool traceConstruction = false;
static bool traceSetNWaves = false;

// here ix still points to the x location in the wave
// but serial points to which wave in the flick


/* ************************************************************ integration on the flick */

// set up our edges and tProgresses to get ready for a new integration
void qFlick::reset(void) {
	// ??
}

/* ************************************************************ birth & death & basics */

// each buffer is initialized to zero bytes therefore 0.0 everywhere
qFlick::qFlick(qSpace *space, int nW)
	: qWave(space), nWaves(nW),  allocWaves(nW), currentWave(0)
{
	if (! space)
		throw std::runtime_error("qFlick::qFlick NULL space");
	if (nWaves < 2) throw std::runtime_error("qFlick nWaves must be at least 2");
	if (nWaves > 1000) throw std::runtime_error("qFlick nWaves is too big, sure you want that?");

	magic = 'Flic';

	// array of waves, just the pointers to them
	waves = (qCx **) calloc(nPoints, sizeof(qCx *));

	// being a qWave, we already have one, just need the rest.  For many purposes,
	waves[0] = wave;
	for (int w = 1; w < nWaves; w++)
		waves[w] = allocateWave(nPoints);

	FORMAT_DIRECT_OFFSETS;
}


qFlick::~qFlick() {
	if (traceConstruction)
		printf("start the qFlick instance destructor...\n");
	setCurrent(0);

	// note how this starts at 1 so item zero can be freed by superclass
	for (int i = 1; i < nWaves; i++) {
		freeWave(waves[i]);
		waves[i] = NULL;
	}
	delete waves;

	waves = NULL;
	if (traceConstruction)
		printf("    freed waves..done with qFlick destructor..\n");
}

/* *********************************************** direct access */

// although qFlick is a subclass, and I'd expect it to exactly overlap qWave,
// there seems to be an extra 128 bits.
// So, do it over.  All these will have different offsets from the same thing in qWave.
void qFlick::formatDirectOffsets(void) {
	printf("🚦 🚦 --------------- starting 🥽 eFlick direct access 🥽 JS getters & setters --------------\n\n");

	makePointerGetter(wave);

	printf("\n");
	makeIntGetter(nPoints);
	makeIntGetter(start);
	makeIntGetter(end);
	makeIntGetter(continuum);

	printf("\n🚦 🚦 --------------- done with 🥽 eFlick direct access 🥽 --------------\n");
}


	/* *********************************************** more/less waves */

void qFlick::setNWaves(int newNW) {
	// do we have to stretch the allocation to add new waves?
	if (newNW >nWaves) {
		if (newNW > allocWaves) {
			waves = (qCx **) realloc(waves, newNW * sizeof(qCx *));
			for (int w = allocWaves; w < newNW; w++)
				waves[w] = NULL;
			allocWaves = newNW;
		}
		for (int w = nWaves; w < newNW; w++)
			waves[w] = allocateWave(nPoints);
	}
	else {
		for (int w = newNW; w < nWaves; w++) {
			freeWave(waves[w]);
			waves[w] = NULL;
		}
	}
	if (traceSetNWaves) {
		printf(" setNWaves from %d to %d\n", nWaves, newNW);
		for (int w = 0; w < allocWaves; w++)
			printf("waves[%d]:%p; ", w, waves[w]);
		printf("\n");

	}
	nWaves = newNW;
};

/* ******************************************************** diagnostic dump **/

// print one complex number, from a flick at time doubleSerial, on a line in the dump on stdout.
// if it overflows the buffer, it won't.  just dump a row for a cx datapoint.
// buf must be 200 long
double qFlick::dumpRow(char *buf, int doubleSerial, int ix, double *pPrevPhase, bool withExtras) {
	qCx w = value(ix, doubleSerial);  // interpolates
	int it = doubleSerial / 2;
	char leftParen = (doubleSerial & 1) ? '(' : '[';
	char rightParen = (doubleSerial & 1) ? ']' : ')';
	double mag = 0;
	if (withExtras) {
		mag = magnitude(ix, doubleSerial);  // interpolates
		double phase = 0.;
		if (w.im || w.re) phase = atan2(w.im, w.re) * 180 / PI;  // pos or neg
		double dPhase = phase - *pPrevPhase + 360.;  // so now its positive, right?
		while (dPhase >= 360.) dPhase -= 360.;

		snprintf(buf, 200, "[%3d] %c%8.4lf,%8.4lf%c | %8.2lf %8.2lf %8.4lf",
			ix, leftParen, w.re, w.im, rightParen, phase, dPhase, mag);
		*pPrevPhase = phase;
	}
	else {
		snprintf(buf, 200, "[%3d] %c%8.4lf,%8.4lf%c", ix, leftParen, w.re, w.im, rightParen);
	}
	return mag;
}


// dump the effective wave on this flick at doubleSerial
// title is the title of the particular call to dumpFlick() like func name
void qFlick::dumpOneSerial(const char *title, int doubleSerial, bool withExtras) {
	printf("==== Flick @%d | %s:", doubleSerial, title);
	const qDimension *dims = space->dimensions;
	char buf[200];
	double prevPhase = 0.;
	double innerProd = 0;

	int ix = 0;
	if (dims->continuum) {
		dumpRow(buf, doubleSerial, ix, &prevPhase, withExtras);
		printf("\n%s", buf);
	}

	// 1 thru N
	for (ix = dims->start; ix < dims->end; ix++) {
		innerProd += dumpRow(buf, doubleSerial, ix, &prevPhase, withExtras);
		printf("\n%s", buf);
	}

	// end
	if (dims->continuum) {
		dumpRow(buf, doubleSerial, ix, &prevPhase, withExtras);
		printf("\nend %s\n", buf);
	}

	printf("==== Flick dumpOneSerial() End ==== innerProd=%lf\n", innerProd);
}


void qFlick::dumpLatest(const char *titleIn, bool withExtras) {
	dumpOneSerial(titleIn, 1, withExtras);
	dumpOneSerial(titleIn, 2, withExtras);
}

// a raw dump of the waves here
void qFlick::dumpAllWaves(const char *title) {
	printf("==== FlickAll | %s\n", title);
	for (int i = 0; i < nWaves; i++) {
		//printf("wave %d -- ", i);
		//dumpThatWave(waves[i], true);
		//printf("      inner products: %lf\n", );
	}
	printf("==== FlickAll End ====\n");
}

void qFlick::dumpOverview(const char *title) {
	printf("==== Flick Overview | %s\n", title);
	for (int i = 0; i < nWaves; i++) {
		printf("         waves[%3d]=0%p    sample @x=1: %lf,  %lf\n",
			i, waves[i], waves[i][1].re, waves[i][1].im);
	}
	printf("==== Flick Overview End ====\n");
}

/* ************************************************************ Vischer calcs on waves in-progress  */
// not sure if we actually need these.  Sorry, lots of commented-out code.

// calculate the complex value, re + i im, at this point and doubleSerial
// always interpolate the missing component as an average of the two nearest
qCx qFlick::value(int doubleSerial, int ix) {
	const int it = (doubleSerial-1) / 2;
	if (! waves[it]) printf("*** no wave[it] in qf:value!\n");
	qCx newPoint = waves[it][ix];
	if (! waves[it+1]) printf("*** no wave[it+1] in qf:value!\n");
	qCx oldPoint = waves[it + 1][ix];


	if (ix & 1)
		// odd reals. real is direct, im is interpolated.  latest doubleSerial = 1
		return qCx(newPoint.re, (newPoint.im + oldPoint.im)/2);
	else
		// even imaginaries. im is direct, real is interpolated.  latest doubleSerial = 2
		return qCx((newPoint.re + oldPoint.re)/2, oldPoint.im);
}


// calculate the magnitude, re**2 + im**2 kindof, at this point and time
// pretty clumsy but accurate, we'll figure out something
double qFlick::magnitude(int doubleSerial, int ix) {
	//printf("qFlick::magnitude: doubleSerial[%d]   ix[%d] \n", doubleSerial, ix);
	// if doubleSerial is 1 or 2, we should end up with it=0
	const int it = (doubleSerial-1) / 2;

	if (! waves[it]) printf("*** no wave[it] in qf:magnitude!\n");
	qCx newPoint = waves[it][ix];
	if (! waves[it+1]) printf("*** no wave[it+1] in qf:magnitude!\n");
	qCx oldPoint = waves[it + 1][ix];

	// if doubleSerial is 1, the real is real, the im is interpolated
	// if doubleSerial is 2, the Im is real, and the Re is interpolated
	if (doubleSerial & 1)
		return newPoint.re * newPoint.re + newPoint.im * oldPoint.im;
	else
		return newPoint.re * oldPoint.re + oldPoint.im * oldPoint.im;
}


// set which one is 'current', so if someone uses this as a qWave,
// that's what they see, that's what gets 'normalized' or whatever
// to 'getCurrent' wave, just get qfk->wave;
void qFlick::setCurrent(int newSerial) {
	if (newSerial < 0 || newSerial >= nWaves)
		printf("qFlick::setCurrent() bad serial: %d\n", newSerial);
	currentWave = newSerial;
	wave = waves[newSerial];
}

/* ************* save this code as we may need it to do visscher inner products etc. */

// do an inner product the way Visscher described.
// doubleSerial = integer time in the past, in units of dt/2; must be >= 0 & 0 is most recent
// if doubleSerial is even, it takes a Re value at doubleSerial/2 and mean between
// 		two Im values at doubleSerial - dt/2 and doubleSerial + dt/2
// if doubleSerial is a odd integer, it takes an Im value at doubleSerial and mean
// 		between the reals from doubleSerial and doubleSerial+1
// you can't take it at zero cuz there's no Im before that.
//double qFlick::innerProduct(void) {
//	int doubleSerial )= 1;ever want this as a variable
//
//	printf("qFlick::innerProduct starting at serial %d\n", doubleSerial);
//	qDimension *dims = space->dimensions; double sum = 0.; int end =
//	dims->end; if (doubleSerial <= 0) throw std::runtime_error("Error in
//	qFlick::innerProduct: doubleSerial is negative");
//	//	const int t = doubleSerial / 2; const bool even = (doubleSerial & 1)
//	//	== 0; qCx *newWave = waves[t]; qCx *oldWave = waves[t + 1];
//
//	//printf("        got to loop\n");
//	for (int ix = dims->start; ix < end; ix++) { double mag =
//	magnitude(doubleSerial, ix); sum += mag;
//		//printf("                dserial=%d ix=%d  mag=%lf
//		//sum=%lf\n", doubleSerial, ix, mag, sum);
//	//printf("        returning sum=%lf\n", sum);
//	return sum; }
//}

// normalize the top of the stack of waves; needs at least two waves in the flick
// does a VISSCHER normalize!
// Normalize (should be) always idempotent;
// anything else you wana do, make your own function
//void qFlick::normalize(void) {
//	//dump("qFlick::normalize starting", true);
//
//	qDimension *dims = space->dimensions;
//	double inProd = innerProduct();
//	printf("qFlick::normalize() total innerProduct is %lf \r", inProd);
//
//	qCx *wave = waves[0];
//	qCx *older = waves[1];
//	printf("           wave = %p   older %p\r", wave, older);
//
//	if (inProd == 0.) {
//		// wtf is this zero wave?  never possible.  And, we can't divide by zero.
//		// Fill it with +1, normalized.  This should be really unusual.
//		for (int ix = dims->start; ix < dims->end; ix++)
//			wave[ix] = older[ix] = qCx(1);
//		inProd = dims->N;
//	}
//	double factor = sqrt(1./inProd);
//	printf("           total innerProduct is %lf factor=%lf\r", inProd, factor);
//
//	// apply the factor everywhere
//	for (int ix = dims->start; ix < dims->end; ix++) {
//		wave[ix] *= factor;
//		older[ix] *= factor;
//	}
//	fixBoundaries();
//	dump("qFlick::normalize done", true);
//}

qFlick *flick_create(qSpace *space, int nWaves) {
	// useThisBuffer, usually null, haven't tested lately
	return new qFlick(space, nWaves);
}

void flick_delete(qFlick *flick) {
	delete flick;
}

