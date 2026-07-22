/*
** drawing description -- calculations for display of the voltage
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import qeConsts from '../engine/qeConsts.js';
//import {scaleLinear} from 'd3-scale';
// import {EFFECTIVE_VOLTS, TOO_MANY_VOLTS, LOW_VOLTS} from './voltConstants.js';
// import {getAGroup, storeASetting} from '../utils/storeSettings.js';
import * as d3 from "d3";

// facts and scales for a space and some other numbers.
// Needs be calculated once per space creation.  Call all the add functions for all the extras.
class drawDesc2D {
	// the constructor merely figures the lowest info based on the space alone
	constructor(space) {
		this.reCast(space);
	}

	// given possible changes in space and other items, recalculate them
	// except not the scales, unless mVD is supplied.  mVD is optional
	reCast(space, mVD) {
		this.continuum = space.continuum;
		if (space.continuum == qeConsts.contENDLESS) {
			// eg for N=8, 8 segments and segment 0===8 and 1===9
			this.barWidth = 1 / space.nStates;
			this.start = space.start;
			this.end = space.end;
		}
		else if (space.continuum == qeConsts.contWELL) {
			// eg for N=8, 8 segments plus two on ends that go to ∞,
			// so segment 0 === 9 = ∞
			this.barWidth = 1 / space.nPoints;
			this.start = 0;
			this.end = space.nPoints;
		}
		else {
			throw `bad space continuum ${space.continuum}`;
		}
	}

	/* ***************************************** scales */
	// require extra params
	addScales(mVD) {
		if (mVD) {
			this.addXScales(mVD.drawingLeft, mVD.drawingRight);
			this.addYScales(mVD.bottomValue, mVD.topValue, mVD.canvasHeight);
		}
		else {
			// sorry we need widths and heights to calc these
			this.xScale = this.yScale = null;
		}
	}

	// once you figure out where you're drawing (drawingLeft,
	// drawingRight), call this. You could use it for any variable
	// that varies linearly from left to right.
	addXScales(drawingLeft, drawingRight) {
		if (!this.xScale) {
			this.xScale = d3.scaleLinear(
				[this.start, this.end],
				[drawingLeft, drawingRight]);
		}
	}

	// here, y can be any kind of value that varies continuously from
	// bottom to top of whatever
	addYScales(bottomValue, topValue, canvasHeight) {
		if (!this.yScale) {
			this.yScale = d3.scaleLinear(
				[bottomValue, topValue],
				[0, canvasHeight]);
			this.yUpsideDown = d3.scaleLinear(
				[bottomValue, topValue],
				[canvasHeight, 0]);
			this.canvasHeight = canvasHeight;
		}
	}

	reset(space) {

	}
}

export default drawDesc2D;
