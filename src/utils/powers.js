/*
** powers -- UI code to do logarithmic scales in powers of 10 or 2
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/


let tracePowerToIndex = false;

/* ***************************************************************** powers
	index (ix) is an integer that the input[type=range] operates with
	power is a real that the user sees and the software outside of LogSlider deals with.
	stepsPerDecade (spd) tells how many ix s make up a decade (x10 or x16)
	EG if spd = 1, so ix = -3, -2, -1, 0, 1, 2, 3 becomes power=.001, .01, .1, 1, 10, 100, 1000
	EG if spd = 3, so ix = -3, -2, -1, 0, 1, 2, 3 becomes power=.1, .2, .5, 1, 2, 5, 10
	EG if spd = 16, so ix = -3, -2, -1, 0, 1, 2, 3 becomes power=.125, .25, .5, 1, 2, 4, 8
	*/
// index this by stepsPerDecade to get the right stepFactors list
export const stepsPerDecadeStepFactors = {
	1: [1],
	2: [1, 3],
	3: [1, 2, 5],
	// 4: [1, 2, 3, 6],
	// 5: [1, 1.5, 2.5, 4, 6],
	6: [1, 1.5, 2, 3, 5, 8],
	// 8: [1, 1.3, 2.4, 3.2, 4.2, 5.6, 7.5]
	10: [1, 1.25, 1.5,     2, 2.50, 3,     4, 5, 6,     8],

	// 16 = base 2 only, all the way up.  Special case in the code.  a "decade" is really x16 with 4 gradations
	16: [1, 2, 4, 8],

	// more binary step factors, subtract 20 to get steps per binade, times 16
	//21: [16, ],  // 1 step per binade
	//22: [16, 24, ],  // 2 steps per binade
	// 23: [16, 20, 24, ]  // 3 steps per binade
	// 24: [16, 20, 24,  28,]  // 4 steps per binade
	// //25: [16, 18, 20, 24,  28,]  // 5 steps per binade
	// 26: [16, 18, 20, 22, 24,  28,]  // 6 steps per binade
	// 28: [16, 18, 20, 22, 24, 26, 28, 30, ]  // 8 steps per binade
};

// convert eg 20, 21, 25, 30 into 100, 125, 300, 1000, the corresponding power
// special case: pass spd=16 to get a power-of-2 setting
// willRoundPowers = boolean, true if all values should be integers
// stepFactors = element of stepsPerDecadeStepFactors
// ix = actual index to convert to a power
// su stgitutes = array or obj mapping indexes to powers for exceptional cases
export function indexToPower(willRoundPowers, stepFactors, spd, ix, substitutes) {
	let whichDecade, decadePower, factor;

	if (substitutes && substitutes[ix]) return substitutes[ix];

	if (spd != 16) {
		whichDecade = Math.floor(ix/spd);
		decadePower = 10 ** whichDecade;
		factor = stepFactors[ix - whichDecade * spd];
	}
	else {
		// remember, there's still decades, but of 16x each, and 4 settings in each one
		whichDecade = Math.floor(ix/4);
		decadePower =  16 ** whichDecade;
		factor = stepFactors[ix - whichDecade * 4];
	}
	let power = factor * decadePower;
	if (willRoundPowers) power = Math.round(power) ;
	return power;
}

// convert eg 100, 125, 300, 1000 into 20, 21, 25, 30
export function powerToIndex(spd, searchPower, substitutes) {
	let logOf;

	if (substitutes) {
		logOf = substitutes.findIndex(pw => pw && (Math.abs(pw - searchPower) / (pw + searchPower) < 1e-8));
		if (logOf < 0)
			logOf = undefined;
	}

	if (!logOf) {
		if (spd != 16)
			logOf = Math.log10(searchPower) * spd;
		else
			logOf = Math.log2(searchPower);
	}

	if (tracePowerToIndex)
		console.log(`powerToIndex(${spd}, ${searchPower}, ) => ${Math.round(logOf)}, subs==>`, substitutes);

	// now it's reasonable at this point to say why are we rounding vs flooring?  Well, try spd=3 and searchPower=200;
	// log*spd => 6.903 which falls down to 6 when it should be 7.
	return Math.round(logOf);
}

// keep this!!  or even better, move to a spec file!
//😇 function testPowers() {
//😇 	for (let spdStr in stepsPerDecadeStepFactors) {
//😇 		const spd = +spdStr;
//😇 		let stepFactors = stepsPerDecadeStepFactors[spd];
//😇 		console.info(`spd: ${spd}  stepFactors:`, stepFactors.map(f => f.toFixed(2)).join(', ') );
//😇
//😇 		for (let offset = -6; offset < 6; offset += spd) {
//😇 			let totalOffset = spd*offset;
//😇 			stepFactors.forEach((factor, ixNear) => {
//😇 				let ix = ixNear + totalOffset;
//😇 				let power = indexToPower(false, stepFactors, spd, ix);
//😇 				let ixBack = powerToIndex(spd, power);
//😇 				console.info(`   ${ix} ➡︎ ${power} ➡ ${ixBack}`);
//😇 				if (ix != ixBack)
//😇 					console.error(`  ix:${ix} ≠ ixBack:${ixBack}`);
//😇 			})
//😇 		}
//😇
//😇 	}
//😇 }
//😇testPowers();

// powers of 2
export function isPowerOf2(n) {
	while (n > 1 ){
		// if it's got more than 1 bit on
		if (n & 1) return false;
		n = n >> 1;
	}
	return true;
}
