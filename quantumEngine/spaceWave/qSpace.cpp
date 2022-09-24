/*
** quantum Space -- where an electron (or whatever) lives and moves around
**		and the forces that impact its motion and time evolution
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/


//#include <ctime>
#include <cstring>
#include "qSpace.h"
#include "../schrodinger/Avatar.h"
#include "qWave.h"
#include "qViewBuffer.h"
#include "../fourier/fftMain.h"



static bool traceFreeBuffer = false;

// someday I need an C++ error handling layer.  See
// https://emscripten.org/docs/porting/Debugging.html?highlight=assertions#handling-c-exceptions-from-javascript

/* ********************************************************** qSpace construction */

// note if you just use the constructor and these functions,
// NO waves or buffers will be allocated for you
qSpace::qSpace(const char *lab)
	: magic('qSpa'), nDimensions(0), potential(NULL), nPoints(0), nStates(0), freeBufferList(NULL), potentialFactor(.1) {

	//printf("🚀 🚀 qSpace::qSpace() constructor starts label:'%s'  this= %p\n", lab, (this));

	strncpy(label, lab, LABEL_LEN);
	label[LABEL_LEN] = 0;

	if (LABEL_LEN != 7 && LABEL_LEN != 15 && LABEL_LEN != 31)
		throw std::runtime_error("🚀 🚀 bad value for LABEL_LEN defined at compiler");

	//printf("🚀 🚀 qSpace::qSpace() constructor done this= %p, length %lx\n",
	//	(this), sizeof(qSpace));
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

	if (nPoints > spectrumLength)
		freeBufferLength = nPoints;
	else
		freeBufferLength = spectrumLength;
	if (traceFreeBuffer) {
		printf("🚀 🚀 qSpace::tallyDimensions, nPoints=%d   spectrumLength=%d   freeBufferLength=%d   ",
			nPoints, spectrumLength, freeBufferLength);
	}

	//printf("🚀 🚀  got past tallyDimensions; nStates=%d  nPoints=%d\n", nStates, nPoints);
}

// call this After addDIMENSION calls to get it ready to go.
// If nPoints is still zero, initSpace hasn't been called yet; failure
void qSpace::initSpace() {
	tallyDimensions();
	// now we know the sizes of buffers!!

	// part of the space: the lay of the land
	potential = new double[nPoints];


	// this allocates the qwaves so must call this after sizes have been decided
	// not there anymore avatar = new Avatar(this);

//	// try out different formulas here.  Um, this is actually set manually in CP
//	avatar->dt = 1. / (nStates * nStates);
	//double dt = dt = nStates * 0.02;  // try out different factors here

	// used only for the RKs - therefore obsolete
//	dtOverI = qCx(0., -dt);
//	halfDtOverI = qCx(0., -dt / 2.);
//	bufferNum = 0;
}

qSpace::~qSpace(void) {
//	printf("🚀 🚀 qSpace destructor starting %s, this= %p  \n", label, (this));
//	printf("🧨 🧨    made it this far, %s:%d    freeBufferList=%p\n", __FILE__, __LINE__, this->freeBufferList);

	// not there if initSpace() never called
	if (potential)
		delete[] potential;


	// these cached buffers need to go free... OBSOLETE
	clearFreeBuffers();

//	printf("🚀 🚀 qSpace destructor done this= %p\n", (this));
//	printf("🧨 🧨    made it this far, %s:%d  freeBufferList=%p\n", __FILE__, __LINE__, this->freeBufferList);
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

// now done in JS and szero is not a special case anymore
//void qSpace::setZeroPotential(void) {
//	qDimension *dims = dimensions;
//	printf("setZeroPotential\n");
//	for (int ix = 0; ix < dims->nPoints; ix++)
//		thePotential[ix] = 0.;
//
//	potentialFactor = 1.;
//}

// obsolete; now done in JS.
//void qSpace::setValleyPotential(double power = 1, double scale = 1, double offset = 0) {
//	printf("setValleyPotential power=%10.3lf  scale=%10.3lf  offset=%10.3lf\n", power, scale, offset);
//	qDimension *dims = dimensions;
//	double mid = round(dims->nStates * offset / 100) + dims->start;
//	for (int ix = dims->start; ix < dims->end; ix++) {
//		thePotential[ix] = pow(abs(ix - mid), power) * scale + offset;
//	}
//
//	potentialFactor = 1.;
//}



/* ********************************************************** FreeBuffer - ALL OBSOLETE */

// this is all on the honor system.  If you borrow a buf, you either have to return it
// with returnBuffer() or you free it with freeWave().
qCx *qSpace::borrowBuffer(void) {
	FreeBuffer *rentedCache = freeBufferList;
	if (rentedCache) {
		if (traceFreeBuffer) {
			printf("🚀 🚀 qSpace::borrowBuffer() with some cached. freeBufferList: %p\n",
			(freeBufferList));
		}

		// there was one available on the free list, pop it off
		freeBufferList = rentedCache->next;
		return (qCx *) rentedCache;
	}
	else {
		// must make a new one
		if (traceFreeBuffer) {
			printf("🚀 🚀 qSpace::borrowBuffer() with none cached. freeBufferList: %p   freeBufferLength: %d\n",
				freeBufferList, freeBufferLength);
		}
		return allocateWave(freeBufferLength);
	}
}

// return the buffer to the free list.  Potentially endless but probably not.
// do not return buffers that aren't the right size - freeBufferLength
void qSpace::returnBuffer(qCx *rentedBuffer) {
	printf("rentedBuffer: %p  freeBufferList=%p",
		rentedBuffer, freeBufferList);
	FreeBuffer *rented = (FreeBuffer *) rentedBuffer;
	rented->next = freeBufferList;
	freeBufferList = rented;
}

// this is the only way they're freed; otherwise they just collect.
// shouldn't be too many, though.  Called by destructor.
void qSpace::clearFreeBuffers() {
	//printf("🚀 🚀 qSpace::clearFreeBuffers() starting. freeBufferList: %p\n",
	//freeBufferList);
	FreeBuffer *n = freeBufferList;
	for (FreeBuffer *f = freeBufferList; f; f = n) {
		n = f->next;
		printf("           🚀 🚀 about to free this one: f=%p, n=%p\n", f, n);
		freeWave((qCx *) f);
	}
	freeBufferList = NULL;
	//printf("              🚀 🚀 qSpace::clearFreeBuffers() done. freeBufferList=%p\n",
	//	freeBufferList);
}
