import sAnimator from './sAnimator';
import qeConsts from '../engine/qeConsts.js';
import {storeASetting, createStoreSettings} from '../utils/storeSettings.js';


describe(`sAnimator recalcFrameMenuRates() `, () => {
	// this function we're testing.  Answer comes as an object dummySA.frameRateMenuFreqs[]
	const dummySA = {};
	const recalcFrameMenuRates = (videoFP) =>
		sAnimator.prototype.recalcFrameMenuRates.call(dummySA, videoFP);

	test.each([
		// typical screen in US
		{videoFP: 1000 / 60, expFirst: 1000 / 60, list: [qeConsts.FASTEST, 16.666666666666668,
			8, 4, 2, 1, 0.5, 0.2, 0.1, 0.06666666666666667, 0.03333333333333333,
				0.016666666666666666]},

		// typical screen in Europe, 50hz
		{videoFP: 1000 / 50, expFirst: 1000 / 50, list: [qeConsts.FASTEST, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1,
			0.06666666666666667, 0.03333333333333333, 0.016666666666666666]},

		// my LG curved screen can also do this:
		{videoFP: 1000 / 85,  expFirst: 1000 / 85, list: [ qeConsts.FASTEST, 11.764705882352942,
			6, 3, 2, 1, 0.5, 0.2, 0.1, 0.06666666666666667, 0.03333333333333333,
			0.016666666666666666]},

		// something in between
		{videoFP: 1000 / 59,  expFirst: 1000 / 59, list: [ qeConsts.FASTEST,  16.949152542372882,
			8, 4, 2, 1, 0.5, 0.2, 0.1, 0.06666666666666667, 0.03333333333333333,
			0.016666666666666666]},

		{videoFP: 1000 / 73,  expFirst: 1000 / 73, list: [ qeConsts.FASTEST,  13.698630136986301,
			7, 4, 2, 1, 0.5, 0.2, 0.1, 0.06666666666666667, 0.03333333333333333,
			0.016666666666666666]},

	])(`testing recalcFrameMenuRates videoFP=%f freq=%f`,
	({videoFP, expFirst, list}) => {
		//console.log(`the dummy SA is: `, dummySA);
		// obsolete
		//recalcFrameMenuRates(videoFP);
		//expect(dummySA.frameRateMenuFreqs[0]).toEqual(qeConsts.FASTEST);
		//expect(dummySA.frameRateMenuFreqs[1]).toEqual(expFirst);
		//expect(dummySA.frameRateMenuFreqs).toEqual(list);
	},
	10_000);

});

describe(`sAnimator findNearestMenuFreq`, () => {
	let sAnim;
	beforeAll(() => {
		sAnim = new sAnimator({cPanel: null}, {grinder: {hadException: null}}, 'glReddraw func' );
	})

	const tezts = [

		/* ******************************************************** the exact ones */
		// typical screen in US
		{vidRate: 60, testFP: 1000 / 60,  expFirstRate: 60, expHalfRate: 30,
			exp7thRate: 5, exp37thRate: 2},

		// typical screen in Europe, 50hz
		{vidRate: 50, testFP: 1000 / 50,  expFirstRate: 50, expHalfRate: 25,
			exp7thRate: 5, exp37thRate: 1},

		// my LG curved screen can also do this:
		{vidRate: 85, testFP: 1000 / 85,  expFirstRate: 85, expHalfRate: 42,
			exp7thRate: 9, exp37thRate: 2},

		/* ******************************************************** the other ones */

		// something in between
		{vidRate: 54, testFP: 1000 / 54,  expFirstRate: 54, expHalfRate: 27,
			exp7thRate: 9, exp37thRate: 1},
		{vidRate: 83, testFP: 1000 / 83,  expFirstRate: 83, expHalfRate: 42,
			exp7thRate: 11, exp37thRate: 2},

	];

	test.each(tezts)(`findNearestMenuFreq vRate=%f  FP=%f  expFst=%f`,
	({vidRate, testFP, expFirstRate, expHalfRate, exp7thRate, exp37thRate}) => {
		// note we're testing not just for a FP but for a vid rate
		sAnim.recalcFrameMenuRates(vidRate);
		expect(sAnim.findNearestMenuFreq(qeConsts.FASTEST)).toBe(qeConsts.FASTEST);

		expect(sAnim.findNearestMenuFreq(testFP)).toBeCloseTo(expFirstRate, 10);

		expect(sAnim.findNearestMenuFreq(testFP * 2)).toBeCloseTo(expHalfRate, 10);

		expect(sAnim.findNearestMenuFreq(testFP * 7)).toBeCloseTo(exp7thRate, 10);

		expect(sAnim.findNearestMenuFreq(testFP * 37)).toBeCloseTo(exp37thRate, 10);

		expect(sAnim.findNearestMenuFreq(1_000_000)).toBeCloseTo(1/60, 10);
	});
});



