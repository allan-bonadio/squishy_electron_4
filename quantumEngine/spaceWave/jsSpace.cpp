/*
** js space -- interface to JS for qSpaces
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

//#include <string.h>
#include "qSpace.h"
#include "../schrodinger/qAvatar.h"
#include "../debroglie/qWave.h"
#include "qViewBuffer.h"

static bool traceSpaceCreation = true;
static bool traceAvatarDetail = false;
static bool traceExceptions = true;

// 'the' globals are for the one and only SquishPanel being displayed on this
// curent, preliminary version of SquishyElectron.  Along with various other
// important objects.  Someday we'll get the JS to hold these.
class qSpace *theSpace = NULL;
double *thePotential = NULL;


struct salientPointersType salientPointers;

/* ********************************************************** wave stuff */

// after the initSpace() call, allocate the buffers.
void allocWaves(void) {
	// we make our own potential
}

// call to destroy them
static void freeWaves(void) {
}

/* ********************************************************** glue functions for js */

// these are for JS only; they're all extern "C"
extern "C" {

void qSpace_dumpPotential(char *title) { theSpace->dumpPotential(title); }

void avatar_oneIteration(qAvatar *pointer) { pointer->oneIteration(); }


// if iterating, FFT as the current iterate finishes, before and after fourierFilter().
// If stopped, fft current wave. now.
void avatar_askForFFT(qAvatar *pointer) { pointer->askForFFT(); }

// this will normalize with the C++ normalize
void wave_normalize(qWave *qwave) {
	qwave->normalize();
}

/* ******************************************************** space creation from JS */


// call this to throw away existing theSpace and waves, and start new
// it's tedious to send a real data structure thru the emscripten interface, so the JS
// constructs the dimensions by repeated calls to addSpaceDimension()
// testing uses this return value.
qSpace *startNewSpace(const char *label) {
	if (traceSpaceCreation)
		printf("\n🚀 🚀 🚀  startNewSpace(%s), theSpace=%p (should be zero)\n", label, theSpace);

	// use theSpace as a way of detecting if they were freed before.
	if (theSpace)
		throw std::runtime_error("Trying to start a new space when one already exists!");

	theSpace = salientPointers.space = new qSpace(label);

	if (traceSpaceCreation) {
		printf("🚀 🚀 🚀  JS startNewSpace   done (%s == %s)   theSpace=%p\n",
			theSpace->label, label, theSpace);
	}

	return theSpace;
}

// call this from JS to add one or more dimensions
// nobody uses this return value either.
void addSpaceDimension(int N, int continuum, const char *label) {
	if (traceSpaceCreation) printf("🚀 addSpaceDimension(%d, %d, %s)\n", N, continuum, label);
	theSpace->addDimension(N, continuum, label);
}

// call this from JS to finish the process for the qSpace, create and add the avatars & potential
struct salientPointersType *completeNewSpace(void) {
	//printf("completeNewSpace starts\n");
	if (traceSpaceCreation) printf("🚀 🚀 🚀  JS completeNewSpace starts(%s)   theSpace=%p\n",
		theSpace->label, theSpace);

	// finish up all the dimensions now that we know them all
	theSpace->initSpace();

	if (traceAvatarDetail) printf("🚀 about to create avatars\n");

	qAvatar *mainAvatar = salientPointers.mainAvatar = theSpace->mainAvatar = new qAvatar(theSpace, "mainAvatar");
	salientPointers.mainVBuffer = mainAvatar->qvBuffer->vBuffer;
	if (traceAvatarDetail) printf("🚀 created mainAvatar\n");

	qAvatar *miniGraphAvatar = salientPointers.miniGraphAvatar = theSpace->miniGraphAvatar = new qAvatar(theSpace, "miniGraph");
	salientPointers.miniGraphVBuffer = miniGraphAvatar->qvBuffer->vBuffer;
	if (traceAvatarDetail) printf("🚀 created miniGraphAvatar\n");

	if (traceSpaceCreation) printf("   🚀 🚀 🚀 completeNewSpace vBuffers After Creation but BEFORE loadViewBuffer  "
		"salientPointers.mainVBuffer=%p   salientPointers.miniGraphVBuffer=%p  \n",
		salientPointers.mainVBuffer, salientPointers.miniGraphVBuffer);

	if (thePotential) throw std::runtime_error("🚀 🚀 🚀 thePotential exists while trying to create new one");
	salientPointers.potentialBuffer = thePotential = theSpace->potential;

	if (traceSpaceCreation) printf("   🚀 🚀 🚀 qSpace::jsSpace: done\n");
	return &salientPointers;
}

// dispose of ALL of everything attached to the space
void deleteTheSpace(qSpace *space) {
	if (traceSpaceCreation) printf("   🚀 🚀 🚀 deleteTheSpace(): starts, theSpace:%p, space to delete=%p\n",
		theSpace, space);
	if (theSpace != space)
		throw std::runtime_error("Trying to delete a space other than theSpace!");

	// deleting the avatars will delete their qWaves and qViewBuffers
	// not there if completeNewSpace() never called, even if initSpace() called
	if (theSpace->mainAvatar) {
		if (traceAvatarDetail) printf("   🚀 🚀 🚀 deleteTheSpace(): deleting avatars\n");
		delete theSpace->mainAvatar;
		theSpace->mainAvatar = NULL;
		delete theSpace->miniGraphAvatar;
		theSpace->miniGraphAvatar = NULL;
	}

	// potential going to be deleted cuz it's part of the space

	// deletes its potential
	delete theSpace;
	theSpace = NULL;
	thePotential = NULL;

	if (traceSpaceCreation) printf("    🚀  deleteTheSpace(): done.  theSpace=%p, thePotential=%p \n",
		theSpace, thePotential);
}

/* ***************************************************************************************************** exceptions */

// Given the mysterious number thrown when C++ barfs, get a real error message.  this is loosely from
// https://emscripten.org/docs/porting/Debugging.html#handling-c-exceptions-from-javascript
const char *getCppExceptionMessage(intptr_t exceptionPtrInt) {
	// what() returns a C string; pass pointer back to JS as integer
	if (traceExceptions) printf("getCppExceptionMessage(%ld) \n", exceptionPtrInt);
	if (exceptionPtrInt & 3)
		return "bad exc ptr";
	if (traceExceptions) printf("getCppExceptionMessage = '%s'\n",
		 reinterpret_cast<std::exception *>(exceptionPtrInt)->what());
	return reinterpret_cast<std::exception *>(exceptionPtrInt)->what();
}

// end of extern "C"
}

