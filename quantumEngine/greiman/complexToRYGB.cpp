/*
** view buffer generator Flat  -- generator for tpyed arrays for geometry for flatDrawing in FLat scene
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/

#include "qAvatar.h"

void complexToRYGB(qCx *ps, qColor3 &color) {
	qCx psi = *ps;
	color.red = color.green = color.blue = 0;

	// figure out which octant it's in; then similar for each
	if (psi.im > 0) {
		if (psi.re > 0) {
			// positive positive red ... yellow
			color.red = 1;
			if (psi.re > psi.im) {
				// red to orange
				color.green = psi.im / psi.re / 2;
			}
			else {
				// orange to yellow
				color.green = 1 - psi.re / psi.im / 2;
			}
		}
		else {
			// negative positive green ... yellow
			psi.re = -psi.re;
			color.green = 1;
			if (psi.re > psi.im) {
				// chartreuce to green
				color.red = psi.im / psi.re / 2;
			}
			else {
				// yellow to chartreuce
				color.red = 1 - psi.re / psi.im / 2;
			}

		}

	}
	else {
		psi.im = -psi.im;
		if (psi.re > 0) {
			// positive negative red ... blue
			if (psi.re > psi.im) {
				// red to magenta
				color.red = 1;
				color.blue = psi.im / psi.re;
			}
			else {
				// magenta to blue
				color.blue = 1;
				color.red = psi.re / psi.im;
			}
		}
		else {
			psi.re = -psi.re;
			// negative negative blue ... green
			if (psi.re > psi.im) {
				// green to cyan
				color.green = 1;
				color.blue = psi.im / psi.re;
			}
			else {
				// cyan to blue
				color.blue = 1;
				color.green = psi.re / psi.im;
			}
		}  // end of re < 0
	}  // end of im < 0

}
