/*
** quantum Space -- where an electron (or whatever) lives and moves around
**		and the forces that impact its motion and time evolution
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/


//#include <ctime>
#include <cstring>
#include "qSpace.h"
#include "../schrodinger/qAvatar.h"
#include "../debroglie/qWave.h"
#include "qViewBuffer.h"
#include "../fourier/fftMain.h"


static bool traceQSpace = false;

/* ********************************************************** qSpace construction */

// note if you just use the constructor and these functions,
// NO waves or buffers will be allocated for you
qSpace::qSpace(const char *lab)
	: magic('qSpa'), nDimensions(0), potential(NULL), nPoints(0), nStates(0), potentialFactor(.1) {

	if (traceQSpace) printf("🚀 🚀 qSpace::qSpace() constructor starts label:'%s'  this= %p\n", lab, (this));

	strncpy(label, lab, LABEL_LEN);
	label[LABEL_LEN] = 0;

	if (LABEL_LEN != 7 && LABEL_LEN != 15 && LABEL_LEN != 31)
		throw std::runtime_error("🚀 🚀 bad value for LABEL_LEN defined at compiler");

	if (traceQSpace) printf("🚀 🚀 qSpace::qSpace() constructor done this= %p, length %lx\n",
			(this), sizeof(qSpace));
}

// after the contructor, call this to add each dimension up to MAX_DIMENSIONS
void qSpace::addDimension(int N, int continuum, const char *label) {
	if (nDimensions >= MAX_DIMENSIONS) {
		printf("🚀 🚀 Error dimensions: %d\n", nDimensions);
		throw std::runtime_error("🚀 🚀 too many dimensions");
	}

	// start of the next dim
	qDimension *dims = dimensions + nDimensions;
	dims->N = N;
	dims->continuum = continuum;

	dims->start = continuum ? 1 : 0;
	dims->end = N + dims->start;

	strncpy(dims->label, label, LABEL_LEN);
	dims->label[LABEL_LEN] = 0;

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
	potential = new double[nPoints];


	// this allocates the qwaves so must call this after sizes have been decided
	// not there anymore avatar = new qAvatar(this);

//	// try out different formulas here.  Um, this is actually set manually in CP
//	avatar->dt = 1. / (nStates * nStates);
	//double dt = dt = nStates * 0.02;  // try out different factors here

	// used only for the RKs - therefore obsolete
//	dtOverI = qCx(0., -dt);
//	halfDtOverI = qCx(0., -dt / 2.);
//	bufferNum = 0;
}

// the avatars are deleted in deleteTheSpace
qSpace::~qSpace(void) {
	if (traceQSpace) printf("🚀 🚀 qSpace destructor starting %s, this= %p  \n", label, (this));

	// not there if initSpace() never called
	if (potential)
		delete[] potential;

	if (traceQSpace) printf("🚀 🚀 qSpace destructor done this= %p\n", (this));
}


/* ********************************************************** potential */

// is this obsolete?  no, need it for C++ testing
void qSpace::dumpPotential(const char *title) {
	int ix;
	qDimension *dims = dimensions;

	printf("🚀 🚀 == Potential %s, %d...%d\n", title, dims->start, dims->end);

	int half = dims->N / 2;
	int quarter = dims->N / 4;
	int quarterEnd = dims->start + quarter;
	for (ix = dims->start; ix < quarterEnd; ix++) {

		printf("[%3d] %8.4lg   [%3d] %8.4lg   [%3d] %8.4lg   [%3d] %8.4lg\n",
			ix, potential[ix], ix+quarter, potential[ix+quarter],
			ix+half, potential[ix+half], ix+half+quarter, potential[ix+half+quarter]);
	}
	printf("🚀 🚀 == Potential %s, %d...%d\n", title, dims->start, dims->end);
}

