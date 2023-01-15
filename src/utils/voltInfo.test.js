/*
** voltInfo test -- testing hte math for viewing and zooming the voltage in the WaveView
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

import {expect, test, jest} from '@jest/globals';
import voltInfo from './voltInfo.js';
import {dumpJsStack} from './errors.js';

//import {getASetting, storeASetting, getAGroup, storeAGroup} from '../utils/storeSettings.js';
//import {isPowerOf2} from './powers.js';
//import qe from '../engine/qe.js';

let traceObj = false;

// minimal expect() checks to see if it's ok
function tryOutConsistency(vInfo) {
	expect(vInfo.heightVolts).toBeGreaterThan(0);
	expect(vInfo.heightVolts).toBeLessThan(1000);

	expect(vInfo.bottomVolts).toBeGreaterThan(-1000);
	expect(vInfo.bottomVolts).toBeLessThan(1000);

	expect(vInfo.voltMax).toBeGreaterThanOrEqual(vInfo.voltMin);
}

let volts16;
let vInfo;

describe(`findVoltExtremes() method`, () => {
	beforeEach(() => {
		 //console.info(`findVoltExtremes() method`);
		// shouldn't matter what the settings passed in are
		volts16 = new Float64Array(16);  // all zeroes, right?
		vInfo = new voltInfo(0, 16, volts16,
			{showVoltage: true, scrollMin: 0, heightVolts: 0, bottomVolts: 0,});

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
		vInfo.findVoltExtremes();
		expect(vInfo.voltMin).toEqual(mini);
		expect(vInfo.voltMax).toEqual(maxi);
	})
});

describe(`voltage creation & consistency`, () => {
	let vInfo;
	beforeEach(() => {
		volts16 = new Float64Array(16);  // all zeroes, right?
	});

	// make the range be 13...17, with other values in between.  Pass in this as a munge function
	// if you want a realistic data range to test against
	const munger = () => {
		for (let ix = vInfo.start; ix < vInfo.end; ix++)
			volts16[ix] = 14 + Math.random();  // 14 ... 15
		volts16[7] = 13;
		volts16[1] = 17;

	}

	test.each([
		// sorry, we can't have a zero range
		[{scrollMin: 0, heightVolts: 0, bottomVolts: 0,}, null,
			{scrollMin: -.5, scrollMax: .5, actualMax: 1.5, heightVolts: 1, bottomVolts: -.25,}],

		// these bottomVolts pass thru cuz it's within range
		[{scrollMin: 0, heightVolts: 1, bottomVolts: 0,}, null,
			{scrollMin: 0, scrollMax: 1, actualMax: 2, heightVolts: 1, bottomVolts: 0,}],
		[{scrollMin: 0, heightVolts: 1, bottomVolts: 1,}, null,
			{scrollMin: 0, scrollMax: 1, actualMax: 2, heightVolts: 1, bottomVolts: 1,}],
		[{scrollMin: -1, heightVolts: 5, bottomVolts: 0,}, null,
			{scrollMin: -1, scrollMax: 4, actualMax: 9, heightVolts: 5, bottomVolts: 0,}],

		// these need a nudge cuz settings are way out.  Results are ALL the
		// same cuz all numbers are replaced.
		[{scrollMin: -1, heightVolts: 2, bottomVolts: 0}, munger,
			{scrollMin: 13, scrollMax: 15, actualMax: 17, heightVolts: 2, bottomVolts: 13.5,}],
		[{scrollMin: 100, heightVolts: 50, bottomVolts: 135}, munger,
			{scrollMin: 13, scrollMax: 15, actualMax: 17, heightVolts: 2, bottomVolts: 13.5,}],

		// but don't change anything if it all fits in the existing data
		[{scrollMin: 14, heightVolts: 1, bottomVolts: 15}, munger,
			{scrollMin: 14, scrollMax: 15, actualMax: 16, heightVolts: 1, bottomVolts: 15,}],

		// these overlap at least part of the range so they won't be changed
		[{scrollMin: 14, heightVolts: 7, bottomVolts: 15}, munger,
			{scrollMin: 14, scrollMax: 21, actualMax: 28, heightVolts: 7, bottomVolts: 15,}],
		[{scrollMin: -5, heightVolts: 10, bottomVolts: 2}, munger,
			{scrollMin: -5, scrollMax: 5, actualMax: 15, heightVolts: 10, bottomVolts: 2,}],
		[{scrollMin: 6, heightVolts: 10, bottomVolts: 8}, munger,
			{scrollMin: 6, scrollMax: 16, actualMax: 26, heightVolts: 10, bottomVolts: 8,}],

	])(`voltInfo created w/%j  munger? %p should yield %o`, (settings, mungeFunc, expected) => {
		mungeFunc?.();
		vInfo = new voltInfo(0, 16, volts16,
			{showVoltage: true, ...settings});
		tryOutConsistency(vInfo);

		expect(vInfo.scrollMin).toEqual(expected.scrollMin);
		expect(vInfo.scrollMax).toEqual(expected.scrollMax);
		expect(vInfo.actualMax).toEqual(expected.actualMax);
		expect(vInfo.heightVolts).toEqual(expected.heightVolts);
		expect(vInfo.bottomVolts).toEqual(expected.bottomVolts);
	});

});


