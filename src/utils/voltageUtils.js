/*
** voltage utils -- since there's no wrapper class, some code to do useful things
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import qe from '../engine/qe.js';

let traceFamiliar = false;

// raw numbers ~ 100 are way too big and throw it all into chaos
const VALLEY_FACTOR = .000_01;

// Voltage is simple array.  No wrapper object needed (not yet)  Just make a typed array from what C++ created
// um... soon though, call it eVoltage.  maybe also on the c++ side

// don't need this - I never calculate the boundary points so don't need their voltage
export function fixVoltageBoundaries(space, voltage) {
	const {end, continuum} = space.startEnd;

	switch (continuum) {
	case qe.contDISCRETE:
		break;

	case qe.contWELL:
		// the points on the end are ∞ voltage, but the arithmetic goes bonkers?  no, voltage on ends is not really used.
		// if I actually set the voltage to ∞, really ought to work?  real, not complex
		// sorry, can't draw with SVG to infinity.
		voltage[0] = voltage[end] = 1e9;
		break;

	case qe.contENDLESS:
		// the points on the end get set to the opposite side.    real, not complex.
		voltage[0] = voltage[end-1];
		voltage[end] = voltage[1];
		break;

	default: throw new Error(`bad continuum '${continuum}' in  fixVoltageBoundaries()`);
	}
}

// set a valley, flat or double voltage potential in the given array, according to params.
// No space needed.
export function setFamiliarVoltage(start, end, voltageArray, voltageParams) {
	//const {start, end, N} = space.startEnd;
	let {valleyPower, valleyScale, valleyOffset, potentialBreed} = voltageParams;
	if (valleyPower == undefined || valleyScale == undefined || valleyOffset == undefined)
		throw `bad Voltage params: valleyPower=${valleyPower}, valleyScale=${valleyScale},
			valleyOffset=${valleyOffset}`
	if (traceFamiliar)
		console.log(`starting setFamiliarPOTENTIAL(array of POTENTIALArray.length,`+
			` POTENTIALParams=`, voltageParams);
	let pot;
	const offset = valleyOffset * (end - start) / 100;
	for (let ix = start; ix < end; ix++) {
		if ('flat' == potentialBreed) {
			pot = 0;
		}
		else {
			pot = Math.pow(Math.abs(ix - offset), +valleyPower) * (+valleyScale * VALLEY_FACTOR);
		}
		if (! isFinite(pot)) {
			console.warn(`voltage ${pot} not finite at x=${ix} ${JSON.stringify(voltageParams)}
			ix - offset=${ix - offset}
			x ** ${valleyPower}=${Math.pow(ix - offset, +valleyPower)}
			x ** ${valleyPower} * ${valleyScale}=
			${Math.pow(ix - offset, +valleyPower) * +valleyScale}`);
		}
		voltageArray[ix] = pot;
	}

	// fix boundaries; the only points we didn't set
	//no, we don't use the boundaries of the voltage fixVoltageBoundaries(space, voltageArray);
}

export function dumpVoltage(space, voltageArray, nPerRow = 1, skipAllButEvery = 1) {
	const {start, end, N} = space.startEnd;
	if (! skipAllButEvery)
		skipAllButEvery = Math.ceil(N / 40);
	if (! nPerRow)
		nPerRow =  Math.ceil(N / 10);

	let txt = '🎢 The Voltage  ';
	for (let ix = start; ix < end; ix++) {
		txt += voltageArray[ix].toFixed(6).padStart(10);
		if (ix % skipAllButEvery == 0)
			txt += '\n';
	}
	console.log(`${txt}\n`);
}


