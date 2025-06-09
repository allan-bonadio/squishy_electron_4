
import {thousandsSpaces, toSiSuffix} from './formatNumber.js';
import {stepsPerDecadeStepFactors, indexToPower, powerToIndex} from '../utils/powers.js';

//for (let ff = 1e-30;  ff < 1e30; ff *= 12345) {
//	console.log(`${ff.toPrecision(5)} = ${toSiUnits(ff, 6)}`);
//}


/* ********************************************************** test thousands */

describe(`test thousands() and `, () => {

	test.each([
		[0, 107, '0', '0', '0'],
		[1, 7, '1', '1'],
		[1.6, 7, '1.6', '1.6'],
		[1.6, 0, '2', '2'],

		[16e1, 7, '1.6', '1.6'],
		[167534e2, 7, '1.6', '1.6'],
		[-16e3, 7, '-16000', '-16k'],
		[1.9999e4, 7, '19 999', '19.999k'],
		[8.9999e5, 7, '899 990', '899.99k'],
		[-9.95e6, 2, '-10 000 000', '-10M'],
		[6e7, 7, '60 000 000', '60M'],
// 		[16e12, 7, '1.6', '1.6'],
// 		[16e16, 7, '1.6', '1.6'],
// 		[16e20, 7, '1.6', '1.6'],
// 		[16e24, 7, '1.6', '1.6'],
// 		[16e30, 7, '1.6', '1.6'],
this isnt right whats that secondargument?
	])(`test thousands()`, (input, dunnoNumber, expectedThous, expectedSI) => {

		expect(thousandsSpaces(input), expectedThous);
		expect(toSiSuffix(input), expectedSI);

	});

	function testThousands() {
		let n;
		for (n = 1e-6; n < 1e6; n *= 10) {
			for (let f = 1; f < 10; f *= 1.4)
				console.info(`  testThousands, progressive fractions: ${n*f} =>`,
					thousandsSpaces(n * f));
			console.log();
		}
	}
	 testThousands();


});

/* ********************************************************** put this in a spec file! */
	function testThousands() {
		let n;
		for (n = 1e-6; n < 1e6; n *= 10) {
			for (let f = 1; f < 10; f *= 1.4)
				console.info(`  testThousands, progressive fractions: ${n*f} =>`,
					thousandsSpaces(n * f));
			console.log();
		}
	}
 testThousands();


// actually, the following is powers


// keep this!!  or even better, move to a spec file!
	function testPowers() {
		for (let spdStr in stepsPerDecadeStepFactors) {
			const spd = +spdStr;
			let stepFactors = stepsPerDecadeStepFactors[spd];
			console.info(`spd: ${spd}  stepFactors:`, stepFactors.map(f => f.toFixed(2)).join(', ') );

			for (let offset = -6; offset < 6; offset += spd) {
				let totalOffset = spd*offset;
				stepFactors.forEach((factor, ixNear) => {
					let ix = ixNear + totalOffset;
					let power = indexToPower(false, stepFactors, spd, ix);
					let ixBack = powerToIndex(spd, power);
					console.info(`   ${ix} ➡︎ ${power} ➡ ${ixBack}`);
					if (ix != ixBack)
						console.error(`  ix:${ix} ≠ ixBack:${ixBack}`);
				})
			}

		}
	}
 testPowers();



