/*
** cppu main -- cppu Unit Test main source, and cppu-specific helpers
** Copyright (C) 2022-2024 Tactile Interactive, all rights reserved
*/

#include <stdexcept>
#include <cstring>

#include "../debroglie/qWave.h"
#include "../debroglie/qFlick.h"
#include "../fourier/qSpectrum.h"
#include "../greiman/qAvatar.h"
#include "../greiman/qViewBuffer.h"
#include "../schrodinger/qGrinder.h"
#include "../schrodinger/abacus.h"
#include "../hilbert/qSpace.h"

#include "CppUTest/TestHarness.h"
#include "CppUTest/CommandLineTestRunner.h"
#include "CppUTest/SimpleString.h"

#include "./cppuMain.h"

// for memory leaks that cppu conveniently gives us, some clues:
static void dumpSizes(void) {
	printf("byte sizes... sz(qSpace)=%lu  sz(qWave)=%lu  sz(qBuffer)=%lu  sz(qSpectrum)=%lu  \n"
		"sz(qFlick)=%lu  sz(qViewBuffer)=%lu  sz(qAvatar)=%lu  sz(qGrinder)=%lu\n"
		"sz(abacus)=%lu  sz(edge)=%lu  sz(progress)=%lu\n\n",
		sizeof(qSpace), sizeof(qWave), sizeof(qBuffer), sizeof(qSpectrum),
		sizeof(qFlick), sizeof(qViewBuffer), sizeof(qAvatar), sizeof(qGrinder),
		sizeof(abacus), sizeof(edge), sizeof(progress));
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
	snprintf(buffer, 100, "%13.8lf %+13.8lf•i", value.re, value.im);

	// funny i gotta do it, thought it would just compare like strings
	for (int j = strlen(buffer); j < 100; j++)
		buffer[j] = 0;

	SimpleString buf = SimpleString(buffer);
	return buf;
}



/* ******************************************************** helpers - waves */


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
		// should use complexEqualText()
		DOUBLES_EQUAL(expected[ix].re, actual[ix].re, 1e-10);
		DOUBLES_EQUAL(expected[ix].im, actual[ix].im, 1e-10);
	}
}


static void complexEqualText(qCx cx1, qCx cx2, const char *msg) {
	DOUBLES_EQUAL_TEXT(cx1.re, cx2.re, ERROR_RADIUS, msg);
	DOUBLES_EQUAL_TEXT(cx1.im, cx2.im, ERROR_RADIUS, msg);
}

