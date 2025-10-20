/*
** js space -- interface to JS for qSpaces
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

#include <stdexcept>

#include "qSpace.h"
#include "../greiman/qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "../debroglie/qWave.h"

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

//	qGrinder *grinder = space->grinder
//		= new qGrinder(space, nGrWorkers, "mainGrinder");
//	if (traceSpaceCreation) printf("🚀 created Grinder\n");

//	if (traceAvatarDetail) printf("🚀 about to create avatars\n");
//
//	qAvatar *mainAvatar = space->mainAvatar = new qAvatar(0, "mainAvatar");
//	//space, "mainAvatar");
//	mainAvatar->space = space;
//	mainAvatar->qwave = (qWave *) grinder->flick;  // very carefully
//	mainAvatar->attachViewBuffer(0, NULL, 4, space->nPoints * 2);
//	if (traceAvatarDetail) printf("🚀 created mainAvatar\n");

//	int *vb = (int *) (mainAvatar->viewBuffers);
//	printf("viewBuffer ints: ox%x ox%x ox%x ox%x ox%x ox%x and vb itself is %p or %x\n",
//		vb[0], vb[1], vb[2], vb[3], vb[4], vb[5], vb, (int) vb);

//	space->miniGraphAvatar = new qAvatar(avFLAT, "miniGraph");

	//space->dumpSpace();
//	if (traceSpaceCreation) printf("   🚀 qSpace created: space=%p  mainAvatar=%p  grinder=%p\n",
//		space, mainAvatar, qgrinder);

	qWave *miniGraphWave = space->miniGraphWave
		= new qWave(space);
	printf("miniGraphWave: %p\n", miniGraphWave);
	qAvatar *miniGraphAvatar = space->miniGraphAvatar
		= new qAvatar(avFLAT, "miniGraph");
	miniGraphAvatar->space = space;
	miniGraphAvatar->qwave = miniGraphWave;
	space->miniGraphAvatar->attachViewBuffer(0, NULL, 2, space->nPoints * 2);

	if (traceSpaceCreation) printf("🚀 created miniGraph Wave and Avatar\n");
	return space;
}

// dispose of ALL of everything attached to the space
// use this to get rid of a space created with startNewSpace/addSpaceDimension/completeNewSpace
void deleteFullSpace(qSpace *space) {
	// deleting the avatars will delete their qWaves and qViewBuffers
	// not there if completeNewSpace() never called, even if initSpace() called
	// if (space->mainAvatar) {
	// 	if (traceAvatarDetail) printf("   🚀 deleteFullSpace(): deleting avatars\n");
	// 	delete space->mainAvatar;
	// 	space->mainAvatar = NULL;
	//
	// 	delete space->miniGraphAvatar;
	// 	space->miniGraphAvatar = NULL;
	// }

	if (space->grinder) {
		delete space->grinder;
		space->grinder = NULL;
	}

	// deletes its voltage
	delete space;
}


// end of extern "C"
}


