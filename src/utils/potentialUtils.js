/*
** potential utils -- since there's no wrapper class, some code to do useful things
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

//import {qeBasicSpace} from '../engine/eSpace';
import qe from '../engine/qe';


// raw numbers ~ 1 are way too big and throw it all into chaos
const VALLEY_FACTOR = .001;

// Potential is simple array.  No wrapper object needed (not yet)  Just make a typed array from what C++ created
// um... soon though, call it ePotential.  maybe also on the c++ side

export function fixPotentialBoundaries(space, potential) {
	const {end, continuum} = space.startEnd;

	switch (continuum) {
	case qe.contDISCRETE:
		break;

	case qe.contWELL:
		// the points on the end are ∞ potential, but the arithmetic goes bonkers?  no, potential on ends is not really used.
		// if I actually set the voltage to ∞, really ought to work?  real, not complex
		potential[0] = potential[end] = Infinity;
		break;

	case qe.contENDLESS:
		// the points on the end get set to the opposite side.    real, not complex.
		potential[0] = potential[end-1];
		potential[end] = potential[1];
		break;

	default: throw `bad continuum '${continuum}' in  fixPotentialBoundaries()`;
	}
}

export function setFamiliarPotential(space, potentialArray, potentialParams) {
	const {start, end, N} = space.startEnd;
	let {valleyPower, valleyScale, valleyOffset} = potentialParams;
	let pot;
	for (let ix = start; ix < end; ix++) {
			pot = Math.pow(Math.abs(ix - valleyOffset * N / 100), +valleyPower) * +valleyScale * VALLEY_FACTOR;
			if (! isFinite(pot)) {
				console.warn(`potential ${pot} screwed up at x=${ix}`, JSON.stringify(potentialParams));
				console.warn(`   ix - valleyOffset * N / 100=${ix - valleyOffset * N / 100}`);
				console.warn(`   Math.pow(ix - valleyOffset * N / 100, +valleyPower)=${Math.pow(ix - valleyOffset * N / 100, +valleyPower)}`);
				console.warn(`  Math.pow(ix - valleyOffset * N / 100, +valleyPower) * +valleyScale=${Math.pow(ix - valleyOffset * N / 100, +valleyPower) * +valleyScale}`);
			}
		potentialArray[ix] = pot;
	}

	// fix boundaries
	fixPotentialBoundaries(space, potentialArray);
}

export function dumpPotential(space, potentialArray, nPerRow = 1, skipAllButEvery = 1) {
	const {start, end, N} = space.startEnd;
	if (! skipAllButEvery)
		skipAllButEvery = Math.ceil(N / 40);
	if (! nPerRow)
		nPerRow =  Math.ceil(N / 10);

	let txt = '';
	for (let ix = start; ix < end; ix++) {
		txt += potentialArray[ix].toFixed(6).padStart(10);
		if (ix % skipAllButEvery == 0)
			txt += '\n';
	}
	console.log(`${txt}\n`);
}


