/*
** Flick -- a qWave that contains a dynamic sequence of waves
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

#include <cstring>
#include "../spaceWave/qSpace.h"
#include "qFlick.h"

bool traceConstruction = false;

// here ix still points to the x location in the wave
// but serial points to which wave in the flick

/* ************************************************************ birth & death & basics */

// each buffer is initialized to zero bytes therefore 0.0 everywhere
qFlick::qFlick(qSpace *space, qGrinder *gr, int nW) :
	qWave(space), qgrinder(gr), nWaves(nW), currentIx(0)
{
	if (! space)
		throw std::runtime_error("qSpectrum::qSpectrum null space");
	if (nWaves < 2) throw std::runtime_error("nWaves must be at least 2");
	if (nWaves > 1000) throw std::runtime_error("nWaves is too big, sure you want that?");

	magic = 'flic';

	// array of waves, just the pointers to them
	waves = (qCx **) malloc(nWaves * sizeof(qCx *));

	// being a qWave, we already have one, just need the rest.  For many purposes,
	// waves[0] === wave so use qFlick just like it was a qWave
	waves[0] = wave;
	for (int w = 1; w < nWaves; w++)
		waves[w] = allocateWave(nPoints);
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
	if (traceConstruction)
		printf("    freed most of the buffers...\n");

	free(waves);
	waves = NULL;
	if (traceConstruction)
		printf("    freed waves..done with qFlick destructor..\n");
}

/* ******************************************************** diagnostic dump **/

// print one complex number, from a flick at time doubleSerial, on a line in the dump on stdout.
// if it overflows the buffer, it won't.  just dump a row for a cx datapoint.
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

		sprintf(buf, "[%3d] %c%8.4lf,%8.4lf%c | %8.2lf %8.2lf %8.4lf",
			ix, leftParen, w.re, w.im, rightParen, phase, dPhase, mag);
		*pPrevPhase = phase;
	}
	else {
		sprintf(buf, "[%3d] %c%8.4lf,%8.4lf%c", ix, leftParen, w.re, w.im, rightParen);
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
// not sure if we actually need these

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
//	printf("qFlick::magnitude: it=%d  waves[%d]=0%p \n", it, it, (int) waves[it]);
//	printf("qFlick::magnitude: waves[0]=0%p \n", (int) waves[0]);
//	printf("qFlick::magnitude: waves[1]=0%p \n", (int) waves[1]);
//	printf("qFlick::magnitude: waves[2]=0%p \n", (int) waves[2]);

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


// create a new wave copy, push this copy onto this flick
//void qFlick::pushCopy(qCx *wave) {
//	qCx *w = allocateWave();
//	if (wave)
//		copyThatWave(w, wave);
//	pushWave(w);
//}

// initialize this flick by pushing this wave twice (two allocated),
// so you can take the inner product at .5 and 1.0 (doubleSerials 1 and 2).
//void qFlick::installWave(qCx *wave) {
//	pushCopy(wave);
//	pushCopy(wave);
//}

// push a new, zeroed or filled, wave onto the beginning of this flick, item zero.
// We also recycle blocks that roll off the end here.
//void qFlick::pushWave(void) {
//	//dumpAllWaves("qFlick::pushWave() Start");
//	printf("pushing a wave...\n");
//
//	// first we need a buffer.
//	qCx *newWave;
//	if (nWaves >= nWaves) {
//		// sorry charlie, gotta get rid of the oldest one...
//		// but stick around we'll recycle you for the new one
//		newWave = waves[nWaves - 1];
//
//		// zap it to zeros, like new!
//		std::memset(newWave, 0, space->nPoints * sizeof(qCx));
//	}
//	else {
//		// waves[] grows like this till it's full, then it recycles the
//		// ones that roll off the end
//		newWave = allocateWave();
//		nWaves++;
//	}
//
//	// shove over
//	for (int i = nWaves - 1; i >= 1; i--)
//		waves[i] = waves[i-1];
//
//	// and here we are.  Good luck with it!
//	waves[0] = newWave;
//
//	// somebody will set this back to zero?
//	currentIx++;
//
//	//dumpAllWaves("pushWave() done");
//}


// set which one is 'current', so if someone uses this as a qWave,
// that's what they see, that's what gets 'normalized' or whatever
// to 'getCurrent' wave, just get qfk->wave;
void qFlick::setCurrent(int newSerial) {
	if (newSerial < 0 || newSerial >= nWaves)
		printf("qFlick::setCurrent() bad serial: %d\n", newSerial);
	currentIx = newSerial;
	wave = waves[newSerial];
}

//void qFlick::fixBoundaries(int serial) {
//	fixThoseBoundaries(waves[serial]);
//}


// do an inner product the way Visscher described.
// doubleSerial = integer time in the past, in units of dt/2; must be >= 0 & 0 is most recent
// if doubleSerial is even, it takes a Re value at doubleSerial/2 and mean between
// 		two Im values at doubleSerial - dt/2 and doubleSerial + dt/2
// if doubleSerial is a odd integer, it takes an Im value at doubleSerial and mean
// 		between the reals from doubleSerial and doubleSerial+1
// you can't take it at zero cuz there's no Im before that.
//double qFlick::innerProduct(void) {
//	int doubleSerial = 1;  // not sure if I'll ever want this as a variable
//
//	printf("qFlick::innerProduct starting at serial %d\n", doubleSerial);
//	qDimension *dims = space->dimensions;
//	double sum = 0.;
//	int end = dims->end;
//	if (doubleSerial <= 0)
//		throw std::runtime_error("Error in qFlick::innerProduct: doubleSerial is negative");
////	const int t = doubleSerial / 2;
////	const bool even = (doubleSerial & 1) == 0;
////	qCx *newWave = waves[t];
////	qCx *oldWave = waves[t + 1];
//
//	//printf("        got to loop\n");
//	for (int ix = dims->start; ix < end; ix++) {
//		double mag = magnitude(doubleSerial, ix);
//		sum += mag;
//		//printf("                dserial=%d ix=%d  mag=%lf  sum=%lf\n",
//		//	doubleSerial, ix, mag, sum);
//	}
//	//printf("        returning sum=%lf\n", sum);
//	return sum;
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

/* ************************************************************ populating */

// n is  number of cycles all the way across N points.
// n 'should' be an integer to make it meet up on ends if endless
// pass negative to make it go backward.
// the first point here is like x=0 as far as the trig functions, and the last like x=-1
//void qFlick::setCircularWave(double n) {
//	if (space->nPoints <= 0) throw std::runtime_error("qFlick::setCircularWave() with zero points");
//
//	qCx tempWave[space->nPoints];
//	qWave tqWave(space, tempWave);
//	qWave *tempQWave = &tqWave;
//
//	printf(" starting qFlick::setCircularWave(%3.2lf) with points=%d\n",
//		n, space->nPoints);
//	//dump("before set sircular & normalize", true);
//	qCx *wave = tempWave;
//	//qCx *wave = wave;
//	qDimension *dims = space->dimensions;
//	int start = dims->start;
//	int end = dims->end;
//
//	// dAngle is change in phase per x point
//	double angle, dAngle = 2. * PI / dims->N * n;
//
//printf(" got past dAngle\n");
//	// visscher gap. How much angle would the Im component go in dt/2?
//	// I have no idea.
//	double dt = space->dt;
//	double nN = n * dims->N;
//	double vGap = -nN * nN * dt / 2 * gapFactor;
//
//	vGap = 0;
//
//
//	//printf("Set circular flick:  n=%lf  nN=%lf  dt=%lf vGap=%lf or %lf * π   dAngle=%lf\n",
//	//	n, nN, dt, vGap, vGap/PI, dAngle);
//	for (int ix = start; ix < end; ix++) {
////		printf("    doin ix=%d\n", ix);
//		angle = dAngle * (ix - start);
////		printf("       [%3d] angle=%lf°\n", ix, angle / PI * 180.);
//		wave[ix] = qCx(cos(angle), sin(angle + vGap));
////		printf("        wave[%3d] =%lf, %lf\n", ix, wave[ix].re, wave[ix].im);
//	}
////	printf("flick, before boundaries, 1 copy");
//	fixBoundaries();
////	printf("flick, freshly generated, 1 copy");
////	dumpThatWave(wave, true);
//
//		tempQWave->copyThatWave(waves[0], tempQWave->wave);
//		tempQWave->copyThatWave(waves[1], tempQWave->wave);
//		//printf("  copied that wave\n");
//		//dumpAllWaves("qFlick::setCircularWave: copied wave 2ice; about to normalize");
//		//space->visscherHalfStep(tempQWave, this);
//		//dump("after set sircular & normalize", true);
//		normalize();
//		//printf(" got past normalize here\n");
//	//	dump("after set sircular & normalize", true);
//	fixBoundaries();
//	//dumpAllWaves("qFlick::setCircularWave: normalize");
//
//	// the interactive code should do this
////	theQViewBuffer->loadViewBuffer(this);
////printf(" got past loadViewBuffer\n");
//}


/* ************************************************************ visscher */

// 	pushWave();

