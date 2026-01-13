/*
** js space -- interface to JS for qSpaces
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

#include <stdexcept>

#include "qSpace.h"
#include "../greiman/qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "../debroglie/qCavity.h"

static bool traceSpaceCreation = false;
static bool traceAvatarDetail = false;

/* ********************************************************** glue functions for js */

// these are for JS only; they're all extern "C"
extern "C" {

void qSpace_dumpVoltage(qSpace *space, char *title) {
	space->dumpVoltage(title);
}

/* ******************************************************** space creation from JS */


// it's tedious to send a real data structure thru the emscripten interface, so the JS
// constructs the dimensions by repeated calls to addSpaceDimension()
// see eSpace constructor
qSpace *startNewSpace(const char *label) {
	if (traceSpaceCreation)
		printf("\n🚀  startNewSpace(%s), \n", label);

	qSpace *space = new qSpace(label);

	if (traceSpaceCreation) {
		printf("🚀  JS startNewSpace   done (%s == %s)   \n",
			space->label, label);
	}

	return space;
}

// call this from JS to add one or more dimensions
void addSpaceDimension(qSpace *space, int N, int continuum,
			double dimLength, const char *label) {
	space->addDimension(N, continuum, dimLength, label);
}

// call this from JS to finish the process for the qSpace, create and add the avatars & voltage
qSpace *completeNewSpace(qSpace *space, int nGrWorkers) {
	if (traceSpaceCreation)
		printf("🚀  JS completeNewSpace starts(%s)   space=%p\n",
			space->label, space);

	// finish up all the dimensions now that we know them all
	space->initSpace();
	return space;
}

// dispose of ALL of everything attached to the space incl grinder
// use this to get rid of a space created with startNewSpace/addSpaceDimension/completeNewSpace
void deleteFullSpace(qSpace *space) {
	// not there if completeNewSpace() never called, even if initSpace() called
	if (space->grinder) {
		delete space->grinder;
		space->grinder = NULL;
	}

	// deletes its voltage
	delete space;
}


// end of extern "C"
}


