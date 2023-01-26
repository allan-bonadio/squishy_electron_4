/*
** voltDisplay test -- testing hte math for viewing and zooming the voltage in the WaveView
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

import {expect, test, jest} from '@jest/globals';
import voltDisplay from './voltDisplay.js';
import {dumpJsStack} from './errors.js';

//import {getASetting, storeASetting, getAGroup, storeAGroup} from '../utils/storeSettings.js';
//import {isPowerOf2} from './powers.js';
//import qe from '../engine/qe.js';

let traceObj = false;

// minimal expect() checks to see if it's ok
function tryOutConsistency(vDisp) {
	expect(vDisp.heightVolts).toBeGreaterThan(0);
	expect(vDisp.heightVolts).toBeLessThan(1000);

	expect(vDisp.bottomVolts).toBeGreaterThan(-1000);
	expect(vDisp.bottomVolts).toBeLessThan(1000);

	expect(vDisp.measuredMaxVolts).toBeGreaterThanOrEqual(vDisp.measuredMinVolts);
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
		expect(vDisp.measuredMinVolts).toEqual(mini);
		expect(vDisp.measuredMaxVolts).toEqual(maxi);
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

	])(`voltDisplay created w/%j  munger? %p should yield %o`, (settings, mungeFunc, expected) => {
		mungeFunc?.();
		vDisp = new voltDisplay(0, 16, volts16,
			{showVoltage: true, ...settings});
		tryOutConsistency(vDisp);

		expect(vDisp.minBottom).toEqual(expected.minBottom);
		expect(vDisp.maxBottom).toEqual(expected.maxBottom);
		expect(vDisp.maxTop).toEqual(expected.maxTop);
		expect(vDisp.heightVolts).toEqual(expected.heightVolts);
		expect(vDisp.bottomVolts).toEqual(expected.bottomVolts);
	});

});


