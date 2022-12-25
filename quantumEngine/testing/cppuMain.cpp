/*
** cppu main -- cppu Unit Test main source, top level
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

#include <stdexcept>

#include "../debroglie/qWave.h"
#include "../fourier/qSpectrum.h"
#include "../schrodinger/qAvatar.h"
#include "../greiman/qViewBuffer.h"
#include "../schrodinger/qGrinder.h"
#include "../spaceWave/qSpace.h"

#include "CppUTest/TestHarness.h"
#include "CppUTest/CommandLineTestRunner.h"
#include "CppUTest/SimpleString.h"

#include "./cppuMain.h"


static bool traceRando = false;



// how do initializers in C++ work?  need them for mocks
static void initExperiments(void) {
//	int n0{};
//	int n1{1};
//
//	int nn0 = {0};
//	int nn1 = {1};
////	int nn2 = {1, 2};
//
//	qCx zombie[2] = {qCx(1.0, 2.0)};
//	qCx zoot[2] = {qCx(6.0, 7.0), qCx(3.0, 4.0)};
//	printf("initializers in C++\n"
//		"| scalar vars;  empty init:%d   one initializer 1:%d nn0: %d   nn1: %d  \n"
//		"| arrays of cx: twoW1init: [0]%lf, %lf  [1]]%lf, %lf   2with2inits: [0]%lf, %lf  [1]]%lf, %lf\n",
//		n0, n1, nn0, nn1,
//		zombie[0].re, zombie[0].im, zombie[1].re, zombie[1].im,
//		zoot[0].re, zoot[0].im, zoot[1].re, zoot[1].im
//		);
}

// for memory leaks that cppu conveniently gives us, some clues:
static void dumpSizes(void) {
	printf("byte sizes... sz(qSpace)=%lu  sz(qWave)=%lu  sz(qBuffer)=%lu  sz(qSpectrum)=%lu  \n"
		"sz(qViewBuffer)=%lu  sz(qAvatar)=%lu  sz(qGrinder)=%lu\n\n",
		sizeof(qSpace), sizeof(qWave), sizeof(qBuffer), sizeof(qSpectrum),
		sizeof(qViewBuffer), sizeof(qAvatar), sizeof(qGrinder));
}


int main(int ac, char** av)
{
	initExperiments();
	dumpSizes();

    return CommandLineTestRunner::RunAllTests(ac, av);
}

/* ******************************************************** helpers - cppu */

// cppuTest's CHECK_EQUAL() figures complex equality using our == operator.
// this only displays complex if a failure, for the message.
SimpleString StringFrom(const qCx value) {
	char buffer[100];
	snprintf(buffer, 100, "%13.10lf %+13.10lf•i", value.re, value.im);
	SimpleString buf = SimpleString(buffer);
	return buf;
}


/* ******************************************************** helpers - spaces */

static bool traceMakeSpace = false;

// in case someone wants some of the other pointers after making a fullSpace, here they are
salientPointersType *fullSpaceSalientPointers = NULL;

// make a new 1d space with N state locations along x, in theSpace, along with whatever else
// the way JS does it.  Needed for lots of tests.
// You are (usually) responsible for deleting it with deleteTheSpace(space).
// Space generated in theSpace.  Old theSpace triggers error if you don't deleteTheSpace().
// frees and reallocates theVoltage and the ViewBuffer
qSpace *makeFullSpace(int N) {
	if (traceMakeSpace) printf("🧨 🧨  starting makeFullSpace(%d), about to startNewSpace\n", N);

	qSpace *space = startNewSpace(MAKEFULLSPACE_LABEL);
	if (traceMakeSpace) printf("        finished startNewSpace(), on to add\n");
	addSpaceDimension(N, contENDLESS, "x");
	if (traceMakeSpace) printf("        finished addSpaceDimension(), on to complete\n");
	fullSpaceSalientPointers = completeNewSpace();

	if (traceMakeSpace) printf("        finished makeFullSpace(%d)\n", N);
	return theSpace;
}

// 1d space, not with all the crud from above.
// qSpace returned; you are responsible for deleting it and allocating avatars.
// this space, you should be able to delete it directly with: delete space;
qSpace *makeBareSpace(int N, int continuum) {
	if (traceMakeSpace) printf("🧨 🧨 makeBareSpace(%d)\n", N);

	qSpace *space = new qSpace(MAKEBARESPACE_LABEL);
	if (traceMakeSpace) printf("    makeBareSpace: sizeof(qSpace) = %ld    space* = %p\n", sizeof(qSpace), space);
	space->addDimension(N, continuum, MAKEBARE1DDIM_LABEL);
	if (traceMakeSpace) printf("    makeBareSpace: did Add, about to Init\n");
	space->initSpace();

	if (traceMakeSpace) printf("    makeBareSpace: done\n");
	return space;
}

/* ******************************************************** helpers - waves */

// turn this off to see if a bug goes away when we avoid stomping on memory
static bool goAheadAndProve = true;

// fill up this buffer (of any kind) with some byte values just to prove that we can do it.
// Any kind of buffer/wave/array.  Size is number of BYTES.
// oh yeah read from each location, too.
// If I end up stomping on something I shouldn't, it'll crash soon enough.
// and cpputest might even detect that
void proveItsMine(void *buf, size_t size) {
	if (!goAheadAndProve) return;

	if (size == 0)
		throw std::runtime_error("proveItsMine()- size is zero");
	if (!buf)
		throw std::runtime_error("proveItsMine()- buf is NULL");

	uint8_t *buffer = (uint8_t *) buf;
	for (int i = 0; i < size; i++)
		buffer[i] = 0xAB ^ buffer[i];  // read And write
}

// make sure these two qBuffers have the same values (within ERROR_RADIUS absolute)
// if not, test fails
void compareWaves(qBuffer *qexpected, qBuffer *qactual) {
	qCx *expected = qexpected->wave;
	qCx *actual = qactual -> wave;

	// these should not be way way out
	LONGS_EQUAL_TEXT(qexpected->nPoints, qactual->nPoints, "Waves have different nPoints");
	LONGS_EQUAL_TEXT(qexpected->start, qactual->start, "Waves have different starts");
	LONGS_EQUAL_TEXT(qexpected->end, qactual->end, "Waves have different ends");

	// do the WHOLE THING including boundaries
	for (int ix = 0; ix < qexpected->nPoints; ix++) {
		// we can't use DOUBLES_EQUAL() cuz these aren't doubles, they're complex!
		CHECK_EQUAL(expected[ix], actual[ix]);
	}
}


static void complexEqualText(qCx cx1, qCx cx2, const char *msg) {
	DOUBLES_EQUAL_TEXT(cx1.re, cx2.re, ERROR_RADIUS, msg);
	DOUBLES_EQUAL_TEXT(cx1.im, cx2.im, ERROR_RADIUS, msg);
}

// need this to verify waves have a certain specific frequency.  Do this to the spectrum.
// returns TRUE if OK, false if not
bool isAllZeroesExceptFor(qBuffer *qwave, int except1, int except2) {
	qCx *wave = qwave->wave;
	int start = qwave->start;
	int end = qwave->end;
	char buf[100];

	for (int ix = start; ix < end; ix++) {
		qCx cx = wave[ix];
		sprintf(buf, "\nwave at [%d]  😢 bad value = %8.8lf %8.8lf\n",
			ix, cx.re, cx.im);

		if (ix != except1 && ix != except2) {
			if (cx != 0) {
				printf("not zero %s", buf);
				return false;
			}
		}
		else {
			if (cx.norm() < ERROR_RADIUS) {
				printf("is zero %s", buf);
				return false;
			}
		}
	}
	return true;
}

/* ********************************************** my favorite pseudo random number generator */

// set this any time you need a predictable sequence.  Probably a number -.5 to .5,
// or I dunno -10 to 10 or 100x or 100÷ that
double rando = PI - 3;

// a mediocre random number generator that's easy to type into a calculator.
// returns -.5 ... +.5
double nextRando(void) {
	double xxx;
	rando = modf(exp(rando + 7.4), &xxx);
	if (traceRando) printf("🎲 next rando num: %lf\n", rando);
	return rando - .5;
}

