/*
** voltDisplay test -- testing hte math for viewing and zooming the voltage in the WaveView
** Copyright (C) 2022-2024 Tactile Interactive, all rights reserved
*/

import {expect, test, jest} from '@jest/globals';
import voltDisplay from './voltDisplay.js';
import {dumpJsStack} from '../utils/errors.js';

import qe from '../engine/qe.js';

let traceObj = false;


	qe.ERROR_RADIUS = 1e-12;


// minimal expect() checks to see if it's ok.  ignores calculated maxes
function tryOutConsistency(vDisp) {
	// first some radical checking
	expect(vDisp.heightVolts).toBeGreaterThan(0);
	expect(vDisp.heightVolts).toBeLessThan(1000);
	expect(vDisp.bottomVolts).toBeLessThan(1000);

	if (vDisp.measuredMaxVolts != undefined)
		expect(vDisp.measuredMaxVolts).toBeGreaterThanOrEqual(vDisp.measuredMinVolts);

	// now make sure things add up
	expect(vDisp.bottomVolts).toBeGreaterThanOrEqual(vDisp.minBottom);
	expect(vDisp.bottomVolts).toBeLessThanOrEqual(vDisp.maxBottom);
	expect(vDisp.minBottom + vDisp.heightVolts).toBe(vDisp.maxBottom);
	expect(vDisp.maxBottom + vDisp.heightVolts).toBe(vDisp.maxTop);
}

let volts16;
let vDisp;

describe(`findVoltExtremes() method`, () => {
	beforeEach(() => {
		 //console.info(`findVoltExtremes() method`);
		// shouldn't matter what the settings passed in are
		volts16 = new Float64Array(16);  // all zeroes, right?
		vDisp = new voltDisplay(0, 16, volts16,
			{showVoltage: true, minBottom: 0, heightVolts: 0, bottomVolts: 0,});

	})

	// try jest's 'test.each':
	test.each([
		// value at 2, value at 9, expMin, expMax
		[0, 0, 0, 0],
		[77, 0, 0, 77],
		[0, -33, -33, 0],
		[77, -33, -33, 77],
		[-33, 77, -33, 77],
	])(`at [2] = %i, at [9] = %i`, (at2, at9, mini, maxi) => {
		volts16[2] = at2;
		volts16[9] = at9;
		vDisp.findVoltExtremes();
		expect(vDisp.measuredMinVolts).toBeCloseTo(mini);
		expect(vDisp.measuredMaxVolts).toBeCloseTo(maxi);
	})
});

describe(`voltage creation & consistency`, () => {
	let vDisp;
	beforeEach(() => {
		volts16 = new Float64Array(16);  // all zeroes, right?
	});

	// make the range be 13...17, with other values in between.  Pass in this as a munge function
	// if you want a realistic data range to test against
	const munger = () => {
		for (let ix = vDisp.start; ix < vDisp.end; ix++)
			volts16[ix] = 14 + Math.random();  // 14 ... 15
		volts16[7] = 13;
		volts16[1] = 17;

	}

	test.each([
		// sorry, we can't have a zero range
		[{minBottom: 0, heightVolts: 0, bottomVolts: 0,}, null,
			{minBottom: -.5, maxBottom: .5, maxTop: 1.5, heightVolts: 1, bottomVolts: -.25,}],

		// these bottomVolts pass thru cuz it's within range
		[{minBottom: 0, heightVolts: 1, bottomVolts: 0,}, null,
			{minBottom: 0, maxBottom: 1, maxTop: 2, heightVolts: 1, bottomVolts: 0,}],
		[{minBottom: 0, heightVolts: 1, bottomVolts: 1,}, null,
			{minBottom: 0, maxBottom: 1, maxTop: 2, heightVolts: 1, bottomVolts: 1,}],
		[{minBottom: -1, heightVolts: 5, bottomVolts: 0,}, null,
			{minBottom: -1, maxBottom: 4, maxTop: 9, heightVolts: 5, bottomVolts: 0,}],

		// these need a nudge cuz settings are way out.  Results are ALL the
		// same cuz all numbers are replaced.
		[{minBottom: -1, heightVolts: 2, bottomVolts: 0}, munger,
			{minBottom: 13, maxBottom: 15, maxTop: 17, heightVolts: 2, bottomVolts: 13.5,}],
		[{minBottom: 100, heightVolts: 50, bottomVolts: 135}, munger,
			{minBottom: 13, maxBottom: 15, maxTop: 17, heightVolts: 2, bottomVolts: 13.5,}],

		// but don't change anything if it all fits in the existing data
		[{minBottom: 14, heightVolts: 1, bottomVolts: 15}, munger,
			{minBottom: 14, maxBottom: 15, maxTop: 16, heightVolts: 1, bottomVolts: 15,}],

		// these overlap at least part of the range so they won't be changed
		[{minBottom: 14, heightVolts: 7, bottomVolts: 15}, munger,
			{minBottom: 14, maxBottom: 21, maxTop: 28, heightVolts: 7, bottomVolts: 15,}],
		[{minBottom: -5, heightVolts: 10, bottomVolts: 2}, munger,
			{minBottom: -5, maxBottom: 5, maxTop: 15, heightVolts: 10, bottomVolts: 2,}],
		[{minBottom: 6, heightVolts: 10, bottomVolts: 8}, munger,
			{minBottom: 6, maxBottom: 16, maxTop: 26, heightVolts: 10, bottomVolts: 8,}],

	])(`voltDisplay created w/%j  should yield %o`, (settings, mungeFunc, expected) => {
		mungeFunc?.();
		vDisp = new voltDisplay(0, 16, volts16,
			{showVoltage: true, ...settings});
		tryOutConsistency(vDisp);

		expect(vDisp.minBottom).toBeCloseTo(expected.minBottom);
		expect(vDisp.maxBottom).toBeCloseTo(expected.maxBottom);
		expect(vDisp.maxTop).toBeCloseTo(expected.maxTop);
		expect(vDisp.heightVolts).toBeCloseTo(expected.heightVolts);
		expect(vDisp.bottomVolts).toBeCloseTo(expected.bottomVolts);
	});

});

describe(`voltD Zoom`, () => {
	let vDisp;
	beforeAll(() => {
		volts16 = new Float64Array(16);  // all zeroes, right?
		vDisp = new voltDisplay(0, 16, volts16);
	});

	// these numbers have been rounded to make it all shorter.
	test.each([
		// zoom out
		// centered on zero
		[-1, {minBottom: -1, heightVolts: 1, bottomVolts: -.5,},
			{minBottom: -1.41421, maxBottom: 0, maxTop: 1.41421, heightVolts: 1.41421, bottomVolts: -0.70710,}],

		// range 0-2, scrolled to bottom
		[-1, {minBottom: 0, heightVolts: 1, bottomVolts: 0,},
			{minBottom: -0.20710, maxBottom: 1.20710, maxTop: 2.62132, heightVolts: 1.41421, bottomVolts: -0.20710,}],

		// range 0-2, scrolled to top
		[-1, {minBottom: 0, heightVolts: 1, bottomVolts: 1,},
			{minBottom: -0.62132, maxBottom: 0.79289, maxTop: 2.20710, heightVolts: 1.41421, bottomVolts: 0.79289,}],

		[-1, {minBottom: -3, heightVolts: 7, bottomVolts: 1,},
			{minBottom: -7.62183, maxBottom: 3.69187, maxTop: 15.00558, heightVolts: 11.31370, bottomVolts: -1.15685,}],
		[-1, {minBottom: 17.4, heightVolts: 12.6, bottomVolts: 20,},
			{minBottom: 14.99841, maxBottom: 30.99841, maxTop: 46.99841, heightVolts: 16., bottomVolts: 18.3,}],


		// zoom in
		[1, {minBottom: -1, heightVolts: 2, bottomVolts: 0},
			{minBottom: -0.41421, maxBottom: 1, maxTop: 2.41421, heightVolts: 1.41421, bottomVolts: 0.29289,}],
		[1, {minBottom: 100, heightVolts: 50, bottomVolts: 135},
			{minBottom: 121.6, maxBottom: 153.6, maxTop: 185.6, heightVolts: 32., bottomVolts: 144,}],

		[1, {minBottom: 14, heightVolts: 1, bottomVolts: 15},
			{minBottom: 14.43933, maxBottom: 15.14644, maxTop: 15.85355, heightVolts: 0.70710, bottomVolts: 15.14644,}],

		[1, {minBottom: 14, heightVolts: 7, bottomVolts: 15},
			{minBottom: 14.86345, maxBottom: 20.52030, maxTop: 26.17715, heightVolts: 5.65685, bottomVolts: 15.67157,}],
		[1, {minBottom: -5, heightVolts: 10, bottomVolts: 2},
			{minBottom: -2.6, maxBottom: 5.4, maxTop: 13.4, heightVolts: 8., bottomVolts: 3,}],
		[1, {minBottom: 6, heightVolts: 10, bottomVolts: 8},
			{minBottom: 7.4, maxBottom: 15.4, maxTop: 23.4, heightVolts: 8., bottomVolts: 9,}],

	])(`voltDZoom%#: zoomed %d starts at %j  should yield %o`, (direction, starting, expected) => {
		vDisp.bottomVolts = starting.bottomVolts;
		vDisp.heightVolts = starting.heightVolts;
		vDisp.minBottom = starting.minBottom;
		//vDisp.setMaxMax();  // so first dump comes out right if you care
		vDisp.userZoom(direction);

		tryOutConsistency(vDisp);

		expect(vDisp.minBottom).toBeCloseTo(expected.minBottom);
		expect(vDisp.maxBottom).toBeCloseTo(expected.maxBottom);
		expect(vDisp.maxTop).toBeCloseTo(expected.maxTop);
		expect(vDisp.heightVolts).toBeCloseTo(expected.heightVolts);
		expect(vDisp.bottomVolts).toBeCloseTo(expected.bottomVolts);
	});

});


