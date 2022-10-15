/*
** js space -- interface to JS for qSpaces
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

//#include <string.h>
#include "qSpace.h"
#include "../schrodinger/qAvatar.h"
#include "qWave.h"
#include "qViewBuffer.h"

static bool traceSpaceCreation = false;
static bool traceExceptions = false;
static bool traceAvatarDetail = false;

// 'the' globals are for the one and only SquishPanel being displayed on this
// curent, preliminary version of SquishyElectron.  Along with various other
// important objects.  Someday we'll get the JS to hold these.
class qSpace *theSpace = NULL;
double *thePotential = NULL;
//class qAvatar *theAvatar = NULL;
//qViewBuffer *theQViewBuffer = NULL;


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
//	//printf("        🚀 🚀 🚀        the qWave %p\n", (theAvatar->qwave));
//	//printf("        🚀 🚀 🚀        the wave %p\n", (theAvatar->qwave->wave));
////	printf("        🚀 🚀 🚀     q=w %d   s=w %d   q=s %d\n",
////		(uintptr_t) (theAvatar->qwave) == (uintptr_t)  (theAvatar->qwave->wave),
////		(uintptr_t) (theSpace) == (uintptr_t) (theAvatar->qwave->wave),
////		(uintptr_t) (theAvatar->qwave) == (uintptr_t) (theSpace)
////	);
//
//	return theAvatar->qwave->wave;
//}

//double Avatar_getElapsedTime(void) {
//	if (!theSpace) throw std::runtime_error("🚀 🚀 🚀 null space in getElapsedTime()");
//	return theAvatar->elapsedTime;
//}
//
//double Avatar_getIterateSerial(void) {
//	if (!theSpace) throw std::runtime_error("🚀 🚀 🚀 null space in getIterateSerial()");
//	return theAvatar->iterateSerial;
//}

void qSpace_dumpPotential(char *title) { theSpace->dumpPotential(title); }
//void qSpace_setZeroPotential(void) { theSpace->setZeroPotential(); }
//void qSpace_setValleyPotential(double power, double scale, double offset) {
//	theSpace->setValleyPotential(power, scale, offset);
//}

// obsolete
//void Avatar_setDt(double dt) {
//	theAvatar->dt = dt;
//}

// obsolete
// iterations are what the user sees.  steps are what Visscher does repeatedly.
//void Avatar_setStepsPerIteration(int stepsPerIteration) {
//	//printf("🚀 🚀 🚀 Avatar_setStepsPerIteration(%d)\n", stepsPerIteration);
//	if (stepsPerIteration < 1 || stepsPerIteration > 1e8) {
//		char buf[100];
//		snprintf(buf, 100, "Avatar_setStepsPerIteration, %d, is <1 or too big\n", stepsPerIteration);
//		throw std::runtime_error(buf);
//	}
//	theAvatar->stepsPerIteration = stepsPerIteration;
//	//printf("🚀 🚀 🚀 Avatar_setStepsPerIteration result %d in theSpace=%p\n",
//	//	theAvatar->stepsPerIteration, theSpace);
//}

// obsolete
// low pass filter.
//void Avatar_setLowPassFilter(int lowPassFilter) {
//	//printf("🚀 🚀 🚀 Avatar_setLowPassFilter(%d)\n", dilution);
//	theAvatar->lowPassFilter = lowPassFilter;
//	//printf("🚀 🚀 🚀 Avatar_setLowPassFilter result %d in theSpace=%p\n",
//	//	theAvatar->lowPassFilter, theSpace);
//}

void avatar_oneIteration(qAvatar *pointer) { pointer->oneIteration(); }
//void Avatar_resetCounters(void) { pointer->resetCounters(); }

// obsolete, i think
// if iterating, FFT after the current iterate finishes.  If stopped, fft current wave.
void avatar_askForFFT(qAvatar *pointer) { pointer->askForFFT(); }

// this will normalize with the C++ normalize which also sets maxNorm
void avatar_normalize(qAvatar *avatar) //{ pointer->qwave->normalize(); }
{
	printf("avatar_normalize(%p) => '%s'\n", avatar, avatar->label);
	avatar->qwave->normalize();
	printf("avatar_normalize(%p) done\n", avatar);
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

	//theAvatar = NULL;

	if (traceSpaceCreation) {
		printf("🚀 🚀 🚀  JS startNewSpace   done (%s == %s)   theSpace=%p\n",
			theSpace->label, label, theSpace);
	}

	return theSpace;
}

// call this from JS to add one or more dimensions
// nobody uses this return value either.
void addSpaceDimension(int N, int continuum, const char *label) {
	if (traceSpaceCreation) printf("addSpaceDimension(%d, %d, %s)\n", N, continuum, label);
	theSpace->addDimension(N, continuum, label);
}

// call this from JS to finish the process for the qSpace, create and add the avatars & potential
struct salientPointersType *completeNewSpace(void) {
	//printf("completeNewSpace starts\n");
	if (traceSpaceCreation) printf("🚀 🚀 🚀  JS completeNewSpace starts(%s)   theSpace=%p\n",
		theSpace->label, theSpace);

	// finish up all the dimensions now that we know them all
	theSpace->initSpace();

//	if (theAvatar) throw std::runtime_error("🚀 🚀 🚀 theAvatar exists while trying to create new one");
	if (traceAvatarDetail) printf("about to do avatars\n");

	qAvatar *mainAvatar = salientPointers.mainAvatar = new qAvatar(theSpace, "mainAvatar");
	salientPointers.mainVBuffer = mainAvatar->qvBuffer->vBuffer;
	if (traceAvatarDetail) printf("did mainAvatar\n");

	qAvatar *miniGraphAvatar = salientPointers.miniGraphAvatar = new qAvatar(theSpace, "miniGraph");
	salientPointers.miniGraphVBuffer = miniGraphAvatar->qvBuffer->vBuffer;
	if (traceAvatarDetail) printf("did miniGraphAvatar\n");

	if (traceSpaceCreation) printf("   🚀 🚀 🚀 completeNewSpace vBuffers After Creation but BEFORE loadViewBuffer  "
		"salientPointers.mainVBuffer=%p   salientPointers.miniGraphVBuffer=%p  \n",
		salientPointers.mainVBuffer, salientPointers.miniGraphVBuffer);

	if (thePotential) throw std::runtime_error("🚀 🚀 🚀 thePotential exists while trying to create new one");
	salientPointers.potentialBuffer = thePotential = theSpace->potential;

	//theQViewBuffer = theAvatar->qvBuffer;
	//salientPointers.vBuffer = theQViewBuffer->vBuffer;

	//salientPointers.mainWaveBuffer = theAvatar->qwave->wave;

	if (traceSpaceCreation) printf("   🚀 🚀 🚀 qSpace::jsSpace: done\n");
	return &salientPointers;
}

// dispose of ALL of everything attached to the space
void deleteTheSpace(qSpace *theSpace) {
	if (traceSpaceCreation) printf("   🚀 🚀 🚀 deleteTheSpace(): starts\n");

	// deleting the avatars will delete their qWaves and qViewBuffers
	// not there if completeNewSpace() never called, even if initSpace() called
	if (theSpace->mainAvatar) {
		delete theSpace->mainAvatar;
		theSpace->mainAvatar = NULL;
		delete theSpace->miniGraphAvatar;
		theSpace->miniGraphAvatar = NULL;
	}
	//theAvatar = NULL;
	//theQViewBuffer = NULL;

	// going to be deleted cuz it's part of the space

	// deletes its potential
	delete theSpace;
	theSpace = NULL;
	thePotential = NULL;

	if (traceSpaceCreation) printf("    deleteTheSpace(): done\n");
}


// Given the mysterious number thrown when C++ bartfs, get a real error message.  this is loosely from
// https://emscripten.org/docs/porting/Debugging.html#handling-c-exceptions-from-javascript
const char *getCppExceptionMessage(intptr_t exceptionPtr) {
	// what() returns a C string; pass pointer back to JS as integer
	if (traceExceptions) printf("getCppExceptionMessage(%ld) \n",
		exceptionPtr);
	//if (exceptionPtr & 3)
	//	return "bad exc ptr";
	if (traceExceptions) printf("getCppExceptionMessage = '%s'\n",
		 reinterpret_cast<std::exception *>(exceptionPtr)->what());
	return reinterpret_cast<std::exception *>(exceptionPtr)->what();
}

// end of extern "C"
}

