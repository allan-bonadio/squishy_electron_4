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


void dumpViewBuffer(qAvatar *avatar, int bufIx, int nPoints, const char *title) {
	float *fArray = avatar->viewBuffers[bufIx].fArray;  // to here
	float prevPhase =0;
	#define FORMAT_BASE      "%6d |  %6.5f  %6.5f  %6.5g  %6.5g"
	#define FORMAT_SUFFIX  " |  %6.5f  %6.5f  %6.5f  m𝜓/nm\n"

	if (!title) title = "";
	printf("==== 📺 dump fArray %p | %s\n", fArray, title);
	printf("   ix  |    re      im     ---    serial  |      𝜃        d 𝜃      magn\n");
	for (int i = 0; i < nPoints; i++) {

		// first three should be all zero
		float *row = fArray + i * 8;
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
	printf("    📺  at end of dumpViewBuffer avatar=%p  avatar->fArray=%p\n\n",
			avatar, fArray);
}


// copy the numbers in our qAvatar's qCavity into this fArray
// one row per vertex, two rows per wave datapoint.
// each row of 4 floats looks like this:
//     real   imaginary    voltage    serial
// Two vertices per datapoint: bottom then top, same data.
// also converts from doubles to floats for GL.
// Also calculates the highest magnitude and leaves it in double0 (overwriting anything previous)
void avFlatLoader(qAvatar *avatar, int bufIx, qCavity *qcavity, int nPoints) {
//	int *p = (int *) avatar;
//	printf("%8lx %8lx %8lx %8lx %8lx %8lx %8lx %8lx ",
//		p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]);


	if (traceViewBuffer)
		printf("\n📺 avFlatLoader to avatar %s starts:\n", avatar->label);
	qCx *wave = qcavity->wave;  // from here
	float *fArray = avatar->viewBuffers[bufIx].fArray;  // to here

	double highest = 0;

	if (traceInDetail) {
		printf("avFlatLoader: avatar %p, qcavity->wave=->%p->%p\n",
			avatar, qcavity, qcavity->wave);
		printf("avFlatLoader: avatar[%d]->fArray %p\n",
			bufIx, fArray);
		qcavity->dump("📺 at start of avFlatLoader()");
	}

	// this is index into the complex point, which translates to 2 GL vertices, eight single floats, 32 bytes
	//printf("avFlatLoader about to do nPoints pts: %d\n", nPoints);
	for (int pointNum = 0; pointNum < nPoints; pointNum++) {
		if (traceInDetail) {
			printf("📺 avFlatLoader fArray %p\n",
				fArray);
			printf("📺 avFlatLoader fArray + pointNum * 8=%p\n",
				fArray + pointNum * 8);
		}

		float *twoRowPtr = fArray + pointNum * 8;
		qCx *wavePtr = wave + pointNum;
		if (traceInDetail) printf("📺 avFlatLoader(pointNum=%d): twoRowPtr =%p and wavePtr=%p\n",
			pointNum, twoRowPtr, wavePtr);

		double re = wavePtr->re;
		double im = wavePtr->im;

		if (traceInDetail) printf("📺 avFlatLoader(pointNum:%d): re=%lf im=%lf\n",
			pointNum, re, im);

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
			printf("📺 avFlatLoader(row %d): %8f %8f %8f %8f    %8f %8f %8f %8f   height=%10lf\n",
				pointNum, twoRowPtr[0], twoRowPtr[1], twoRowPtr[2], twoRowPtr[3],
				twoRowPtr[4], twoRowPtr[5], twoRowPtr[6], twoRowPtr[7],
				height);
		}
	}

	if (traceHighest) {
		printf("    at end of avFlatLoader fArray=%p highest=%12.6lf\n\n",
				 fArray, highest);
	}

	if (traceViewBuffer) {
		dumpViewBuffer(avatar, bufIx, nPoints, "avFlatLoader done");
	}

	avatar->double0 = highest;
	//printf("end of avFlatLoader: double0=%lf  highest=%lf\n", avatar->double0, highest);
	// all return values returned on the avatar in [di][01]
}

// for the JS side.  Do I really need these?  this is called only from c++
extern "C" {
	void avatar_dumpViewBuffer(qAvatar *avatar, int bufIx, int nPoints, const char *title) {
		dumpViewBuffer(avatar, bufIx, nPoints, title);
	}

	// load up the Avatar's view buffer based on the Avatar's wave buffer
	// returns the highest height of norm of wave entries
	void avatar_avFlatLoader(qAvatar *avatar, int bufIx, qCavity *qcavity, int nPoints) {
		avFlatLoader(avatar, bufIx, qcavity, nPoints);
	}
}

