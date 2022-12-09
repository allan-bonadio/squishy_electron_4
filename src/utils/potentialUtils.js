/*
** potential utils -- since there's no wrapper class, some code to do useful things
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import qe from '../engine/qe.js';

let traceFamiliar = false;

// raw numbers ~ 100 are way too big and throw it all into chaos
const VALLEY_FACTOR = .000_01;

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
		// sorry, can't draw with SVG to infinity.
		potential[0] = potential[end] = 1e9;
		break;

	case qe.contENDLESS:
		// the points on the end get set to the opposite side.    real, not complex.
		potential[0] = potential[end-1];
		potential[end] = potential[1];
		break;

	default: throw new Error(`bad continuum '${continuum}' in  fixPotentialBoundaries()`);
	}
}

export function setFamiliarPotential(space, potentialArray, potentialParams) {
	const {start, end, N} = space.startEnd;
	let {valleyPower, valleyScale, valleyOffset} = potentialParams;
	if (valleyPower == undefined || valleyScale == undefined || valleyOffset == undefined)
		throw `bad Potential params: valleyPower=${valleyPower}, valleyScale=${valleyScale},
			valleyOffset=${valleyOffset}`
	if (traceFamiliar)
		console.log(`starting setFamiliarPOTENTIAL(array of POTENTIALArray.length,`+
			` POTENTIALParams=`, potentialParams);
	let pot;
	const offset = valleyOffset * N / 100;
	for (let ix = start; ix < end; ix++) {
		if (valleyScale == 0) {
			pot = 0;
		}
		else {
			pot = Math.pow(Math.abs(ix - offset), +valleyPower) * (+valleyScale * VALLEY_FACTOR);
			if (! isFinite(pot)) {
				console.warn(`potential ${pot} not finite at x=${ix}`, JSON.stringify(potentialParams));
				console.warn(`   ix - offset=${ix - offset}`);
				console.warn(`   Math.pow(ix - offset, +valleyPower)=${Math.pow(ix - offset, +valleyPower)}`);
				console.warn(`  Math.pow(ix - offset, +valleyPower) * +valleyScale=${Math.pow(ix - offset, +valleyPower) * +valleyScale}`);
			}
		}
		potentialArray[ix] = pot;
	}

	// fix boundaries; the only points we didn't set
	fixPotentialBoundaries(space, potentialArray);

	//dumpPotential(space, potentialArray, 8);
}

export function dumpPotential(space, potentialArray, nPerRow = 1, skipAllButEvery = 1) {
	const {start, end, N} = space.startEnd;
	if (! skipAllButEvery)
		skipAllButEvery = Math.ceil(N / 40);
	if (! nPerRow)
		nPerRow =  Math.ceil(N / 10);

	let txt = '🎢 The Potential  ';
	for (let ix = start; ix < end; ix++) {
		txt += potentialArray[ix].toFixed(6).padStart(10);
		if (ix % skipAllButEvery == 0)
			txt += '\n';
	}
	console.log(`${txt}\n`);
}


