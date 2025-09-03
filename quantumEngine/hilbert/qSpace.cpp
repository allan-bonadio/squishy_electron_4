/*
** quantum Space -- where an electron (or whatever) lives and moves around
**		and the forces that impact its motion and time evolution
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/


#include <cstring>
#include <stdexcept>

#include "qSpace.h"
#include "../greiman/qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "../debroglie/qWave.h"
#include "../fourier/fftMain.h"
#include "../directAccessors.h"


static bool traceQSpace = false;
static bool traceSpaceCreation = false;

/* ********************************************************** qSpace construction */

// note if you just use the constructor and these functions,
// NO waves or buffers will be allocated for you.
// Use the functions in jsSpace.cpp to do  practical constructions.
qSpace::qSpace(const char *lab)
	: magic('Spac'), nDimensions(0), voltage(NULL), nPoints(0), nStates(0) {

	if (traceQSpace) {
		printf("🚀 🚀 qSpace::qSpace() constructor starts. label:'%s'  this= %p\n",
			lab, (this));
		printf("      ℏ=%8.3g, m_e=%8.3g, ℏOver2m_e=%8.3g, inverseℏ=%8.3g\n",
			ℏ, m_e, ℏOver2m_e, inverseℏ);
	}

	strncpy(label, lab, MAX_LABEL_LEN);
	label[MAX_LABEL_LEN] = 0;

	if (traceQSpace) {
		printf("🚀 🚀 qSpace::qSpace() constructor done this= %p, length %lx\n",
			(this), sizeof(qSpace));
	}

	// put this in the constructor so it's run early on, in case you have to rebuild them all
	FORMAT_DIRECT_OFFSETS;
}

// after the contructor, call this to add each dimension up to MAX_DIMENSIONS
void qSpace::addDimension(int N, int continuum, double dimLength, const char *label) {
	if (nDimensions >= MAX_DIMENSIONS) {
		printf("🚀 Error dimensions: %d\n", nDimensions);
		throw std::runtime_error("🚀 too many dimensions");
	}

	// start of the next dim
	qDimension *dim = dimensions + nDimensions;
	dim->N = N;
	dim->continuum = continuum;

	// each datapoint represents a segment of the length DX wide.  How wide is each?
	int nSegments = N;
	if (contWELL == continuum)
		nSegments--;

	dim->dimLength = dimLength;
	dim->DX = dimLength / nSegments;

	dim->start = continuum ? 1 : 0;
	dim->end = N + dim->start;

	strncpy(dim->label, label, MAX_LABEL_LEN);
	dim->label[MAX_LABEL_LEN] = 0;

	if (traceSpaceCreation)
		dim->dumpDimension();
	nDimensions++;
}

// do the tally for JUST THIS dimension
void qDimension::dumpDimension(void) {
	printf("dimension %s: 🚀\n", label);
	printf("    N=%d   continuum=%d   start=%d   end=%d   nStates=%d   nPoints=%d  🚀"
			" dimLength=%lg.4      DX=%lg.4      d2Coeff=%lg.4     spectrumLength=%d\n",
			N, continuum, start, end, nStates, nPoints, dimLength, DX, d2Coeff, spectrumLength);
}

// do the tally for JUST THIS dimension
void qDimension::tally(qSpace *space) {
	space->nStates *= N;
	nStates = space->nStates;  // accumulates states of prev dims
	space->nPoints *= start + end;
	nPoints = space->nPoints;  // accumulates

	chooseSpectrumLength();

	double dx2 = DX * DX;
	d2Coeff = ℏOver2m_e / dx2;
	space->alpha += d2Coeff;
}

// do the tally for ALL DIMENSIONS, COMBINED.  after all the addDimension calls,
// what have we got?  calculate, not alloc.  This kindof assumes one dimensions; i'll figure it out later.
void qSpace::tallyDimensions(void) {
	nPoints = 1;
	nStates = 1;

	// when we get into multiple dimensions, we have to get the harmonic sum of the dx²s.
	// use the formula given here:
	// https://en.wikipedia.org/wiki/FTCS_scheme#Stability
	// where the alpha we use here already has the dx²s divided out.
	// Units 1/time
	alpha = 0;

	// finish up all the dimensions now that we know them all - inside out
	for (int dd = nDimensions-1; dd >= 0; dd--) {
		dimensions[dd].tally(this);
	}
	dt = 1 / (2 * alpha);

	spectrumLength = dimensions[0].spectrumLength;

	if (traceQSpace) {
		printf("🚀  got past tallyDimensions; nStates=%d  nPoints=%d\n", nStates, nPoints);
		printf("   d2Coeff=%lf  alpha=%lf /ps  dt=%lf ps\n",
			dimensions[0].d2Coeff, alpha, dt);
	}
}

// call this After addDimension calls to get it ready to go.
// If nPoints is still zero, initSpace hasn't been called yet; failure
void qSpace::initSpace() {
	tallyDimensions();
	// now we know the sizes of buffers!!

	// part of the space: the lay of the land
	voltage = new double[nPoints];
}

// the avatars and grinder are deleted in deleteFullSpace
qSpace::~qSpace(void) {
	if (traceQSpace) printf("🚀 qSpace destructor starting %s, this= %p  \n", label, (this));

	// not there if initSpace() never called
	if (voltage)
		delete[] voltage;

	if (traceQSpace) printf("🚀 qSpace destructor done this= %p\n", (this));
}

// need these numbers for the js interface to this object, to figure out the offsets.
// see eGrinder.js ;  usually this function isn't called.
// Insert this into the constructor and run this once.  Copy text output.
// Paste the output into class eGrinder, the class itself, to replace the existing ones
void qSpace::formatDirectOffsets(void) {
	printf("🚀 🚀--------------- starting 🥽 eSpace direct access 🥽 JS getters & setters--------------\n\n");

	makePointerGetter(voltage);
	printf("\n");

	/* *********************************************** dimensions */

	makeNamedIntGetter(N, dimensions[0].N);  // until 2nd D
	makeNamedIntGetter(continuum, dimensions[0].continuum);  // until 2nd D
	makeNamedIntGetter(start, dimensions[0].start);  // until 2nd D
	makeNamedIntGetter(end, dimensions[0].end);  // until 2nd D
	makeIntGetter(nStates);
	makeIntGetter(nPoints);

	makeNamedDoubleGetter(dimLength, dimensions[0].dimLength);  // until 2nd D

//	makeNamedIntGetter(nStates0, dimensions[0].nStates);
//	makeNamedIntGetter(nPoints0, dimensions[0].nPoints);
//	makeNamedIntGetter(spaceLength0, dimensions[0].dimLength);
//
//	makeNamedIntGetter(spectrumLength0, dimensions[0].spectrumLength);
//	makeNamedDoubleGetter(dLength0, dimensions[0].DX);  // until 2nd D
//	makeNamedStringPointer(label0, dimensions[0].label);


	/* *********************************************** scalars */

	makeDoubleGetter(dt);

	makeIntGetter(nDimensions);
	makeIntGetter(spectrumLength);

	makePointerGetter(mainAvatar);
	makePointerGetter(miniGraphAvatar);
	makePointerGetter(grinder);

	makeStringPointer(label);

	printf("\n🚀 🚀  --------------- done with 🥽 eSpace direct access 🥽 --------------\n");
}

/* ********************************************************** dumping */

// is this obsolete?  no, need it for C++ testing
void qSpace::dumpVoltage(const char *title) {
	int ix;
	qDimension *dims = dimensions;

	printf("🚀 == Voltage %s, %d...%d\n", title, dims[0].start, dims[0].end);

	int half = dims[0].N / 2;
	int quarter = dims[0].N / 4;
	int quarterEnd = dims[0].start + quarter;
	for (ix = dims[0].start; ix < quarterEnd; ix++) {

		printf("[%3d] %8.4lg   [%3d] %8.4lg   [%3d] %8.4lg   [%3d] %8.4lg\n",
			ix, voltage[ix], ix+quarter, voltage[ix+quarter],
			ix+half, voltage[ix+half], ix+half+quarter, voltage[ix+half+quarter]);
	}
	printf("🚀 == Voltage %s, %d...%d\n", title, dims[0].start, dims[0].end);
}

void qSpace::dumpSpace(void) {
	printf("All %d dimensions of this space %s:\n", nDimensions, label);

	for (int d = 0; d < nDimensions; d++) {
		dimensions[d].dumpDimension();
	}

	printf("magic=" MAGIC_FORMAT ", alpha=%lg.4, dt=%lg.4, nStates=%d, nPoints=%d, spectrumLength=%d",
			MAGIC_ARGS, 	alpha, 	dt, 	nStates, 	nPoints, 	spectrumLength);

	printf("qDimension length: %lul   qSpace length: %lul\n", sizeof(qDimension), sizeof(qSpace));

}
