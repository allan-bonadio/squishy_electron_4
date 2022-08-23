/*
** cppu main -- cppu Unit Test main source, top level
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/



#include "../squish.h"
#include "../spaceWave/qSpace.h"
#include "../schrodinger/Avatar.h"
#include "../spaceWave/qWave.h"
#include "../fourier/qSpectrum.h"
#include "../spaceWave/qViewBuffer.h"

#include "CppUTest/TestHarness.h"
#include "CppUTest/CommandLineTestRunner.h"
#include "CppUTest/SimpleString.h"

#include "./cppuMain.h"

// how do initializers in C++ work?
static void initExperiments(void) {
	int n0{};
	int n1{1};

	int nn0 = {0};
	int nn1 = {1};
//	int nn2 = {1, 2};

	qCx zombie[2] = {qCx(1.0, 2.0)};
	printf("n0:%d n1:%d nn0: %d   nn1: %d   zombie: %lf, %lf  ... %lf, %lf\n",
		n0, n1, nn0, nn1, zombie[0].re, zombie[0].im, zombie[1].re, zombie[1].im);
}

// for memory leaks that cppu conveniently gives us, some clues:
static void dumpSizes(void) {
	printf("byte sizes... sz(qSpace)=%lu  sz(qWave)=%lu  sz(qBuffer)=%lu  sz(qSpectrum)=%lu  sz(qViewBuffer)=%lu  sz(Avatar)=%lu\n\n",
		sizeof(qSpace), sizeof(qWave), sizeof(qBuffer), sizeof(qSpectrum), sizeof(qViewBuffer), sizeof(Avatar));
}


int main(int ac, char** av)
{
	//initExperiments();
	dumpSizes();

    return CommandLineTestRunner::RunAllTests(ac, av);
}

/* ******************************************************** helpers - cppu */

// CHECK_EQUAL() figures complex equality using our == operator.
// this only displays complex if a failure, for the message.
SimpleString StringFrom(const qCx value) {
	char buffer[100];
	snprintf(buffer, 100, "%15.12lf %+15.12lf•i", value.re, value.im);
	SimpleString buf = SimpleString(buffer);
	return buf;
}


/* ******************************************************** helpers - spaces */

static bool traceMakeSpace = false;

// in case someone wants some of the other pointers after making a fullSpace, here they are
salientPointersType *fullSpaceSalientPointers = NULL;

// make a new 1d space with N state locations along x, in theSpace, along with whatever else
// the way JS does it.  Needed for lots of tests.
// You are (usually) responsible for deleting it with deleteTheSpace().
// Space generated in theSpace.  Old theSpace triggers error if you don't deleteTheSpace().
// frees and reallocates laos, peru, thePotential and the ViewBuffer
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
// qSpace returned; you are responsible for deleting it and allocating buffers.
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


#define IAZ_TOLERANCE   1e-12

static void complexEqualText(qCx cx1, qCx cx2, const char *msg) {
	//printf("checking.   see if (%lf %lf) == (%lf %lf) close enough.\n",
	//	cx1.re, cx1.im, cx2.re, cx2.im);
	DOUBLES_EQUAL_TEXT(cx1.re, cx2.re, IAZ_TOLERANCE, msg);
	DOUBLES_EQUAL_TEXT(cx1.im, cx2.im, IAZ_TOLERANCE, msg);
}

// need this to verify waves have a certain specific frequency.  Do this to the spectrum.
void isAllZeroesExceptFor(qBuffer *qwave, int except1, int except2) {
	qCx *wave = qwave->wave;
	int start = qwave->start;
	int end = qwave->end;
	char buf[100];

	for (int ix = start; ix < end; ix++) {
		qCx cx = wave[ix];
		double re = cx.re, im = cx.im;
		sprintf(buf, "wave at [%d]  bad value = %8.8lf %8.8lf",
			ix, re, im);

		if (ix != except1 && ix != except2)
			complexEqualText(cx, qCx(0), buf);
		else
			CHECK_TEXT(cx.norm() > IAZ_TOLERANCE, buf);
	}
}



/* ********************************************** my favorite random number generator */

static bool traceRando = true;

// set this any time you need a predictable sequence.  Probably a number -.5 to .5,
// or I dunno -10 to 10 or 100x or 100÷ that
double rando = PI - 3;

// a mediocre random number generator that's easy to type into a calculator.
// returns -.5 ... +.5
double nextRando(void) {
	double xxx;
	rando = modf(exp(rando + 7.4), &xxx);
	if (traceRando) printf("next num: %lf\n", rando);
	return rando - .5;
}

