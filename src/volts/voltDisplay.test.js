/*
** voltDisplay test -- testing hte math for viewing and zooming the voltage in the WaveView
** Copyright (C) 2022-2025 Tactile Interactive, all rights reserved
*/

import {expect, test, jest} from '@jest/globals';

import voltDisplay from './voltDisplay.js';
//import {dumpJsStack} from '../utils/errors.js';
import qeConsts from '../engine/qeConsts.js';

let traceObj = false;


	qeConsts.ERROR_RADIUS = 1e-12;


// minimal expectation checks to see if it's ok.  for almost all tests.
// Note voltages are typically in thousands of volts.
function tryOutConsistency(vDisp) {
	// first some radical checking
	expect(vDisp.heightVolts).toBeGreaterThan(0);
	expect(vDisp.heightVolts).toBeLessThan(100_000);

	expect(vDisp.bottomVolts).toBeGreaterThan(-100_000);
	expect(vDisp.bottomVolts).toBeLessThan(100_000);

	if (vDisp.measuredMaxVolts != undefined)
		expect(vDisp.measuredMaxVolts).toBeGreaterThanOrEqual(vDisp.measuredMinVolts);

	// now make sure things add up
	//expect(vDisp.bottomVolts).toBeGreaterThanOrEqual(vDisp.minBottom);
	//expect(vDisp.bottomVolts).toBeLessThanOrEqual(vDisp.maxBottom);
	//expect(vDisp.minBottom + vDisp.heightVolts).toBe(vDisp.maxBottom);
	//expect(vDisp.maxBottom + vDisp.heightVolts).toBe(vDisp.maxTop);
}

let volts16;  // typically Float64Array(16)
let vDisp;  // typically a voltDisplay to go with volts16

describe(`findVoltExtremes() method`, () => {
	beforeEach(() => {
		 //console.info(`findVoltExtremes() method`);
		// shouldn't matter what the settings passed in are
		volts16 = new Float64Array(16);  // all zeroes, right?
		// TODO: should also test well continuum!
		vDisp = new voltDisplay('test findVoltExtremes', 0, 16, qeConsts.contENDLESS, volts16,
			{showVoltage: 'always', heightVolts: 0, bottomVolts: 0,});

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
		[{heightVolts: 0, bottomVolts: 0,}, null,
			{heightVolts: 1, bottomVolts: -.25,}],

		// these bottomVolts pass thru cuz it's within range
		[{heightVolts: 1, bottomVolts: 0,}, null,
			{heightVolts: 1, bottomVolts: 0,}],
		[{heightVolts: 1, bottomVolts: 1,}, null,
			{heightVolts: 1, bottomVolts: 1,}],
		[{heightVolts: 5, bottomVolts: 0,}, null,
			{heightVolts: 5, bottomVolts: 0,}],

		// these need a nudge cuz settings are way out.  Results are ALL the
		// same cuz all numbers are replaced.
		[{heightVolts: 2, bottomVolts: 0}, munger,
			{heightVolts: 2, bottomVolts: 13.5,}],
		[{heightVolts: 50, bottomVolts: 135}, munger,
			{heightVolts: 2, bottomVolts: 13.5,}],

		// but don't change anything if it all fits in the existing data
		[{heightVolts: 1, bottomVolts: 15}, munger,
			{heightVolts: 1, bottomVolts: 15,}],

		// these overlap at least part of the range so they won't be changed
		[{heightVolts: 7, bottomVolts: 15}, munger,
			{heightVolts: 7, bottomVolts: 15,}],
		[{heightVolts: 10, bottomVolts: 2}, munger,
			{heightVolts: 10, bottomVolts: 2,}],
		[{heightVolts: 10, bottomVolts: 8}, munger,
			{heightVolts: 10, bottomVolts: 8,}],

	])(`voltDisplay created w/%j  should yield %o`, (settings, mungeFunc, expected) => {
		mungeFunc?.();
		vDisp = new voltDisplay('test created', 0, 16, qeConsts.contENDLESS, volts16,
			{showVoltage: 'always', ...settings});
		tryOutConsistency(vDisp);

		// expect(vDisp.minBottom).toBeCloseTo(expected.minBottom);
		// expect(vDisp.maxBottom).toBeCloseTo(expected.maxBottom);
		// expect(vDisp.maxTop).toBeCloseTo(expected.maxTop);
		expect(vDisp.heightVolts).toBeCloseTo(expected.heightVolts);
		expect(vDisp.bottomVolts).toBeCloseTo(expected.bottomVolts);
	});

});

describe(`voltDisplay Zoom`, () => {
	let vDisp;
	beforeAll(() => {
		volts16 = new Float64Array(16);  // all zeroes, right?
		vDisp = new voltDisplay('test Zoom', 0, 16, qeConsts.contENDLESS, volts16);
	});

	// these numbers have been rounded to make it all shorter.
	test.each([
		// zoom out
		// centered on zero
		[-1, {heightVolts: 1, bottomVolts: -.5,},
			{heightVolts: 1.41421, bottomVolts: -0.70710,}],

		// range 0-2, scrolled to bottom
		[-1, {heightVolts: 1, bottomVolts: 0,},
			{heightVolts: 1.41421, bottomVolts: -0.20710,}],

		// range 0-2, scrolled to top
		[-1, {heightVolts: 1, bottomVolts: 1,},
			{heightVolts: 1.41421, bottomVolts: 0.79289,}],

		[-1, {heightVolts: 7, bottomVolts: 1,},
			{heightVolts: 11.31370, bottomVolts: -1.15685,}],
		[-1, {heightVolts: 12.6, bottomVolts: 20,},
			{heightVolts: 16., bottomVolts: 18.3,}],


		// zoom in
		[1, {heightVolts: 2, bottomVolts: 0},
			{heightVolts: 1.41421, bottomVolts: 0.29289,}],
		[1, {heightVolts: 50, bottomVolts: 135},
			{heightVolts: 32., bottomVolts: 144,}],

		[1, {heightVolts: 1, bottomVolts: 15},
			{heightVolts: 0.70710, bottomVolts: 15.14644,}],

		[1, {heightVolts: 7, bottomVolts: 15},
			{heightVolts: 5.65685, bottomVolts: 15.67157,}],
		[1, {heightVolts: 10, bottomVolts: 2},
			{heightVolts: 8., bottomVolts: 3,}],
		[1, {heightVolts: 10, bottomVolts: 8},
			{heightVolts: 8., bottomVolts: 9,}],

	])(`voltDZoom%#: zoomed %d starts at %j  should yield %o`,
	(direction, starting, expected) => {
		vDisp.bottomVolts = starting.bottomVolts;
		vDisp.heightVolts = starting.heightVolts;
		vDisp.minBottom = starting.minBottom;
		vDisp.zoomVoltHandler(direction);

		tryOutConsistency(vDisp);

		// expect(vDisp.minBottom).toBeCloseTo(expected.minBottom);
		// expect(vDisp.maxBottom).toBeCloseTo(expected.maxBottom);
		// expect(vDisp.maxTop).toBeCloseTo(expected.maxTop);
		expect(vDisp.heightVolts).toBeCloseTo(expected.heightVolts);
		expect(vDisp.bottomVolts).toBeCloseTo(expected.bottomVolts);
	});

});


