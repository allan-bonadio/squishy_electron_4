/*
** js space -- interface to JS for qSpaces
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

#include <stdexcept>

#include "qSpace.h"
#include "../greiman/qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "../debroglie/qWave.h"
#include "../greiman/qViewBuffer.h"

static bool traceSpaceCreation = false;
static bool traceAvatarDetail = false;

/* ********************************************************** glue functions for js */

// these are for JS only; they're all extern "C"
extern "C" {

void qSpace_dumpVoltage(qSpace *space, char *title) { space->dumpVoltage(title); }

// this will normalize with the C++ normalize
void wave_normalize(qWave *qwave) {
	qwave->normalize();
}

/* ******************************************************** space creation from JS */


// it's tedious to send a real data structure thru the emscripten interface, so the JS
// constructs the dimensions by repeated calls to addSpaceDimension()
// see eSpace constructor
qSpace *startNewSpace(const char *label) {
	if (traceSpaceCreation)
		printf("\n🚀 🚀 🚀  startNewSpace(%s), \n", label);

	qSpace *space = new qSpace(label);

	if (traceSpaceCreation) {
		printf("🚀 🚀 🚀  JS startNewSpace   done (%s == %s)   \n",
			space->label, label);
	}

	return space;
}

// call this from JS to add one or more dimensions
void addSpaceDimension(qSpace *space, int N, int continuum, double spaceLength, const char *label) {
	double dx = spaceLength / (N - 1);  // shouldn't this be N instead of N-1?
	if (traceSpaceCreation) printf("🚀 addSpaceDimension(%d, %d, %lf=>%lf, %s)\n",
		N, continuum, spaceLength, dx, label);
	space->addDimension(N, continuum, dx, label);
}

// call this from JS to finish the process for the qSpace, create and add the avatars & voltage
qSpace *completeNewSpace(qSpace *space, int nThreads) {
	if (traceSpaceCreation)
		printf("🚀 🚀 🚀  JS completeNewSpace starts(%s)   space=%p\n",
			space->label, space);

	// finish up all the dimensions now that we know them all
	space->initSpace();

	if (traceAvatarDetail) printf("🚀 about to create avatars\n");

	qAvatar *mainAvatar = space->mainAvatar = new qAvatar(space, "mainAvatar");
	if (traceAvatarDetail) printf("🚀 created mainAvatar\n");

	qGrinder *qgrinder = space->qgrinder = new qGrinder(space, mainAvatar, nThreads, "mainGrinder");

	space->miniGraphAvatar = new qAvatar(space, "miniGraph");

//	if (theVoltage) throw std::runtime_error("🚀 🚀 🚀 theVoltage exists while trying to create new one");
//	theVoltage = space->voltage;

	if (traceSpaceCreation) printf("   🚀 🚀 🚀 qSpace::jsSpace: done\n");
	return space;
}

// dispose of ALL of everything attached to the space
// use this to get rid of a space created with startNewSpace/addSpaceDimension/completeNewSpace
void deleteFullSpace(qSpace *space) {
//	if (traceSpaceCreation) printf("   🚀 🚀 🚀 deleteFullSpace(): starts, theSpace:%p, space to delete=%p\n",
//		theSpace, space);
//	if (theSpace != space)
//		throw std::runtime_error("Trying to delete a space other than theSpace!");

	// deleting the avatars will delete their qWaves and qViewBuffers
	// not there if completeNewSpace() never called, even if initSpace() called
	if (space->mainAvatar) {
		if (traceAvatarDetail) printf("   🚀 🚀 🚀 deleteFullSpace(): deleting avatars\n");
		delete space->mainAvatar;
		space->mainAvatar = NULL;

		delete space->miniGraphAvatar;
		space->miniGraphAvatar = NULL;

		delete space->qgrinder;
		space->qgrinder = NULL;
	}

	// voltage going to be deleted cuz it's part of the space

	// deletes its voltage
	delete space;

	// get rid of these variables someday
//	theSpace = NULL;
//	theVoltage = NULL;

//	if (traceSpaceCreation) printf("    🚀  deleteFullSpace(): done.  theSpace=%p, theVoltage=%p \n",
//		theSpace, theVoltage);
}


// end of extern "C"
}


