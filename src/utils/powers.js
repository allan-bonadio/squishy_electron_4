/*
** powers -- UI code to do logarithmic scales in powers of 10 or 2
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
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

"Index" (ix) is a consecutive integer that, eg, the input[type=range] operates
with.  It goes thru all the powers and sub-gradations, so that all
indexes that are multiples of spd are powers of the base.

"Power" is a rounded off real power that the user sees and the software
outside of LogSlider uses.  Use the names power and index always to keep it straight.

stepsPerDecade (spd) tells how many ix s make up a decade, binade (x10 or x2)
If spd = 1, then ix = -3, -2, -1, 0, 1, 2, 3 becomes
	power=.001, .01, .1, 1, 10, 100, 1000
If spd = 3, then ix = -3, -2, -1, 0, 1, 2, 3 becomes power=.1, .2, .5, 1, 2, 5, 10
If spd = 10, then ix = -3, -2, -1, 0, 1, 2, 3 becomes
	power=.5, .6, .8, 1, 1.25, 1.5, 2
If spd = 16, so ix = -3, -2, -1, 0, 1, 2, 3 becomes power=.125, .25, .5, 1, 2, 4, 8
*/

// index this by stepsPerDecade to get the right stepFactors list
// (the commented out ones are either unused or more exact but less handy)
export const stepsPerDecadeStepFactors = {
	1: [1],
	2: [1, 3],
	3: [1, 2, 5],
	6: [1, 1.5, 2, 3, 5, 7],
	10: [1, 1.26, 1.6,     2, 2.5, 3,     4, 5, 6,     8],

	// 16 = base 2 only, all the way up. Implemented as base 16 now; fix it later
	16: [1, 2, 4, 8],
};

// convert eg 20, 21, 25, 30 into 100, 125, 300, 1000, the corresponding power
// special case: pass spd=16 to get a power-of-2 setting
// willRoundPowers = boolean, true if all values should be integers (for small powers)
// stepFactors = element of stepsPerDecadeStepFactors
// ix = actual index to convert to a power
// substitutes = array or obj mapping indexes to powers for exceptional cases
export function indexToPower(willRoundPowers, spd, ix, substitutes) {
	let wholePower, factor;
	const stepFactors = stepsPerDecadeStepFactors[spd];
	if (substitutes && substitutes[ix]) return substitutes[ix];

	if (spd != 16) {
		let whichDecade = Math.floor(ix/spd);
		wholePower = 10 ** whichDecade;
		// console.log(`🙃 spd${spd} ix${ix} wd${whichDecade} ${wholePower} `)
		factor = stepFactors[ix - whichDecade * spd];
		//console.log(`🙃 spd${spd} ix${ix} wd${whichDecade} ${wholePower} f${factor} p${factor * wholePower} `)
	}
	else {
		// remember, there's still "decades", but of 16x each, and 4 settings in each one
		let whichHexade = Math.floor(ix/4);
		wholePower =  16 ** whichHexade;
		factor = stepFactors[ix - whichHexade * 4];
	}
	let power = factor * wholePower;
	if (willRoundPowers) power = Math.round(power) ;
	return power;
}

// convert eg 100, 125, 300, 1000 into 20, 21, 25, 30
export function powerToIndex(spd, power, substitutes) {
	let logOf;

	if (power <= 0 || !isFinite(power)) {
		debugger;
		throw `bad powerToIndex power ${power}`;
	}
	if (substitutes) {
		logOf = substitutes.findIndex(pw =>
			pw && (Math.abs(pw - power) / (pw + power) < 1e-8));
		if (logOf < 0)
			logOf = undefined;
	}

	if (!logOf) {
		if (spd != 16)
			logOf = Math.log10(power) * spd;
		else
			logOf = Math.log2(power);
	}

	if (tracePowerToIndex)
		console.log(`powerToIndex(${spd}, ${power}, ) => ${Math.round(logOf)}, subs==>`, substitutes);

// 	now it's reasonable at this point to say why are we rounding vs flooring?
// 	 Well, try spd=3 and power=200; log*spd => 6.903 which falls down
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


/* ******************************************** twoSided */

// a two-sided one goes from a negative to a positive index.  The
// single-sided ix is slid down to range from 1 to singleIndexWidth for
// powers > 0, to zero for zero, and from -1 to -singleIndexWidth for
// negatives.  So complicated, hence this object to keep track.
// I think eventually, I'll roll in single-sided into this object too,
// instead of passing around all these arguments.  TODO

export class twoSidedInfo {

	// pass in the singleindices as if single (as above), and we'll set it up
	// will use example in comments: spd = 3, so powers 1, 2, 5, 10...
	// single minix = -6 power=.01, single maxix = 9 for 1000
	constructor(spd, minSinglePower, maxSinglePower) {
		this.stepsPerDecade = spd;
		this.minSingleIndex = powerToIndex(spd, minSinglePower);
		this.maxSingleIndex = powerToIndex(spd, maxSinglePower);

		// the renumbered indices go both directions from zero, to singleIndexWidth+1?
		// eg singleIndexWidth = 16, twowidth=33, twoindices range -16...+16
		this.singleIndexWidth = this.maxSingleIndex - this.minSingleIndex + 1;
		let twoWidth = 2 * this.singleIndexWidth + 1;  // do i need this?

		// outer limits, representing ±maxSingleIndex
		this.minIndex = - this.singleIndexWidth - 1;
		this.maxIndex = this.singleIndexWidth + 1;

		// use these for return arguments, sometimes
		this.neg = this.zero = false;
		this.singleIx = NaN;
	}


	// convert a single-sided index to a twoSide index, but only if
	// twoSided, otherwise just return ix.  Note with single sided,
	// zero and negative have no loggable valid meanings, hence the booleans to
	// indicate.
	indexToTwoIndex(ix, zero, neg) {
		// the zero pt
		if (zero) return 0;

		// single min means twoIndex of 1
		let twoIndex = ix - this.minSingleIndex + 1;

		if (neg)
			return -twoIndex;
		return twoIndex;

	}

	// convert the twoIndex (minIndex ... maxIndex) to a singleIndex plus flags
	// return nothing but sets this.fields: {zero: bool, neg: bool, singleIndex}
	twoIndexToIndex(twoIx) {
		// if (!twoSided)
		// 	return twoIx;

		this.neg = this.zero = false;
		if (twoIx == 0)
			return this.zero = true;

		this.singleIx = Math.abs(twoIx)  - 1 + this.minSingleIndex;
		this.neg = twoIx < 0;
	}

	// convert singleIx and neg and zero (in this) to a twoIndex
	//  (minIndex ... maxIndex)
	// return the twoIndex
	indexToTwoIndex(singleIx, zero, neg) {
		if (zero) return 0;
		let twoIndex = singleIx - this.minSingleIndex + 1;
		if (neg)
			twoIndex = -twoIndex;
		return twoIndex;
	}

	twoIndexToPower(twoIndex) {
		if (twoIndex == 0)
			return 0;

		this.twoIndexToIndex(twoIndex);
		let power = indexToPower(false, this.stepsPerDecade, this.singleIx);
		if (this.neg)
			power = -power;
		console.log(`🙃 spd${this.stepsPerDecade} twoIndex${twoIndex} singleIx${this.singleIx} p${power.toPrecision(5)}`)
		return power;
	}

	powerToTwoIndex(twoPower) {
		if (twoPower == 0)
			return 0;

		let power = Math.abs(twoPower);
		let neg = twoPower < 0;
		let singleIndex = powerToIndex(this.stepsPerDecade, power);

		let twoIndex = this.indexToTwoIndex(singleIndex, false, neg);
		return twoIndex;
	}
}
