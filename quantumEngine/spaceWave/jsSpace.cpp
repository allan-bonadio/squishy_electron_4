/*
** js space -- interface to JS for qSpaces
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

//#include <string.h>
#include <stdexcept>

#include "qSpace.h"
#include "../greiman/qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "../debroglie/qWave.h"
#include "../debroglie/qFlick.h"
#include "../greiman/qViewBuffer.h"

static bool traceSpaceCreation = false;
static bool traceAvatarDetail = false;
static bool traceExceptions = false;

// 'the' globals are for the one and only SquishPanel being displayed on this
// curent, preliminary version of SquishyElectron.  Along with various other
// important objects.  Someday we'll get the JS to hold these.
class qSpace *theSpace = NULL;
double *theVoltage = NULL;


/* ********************************************************** wave stuff */
//
//// after the initSpace() call, allocate the buffers.
//void allocWaves(void) {
//	// we make our own voltage
//}
//
//// call to destroy them
//static void freeWaves(void) {
//}

/* ********************************************************** glue functions for js */

// these are for JS only; they're all extern "C"
extern "C" {

void qSpace_dumpVoltage(char *title) { theSpace->dumpVoltage(title); }

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

	theSpace = new qSpace(label);

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

// call this from JS to finish the process for the qSpace, create and add the avatars & voltage
qSpace *completeNewSpace(void) {
	if (traceSpaceCreation)
		printf("🚀 🚀 🚀  JS completeNewSpace starts(%s)   theSpace=%p\n",
			theSpace->label, theSpace);

	// finish up all the dimensions now that we know them all
	theSpace->initSpace();

	if (traceAvatarDetail) printf("🚀 about to create avatars\n");

	qAvatar *mainAvatar = theSpace->mainAvatar = new qAvatar(theSpace, "mainAvatar");
	if (traceAvatarDetail) printf("🚀 created mainAvatar\n");

	qGrinder *grinder = theSpace->grinder = new qGrinder(theSpace, mainAvatar, "mainGrinder");

	theSpace->miniGraphAvatar = new qAvatar(theSpace, "miniGraph");

	if (theVoltage) throw std::runtime_error("🚀 🚀 🚀 theVoltage exists while trying to create new one");
	theVoltage = theSpace->voltage;

	if (traceSpaceCreation) printf("   🚀 🚀 🚀 qSpace::jsSpace: done\n");
	return theSpace;
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

		delete theSpace->grinder;
		theSpace->grinder = NULL;
	}

	// voltage going to be deleted cuz it's part of the space

	// deletes its voltage
	delete theSpace;
	theSpace = NULL;
	theVoltage = NULL;

	if (traceSpaceCreation) printf("    🚀  deleteTheSpace(): done.  theSpace=%p, theVoltage=%p \n",
		theSpace, theVoltage);
}

/* ***************************************************************************************************** exceptions */

// there's TWO copies of this: jsSpace.cpp and misc.cpp .
// Given the mysterious number thrown when C++ barfs, get a real error message.  this is loosely from
// https://emscripten.org/docs/porting/Debugging.html#handling-c-exceptions-from-javascript
const char *getCppExceptionMessage(intptr_t exceptionPtrInt) {
	printf("calling const char *getCppExceptionMessage(%ld) in jsSpace\n", exceptionPtrInt);

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


