import sAnimator from './sAnimator';
import qe from '../engine/qe.js';

// this function we're testing.  Answer comes as an object dummySA.frameRateMenuPeriods[]
const dummySA = {};
const recalcFrameMenuRates = (animationFP) =>
	sAnimator.prototype.recalcFrameMenuRates.call(dummySA, animationFP);

describe(`sAnimator recalcFrameMenuRates() `, () => {

	test.each([
		{animationFP: 1000 / 60, expectedZeroth: qe.FASTEST, expectedFirst: 1000 / 60},
		{animationFP: 1000 / 50, expectedZeroth: qe.FASTEST, expectedFirst: 1000 / 50},
		{animationFP: 1000 / 85, expectedZeroth: qe.FASTEST, expectedFirst: 1000 / 85},

	])(`testing recalcFrameMenuRates what does this do`,
	({animationFP, expectedZeroth, expectedFirst}) => {

		recalcFrameMenuRates(animationFP);
		expect(dummySA.frameRateMenuPeriods[0], expectedZeroth);
		expect(dummySA.frameRateMenuPeriods[1], expectedFirst);
	});

});
