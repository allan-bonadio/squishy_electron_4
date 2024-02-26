/*
** powers -- UI code to do logarithmic scales in powers of 10 or 2
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/


let tracePowerToIndex = false;


/*
	This is all so we can have logarithmic controls using the usual linear UI
	devices.  	The logarithms can be base 2 (N), 10 (most), or 16 (unused yet).

	Between integer powers of the base, there are sub-gradations that are round
	numbers, but they're not really convenient powers of the base.  So for spd=3
	below, you're dividing up 1...10 into three segments.  Logarithmically, the
	numbers used would be at irrational 10**(1/3) = 2.1544.. and
	10**(2/3)=4.6415..., but for human use it's much better to round off to 2
	and 5 (log10(2) = .30102...  and log10(5) = 0.69897...) which are not
	exactly 1/3 and 2/3, but close enough.

	So this transformation isn't usually a convenient math function.  So we use the lookup tables below.

	index (ix) is an integer that, eg, the input[type=range] operates with.  It goes thru all the powers and sub-gradations, so that all indexes that are multiples of spd are powers of the base.
	power is a rounded off real power that the user sees and the software outside of LogSlider uses.
	stepsPerDecade (spd) tells how many ix s make up a decade, binade (x10 or x2)
	If spd = 1, then ix = -3, -2, -1, 0, 1, 2, 3 becomes power=.001, .01, .1, 1, 10, 100, 1000
	If spd = 3, then ix = -3, -2, -1, 0, 1, 2, 3 becomes power=.1, .2, .5, 1, 2, 5, 10
	If spd = 10, then ix = -3, -2, -1, 0, 1, 2, 3 becomes power=.5, .6, .8, 1, 1.25, 1.5, 2
	If spd = 16, so ix = -3, -2, -1, 0, 1, 2, 3 becomes power=.125, .25, .5, 1, 2, 4, 8
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

	// 16 = base 2 only, all the way up. Implemented as base 16 now; fix it later
	16: [1, 2, 4, 8],

	// more binary step factors, subtract 20 to get steps per binade, times 16
	// I have to think these through before implementing them...
	//21: [1, ],  // 1 step per binade
	//22: [1, 3/2, ],  // 2 steps per binade
	// 23: [1, 5/4, 6/4, ]  // 3 steps per binade
	// 24: [[1, 5/4, 6/4,  7/4,]  // 4 steps per binade
	// //25: [16, 18, 20, 24,  28,]  // 5 steps per binade
	// 26: [16, 18, 20, 22, 24,  28,]  // 6 steps per binade
	// 28: [16, 18, 20, 22, 24, 26, 28, 30, ]  // 8 steps per binade
};

// convert eg 20, 21, 25, 30 into 100, 125, 300, 1000, the corresponding power
// special case: pass spd=16 to get a power-of-2 setting
// willRoundPowers = boolean, true if all values should be integers (for small powers)
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
		// no, redo these before implementing!
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

// 	now it's reasonable at this point to say why are we rounding vs flooring?
// 	 Well, try spd=3 and searchPower=200; log*spd => 6.903 which falls down
// 	to 6 when it should be 7.
	return Math.round(logOf);
}


// powers of 2
export function isPowerOf2(n) {
	while (n > 1 ){
		// if it's got more than 1 bit on
		if (n & 1) return false;
		n = n >> 1;
	}
	return true;
}
