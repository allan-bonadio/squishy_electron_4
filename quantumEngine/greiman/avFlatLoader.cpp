/*
** avatar Flat Loader -- transcribe a complex psi buffer to webGL attribute
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/


#include <stdexcept>

//#include "../hilbert/qSpace.h"
#include "qAvatar.h"
//#include "../schrodinger/qGrinder.h"
#include "../debroglie/qCavity.h"

static const bool traceViewBuffer = false;  // dumps it
static const bool traceHighest = true;
static const bool traceInDetail = true;
static const bool traceWaveDump = true;



// copy the numbers in our qAvatar's cavity into this fArray
// one row per vertex, two rows per wave datapoint.
// each row of 4 floats looks like this:
//     real   imaginary    voltage    serial
// Two vertices per datapoint: bottom then top, same data.
// also converts from doubles to floats for GL.
// Also calculates the highest magnitude and leaves it in double0 (overwriting anything previous)
void avFlatLoader(qAvatar *avatar, int bufIx, qCavity *cavity, int nPoints) {
//	int *p = (int *) avatar;
//	printf("%8lx %8lx %8lx %8lx %8lx %8lx %8lx %8lx ",
//		p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]);


	if (traceViewBuffer)
		printf("\n🚦 avFlatLoader to avatar %s starts:\n", avatar->label);
	qCx *wave = cavity->wave;  // from here
	float *fArray = avatar->viewBuffers[bufIx].fArray;  // to here
	if (traceInDetail) {
		printf("avFlatLoader avatar=%p, ->viewBuffers=%p vb[ix=%d]->fArray %p\n",
			avatar, avatar->viewBuffers, bufIx, fArray);
		printf("       viewBuffers %p %p %p %p\n",
			avatar->viewBuffers[0].fArray, avatar->viewBuffers[1].fArray,
			avatar->viewBuffers[2].fArray, avatar->viewBuffers[3].fArray);
	}
	double highest = 0;

	if (traceInDetail) {
		printf("🚦 avFlatLoader: avatar=%p, cavity=%p, ->wave=%p avatar[ix=%d]->fArray %p\n",
			avatar, cavity, cavity->wave, bufIx, fArray);
	}
	if (traceWaveDump)
		cavity->dump("🚦 at start of avFlatLoader()");

	// this is index into the complex point, which translates to 2 GL vertices, eight single floats, 32 bytes
	//printf("avFlatLoader about to do nPoints pts: %d\n", nPoints);
	for (int pointNum = 0; pointNum < nPoints; pointNum++) {
		float *twoRowPtr = fArray + pointNum * 8;
		if (traceInDetail)
			printf("🚦 avFlatLoader(pointNum=%d):  fArray base=%p  twoRowPtr=%p\n",
				pointNum, fArray, twoRowPtr);

		qCx *wavePtr = wave + pointNum;
		double re = wavePtr->re;
		double im = wavePtr->im;

		if (traceInDetail) printf("                         wavePtr=%p  re=%lf im=%lf\n",
			wavePtr, re, im);

		twoRowPtr[0] = re;
		twoRowPtr[1] = im;

		twoRowPtr[2] = 0;
		twoRowPtr[3] = pointNum * 2.;  // vertexSerial: at zero

		twoRowPtr[4] = re;
		twoRowPtr[5] = im;
		twoRowPtr[6] = 0;
		twoRowPtr[7] = pointNum * 2. + 1.;  // at magnitude, top

		// while we're here, collect the highest point
		double height = re * re + im * im;
		if (height > highest)
			highest = height;

		if (traceInDetail) {
			printf("🚦 avFlatLoader(pointNum %d): %8f %8f %8f %8f    %8f %8f %8f %8f   height=%10lf\n",
				pointNum, twoRowPtr[0], twoRowPtr[1], twoRowPtr[2], twoRowPtr[3],
				twoRowPtr[4], twoRowPtr[5], twoRowPtr[6], twoRowPtr[7],
				height);
		}
	}

	avatar->double0 = highest;
	if (traceHighest) {
		printf("🚦 at end of avFlatLoader fArray=%p\n        highest=%10.6lf    double0=%10.6lf\n",
				 fArray, highest, avatar->double0);
	}

	if (traceViewBuffer) {
		avatar->dumpComplexViewBuffer(bufIx, nPoints, "avFlatLoader done");
	}

	//printf("end of avFlatLoader: double0=%lf  highest=%lf\n", avatar->double0, highest);
	// all return values returned on the avatar in [di][01]
}

// for the JS side.  Do I really need these?  this is called only from c++
extern "C" {
	// load up the Avatar's view buffer based on the Avatar's wave buffer
	// returns the highest height of norm of wave entries
	void avatar_avFlatLoader(qAvatar *avatar, int bufIx, qCavity *cavity, int nPoints) {
		avFlatLoader(avatar, bufIx, cavity, nPoints);
	}
}

