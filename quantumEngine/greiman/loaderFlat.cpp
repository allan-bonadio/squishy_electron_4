/*
** view buffer generator Flat  -- generator for tpyed arrays for geometry for flatDrawing in FLat scene
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/


#include "../hilbert/qSpace.h"
#include "../debroglie/qWave.h"
#include "qAvatar.h"
//#include "qDrawingBuffers.h"


// put these in allCpp.list

//	2D.
//	posBuffer should be nPoints * 2
//	colorBuffer should be nPoints * 3

void loaderFlat(qAvatar *avatar) {
	qSpace *space = avatar->space;
	int nPoints = space->nPoints;

	// To update custom attributes, set the needsUpdate flag to true on the BufferAttribute of the geometry (see BufferGeometry for further details).

//	float *posBuffer = avatar->attachViewBuffer(0, NULL, 2, 2 * nPoints);
//	float *colorBuffer = avatar->attachViewBuffer(1, NULL, 3, 2 * nPoints);
}

	//		qPos2 *pos = (qPos2 *) posBuffer;
	//		qColor3 *color = (qColor3 *) colorBuffer;

//(qAvatar* avatar, float *posBuffer, float *colorBuffer, void *args) {

//	qSpace *space = avatar->space;
//	int nPoints = space->nPoints;
//	for (int ix = 0; ix < nPoints; ix++) {
//		float temp = (float) ix / nPoints;
//		pos[ix] = qPos2(temp, temp);
//		color[ix] = qColor3(temp, temp, temp);
//	}
//	return NULL;
//};
