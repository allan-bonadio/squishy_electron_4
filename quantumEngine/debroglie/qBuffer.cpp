/*
** quantum Buffer -- basic buffer for waves or spectrums
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

#include <cstring>

/*
a long array of qCx complex numbers, plus some other info

Data structures used for these buffers:
qCx *wave  # wave: just an array of complex nums that's nPoints long
	In JS, it turns into a Float64Array with 2nPoints numbers
qBuffer - object, superclass of qWave and qSpectrum
qWave - object that owns a single wave, and points to its space
qSpectrum - object that owns a single qSpectrum, and points to its space
qFlick - object that owns a list of waves, and points to its space
	(not sure if i'll keep using qFlick)
*/

#include "../squish.h"
#include "../spaceWave/qSpace.h"
#include "qBuffer.h"

static bool traceInnerProduct = false;
static bool traceNormalize = false;
static bool traceAllocate = false;

// just allocate a wave of whatever length
// buffer is unreliably initialized to zero bytes only first time it's allocated; hence calloc
qCx *allocateZeroedWave(int nPoints) {
	qCx *buf = (qCx *) calloc(nPoints, sizeof(qCx));
	if (traceAllocate) {
		printf("🍕 allocateZeroedWave()  buf=%p  nPoints: %d bytelength=x%lx\n",
			buf, nPoints, nPoints * sizeof(qCx));
	}
	// each cell has zeroes
	return buf;
}

void freeWave(qCx *wave) {
	if (traceAllocate) {
		// we don't know the length here, but you can search for the pointer value
		printf("🍕 freeWave()  wave=%p \n", wave);
	}
	free(wave);
}

// make one, the right size for this buffer's space, or nPoints long if no space
qCx *qBuffer::allocateWave(int nPoints) {
	if (traceAllocate) printf("🍕qBuffer::allocateWave(int nPoints=%d)\n", nPoints);
	if (nPoints <= 0)
		throw std::runtime_error("qBuffer::allocateWave() - no nPoints");

	// ?? this is weird  this->nPoints = nPoints;
	qCx *wa =  (qCx *) malloc(nPoints * sizeof(qCx));
	if (traceAllocate) {
		printf("🍕 qBuffer::allocateWave this=%p  nPoints: %d  buffer: %p, filled with -77\n",
			this, nPoints, wa);
		for (int j = 0; j < nPoints; j++)
			wa[j] = -77.;  // sets both Re and Im
	}
	return wa;
}



// create one
qBuffer::qBuffer(void)
	: magic('Buff'), wave(NULL),
		nPoints(0), start(0), end(0), continuum(contDISCRETE),
		space(NULL) {
}

// actually create the buffer that we need
// dynamically allocated or Bring Your Own Buffer to use
// usually called by subclass constructors when they figure out how long a buffer is needed
// length is in units of qComplex (16 by)
void qBuffer::initBuffer(int length, qCx *useThisBuffer) {
	if (useThisBuffer) {
		wave = useThisBuffer;
		dynamicallyAllocated = false;
	}
	else {
		wave = allocateWave(length);
		dynamicallyAllocated = true;
	}

	nPoints = length;
	if (traceAllocate) {
		printf("🍕 qBuffer::initBuffer this=%p  wave=%p  nPoints: %d\n",
			this, wave, nPoints);
	}
}

qBuffer::~qBuffer() {
	if (traceAllocate)
		printf("🍕  start the qBuffer instance destructor...space=%p\n", space);
	if (dynamicallyAllocated) {
		freeWave(wave);
	}

	space = NULL;
	if (traceAllocate) printf("   🍕  setted buffer to null; done with qBuffer destructor.\n");
}




/* ******************************************************** diagnostic dumps **/

// print one complex number, plus maybe some more calculated metrics for that point, on a line in the dump on stdout.
// if it overflows the buffer, it won't.  just dump a row for a cx datapoint.
// returns the magnitude non-visscher, but only withExtras
double qBuffer::dumpRow(char buf[200], int ix, qCx w, double *pPrevPhase, bool withExtras) {
	double re = w.re;
	double im = w.im;
	double norm = 0;
	if (withExtras) {
		norm = w.norm();

		// if re and im are zero (or close) then the angle is undefined.  Use NaN.
		double phase = NAN;
		if (abs(im) + abs(re) > 1e-9)
			phase = atan2(im, re) * 180. / PI;  // pos or neg OR NAN

		// difference, then adjust it to -180...+180
		double dPhase = fmod(phase - *pPrevPhase + 180, 360) - 180.;

		// if this or the previous point was (0,0) then the phase and dPhase will be NAN, and they print that way
		snprintf(buf, 200, "[%3d] (%8.4lf,%8.4lf) | %8.3lf %9.3lf %8.4lf  m𝜓/nm",
			ix, re, im, phase, dPhase, norm * 1000);
		*pPrevPhase = phase;
	}
	else {
		snprintf(buf,200, "[%3d] (%8.4lf,%8.4lf)    ... norm=%lg", ix, re, im, norm);
	}
	return norm;
}

// you can use this on waves or spectrums; for the latter, leave off the start and the rest
void qBuffer::dumpSegment(qCx *wave, bool withExtras, int start, int end, int continuum) {
	if (start >= end) {
		printf("qBuffer::dumpSegment(%p, %d, %d, %d)\n",
			wave, start, end, continuum);
		throw std::runtime_error("qBuffer::dumpSegment() start >= end");
	}

	int ix = 0;
	char buf[200];
	double prevPhase = 0.;
	double innerProd = 0.;

	// somehow, commenting out these lines fixes the nan problem.
	// but the nan problem doesn't happen on flores?
	// i haven't seen the nan problem since like a month ago.  ab 2021-08-25
	if (continuum) {
		qBuffer::dumpRow(buf, ix, wave[0], &prevPhase, withExtras);
		printf("%s", buf);
	}

	for (ix = start; ix < end; ix++) {
		innerProd += dumpRow(buf, ix, wave[ix], &prevPhase, withExtras);
		printf(" \n%s", buf);
	}

	if (continuum) {
		qBuffer::dumpRow(buf, ix, wave[end], &prevPhase, withExtras);
		printf("\nend %s", buf);
	}

	printf("    inner product=%11.8lg\n", innerProd);
}

// any wave, probably shouldn't call this
void qBuffer::dumpThat(qCx *wave, bool withExtras) {
	qBuffer::dumpSegment(wave, withExtras, start, end, continuum);
}

// works on any buffer but originally written for qWaves
void qBuffer::dump(const char *title, bool withExtras) {
	printf(" \n🌊🌊 qBuffer ==== a '%c%c%c%c'  %p->%p | %s ",
		magic >> 24, magic >> 16, magic >> 8, magic, this, wave, title);
	qBuffer::dumpSegment(wave, withExtras, start, end, continuum);
	printf("        ==== end of Wave ====\n\n");
}

// use this if roundoff is a problem
void qBuffer::dumpHiRes(const char *title) {
	printf("🍕 🍕  HIRES %s: s=%d e=%d continuum:%d nPoints:%d\n", title, start, end, continuum, nPoints);
	double iProd = 0;
	for (int ix = 0; ix < nPoints; ix++) {
		printf("🍕 [%3d]  %22.16lg, %22.16lg\n", ix, wave[ix].re, wave[ix].im);
		if (ix >= start && ix < end)
			iProd += wave[ix].norm();
	}
	printf("🍕 🍕  HIRES innerProduct: %22.16lg\n", iProd);
}

// calls the JS dumpRainbow method of eWave.  Note we can't compile this for
// straight C++ code (like specs) cuz there's no emscripten or JS.  So the app,
// or node with emscripten
void qBuffer::rainbowDump(const char *title) {
	printf("about to rainbowDump EM_ASM %p %d %d %d %s\n\n", wave, start, end, nPoints, title);
	// this also has to compile for standard C++ with no emscripten
	#ifdef EM_ASM
	EM_ASM({
		// temporary
		let waveJS = new Float64Array(window.Module.HEAPF64.buffer, $0, 2 * $3);
		let titleJS = UTF8ToString($4);

		rainbowDump(waveJS, $1, $2, $3, titleJS);

		//	$1, $2, $3, $4);
	}, wave, start, end, nPoints, title);
	#endif
printf("done with rainbowDump EM_ASM\n\n");
}


/* ************************************************************ arithmetic */
// these are operations that are useful and analogous for both Waves and Spectrums

// refresh the wraparound points for ANY WAVE subscribing to this space
// 'those' or 'that' means some wave other than this->wave
static void fixSomeBoundaries(qCx *wave, int continuum, int start, int end) {
	if (end <= 0) throw std::runtime_error("🌊🌊 fixSomeBoundaries() with zero points");

	switch (continuum) {
	case contDISCRETE:
		break;

	case contWELL:
		// the points on the end are ∞ voltage, but the arithmetic goes bonkers
		// if I actually set the voltage to ∞
		wave[0] = qCx();
		wave[end] = qCx();
		break;

	case contENDLESS:
		// the points on the end get set to the opposite side
		wave[0] = wave[end-1];
		wave[end] = wave[1];
		break;
	}
}

void qBuffer::fixThoseBoundaries(qCx *targetWave) {
	if (!targetWave)
		targetWave = wave;
	fixSomeBoundaries(targetWave, continuum, start, end);
}

// calculate ⟨𝜓 | 𝜓⟩  'inner product'.  Non-visscher; do not use it during an iteration.
// use it when the Re and the Im are synchronized.
double qBuffer::innerProduct(void) {
	qCx *wave = this->wave;
	double sum = 0.;

	for (int ix = start; ix < end; ix++) {
		qCx point = wave[ix];
		double norm = point.norm();
		sum += norm;
		if (traceNormalize) {
			if (traceInnerProduct)
				printf("innerProduct point %d (%lf,%lf) norm--> %lf\n",
					ix, wave[ix].re, wave[ix].im, norm);
		}
	}

	return sum;
}

// enforce ⟨𝜓 | 𝜓⟩ = 1 by dividing out the current magnitude sum.
// Buffer must be installed as well as nPoints, start and end
double qBuffer::normalize(void) {
	if (traceNormalize) {
		printf("qBuffer:: 🍕starting normalize, this=%p --> %p\n", this, wave);
		dump("qBuffer::    🍕what we're dealing with", true);
	}

	double iProd = innerProduct();
	if (traceNormalize) {
		printf("🍕 normalizing qBuffer.  innerProduct=%lf\n", iProd);
	}
	if (iProd == 0. || ! isfinite(iProd)) {
		// ALL ZEROES!??! this is bogus, shouldn't be happening.
		// Well, except that brand new buffers are initialized to zeroes.
		throw std::runtime_error("tried to normalize a buffer with all zeroes!");
	}

	// normal functioning
	const double factor = pow(iProd, -0.5);
	if (traceNormalize) {
		printf("🍕 normalizing qBuffer.  factor=%lf, start=%d, end=%d, N=%d\n",
			factor, start, end, end - start);
	}

	for (int ix = start; ix < end; ix++)
		wave[ix] *= factor;

	fixBoundaries();

	return iProd;
}

/* ****************************************************************************  setting */

// a little bit dangerous if your waves don't have the same continuum
void qBuffer::copyThatWave(qCx *dest, qCx *src, int length) {
//	printf("🍕 qWave::copyThatWave(%d <== %d)\n", (int) dest, (int) src);
	if (!dest) dest = wave;
	if (!src) src = wave;
	if (length < 0)
		length = nPoints;
	memcpy(dest, src, length * sizeof(qCx));
}

// qBuffers know their length
// buffers (waves, spectrums) must be same length!
void qBuffer::copyBuffer(qBuffer *dest, qBuffer *src) {
	int sStates = src->end - src->start;
	int dStates = dest->end - dest->start;
	if (sStates != dStates)
		throw std::runtime_error("qBuffer::copyBuffer() - different buffer lengths");

	if (dest->continuum == src->continuum) {
		// plus the boundaries, just copy it all
		copyThatWave(dest->wave, src->wave, src->nPoints);
	}
	else {
		// do the boundaries depending
		copyThatWave(dest->wave + dest->start, src->wave + src->start, dStates);
		dest->fixBoundaries();
	}
}

void qBuffer::copyFrom(qBuffer *src) {
	copyBuffer(this, src);
}

void qBuffer::copyTo(qBuffer *dest) {
	copyBuffer(dest, this);
}


void qBuffer::fill(qCx value) {
	for (int ix = 0; ix < nPoints; ix++)
		wave[ix] *= value;
}

// just for C++ testing; should be same as in JS
// previous contents of target overwritten.  Must be the size you want.
void qBuffer::setCircularWave(double frequency, int first) {
	int N = end - start;

	// the pie-slice for each point
	double dAngle = 2 * PI / N * frequency;

	for (int ix = start; ix < end; ix++) {
		double angle = dAngle * (ix - start - first);
		wave[ix] = qCx(cos(angle), sin(angle));
	}

	normalize();
	// done in normalize fixBoundaries();
}

// just for C++ testing.  first=> phase.  most values ±height.
// previous contents of target gone.  Buffer must be the size you want.
// [ix=first] = +height, switches to -height after wavelength/2
// then repeats.  If wavelength is odd, in between psi is 0
void qBuffer::setSquareWave(int wavelength, int first, qCx height) {
	int N = end - start;

	bool isOdd = wavelength & 1;
	int halfWavelength = wavelength / 2;

	// the pie-slice for each point
	for (int ix = start; ix < end; ix++) {
		int phase = (ix - start - first) % wavelength;
		qCx val = height;
		if (phase >= halfWavelength) {
			 if (isOdd && phase == halfWavelength)
			 	val = 0;
			 else
				val = -height;
		}
		wave[ix] = val;
	}

	normalize();
	fixBoundaries();
	dump("setSquareWave() done");
}


// add these two waves, modulated by the coefficients, leaving result in this->wave
// UN-normalized, UN-fixed boundaries.  Either can be this if you want, no probs
void qBuffer::add(qBuffer *qwave1, double coeff1, qBuffer *qwave2, double coeff2) {
	int N = end - start;
	qCx *wave1 = qwave1->wave + qwave1->start;
	qCx *wave2 = qwave2->wave + qwave2->start;
	qCx *dest = wave + start;

	for (int ix = 0; ix < N; ix++) {
		// must do multiply in this order; gotta fix that someday
		dest[ix] = wave1[ix] * coeff1 +  wave2[ix] * coeff2;
	}

}

