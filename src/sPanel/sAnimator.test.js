import sAnimator from './sAnimator';
import qeConsts from '../engine/qeConsts.js';

// this function we're testing.  Answer comes as an object dummySA.frameRateMenuFreqs[]
const dummySA = {};
const recalcFrameMenuRates = (animationFP) =>
	sAnimator.prototype.recalcFrameMenuRates.call(dummySA, animationFP);

describe(`sAnimator recalcFrameMenuRates() `, () => {

	test.each([
		// typical screen in US
		{animationFP: 1000 / 60, expectedFirst: 1000 / 60, list: [9999, 16.666666666666668,
			8, 4, 2, 1, 0.5, 0.2, 0.1, 0.06666666666666667, 0.03333333333333333,
				0.016666666666666666]},

		// typical screen in Europe, 50hz
		{animationFP: 1000 / 50, expectedFirst: 1000 / 50, list: [9999, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1,
			0.06666666666666667, 0.03333333333333333, 0.016666666666666666]},

		// my LG curved screen can also do this:
		{animationFP: 1000 / 85,  expectedFirst: 1000 / 85, list: [ 9999, 11.764705882352942,
			6, 3, 2, 1, 0.5, 0.2, 0.1, 0.06666666666666667, 0.03333333333333333,
			0.016666666666666666]},

		// something in between
		{animationFP: 1000 / 59,  expectedFirst: 1000 / 59, list: [ 9999,  16.949152542372882,
			8, 4, 2, 1, 0.5, 0.2, 0.1, 0.06666666666666667, 0.03333333333333333,
			0.016666666666666666]},

		{animationFP: 1000 / 73,  expectedFirst: 1000 / 73, list: [ 9999,  13.698630136986301,
			7, 4, 2, 1, 0.5, 0.2, 0.1, 0.06666666666666667, 0.03333333333333333,
			0.016666666666666666]},

	])(`testing recalcFrameMenuRates`,
	({animationFP, expectedFirst, list}) => {
		//console.log(`the dummy SA is: `, dummySA);
		//console.log(`the dummySA.frameRateMenuFreqs is: `, dummySA.frameRateMenuFreqs);
		recalcFrameMenuRates(animationFP);
		expect(dummySA.frameRateMenuFreqs[0]).toEqual(qeConsts.FASTEST);
		expect(dummySA.frameRateMenuFreqs[1]).toEqual(expectedFirst);
		expect(dummySA.frameRateMenuFreqs).toEqual(list);
	});

});
