/*
** eFlick -- JS equivalent to a qFlick (roughly)
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

// There is no eBuffer or eSpectrum; C++ deals with those exclusively

import qeConsts from './qeConsts.js';
//import cx2rgb from '../gl/cx2rgb/cx2rgb.txlated.js';
import {cppObjectRegistry, prepForDirectAccessors} from '../utils/directAccessors.js';
import eSpace from './eSpace.js';
import eWave from './eWave.js';

let traceSetFamiliarFlick = false;
let traceGaussian = false;
let traceFamiliarResult = false;
let traceAllocate = true;

const _ = num => num.toFixed(4).padStart(9);
// const abs = Math.abs;
// const sqrt = Math.sqrt;
// const exp = Math.exp;
// const π = Math.PI;
// const sin = Math.sin;
// const cos = Math.cos;
// const atan2 = Math.atan2;

// generate string for this one cx value, w, at location ix
// rewritten from the c++ version in qBuffer::dumpRow()
// pls keep in sync!
// this should be moved to eFlick!
// function dumpRow(ix, re, im, prev, isBorder) {
// 	const mag = re * re + im * im;
//
// 	let phase = NaN;
// 	if (abs(im) + abs(re) > 1e-9)
// 		phase = atan2(im, re) * 180 / π;  // pos or neg
//
// 	// make sure diff is -180 ... +180
// 	let dPhase = (phase - prev.phase + 180) / 360;
// 	if (dPhase <= -180) dPhase += 360;
// 	if (dPhase > 180) dPhase -= 360;
//
// 	prev.phase = phase;
//
// 	// calculate inner product while we're at it, displayed on last line
// 	if (!isBorder) prev.innerProd += mag;
//
// 	return`[${ix}] (${_(re)} , ${_(im)}) | `+
// 		`${_(phase)} ${_(dPhase)}} ${_(mag * 1000)} m𝜓/nm\n` ;
// }


// Dump a wave buffer as a colored bargraph in the JS console
// this is also called by C++ so it's easier as a standalone function
// see also eFlick method by same name (but different args)
// export function rainbowDump(wave, start, end, nPoints, title) {
// 	let start2 = 2 * start;
// 	let end2 = 2 * end;
// 	if (isNaN(start2) || isNaN(end2))
// 		debugger;
//
// 	// maybe doesn't work when called from c++?
// 	console.log(`%c rainbowDump  🌊 |  ${title} `,
// 		`color: #222; background-color: #fff; font: 14px Palatino;`);
//
// 	// autorange
// 	let maxi = 0;
// 	for (let ix2 = start2; ix2 < end2; ix2 += 2)
// 		maxi = Math.max(maxi, wave[ix2] ** 2 + wave[ix2 + 1] ** 2);
// 	let correction = 1000 / maxi;  // intended max width in console
//
// 	for (let ix2 = start2; ix2 < end2; ix2 += 2) {
// 		let mag = (wave[ix2] ** 2 + wave[ix2 + 1] ** 2) * correction;
//
// 		let color = cx2rgb([wave[ix2], wave[ix2 + 1]]);
// 		color = `rgb(${color[0]*255}, ${color[1]*255}, ${color[2]*255})`;
// 		console.log(`%c `, `background-color: ${color}; padding-right: ${mag+5}px; `);
// 	}
// }
// window.rainbowDump = rainbowDump;  // so c++ can get to it

/* **************************************************************** eFlick */

// this is just a 1D wave.  someday...
class eFlick extends eWave {
	// see how much we can freeload off of class qWave.  All the direct accessor
	// variables are in different places!! but everything else should work ok.  i
	// think.  Only available constructor is with pointer and no typed array buffer.
	// cuz there's multiple waves.
	constructor(space, pointer) {
		super(space, null, pointer);

		// no already created.  Figure this out later.  qeFuncs.flick_create(space.pointer);
	}

	// finish the construction.  eFlick (the only one) is constructed by the space
	// with all its buffers.  No fussing.  useThis32F is null.  ._wave is pointer to the qwave's wave.
	completeWave(useThis32F) {
		// always had the C++ buffer, need this too
		this.wave = new Float64Array(Module.HEAPF64.buffer, this._wave, 2 * this.space.nPoints);
	}

	// delete, except 'delete' is a reserved word.  Turn everything off.
	// null out all other JS objects and buffers it points to, so ref counting can recycle it all
	liquidate() {
		flick_delete(this.pointer);
		this.space = this.wave = null;
	}

	/* ************************************* 🥽 direct access */
	// these are different offsets from qWave; therefore all of these
	// have to override qWave's versions.  But the constructor for eWave calls
	// prepForDirectAccessors() for us, and it works the same.

	get _wave() { return this.ints[7]; }

	get nPoints() { return this.ints[8]; }
	get start() { return this.ints[9]; }
	get end() { return this.ints[10]; }
	get continuum() { return this.ints[11]; }

	/* **************************** 🥽 end of direct accessors */
	// hope everything else works!  All of qWave's methods work on
	// buffer zero.
}

export default eFlick;

