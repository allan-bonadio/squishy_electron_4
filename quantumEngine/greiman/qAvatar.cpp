/*
** qAvatar -- the instance and simulation of a quantum mechanical wave in a space
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/
// TODO merge qViewBuffer into qAvatar

#include <string.h>

#include <limits>
#include <cfenv>

#include "../hilbert/qSpace.h"
#include "qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "../debroglie/qWave.h"
#include "../fourier/qSpectrum.h"
#include "../greiman/qViewBuffer.h"
#include "../fourier/fftMain.h"
#include "../directAccessors.h"



static bool traceJustWave = false;
static bool traceJustInnerProduct = false;

static bool traceFourierFilter = false;

static bool dumpFFHiResSpectums = false;
static bool traceIProd = false;

static bool traceSpace = false;  // prints info about the space in the avatar constructor

// those apply to these tracing flags
static bool traceEachFFSquelch = false;
static bool traceEndingFFSpectrum = false;


/* *********************************************************************************** qAvatar */

// create new avatar, complete with its own wave and view buffers
// make sure these values are doable by the sliders' steps
qAvatar::qAvatar(qSpace *sp, const char *lab)
	: space(sp), magic('Avat') {

	qwave = new qWave(space);
	voltage = sp->voltage;
	voltageFactor = sp->voltageFactor;

	strncpy(label, lab, MAX_LABEL_LEN);
	label[MAX_LABEL_LEN] = 0;

	// we always need a view buffer; that's the whole idea behind an avatar
	qvBuffer = new qViewBuffer(space, this);
	vBuffer = qvBuffer->vBuffer;

	if (traceSpace) {
		printf("the qSpace for avatar %s:   magic=%c%c%c%c label=%s nDimesions=%d  "
			"nStates=%d nPoints=%d voltage=%p voltageFactor=%lf spectrumLength=%d  \n",
			label,
			space->magic >> 24,  space->magic >> 16, space->magic >> 8, space->magic,
			space->label, space->nDimensions, space->nStates, space->nPoints,
			space->voltage, space->voltageFactor, space->spectrumLength);
		qDimension *dims = space->dimensions;
		printf("      its qDimension:   N=%d start=%d end=%d ",
			dims->N, dims->start, dims->end);
		printf("      nStates=%d nPoints=%d\n", dims->nStates, dims->nPoints);
		printf("      its continuum=%d spectrumLength=%d label=%s\n",
			dims->continuum, dims->spectrumLength, dims->label);
	}

	// enable this when qAvatar.h fields change
	FORMAT_DIRECT_OFFSETS;
};

qAvatar::~qAvatar(void) {
	// we delete any buffers hanging off the qAvatar here.
	// eAvatar will delete the Avatar object and any others needed.
	delete qwave;
	qwave = NULL;
	delete qvBuffer;
	qvBuffer = NULL;
};

// need these numbers for the js interface to this object, to figure out the offsets.
// see eAvatar.js ;  usually this function isn't called.
// Insert this into the constructor and run this once.  Copy text output.
// Paste the output into class eAvatar, the class itself, to replace the existing ones
void qAvatar::formatDirectOffsets(void) {
	// don't need magic
	printf("🚦 🚦 --------------- starting qAvatar direct access JS getters & setters--------------\n\n");

	makePointerGetter(space);

	/* *********************************************** waves & buffers */

	makePointerGetter(qwave);

	// the view Buffer to be passed to webgl.  Just the buffer, not the qViewBuffer
	makePointerGetter(vBuffer);

	makeStringPointer(label);

	printf("\n🚦 🚦 --------------- done with qAvatar direct access --------------\n");
}

/* ********************************************************** dumpObj  */

// dump all the fields of an avatar
void qAvatar::dumpObj(const char *title) {
	printf("\n🌊🌊 ==== qAvatar | %s ", title);
	printf("        magic: %c%c%c%c   qSpace=%p '%s'   \n",
		magic>>3, magic>>2, magic>>1, magic, space, label);

	printf("        qwave %p, qViewBuffer %p\n", qwave, qvBuffer);

	printf("        ==== end of qAvatar ====\n\n");
}


