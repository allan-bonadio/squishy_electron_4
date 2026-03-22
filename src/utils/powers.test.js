
import {thousandsSpaces, toSiSuffix} from './formatNumber.js';
import {stepsPerDecadeStepFactors, indexToPower, powerToIndex,
	twoSidedInfo} from '../utils/powers.js';
import {EFFECTIVE_VOLTS, AMPLE_VOLTS, LOW_VOLTS}
	from '../volts/voltConstants.js';



/* ************************************ test single sided */

describe(`single sided indexToPower `, () => {

	// index to power
	test.each([
		[1, 0, 1],
		[1, 1, 10],
		[1, -1, .1],
		[1, -6, 1e-6],
		[1, 9, 1e9],

		[2, 0, 1],
		[2, 1, 3],
		[2, 2, 10],
		[2, 20, 1e10],
		[2, 23, 3e11],
		[2, -1, .3],
		[2, -2, .1],
		[2, -19, 3e-10],
		[2, -30, 1e-15],

		[3, 0, 1],
		[3, 1, 2],
		[3, 2, 5],
		[3, 3, 10],
		[3, 7, 200],
		[3, 17, 5e5],
		[3, 27, 1e9],
		[3, -1, .5],
		[3, -2, .2],
		[3, -3, .1],
		[3, -8, .002],
		[3, -18, 1e-6],
		[3, -28, .5e-9],

		[6, 0, 1],
		[6, 1, 1.5],
		[6, 2, 2],
		[6, 3, 3],
		[6, 4, 5],
		[6, 5, 7],
		[6, 6, 10],
		[6, 49, 1.5e8],
		[6, 63, 3e10],
		[6, 79, 1.5e13],
		[6, 119, 7e19],

		[6, -1, .7],
		[6, -2, .5],
		[6, -3, .3],
		[6, -4, .2],
		[6, -5, .15],
		[6, -6, .1],
		[6, -29, 1.5e-5],
		[6, -78, 1e-13],

		[10, 0, 1],
		[10, 1, 1.26],
		[10, 2, 1.6],
		[10, 3, 2],
		[10, 4, 2.5],
		[10, 5, 3],
		[10, 6, 4],
		[10, 7, 5],
		[10, 8, 6],
		[10, 9, 8],
		[10, 10, 10],

		[16, 0, 1],
		[16, 1, 2],
		[16, 2, 4],
		[16, 3, 8],
		[16, 4, 16],
		[16, 13, 2 ** 13],
		[16, 47, 2 ** 47],

		[16, -1, .5],
		[16, -2, .25],
		[16, -3, .125],
		[16, -4, .0625],
		[16, -21, 2 ** -21],
		[16, -55, 2 ** -55],

	])(`spd%i: %i=ix to power ?= %d`, (spd, input, expected) => {
		expect(indexToPower(false, spd, input)).toBeCloseTo(expected, 12);
	});

});

describe(`single sided powerToIndex `, () => {
	test.each([
		// these are all same as above, but index and expected
		// are reversed.
		[1, 1, 0],
		[1, 10, 1],
		[1, .1, -1],
		[1, 1e-6, -6],
		[1, 1e9, 9],

		[2, 1, 0],
		[2, 3, 1],
		[2, 10, 2],
		[2, 1e10, 20],
		[2, 3e11, 23],
		[2, .3, -1],
		[2, .1, -2],
		[2, 3e-10, -19],
		[2, 1e-15, -30],

		[3, 1, 0],
		[3, 2, 1],
		[3, 5, 2],
		[3, 10, 3],
		[3, 200, 7],
		[3, 5e5, 17],
		[3, 1e9, 27],
		[3, .5, -1],
		[3, .2, -2],
		[3, .1, -3],
		[3, .002, -8],
		[3, 1e-6, -18],
		[3, .5e-9, -28],

		[6, 1, 0],
		[6, 1.5, 1],
		[6, 2, 2],
		[6, 3, 3],
		[6, 5, 4],
		[6, 8, 5],
		[6, 10, 6],
		[6, 1.5e8, 49],
		[6, 3e10, 63],
		[6, 1.5e13, 79],
		[6, 8e19, 119],

		[6, .8, -1],
		[6, .5, -2],
		[6, .3, -3],
		[6, .2, -4],
		[6, .15, -5],
		[6, .1, -6],
		[6, 1.5e-5, -29],
		[6, 1e-13, -78],

// 		[10, 1, 0],
// 		[10, 1, 0],
// 		[10, 1, 0],
// 		[10, 1, 0],

		[16, 1, 0],
		[16, 2, 1],
		[16, 4, 2],
		[16, 8, 3],
		[16, 16, 4],
		[16, 2 ** 13, 13],
		[16, 2 ** 47, 47],

		[16, .5, -1],
		[16, .25, -2],
		[16, .125, -3],
		[16, .0625, -4],
		[16, 2 ** -21, -21],
		[16, 2 ** -55, -55],

	])(`spd%i: %d=power to ix?= %d`, (spd, input, expected) => {
		expect(powerToIndex(spd, input)).toBe(expected);
	});
});


/* ******************************************** two sided */

// two sided powers go positive and negatve, and zero.  For instance,
// -100, -10, -1, -.1, -.01,   0,    .01, .1, 1 ,10, 100
// The positive numbers have single sided indices -2..2 for the above.
// we re-map these single-sided indices to another set of
// two-sided indices,  -5, -4, ... -1, 0, 1, ...5
// so minSingleIndex (-2 in this example), maxSingleIndex (+2 in this
// example) tell what actual logarithmic domain you're using on the
// positive and negative sides.  For the above example, -2 ... 2
// singlesided maps to 1 ... 5 twosided.

// this goes through some twosided scenarios.  For each, we do some
// index-to-power and power-to-index testing.  Sorry, too many cases
// to do good testing on them... so we just test which variation we use

describe(`twoSide indexToPower `,
	() => {
		const info = new twoSidedInfo(10, 100, 40_000);

		test.each([
			[0, 0],

			[1, 100],
			[2, 126],
			[4, 200],
			[7, 400],
			[11, 1000],
			[14, 2000],
			[17, 4_000],
			[19, 6_000],
			[23, 16_000],
			[27, 40_000],

			[-1, -100],
			[-2, -126],
			[-4, -200],
			[-7, -400],
			[-11, -1000],
			[-14, -2000],
			[-17, -4_000],
			[-19, -6_000],
			[-23, -16_000],
			[-27, -40_000],

		])(`twoSided spd=${info.stepsPerDecade} : %d=ix `
			+`twoIndexToPower?= %d`,
				(input, expected) => {
					expect(info.twoIndexToPower(input)).toBe(expected);
				}
		);

});





// 		// these are all same as above, but index and expected are reversed.
// 		[1, 0, 4],  // 1, 10, 100, 1000, 10_000
//
// 		[3, -6, 6],  // .01, .02, .05, .1,... 1, ...10, 20, 50, 100
//
// 		[10, 0, 40],  // 1, 1.25, 1.5...10...20...30...40
//
// 		// [6, .1, -1],
// 		// [10, 1e-6, -6],
//
// 	])(`twoSided spd%i: single side %i ... %i`,
// 		(spd, minSingleIndex, maxSingleIndex) => {
// 		const info = new twoSidedInfo(spd, minSingleIndex, maxSingleIndex);






// describe.each([
// 		// these are all same as above, but index and expected are reversed.
// 		[1, 0, 4],  // 1, 10, 100, 1000, 10_000
//
// 		[3, -6, 6],  // .01, .02, .05, .1,... 1, ...10, 20, 50, 100
//
// 		[10, 0, 40],  // 1, 1.25, 1.5...10...20...30...40
//
// 		// [6, .1, -1],
// 		// [10, 1e-6, -6],
//
// 	])(`twoSided spd%i: single side %i ... %i`,
// 		(spd, minSingleIndex, maxSingleIndex) => {
// 		const info = new twoSidedInfo(spd, minSingleIndex, maxSingleIndex);
//
// 	describe(`two sided indexToPower `, () => {
//
// 		// index to power
// 		test.each([
// 			// spd 1
// 			[0, 1],
// 			[1, 10],
// 			[-1, .1],
// 			[-6, 1e-6],
// 			[9, 1e9],
//
// 			// spd 3
// 			[0, 1],
// 			[1, 2],
// 			[2, 5],
// 			[3, 10],
// 			[7, 200],
// 			[17, 5e5],
// 			[27, 1e9],
// 			[-1, .5],
// 			[-2, .2],
// 			[-3, .1],
// 			[-8, .002],
// 			[-18, 1e-6],
// 			[-28, .5e-9],
//
// 			// spd 6
// 			[0, 1],
// 			[1, 1.5],
// 			[2, 2],
// 			[3, 3],
// 			[4, 5],
// 			[5, 8],
// 			[6, 10],
// 			[49, 1.5e8],
// 			[63, 3e10],
// 			[79, 1.5e13],
// 			[119, 8e19],
//
// 			// spd 10
// 			[-1, .8],
// 			[-2, .5],
// 			[-3, .3],
// 			[-4, .2],
// 			[-5, .15],
// 			[-6, .1],
// 			[-29, 1.5e-5],
// 			[-78, 1e-13],
//
// 	// 		[10, 0, 1],
// 	// 		[10, 0, 1],
// 	// 		[10, 0, 1],
// 	// 		[10, 0, 1],
//
// 			[16, 0, 1],
// 			[16, 1, 2],
// 			[16, 2, 4],
// 			[16, 3, 8],
// 			[16, 4, 16],
// 			[16, 13, 2 ** 13],
// 			[16, 47, 2 ** 47],
//
// 			[16, -1, .5],
// 			[16, -2, .25],
// 			[16, -3, .125],
// 			[16, -4, .0625],
// 			[16, -21, 2 ** -21],
// 			[16, -55, 2 ** -55],
//
// 		])(`spd%i: %i=ix to power ?= %d`, (spd, input, expected) => {
// 			expect(indexToPower(false, spd, input)).toBeCloseTo(expected, 12);
// 		});
//
// 	});
//



		//expect(powerToIndex(spd, input)).toBe(expected);
	//});
//});

