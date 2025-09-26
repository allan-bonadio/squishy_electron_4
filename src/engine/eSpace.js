/*
** eSpace - the JS representations of the c++ qSpace object
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/
import qeFuncs from './qeFuncs.js';
import InteStats from '../controlPanel/InteStats.js';
import {prepForDirectAccessors} from '../utils/directAccessors.js';
import voltDisplay from '../volts/voltDisplay.js';
import eAvatar from './eAvatar.js';
import eGrinder from './eGrinder.js';
import eWave from './eWave.js';
import eFlick from './eFlick.js';
import {getAGroup} from '../utils/storeSettings.js';
import {interpretCppException} from '../utils/errors.js';
import {MAX_DIMENSIONS, N_THREADS} from './eEngine.js';

let traceSpace = true;
let traceFamiliarWave = true;
let traceGlobalSpace = true;


/* ************************************************ eSpace */
// this is how you create a qSpace - start from JS and call this.
// call like this:
// new eSpace([{N: 128, continuum: qeConsts.contENDLESS,coord: 'x', etc}], spaceLabelString)
//
// labels must be unique.  Modeled after qSpace in C++,
// does all dimensions in constructor, at least.
// Coords are the same if two dims are parallel, eg two particles with x coords.
// Not the same if one particle with x and y coords; eg you could have an endless canal.
export class eSpace {
	// some bugs cause a big restart, creating a new space, and a big mess.
	static theSpace = null;

	constructor(dims, spaceLabel) {
		if (traceSpace)
			console.log(`eSpace constructor just starting`, dims, spaceLabel);
		if (dims.length > MAX_DIMENSIONS)
			throw new Error(`Too many dimensions for space: ${dims.length} given but max is ${MAX_DIMENSIONS}`);
		if (eSpace.theSpace)
			throw new Error('creating second space')
		this.pointer = qeFuncs.startNewSpace(spaceLabel);
		prepForDirectAccessors(this, this.pointer);

		// make each dimension (someday there'll be more than 1)
		//let nPoints = 1, nStates = 1;
		dims.forEach(d => {
			qeFuncs.addSpaceDimension(this.pointer, d.N, d.continuum,
				d.dimLength, d.label);
			}
		);

		qeFuncs.completeNewSpace(this.pointer, N_THREADS);

		// direct access into the voltage buffer
		this.voltageBuffer = new Float64Array(window.Module.HEAPF64.buffer,
				this._voltage, this.nPoints);
		this.vDisp = voltDisplay.newForSpace(this);
		let voltageParams = getAGroup('voltageParams');
		this.vDisp.setFamiliarVoltage(voltageParams);

		// the avatars create their vbufs and waves, and we make a copy for ourselves
		// no, done by scene this.mainAvatar = eAvatar.adaptAvatar(this._mainAvatar);
		// no, done by scene this.miniGraphAvatar = eAvatar.adaptAvatar(this._miniGraphAvatar);

		this.grinder = new eGrinder(this);
		this._grinder = this.grinder.pointer;

		this.mainFlick = this.grinder.flick;  // i know its a flick not a wave
		this._mainFlick = this.mainFlick.pointer;  // i know its a flick not a wave

		this.miniGraphWave = new eWave(this, null, this._miniGraphWave);
		this._miniGraphWave = this.miniGraphWave.pointer;

		// SetWave most recent settings.
		let waveParams = getAGroup('waveParams');
		this.mainFlick.setFamiliarWave(waveParams);
		this.miniGraphWave.setFamiliarWave(waveParams);
		if (traceFamiliarWave)
			console.log(`🚀  done with setFamiliarWave():`, this.mainFlick.wave);

		//this.sInteStats = new InteStats(this);
		if (traceSpace) console.log(`🚀  done creating eSpace:`, this);

		if (traceGlobalSpace)
			window.squishSpace = this;
	}

	// delete, except 'delete' is a reserved word.  Turn everything off.
	// null out all other JS objects and buffers it points to, so ref counting can recycle it all
	liquidate() {
		// delete stuff that this object's creator created, in reverse order
		try {
			if (traceSpace) {
				// trace msgs in C++ should agree with these
				let mgAv =  '0x'+ this.miniGraphAvatar.pointer.toString(16);
				let mainAv = '0x'+  this.mainAvatar.pointer.toString(16);
				let spP = '0x'+ this.pointer.toString(16);
				console.log(`🚀  liquidating main avatar=${mainAv}  mini avatar=${mgAv} `
					+`  space=${spP} `,
					this);
			}
			this.miniGraphAvatar.liquidate();
			this.miniGraphAvatar = null;

			this.mainAvatar.liquidate();
			this.mainAvatar = null;

			// ?? aren't we freeing the voltage buffer?!?!
			this.voltageBuffer = this.dimensions = null;

			// finally, get rid of the C++ object
			qeFuncs.deleteFullSpace(this.pointer);
			if (traceSpace) console.log(`🚀  done  liquidating eSpace:`, this);
		} catch (ex) {
			// eslint-disable-next-line no-ex-assign
			ex = interpretCppException(ex);
			console.error(ex.stack ?? ex.message ?? ex);
		}
	}

	/* ********************************* 🥽 Direct Accessors */
	// see qSpace.cpp and directAccessors.h to regenerate this.

	get _voltage() { return this.ints[1]; }

	get N() { return this.ints[2]; }
	get continuum() { return this.ints[3]; }
	get start() { return this.ints[4]; }
	get end() { return this.ints[5]; }
	get nStates() { return this.ints[43]; }
	get nPoints() { return this.ints[44]; }
	get dimLength() { return this.doubles[4]; }
	get dt() { return this.doubles[20]; }
	get nDimensions() { return this.ints[42]; }
	get spectrumLength() { return this.ints[45]; }
	get _mainAvatar() { return this.ints[46]; }
	set _mainAvatar(a) { this.ints[46] = a; }
	get _miniGraphAvatar() { return this.ints[47]; }
	set _miniGraphAvatar(a) { this.ints[47] = a; }
	get _mainFlick() { return this.ints[48]; }
	set _mainFlick(a) { this.ints[48] = a; }
	get _miniGraphWave() { return this.ints[49]; }
	set _miniGraphWave(a) { this.ints[49] = a; }
	get _grinder() { return this.ints[50]; }
	set _grinder(a) { this.ints[50] = a; }
	get _label() { return this.pointer + 204; }


	/* **************************** 🥽 end of direct accessors */

	// return me the start, end, etc of this 1d space
	// call it like this: const {start, end, N, continuum} = space.startEnd;
	get startEnd() {
		//const dim = this.dimensions[0];
		return {start: this.start, end: this.end, N: this.N, nPoints: this.nPoints,
			continuum: this.continuum, dimLength: this.dimLength};
		//const dim = this.dimensions[0];
		//return {start: dim.start, end: dim.end, N: dim.N, nPoints: this.nPoints,
		//	continuum: dim.continuum, dimLength: dim.dimLength};
	}

	// this will return the DOUBLE of start and end, for indexing into complex tables.
	// so you can just loop thru += 2
	// skipping over reals/imags.  but NOT N, that's honest
	// call like this:       const {start2, end2, N} = this.space.startEnd2;
	// note start2, end2 NEED TO BE SPELLED exactly that way!
	get startEnd2() {
		return {start2: this.start*2, end2: this.end*2, N: this.N, nPoints2: this.nPoints*2,
			continuum: this.continuum, dimLength: this.dimLength};
	}
}

export default eSpace;
