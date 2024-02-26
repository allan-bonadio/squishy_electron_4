/*
** testing helpers -- C++ general utilities to help with unit tests and other tests
** Copyright (C) 2023-2024 Tactile Interactive, all rights reserved
*/

#include <stdexcept>
#include <cstring>

#include "../debroglie/qWave.h"
#include "../fourier/qSpectrum.h"
#include "../greiman/qAvatar.h"
#include "../greiman/qViewBuffer.h"
#include "../schrodinger/qGrinder.h"
#include "../hilbert/qSpace.h"
#include "testingHelpers.h"


static bool traceRando = false;


/* ******************************************************** helpers - spaces */

static bool traceMakeSpace = false;

// make a new 1d space with N state locations along x, in space, along with whatever else
// the way JS does it.  Needed for lots of tests.
// You are (usually) responsible for deleting it with deleteFullSpace(space).
qSpace *makeFullSpace(int N) {
	if (traceMakeSpace) printf("🧨 🧨  starting makeFullSpace(%d), about to startNewSpace\n", N);

	qSpace *space = startNewSpace(MAKEFULLSPACE_LABEL);
	if (traceMakeSpace) printf("        finished startNewSpace(), on to add\n");
	addSpaceDimension(space, N, contENDLESS, 10, "x");
	if (traceMakeSpace) printf("        finished addSpaceDimension(), on to complete\n");
	completeNewSpace(space, 1);

	if (traceMakeSpace) printf("        finished makeFullSpace(%d)\n", N);
	return space;
}

// 1d space, not with all the crud from above.
// qSpace returned; you are responsible for deleting it and allocating avatars.
// this space, you should be able to delete it directly with: delete space;
qSpace *makeBareSpace(int N, int continuum) {
	if (traceMakeSpace) printf("🧨 🧨 makeBareSpace(%d)\n", N);

	qSpace *space = new qSpace(MAKEBARESPACE_LABEL);
	if (traceMakeSpace) printf("    makeBareSpace: sizeof(qSpace) = %ld    space* = %p\n",
		sizeof(qSpace), space);
	space->addDimension(N, continuum, .37, MAKEBARE1DDIM_LABEL);
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

// take a wave, and print out a C++ declaration and initializer that you can paste back into your spec file
void dumpWaveInitializer(const char *varName, qCx *psi, int nPoints) {
	printf("static qCx %s[%d] = {\n", varName, nPoints);
	for (int ix = 0; ix < nPoints; ix++) {
		printf("qCx(%16.10lf,  %16.10lf),  // %d\n",
			psi[ix].re, psi[ix].im, ix);
	}
	printf("};\n");
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

