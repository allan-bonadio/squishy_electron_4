/*
** js space -- interface to JS for qSpaces
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

#include <string>
#include <emscripten/bind.h>
#include "qSpace.h"
#include "../schrodinger/Avatar.h"
#include "qWave.h"
#include "qViewBuffer.h"



static bool traceSpaceCreation = false;


// 'the' globals are for the one and only SquishPanel being displayed on this
// curent, preliminary version of SquishyElectron.  Along with various other
// important objects.  Someday we'll get the JS to hold these.
class qSpace *theSpace = NULL;
double *thePotential = NULL;
class Avatar *theAvatar = NULL;
qViewBuffer *theQViewBuffer = NULL;


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

// return a pointer to just the main wave for theSpace
// i guess it's not used anymore
//qCx *Avatar_getWaveBuffer(void) {
//	//printf("🚀 🚀 🚀 Avatar_getWaveBuffer() theSpace: %p\n", (theSpace));
//	//printf("        🚀 🚀 🚀        the qWave %p\n", (theAvatar->mainQWave));
//	//printf("        🚀 🚀 🚀        the wave %p\n", (theAvatar->mainQWave->wave));
////	printf("        🚀 🚀 🚀     q=w %d   s=w %d   q=s %d\n",
////		(uintptr_t) (theAvatar->mainQWave) == (uintptr_t)  (theAvatar->mainQWave->wave),
////		(uintptr_t) (theSpace) == (uintptr_t) (theAvatar->mainQWave->wave),
////		(uintptr_t) (theAvatar->mainQWave) == (uintptr_t) (theSpace)
////	);
//
//	return theAvatar->mainQWave->wave;
//}

double Avatar_getElapsedTime(void) {
	if (!theSpace) throw std::runtime_error("🚀 🚀 🚀 null space in getElapsedTime()");
	return theAvatar->elapsedTime;
}

double Avatar_getIterateSerial(void) {
	if (!theSpace) throw std::runtime_error("🚀 🚀 🚀 null space in getIterateSerial()");
	return theAvatar->iterateSerial;
}

void qSpace_dumpPotential(char *title) { theSpace->dumpPotential(title); }
//void qSpace_setZeroPotential(void) { theSpace->setZeroPotential(); }
//void qSpace_setValleyPotential(double power, double scale, double offset) {
//	theSpace->setValleyPotential(power, scale, offset);
//}

void Avatar_setDt(double dt) {
	theAvatar->dt = dt;
}

// iterations are what the user sees.  steps are what Visscher does repeatedly.
void Avatar_setStepsPerIteration(int stepsPerIteration) {
	//printf("🚀 🚀 🚀 Avatar_setStepsPerIteration(%d)\n", stepsPerIteration);
	if (stepsPerIteration < 1 || stepsPerIteration > 1e8) {
		char buf[100];
		snprintf(buf, 100, "Avatar_setStepsPerIteration, %d, is <1 or too big\n", stepsPerIteration);
		throw std::runtime_error(buf);
	}
	theAvatar->stepsPerIteration = stepsPerIteration;
	//printf("🚀 🚀 🚀 Avatar_setStepsPerIteration result %d in theSpace=%p\n",
	//	theAvatar->stepsPerIteration, theSpace);
}

// low pass filter.
void Avatar_setLowPassFilter(int lowPassFilter) {
	//printf("🚀 🚀 🚀 Avatar_setLowPassFilter(%d)\n", dilution);
	theAvatar->lowPassFilter = lowPassFilter;
	//printf("🚀 🚀 🚀 Avatar_setLowPassFilter result %d in theSpace=%p\n",
	//	theAvatar->lowPassFilter, theSpace);
}

void Avatar_oneIteration(void) { theAvatar->oneIteration(); }
void Avatar_resetCounters(void) { theAvatar->resetCounters(); }

// if iterating, FFT after the current iterate finishes.  If stopped, fft current wave.
void Avatar_askForFFT(void) { theAvatar->askForFFT(); }

// this will normalize with the C++ normalize which also sets maxNorm
void Avatar_normalize(void) { theAvatar->mainQWave->normalize(); }


/* ******************************************************** space creation from JS */


// call this to throw away existing theSpace and waves, and start new
// it's tedious to send a real data structure thru the emscripten interface, so the JS
// constructs the dimensions by repeated calls to addSpaceDimension()
// testing uses this return value.
qSpace *startNewSpace(const char *label) {
	if (traceSpaceCreation)
		printf("🚀 🚀 🚀  startNewSpace(%s), theSpace=%p (should be zero)\n", label, theSpace);

	// use theSpace as a way of detecting if they were freed before.
	if (theSpace)
		throw std::runtime_error("Trying to start a new space when one already exists!");

	//printf("🚀 🚀 🚀  startNewSpace: about to construct new space  itself '%s'\n", label);
	theSpace = salientPointers.space = new qSpace(label);

	//theAvatar = NULL;

	if (traceSpaceCreation) {
		printf("🚀 🚀 🚀  JS startNewSpace   done (%s == %s)   theSpace=%p, freeBufferList: %p\n",
			theSpace->label, label, theSpace, theSpace->freeBufferList);
	}

	return theSpace;
}

// call this from JS to add one or more dimensions
// nobody uses this return value either.
void addSpaceDimension(int N, int continuum, const char *label) {
	if (traceSpaceCreation) printf("addSpaceDimension(%d, %d, %s)   %p\n", N, continuum, label, theSpace->freeBufferList);
	theSpace->addDimension(N, continuum, label);
	if (traceSpaceCreation) printf("🚀 🚀 🚀  addSpaceDimension(): freeBufferList: %p\n", theSpace->freeBufferList);
}

// call this from JS to finish the process
struct salientPointersType *completeNewSpace(void) {
	//printf("completeNewSpace starts\n");
	if (traceSpaceCreation) printf("🚀 🚀 🚀  JS completeNewSpace starts(%s)   theSpace=%p, freeBufferList: %p\n",
		theSpace->label, theSpace, theSpace->freeBufferList);

	// finish up all the dimensions now that we know them all
	theSpace->initSpace();

	if (theAvatar) throw std::runtime_error("🚀 🚀 🚀 theAvatar exists while trying to create new one");
	theAvatar = salientPointers.theAvatar = new Avatar(theSpace);
	salientPointers.miniGraphAvatar = new Avatar(theSpace);
	//printf("did initSpace\n");


	if (thePotential) throw std::runtime_error("🚀 🚀 🚀 thePotential exists while trying to create new one");
	salientPointers.potentialBuffer = thePotential = theSpace->potential;

	theQViewBuffer = theAvatar->qvBuffer;
	salientPointers.vBuffer = theQViewBuffer->vBuffer;

	if (traceSpaceCreation) printf("   🚀 🚀 🚀 completeNewSpace After Creation but BEFORE loadViewBuffer  "
		"theQViewBuffer=%p  theQViewBuffer->vBuffer=%p  freeBufferList=%p\n",
		theQViewBuffer, theQViewBuffer ?  theQViewBuffer->vBuffer : NULL,
		theSpace->freeBufferList
	);

	salientPointers.mainWaveBuffer = theAvatar->mainQWave->wave;

	if (traceSpaceCreation) printf("   🚀 🚀 🚀 qSpace::jsSpace: done\n");
	return &salientPointers;
}

// dispose of ALL of that
void deleteTheSpace() {
	//printf("   🚀 🚀 🚀 deleteTheSpace(): starts\n");

	// not there if completeNewSpace() never called, even if initSpace() called
	if (theAvatar) {
		delete theAvatar;
		delete salientPointers.miniGraphAvatar;
	}
	theAvatar = NULL;
	theQViewBuffer = NULL;

	// going to be deleted cuz it's part of the space
	thePotential = NULL;

	//printf("    deleteTheSpace(): finished freeWaves\n");

	delete theSpace;
	theSpace = NULL;
	//printf("    deleteTheSpace(): done\n");
}


// Given the mysterious number thrown when C++ bartfs, get a real error message.  this is loosely from
// https://emscripten.org/docs/porting/Debugging.html#handling-c-exceptions-from-javascript
const char *getCppExceptionMessage(intptr_t exceptionPtr) {
	// what() returns a C string; pass pointer back to JS as integer
	return reinterpret_cast<std::exception *>(exceptionPtr)->what();
}


// end of extern "C"
}

