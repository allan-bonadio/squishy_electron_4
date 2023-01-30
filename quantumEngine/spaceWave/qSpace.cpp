/*
** quantum Space -- where an electron (or whatever) lives and moves around
**		and the forces that impact its motion and time evolution
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/


#include <cstring>
#include <stdexcept>

#include "qSpace.h"
#include "../greiman/qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "../debroglie/qWave.h"
#include "../greiman/qViewBuffer.h"
#include "../fourier/fftMain.h"
#include "../directAccessors.h"


static bool traceQSpace = false;

/* ********************************************************** qSpace construction */

// note if you just use the constructor and these functions,
// NO waves or buffers will be allocated for you
qSpace::qSpace(const char *lab)
	: magic('Spac'), nDimensions(0), voltage(NULL), nPoints(0), nStates(0), voltageFactor(-.1) {

	if (traceQSpace) printf("🚀 🚀 qSpace::qSpace() constructor starts label:'%s'  this= %p\n", lab, (this));

	strncpy(label, lab, MAX_LABEL_LEN);
	label[MAX_LABEL_LEN] = 0;

	if (MAX_LABEL_LEN != 7 && MAX_LABEL_LEN != 15 && MAX_LABEL_LEN != 31)
		throw std::runtime_error("🚀 🚀 bad value for MAX_LABEL_LEN defined at compiler");

	if (traceQSpace) printf("🚀 🚀 qSpace::qSpace() constructor done this= %p, length %lx\n",
			(this), sizeof(qSpace));

	// put this in the constructor so it's run early on, in case you have to rebuild them all
	FORMAT_DIRECT_OFFSETS;
}

// after the contructor, call this to add each dimension up to MAX_DIMENSIONS
void qSpace::addDimension(int N, int continuum, double dx, const char *label) {
	if (nDimensions >= MAX_DIMENSIONS) {
		printf("🚀 🚀 Error dimensions: %d\n", nDimensions);
		throw std::runtime_error("🚀 🚀 too many dimensions");
	}

	// start of the next dim
	qDimension *dims = dimensions + nDimensions;
	dims->N = N;
	dims->continuum = continuum;
	dims->dx = dx;

	dims->start = continuum ? 1 : 0;
	dims->end = N + dims->start;

	strncpy(dims->label, label, MAX_LABEL_LEN);
	dims->label[MAX_LABEL_LEN] = 0;

	nDimensions++;
}

// after all the addDimension calls, what have we got?  calculate, not alloc.
void qSpace::tallyDimensions(void) {
	nPoints = 1;
	nStates = 1;

	int ix;
	// finish up all the dimensions now that we know them all - inside out
	for (ix = nDimensions-1; ix >= 0; ix--) {
		qDimension *dim = dimensions + ix;

		nStates *= dim->N;
		dim->nStates = nStates;
		nPoints *= dim->start + dim->end;
		dim->nPoints = nPoints;

		dim->chooseSpectrumLength();
	}

	spectrumLength = dimensions[0].spectrumLength;

	if (traceQSpace) printf("🚀 🚀  got past tallyDimensions; nStates=%d  nPoints=%d\n", nStates, nPoints);
}

// call this After addDIMENSION calls to get it ready to go.
// If nPoints is still zero, initSpace hasn't been called yet; failure
void qSpace::initSpace() {
	tallyDimensions();
	// now we know the sizes of buffers!!

	// part of the space: the lay of the land
	voltage = new double[nPoints];
}

// the avatars and grinder are deleted in deleteFullSpace
qSpace::~qSpace(void) {
	if (traceQSpace) printf("🚀 🚀 qSpace destructor starting %s, this= %p  \n", label, (this));

	// not there if initSpace() never called
	if (voltage)
		delete[] voltage;

	if (traceQSpace) printf("🚀 🚀 qSpace destructor done this= %p\n", (this));
}

// need these numbers for the js interface to this object, to figure out the offsets.
// see eGrinder.js ;  usually this function isn't called.
// Insert this into the constructor and run this once.  Copy text output.
// Paste the output into class eGrinder, the class itself, to replace the existing ones
void qSpace::formatDirectOffsets(void) {
	printf("🪓 🪓 --------------- starting qSpace direct access JS getters & setters--------------\n\n");

	makePointerGetter(voltage);
	makeDoubleGetter(voltageFactor);
	printf("\n");

	/* *********************************************** dimensions */

	makeNamedIntGetter(N, dimensions[0].N);  // until 2nd D
	makeNamedIntGetter(continuum, dimensions[0].continuum);  // until 2nd D
	makeNamedIntGetter(dx, dimensions[0].dx);  // until 2nd D
	makeNamedIntGetter(start, dimensions[0].start);  // until 2nd D
	makeNamedIntGetter(end, dimensions[0].end);  // until 2nd D
	makeNamedIntGetter(nStates0, dimensions[0].nStates);
	makeNamedIntGetter(nPoints0, dimensions[0].nPoints);
	makeNamedIntGetter(spectrumLength0, dimensions[0].spectrumLength);
	makeNamedStringPointer(label0, dimensions[0].label);


	/* *********************************************** scalars */

	makeIntGetter(nDimensions);
	makeIntGetter(nStates);
	makeIntGetter(nPoints);
	makeIntGetter(spectrumLength);

	makePointerGetter(mainAvatar);
	makePointerGetter(miniGraphAvatar);
	makePointerGetter(grinder);

	makeStringPointer(label);

	printf("\n🖼 🖼 --------------- done with qSpace direct access --------------\n");
}

/* ********************************************************** voltage */

// is this obsolete?  no, need it for C++ testing
void qSpace::dumpVoltage(const char *title) {
	int ix;
	qDimension *dims = dimensions;

	printf("🚀 🚀 == Voltage %s, %d...%d\n", title, dims->start, dims->end);

	int half = dims->N / 2;
	int quarter = dims->N / 4;
	int quarterEnd = dims->start + quarter;
	for (ix = dims->start; ix < quarterEnd; ix++) {

		printf("[%3d] %8.4lg   [%3d] %8.4lg   [%3d] %8.4lg   [%3d] %8.4lg\n",
			ix, voltage[ix], ix+quarter, voltage[ix+quarter],
			ix+half, voltage[ix+half], ix+half+quarter, voltage[ix+half+quarter]);
	}
	printf("🚀 🚀 == Voltage %s, %d...%d\n", title, dims->start, dims->end);
}

