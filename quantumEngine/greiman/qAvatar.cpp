/*
** qAvatar -- the instance and simulation of a quantum mechanical wave in a space
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

#include <string.h>

#include <limits>
#include <cfenv>

#include "../hilbert/qSpace.h"
#include "qAvatar.h"
#include "../schrodinger/qGrinder.h"
#include "../debroglie/qWave.h"
#include "../fourier/qSpectrum.h"
//#include "../greiman/qViewBuffer.h"
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
static const bool traceViewBuffer = false;
static const bool traceHighest = false;
static const bool traceInDetail = false;



/* *********************************************************************************** qAvatar */

// create new avatar, complete with its own wave and view buffers
qAvatar::qAvatar(qSpace *sp, const char *lab)
	: space(sp), magic('Avat') {

	qwave = new qWave(space);
	voltage = sp->voltage;

	strncpy(label, lab, MAX_LABEL_LEN);
	label[MAX_LABEL_LEN] = 0;

	// we always need a view buffer; that's the whole idea behind an avatar
	// 4 floats per vertex, two verts per point
	vBuffer = new float[space->nPoints * 8];
	if (traceViewBuffer) printf("📺 new qvBuffer(): vBuffer ptr %p \n",
		vBuffer);

	if (traceSpace) {
		printf("the qSpace for avatar %s:   magic=%c%c%c%c label=%s nDimesions=%d  "
			"nStates=%d nPoints=%d voltage=%p  spectrumLength=%d  \n",
			label,
			space->magic >> 24,  space->magic >> 16, space->magic >> 8, space->magic,
			space->label, space->nDimensions, space->nStates, space->nPoints,
			space->voltage, space->spectrumLength);
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
	delete[] vBuffer;
	delete qwave;
	qwave = NULL;
	//delete qvBuffer;
	//qvBuffer = NULL;
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
	makePointerGetter(voltage);

	// the view Buffer to be passed to webgl.  Just the buffer
	makePointerGetter(vBuffer);

	makeStringPointer(label);

	printf("\n🚦 🚦 --------------- done with qAvatar direct access --------------\n");
}

/* ********************************************************** dump  */

// dump all the fields of an avatar other than the actual datapoints
void qAvatar::dumpObj(const char *title) {
	printf("\n🌊🌊 ==== qAvatar | %s ", title);
	printf("        magic: %c%c%c%c   qSpace=%p   '%s'   \n",
		magic>>3, magic>>2, magic>>1, magic, space, label);

	printf("        qwave %p     vBuffer %p\n", qwave, vBuffer);

	printf("        ==== end of qAvatar ====\n\n");
}

// dump the view buffer just before it heads off to webgl.
void qAvatar::dumpViewBuffer(const char *title) {
	float prevPhase = 0;
	#define FORMAT_BASE      "%6d |  %8.5f  %8.5f  %6.5g  %6.5g"
	#define FORMAT_SUFFIX  " | %6.5f %6.5f  %6.5f m𝜓/nm\n"

	if (!title) title = "";
	printf("==== 📺 dump avatar %p ➔ buffer %p | %s\n", this, vBuffer, title);
	printf("   ix  |    re      im     ---    serial  |      𝜃        d 𝜃      magn\n");
	for (int i = 0; i < space->nPoints; i++) {

		// first three should be all zero
		float *row = vBuffer + i * 8;
		printf(FORMAT_BASE "\n",
			i,
			row[0], row[1], row[2], row[3]);


		float re = row[4];
		float im = row[5];
		float phase = atan2(im, re) * 180 / PI;
		float dPhase = fmod(phase - prevPhase + 180, 360) - 180;
		float magn = im * im + re * re;
		printf(FORMAT_BASE FORMAT_SUFFIX,
			i,
			re, im, row[6], row[7],
			phase, dPhase, magn);

		prevPhase = phase;
	}
	printf("    📺  qAvatar::at end of dumpViewBuffer qViewBuffer->vBuffer=%p\n\n",
			vBuffer);
}


// copy the numbers in our qAvatar's qWave into this vBuffer
// one row per vertex, two rows per wave datapoint.
// each row of 4 floats looks like this:
//     real   imaginary    voltage    serial
// Two vertices per datapoint: bottom then top, same data.
// also converts from doubles to floats for GL.
float qAvatar::loadViewBuffer(void) {
	if (traceViewBuffer) printf("\n📺 qAvatar::loadViewBuffer(%s) starts: vBuffer = %p \n",
		label, vBuffer);
	qCx *wave = qwave->wave;

	int nPoints = space->nPoints;
	double highest = 0;  // actually the highest squared; don't want to do sqrt in the loop
	double tiny = 1;

	if (traceInDetail) {
		printf("loadViewBuffer(B): qAvatar %p    qwave->wave=->%p->%p\n",
			this,
			qwave,
			qwave->wave);
		printf("loadViewBuffer(vb,lqw): qAvatar->vBuffer %p\n",
			vBuffer);
		qwave->dump("📺 at start of loadViewBuffer()");
	}

	// this is index into the complex point, which translates to 2 GL points
	//	printf("qAvatar::loadViewBuffer about to do all the pts\n");
	for (int pointNum = 0; pointNum < nPoints; pointNum++) {
		if (traceInDetail) {
			printf("📺 qAvatar::loadViewBuffer vBuffer %p\n",
				vBuffer);
			printf("📺 qAvatar::loadViewBuffer vBuffer + pointNum * 8=%p\n",
				vBuffer + pointNum * 8);
		}
		float *twoRowPtr = vBuffer + pointNum * 8;
		if (traceInDetail)
			printf("📺 qAvatar::loadViewBuffer twoRowPtr =%p\n", twoRowPtr);
		qCx *wavePtr = wave + pointNum;
		if (traceInDetail)
			printf("📺 qAvatar::loadViewBuffer wavePtr =%p\n", wavePtr);

		if (traceInDetail) printf("📺 loadViewBuffer(pointNum=%d): twoRowPtr =%p and wavePtr=%p\n",
			pointNum, twoRowPtr, wavePtr);

		double re = wavePtr->re;
		double im = wavePtr->im;

		if (traceInDetail) printf("📺 loadViewBuffer(pointNum:%d): re=%lf im=%lf tiny=%lf\n",
			pointNum, re, im, tiny);

		twoRowPtr[0] = re * tiny;
		twoRowPtr[1] = im * tiny;

		twoRowPtr[2] = 0;
		twoRowPtr[3] = pointNum * 2.;  // vertexSerial: at zero

		twoRowPtr[4] = re;
		twoRowPtr[5] = im;
		twoRowPtr[6] = 0;
		twoRowPtr[7] = pointNum * 2. + 1.;  // at magnitude, top

		if (traceInDetail) printf("📺 loadViewBuffer(8:%d): %lf %lf %lf %lf %lf %lf %lf %lf\n",
			pointNum, twoRowPtr[0], twoRowPtr[1], twoRowPtr[2], twoRowPtr[3],
				twoRowPtr[4], twoRowPtr[5], twoRowPtr[6], twoRowPtr[7]);

		// while we're here, collect the highest point
		double height = re * re + im * im;
		if (height > highest)
			highest = height;
	}

	if (traceHighest)
		printf("    qAvatar::at end of loadViewBuffer this=%p  vBuffer=%p highest=%12.6lf\n\n",
				this, vBuffer, highest);

	if (traceViewBuffer) {
		dumpViewBuffer("loadViewBuffer done");
	}

	return highest;
}


// for the JS side
extern "C" {
	void avatar_dumpViewBuffer(qAvatar *avatar, const char *title) {
		avatar->dumpViewBuffer(title);
	}

	// return the vbuffer, raw floats
	float *avatar_getViewBuffer(qAvatar *avatar) {
		return avatar->vBuffer;
	}

	// load up the Avatar's view buffer based on the Avatar's wave buffer
	// returns the highest height of norm of wave entries
	double avatar_loadViewBuffer(qAvatar *avatar) {
		return avatar->loadViewBuffer();
	}
}

