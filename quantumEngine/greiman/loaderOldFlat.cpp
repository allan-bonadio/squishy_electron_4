/*
** view buffer generator Old FLat -- generator for pre-Threejs  for Flat scene
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

#include "../hilbert/qSpace.h"
#include "qAvatar.h"
#include "../debroglie/qWave.h"

char *dbgOldFlat(qAvatar* avatar) {

	return NULL;
}

//// copy the numbers in our qAvatar's qWave into this vBuffer
//// one row per vertex, two rows per wave datapoint.
//// each row of 4 floats looks like this:
////     real   imaginary    voltage    serial
//// Two vertices per datapoint: bottom then top, same data.
//// also converts from doubles to floats for GL.
//float qAvatar::loadViewBuffer(void) {
//	if (traceViewBuffer) printf("\n📺 qAvatar::loadViewBuffer(%s) starts: vBuffer = %p \n",
//		label, vBuffer);
//	qCx *wave = qwave->wave;
//
//	int nPoints = space->nPoints;
//	double highest = 0;  // actually the highest squared; don't want to do sqrt in the loop
//	double tiny = 1;
//
//	if (traceInDetail) {
//		printf("loadViewBuffer(B): qAvatar %p    qwave->wave=->%p->%p\n",
//			this,
//			qwave,
//			qwave->wave);
//		printf("loadViewBuffer(vb,lqw): qAvatar->vBuffer %p\n",
//			vBuffer);
//		qwave->dump("📺 at start of loadViewBuffer()");
//	}
//
//	// this is index into the complex point, which translates to 2 GL points
//	//	printf("qAvatar::loadViewBuffer about to do all the pts\n");
//	for (int pointNum = 0; pointNum < nPoints; pointNum++) {
//		if (traceInDetail) {
//			printf("📺 qAvatar::loadViewBuffer vBuffer %p\n",
//				vBuffer);
//			printf("📺 qAvatar::loadViewBuffer vBuffer + pointNum * 8=%p\n",
//				vBuffer + pointNum * 8);
//		}
//		float *twoRowPtr = vBuffer + pointNum * 8;
//		if (traceInDetail)
//			printf("📺 qAvatar::loadViewBuffer twoRowPtr =%p\n", twoRowPtr);
//		qCx *wavePtr = wave + pointNum;
//		if (traceInDetail)
//			printf("📺 qAvatar::loadViewBuffer wavePtr =%p\n", wavePtr);
//
//		if (traceInDetail) printf("📺 loadViewBuffer(pointNum=%d): twoRowPtr =%p and wavePtr=%p\n",
//			pointNum, twoRowPtr, wavePtr);
//
//		double re = wavePtr->re;
//		double im = wavePtr->im;
//
//		if (traceInDetail) printf("📺 loadViewBuffer(pointNum:%d): re=%lf im=%lf tiny=%lf\n",
//			pointNum, re, im, tiny);
//
//		twoRowPtr[0] = re * tiny;
//		twoRowPtr[1] = im * tiny;
//
//		twoRowPtr[2] = 0;
//		twoRowPtr[3] = pointNum * 2.;  // vertexSerial: at zero
//
//		twoRowPtr[4] = re;
//		twoRowPtr[5] = im;
//		twoRowPtr[6] = 0;
//		twoRowPtr[7] = pointNum * 2. + 1.;  // at magnitude, top
//
//		if (traceInDetail) printf("📺 loadViewBuffer(8:%d): %lf %lf %lf %lf %lf %lf %lf %lf\n",
//			pointNum, twoRowPtr[0], twoRowPtr[1], twoRowPtr[2], twoRowPtr[3],
//				twoRowPtr[4], twoRowPtr[5], twoRowPtr[6], twoRowPtr[7]);
//
//		// while we're here, collect the highest point
//		double height = re * re + im * im;
//		if (height > highest)
//			highest = height;
//	}
//
//	if (traceHighest)
//		printf("    qAvatar::at end of loadViewBuffer this=%p  vBuffer=%p highest=%12.6lf\n\n",
//				this, vBuffer, highest);
//
//	if (traceViewBuffer) {
//		dumpViewBuffer("loadViewBuffer done");
//	}
//
//	return highest;
//}
