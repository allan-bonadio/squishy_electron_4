/*
** quantum Wave -- quantum wave buffer
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

#include <stdexcept>

#include "../hilbert/qSpace.h"
#include "../greiman/qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "qWave.h"
#include "../directAccessors.h"

int traceCreate = false;

/* ************************************************************ birth & death & basics */

// This produces a wave ready to hold an electron
qWave::qWave(qSpace *sp, qCx *useThisBuffer)
	: qBuffer() {

	if (! sp)
		throw "qWave::qWave null space";
	magic = 'Wave';
	space = sp;

	if (traceCreate) {
		printf("🌊🌊 qWave::qWave(%s)  utb=%p => this=%p\n", space->label,
			useThisBuffer, this);
		printf("🌊🌊 qWave::qWave() wave's Space: %p  nPoints:%d\n", (space), space->nPoints);
		printf("      🌊🌊        qWave: %p\n", (this));
	}

	initBuffer(space->nPoints, useThisBuffer);

	if (traceCreate)
		printf("      🌊🌊  allocated wave: %p\n", (wave));
	qDimension *dim = space->dimensions;
	nPoints = dim->nPoints;
	start = dim->start;
	end = dim->end;
	continuum = dim->continuum;

	if (traceCreate) {
		printf("🌊🌊 allocated qWave::qWave resulting qWave obj: %p   sizeof qWave = x%lx\n",
			this, (long) sizeof(qWave));
		printf("        sizeof(int):%ld   sizeof(void *):%ld\n", sizeof(int), sizeof(void *));
	}

	FORMAT_DIRECT_OFFSETS;
}

qWave::~qWave(void) {
	// the qBuffer superclass frees the wave just like it allocates it

	if (traceCreate) {
		printf("🌊🌊 qWave::~qWave resulting qWave obj: %p \n",
			this);
		printf("        sizeof(int):%ld   sizeof(void *):%ld\n", sizeof(int), sizeof(void *));
	}
}


	/* *********************************************** direct access */

// Insert this into the constructor and run this once.  Copy text output.
// Paste the output into class eWave, the class itself, to replace the existing ones
void qWave::formatDirectOffsets(void) {
	// don't need magic
	printf("🚦 🚦 --------------- starting qWave direct access JS getters & setters --------------\n\n");

	makePointerGetter(wave);

	printf("\n");
	makeIntGetter(nPoints);
	makeIntGetter(start);
	makeIntGetter(end);
	makeIntGetter(continuum);

	printf("\n🚦 🚦 --------------- done with qWave direct access --------------\n");
}


	/* *********************************************** iterators */


/* never tested - might never work  */
void qWave::forEachPoint(void (*callback)(qCx, int) ) {
	qDimension *dims = space->dimensions;
	int end = dims->end + dims->start;
	qCx *wave = wave;
	for (int ix = 0; ix < end; ix++) {
		callback(wave[ix], ix);
	}
}

/* never tested - might never work   */
void qWave::forEachState(void (*callback)(qCx, int) ) {
	qDimension *dims = space->dimensions;
	int end = dims->end;
	qCx *wave = wave;
	for (int ix = dims->start; ix < end; ix++) {
		callback(wave[ix], ix);
	}
}

/* ************************************************* bad ideas I might revisit?  */

double cleanOneNumber(double u, int ix, int sense) {
	if (!isfinite(u)) {
		// just enough to be nonzero without affecting the balance
		printf("🌊🌊 had to prune [%3d]= %f\n", ix, u);
		double faker = sense ? 1e-9 :  -1e-9;
		return faker;
	}
	return u;
}

// look for NaNs and other foul numbers, and replace them with something .. better.
void qWave::prune() {
	printf("🌊🌊 Do we really have to do this?  let's stop.\n");

	qDimension *dims = space->dimensions;
	qCx *wave = wave;
	for (int ix = dims->start; ix < dims->end; ix++) {
		wave[ix].re = cleanOneNumber(wave[ix].re, ix, ix & 1);
		wave[ix].im = cleanOneNumber(wave[ix].im, ix, ix & 2);
	}
}

