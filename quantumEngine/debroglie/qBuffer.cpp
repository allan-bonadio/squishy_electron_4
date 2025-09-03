/*
** quantum Buffer -- basic buffer for waves or spectrums
** Copyright (C) 2022-2025 Tactile Interactive, all rights reserved
*/

/*
a long array of qCx complex numbers, plus some other meta info

Data structures used for these buffers:
qCx *wave  # wave: just an array of complex nums that's nPoints = nPoints/2 long
	In JS, it turns into a Float64Array with nPoints complex numbers
qBuffer - object, superclass of qWave and qSpectrum
qWave - object that owns a single wave, and points to its space
qSpectrum - object that owns a single qSpectrum, and points to its space
qFlick - object that owns a list of waves, and points to its space
*/

#include <cstring>
#include <stdexcept>

#include "../hilbert/qSpace.h"
#include "qBuffer.h"

static bool traceInnerProduct = false;
static bool traceNormalize = false;
static bool traceAllocate = true;
static bool traceInit = true;

// make one, any size.  For single floats, ints, whatever.  Mostly for use from JS.
void *allocateBuffer(int byteSize) {
	if (traceAllocate) printf(" 🍕allocateBuffer(int nBytes=%d)\n", byteSize);
	if (byteSize <= 0)
		throw std::runtime_error("allocateBuffer() - no byteSize");

	void *mem =  (void *) malloc(byteSize);
	if (traceAllocate) {
		printf(" 🍕 allocateWave byteSize: %d  buffer: %p, filled with  -0x55\n",
			byteSize, mem);
		for (int j = 0; j < byteSize; j++)
			((byte *) mem)[j] = -0x55;
	}
	return mem;
}

// just allocate a wave of whatever length
// buffer is unreliably initialized to zero bytes only first time it's allocated; hence calloc
qCx *allocateZeroedWave(int nPoints) {
	qCx *buf = (qCx *) calloc(nPoints, sizeof(qCx));
	if (traceAllocate) {
		printf(" 🍕 allocateZeroedWave()  buf=%p  nPoints: %d bytelength=x%lx\n",
			buf, nPoints, nPoints * sizeof(qCx));
	}
	// each cell has zeroes
	return buf;
}

void freeWave(qCx *wave) {
	if (traceAllocate) {
		// we don't know the length here, but you can search for the pointer value
		printf(" 🍕 freeWave()  wave=%p \n", wave);
	}
	free(wave);
}

// make one, the right size for this buffer's space, or nPoints long if no space
// each value is a qCx complex double value
qCx *allocateWave(int nPoints) {
	if (traceAllocate) printf(" 🍕allocateWave(int nPoints=%d)\n", nPoints);
	if (nPoints <= 0)
		throw std::runtime_error("allocateWave() - no nPoints");

	qCx *wa =  (qCx *) malloc(nPoints * sizeof(qCx));
	if (traceAllocate) {
		printf(" 🍕 allocateWave nPoints: %d  buffer: %p, filled with -77\n",
			nPoints, wa);
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
// length is in units of qCx (complex double 16 bytes)
void qBuffer::initBuffer(int nCxes, qCx *useThisMemory) {
	if (useThisMemory) {
		wave = useThisMemory;
		dynamicallyAllocated = false;
	}
	else {
		wave = allocateWave(nCxes);
		dynamicallyAllocated = true;
	}

	nPoints = nCxes;
	if (traceAllocate) {
		printf(" 🍕 qBuffer::initBuffer this=%p  wave=%p  nPoints: %d\n",
			this, wave, nPoints);
	}
	if (traceInit) {
		printf(" 🍕 qBuffer vars: this=%p, &magic=%p, &wave=%p   &nPoints=%p  &start=%p   &end=%p   &continuum=%p\n",
			this, &magic, &wave, &nPoints, &start, &end, &continuum);
	}
}

qBuffer::~qBuffer() {
	if (traceAllocate)
		printf(" 🍕  start the qBuffer instance destructor...space=%p\n", space);
	if (dynamicallyAllocated) {
		freeWave(wave);
	}

	space = NULL;
	if (traceAllocate) printf("   🍕  setted buffer to null; done with qBuffer destructor.\n");
}


/* ******************************************************** diagnostic dumps **/

void qBuffer::dumpHeadings(bool withNewline, bool withExtras) {
	if (withExtras)
		printf("  ix       re        im        phase   ∆ phase      norm m𝜓/nm");
	else
		printf("  ix       re        im      norm m𝜓/nm");
	if (withNewline)
		printf("\n");
}

// print one complex number, plus maybe some more calculated metrics for that
// point, on a line in the dump on stdout. Results in buf, handed in if it
// overflows the buffer, it won't.  just dump a row for a cx datapoint. returns
// the magnitude non-visscher, but only withExtras
double qBuffer::dumpRow(char buf[200], int ix, qCx w, double *pPrevPhase, bool withExtras) {
	double re = w.re;
	double im = w.im;
	double norm = w.norm();
	if (withExtras) {
		// if re and im are zero (or close) then the angle is undefined.  Use NaN.
		double phase = NaN;
		if (abs(im) + abs(re) > 1e-9)
			phase = atan2(im, re) * 180. / PI;  // pos or neg OR NAN

		// difference, then adjust it to -180...+180
		double dPhase = fmod(phase - *pPrevPhase + 180, 360) - 180.;

		// if this or the previous point was (0,0) then the phase and dPhase will be NAN, and they print that way
		snprintf(buf, 200, "[%3d] (%8.4lf,%8.4lf) | %8.3lf %9.3lf   %8.4lf  m𝜓/nm",
			ix, re, im, phase, dPhase, norm * 1000);
		*pPrevPhase = phase;
	}
	else {
		snprintf(buf, 200, "[%3d] (%8.4lf,%8.4lf)    %8.4lf  m𝜓/nm",
			ix, re, im, norm * 1000);
	}
	return norm;
}

// you can use this on waves or spectrums; for some, leaves off the start and end
// also prints the inner prod on the last line
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

	printf("  inner product=%4.8lg\n", innerProd);
}

// any wave, probably shouldn't call this
void qBuffer::dumpThat(qCx *wave, bool withExtras) {
	qBuffer::dumpSegment(wave, withExtras, start, end, continuum);
}

// works on any buffer, shows which kind
void qBuffer::dump(const char *title, bool withExtras) {
	printf(" \n🌊🌊 a " MAGIC_FORMAT " buffer, o%p w%p | %s \n",
		MAGIC_ARGS, this, wave, title);
	qBuffer::dumpHeadings();
	qBuffer::dumpSegment(wave, withExtras, start, end, continuum);
	printf("        ==== end of qBuffer ====\n\n");
}

// use this if roundoff is a problem
void qBuffer::dumpHiRes(const char *title) {
	printf(" 🍕 🍕  HIRES %s: s=%d e=%d continuum:%d nPoints:%d\n", title, start, end, continuum, nPoints);
	double iProd = 0;
	for (int ix = 0; ix < nPoints; ix++) {
		printf(" 🍕 [%3d]  %22.16lg, %22.16lg\n", ix, wave[ix].re, wave[ix].im);
		if (ix >= start && ix < end)
			iProd += wave[ix].norm();
	}
	printf(" 🍕 🍕  HIRES innerProduct: %22.16lg\n", iProd);
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
		wave[0] = wave[end] = qCx();
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
				printf(" 🍕 innerProduct point %d (%lf,%lf) norm--> %lf\n",
					ix, wave[ix].re, wave[ix].im, norm);
		}
	}

	return sum;
}

// enforce ⟨𝜓 | 𝜓⟩ = 1 by dividing out the current magnitude sum.
// returns the PREVIOUS magnitude sum (inner product)
// Buffer must be installed as well as nPoints, start and end
double qBuffer::normalize(void) {
	if (traceNormalize) {
		printf("qBuffer:: 🍕starting normalize, this=%p --> %p\n", this, wave);
		dump("qBuffer::    🍕what we're dealing with", true);
	}

	double iProd = innerProduct();
	if (traceNormalize) {
		printf(" 🍕 normalizing qBuffer.  innerProduct=%lf\n", iProd);
	}
	if (iProd == 0.) {
		// ALL ZEROES!??! this is bogus, shouldn't be happening.
		// Well, except that brand new buffers are initialized to zeroes.
		throw std::runtime_error("tried to normalize a buffer with all zeroes!");
	}
	if (! isfinite(iProd))
		throw std::runtime_error("tried to normalize; iProd not finite");

	// normal functioning
	const double factor = pow(iProd, -0.5);
	if (traceNormalize) {
		printf(" 🍕 normalizing qBuffer.  factor=%lf, start=%d, end=%d, N=%d\n",
			factor, start, end, end - start);
	}

	for (int ix = start; ix < end; ix++)
		wave[ix] *= factor;

	fixBoundaries();

	return iProd;
}

/* **********************************************************************  setting wave */

// a little bit dangerous if your waves don't have the same continuum
void qBuffer::copyThatWave(qCx *dest, qCx *src, int nCxes) {
//	printf(" 🍕 qWave::copyThatWave(%d <== %d)\n", (int) dest, (int) src);
	if (!dest) dest = wave;
	if (!src) src = wave;
	if (nCxes < 0)
		nCxes = nPoints;
	memcpy(dest, src, nCxes * sizeof(qCx));
}

// qBuffers know their length - must be same length and same continuum
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
	// done in normalize fixBoundaries();
	dump("setSquareWave() done");
}


// add these two waves, modulated by the coefficients, leaving result in this->wave
// UN-normalized, UN-fixed boundaries.  Either can be this if you want, no probs
void qBuffer::add(double coeff1, qCx *wave1, double coeff2, qCx *wave2) {
	int N = end - start;
	qCx *dest = wave + start;

	for (int ix = 0; ix < N; ix++) {
		// must do multiply in this order; gotta fix that someday
		dest[ix] = wave1[ix] * coeff1 +  wave2[ix] * coeff2;
	}

}

// add these two waves, modulated by the coefficients, leaving result in this->wave
// UN-normalized, UN-fixed boundaries.
void qBuffer::add(double coeff1, qBuffer *qwave1, double coeff2, qBuffer *qwave2) {
	add(coeff1, qwave1->wave + qwave1->start, coeff2, qwave2->wave + qwave2->start);
}


/* **********************************************************************  javascript */

// allocate a buffer full of floats for JS
qCx *buffer_allocateZeroedWave(int nPairs) {
	return allocateZeroedWave(nPairs);
}

qCx *buffer_allocateWave(int nPairs) {
	return allocateWave(nPairs);
}


// allocate a C++ buffer full of whatever size data
void *buffer_allocateBuffer(int nBytes) {
	return (void *) calloc(nBytes, 1);
}
