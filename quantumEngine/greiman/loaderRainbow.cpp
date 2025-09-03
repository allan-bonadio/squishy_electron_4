/*
** view buffer generator Rainbow  -- generator for |u| = 1
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/

#include <cmath>
#include <numbers>

#include "../hilbert/qSpace.h"
#include "qAvatar.h"

#define N_POINTS 37

// sick of trying to untangle the C++ jungle
const double π = 3.141592653589793;

// 10°
#define RADIANS_PER_SEG (10. / 180. * π);
#define RADIUS   25


extern void loaderRainbow(qAvatar *avatar) {
	// only fill some points - don't blow the buffer, don't go over number of segments we're trying to do.
	int verts = avatar->viewBuffers[0].nVertices;
	if (verts < N_POINTS)
		verts = N_POINTS;

	//qCx *cxs = (qCx *) qwave->wave;
	printf("running loaderRainbow on %s\n", avatar->label);
	qPos2 *poses = (qPos2 *) avatar->buf(0);
	qColor3 *colors = (qColor3 *) avatar->buf(1);

	// make sure they work the way I espect them to
//	for (int p = 0; p < verts; p++) {
//		printf("rowb4 %d: %9.2f %9.2f   %9.2f %9.2f %9.2f\n",
//			p, poses[p].x, poses[p].y, colors[p].red, colors[p].green, colors[p].blue );
//	}

	/// center
	poses[0] = qPos2(RADIUS, RADIUS);
	colors[0] = qColor3(0,0,0);

	for (int p = 1; p < verts; p++) {
	//for (int p = 0; p < N_POINTS; p++) {
		double angle = p * RADIANS_PER_SEG;
		double si = sin(angle);
		double co = cos(angle);

		// two vertices for each point
		poses[p] = qPos2(RADIUS * (co + 1), RADIUS * (si + 1));

		qCx cx = qCx(co, si);
		complexToRYGB(&cx, &colors[p]);
	}

//	printf("\n");
//	for (int p = 0; p < verts; p++) {
//		printf("rowAf %d: %9.2f %9.2f   %9.2f %9.2f %9.2f\n",
//			p, poses[p].x, poses[p].y, colors[p].red, colors[p].green, colors[p].blue );
//	}
}

	//		qPos2 *pos = (qPos2 *) posBuffer
//char *avRAINBOW::loadBuffers(void) {
//	qPos2 *poses = (qPos *) posBuffer;
//	qColor3 *colors = (qColor3 *) colorBuffer;
//
//	for (int p = 0; p < N_POINTS; p++) {
//		double angle = p * RADIANS_PER_SEG;
//		double si = sin(angle);
//		double co = cos(angle);
//		poses[2*p] = qPos2(RADIUS * (co + 1), RADIUS * (si + 1));
//		poses[2*p + 1] = qPos2(RADIUS, RADIUS);
//	}
//}



