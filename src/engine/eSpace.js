/*
** eSpace - the JS representations of the c++ qSpace object
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/
import qe from './qe.js';
import {prepForDirectAccessors} from '../utils/directAccessors.js';
//import eWave from './eWave.js';
import {setFamiliarVoltage} from '../utils/voltageUtils.js';
import eAvatar from './eAvatar.js';
import eGrinder from './eGrinder.js';
import {getAGroup} from '../utils/storeSettings.js';
import {interpretCppException} from '../utils/errors.js';
import {MAX_DIMENSIONS} from './eEngine.js';

let traceSpace = true;
let traceFamiliarWave = false;

/* **************************************************************** eDimension */

// these days the espace is just one qDimension.
// So, do it that way, if anybody needs it.  dim={N, continuum, label: 'x'}
export class eDimension {
	constructor(dim) {
		this.N = dim.N;
		this.continuum = dim.continuum;
		this.label = dim.label;

		this.start = this.continuum ? 1 : 0;
		this.end = this.N + this.start;
	}
}

/* **************************************************************** eSpace */
// this is how you create a qSpace - start from JS and call this.
// call like this:
// new eSpace([{N: 128, continuum: qe.contENDLESS,coord: 'x'}], spaceLabelString)
// labels must be unique.  Modeled after qSpace in C++,
// does all dimensions in constructor, at least.
// Coords are the same if two dims are parallel, eg two particles with x coords.
// Not the same if one particle with x and y coords; eg you could have an endless canal.
export class eSpace {
	constructor(dims, spaceLabel) {
		if (traceSpace) console.log(`eSpace constructor just starting`, dims, spaceLabel);
		if (dims.length > MAX_DIMENSIONS)
			throw new Error(`Too many dimensions for space: ${dims.length} given but max is ${MAX_DIMENSIONS}`);

		// this actually does it over on the C++ side
		this.pointer = qe.startNewSpace(spaceLabel);
		prepForDirectAccessors(this, this.pointer);

		// make each dimension (someday there'll be more than 1)
		//let nPoints = 1, nStates = 1;
		this.dimensions = dims.map(d => {
				qe.addSpaceDimension(d.N, d.continuum, d.label);  // c++

				let dim = new eDimension(d)
				//nStates *= dim.N;
				//nPoints *= dim.start + dim.end;
				return dim;
			}
		);

		qe.completeNewSpace();

		// direct access into the voltage buffer
		this.voltageBuffer = new Float64Array(window.Module.HEAPF64.buffer,
				this._voltage, this.nPoints);;
		let voltageParams = getAGroup('voltageParams');
		setFamiliarVoltage(this.start, this.end, this.voltageBuffer, voltageParams);

		// the avatars create their vbufs and waves, and we make a copy for ourselves
		this.mainEAvatar = new eAvatar(this, this._mainAvatar);
		this.mainVBuffer = this.mainEAvatar.vBuffer;
		this.mainEWave = this.mainEAvatar.ewave;

		this.grinder = new eGrinder(this, this.mainEAvatar, this._grinder);

		this.miniGraphAvatar = new eAvatar(this, this._miniGraphAvatar);
		this.miniGraphVBuffer = this.miniGraphAvatar.vBuffer;
		this.miniGraphEWave = this.miniGraphAvatar.mainEWave;

		// by default it's set to 1s, or zeroes?  but we want something good.
		let waveParams = getAGroup('waveParams');
		this.mainEWave.setFamiliarWave(waveParams);  //  SquishPanel re-does this for SetWave
		qe.grinder_copyFromAvatar(this.grinder.pointer, this.mainEAvatar.pointer);

		this.miniGraphAvatar.ewave.setFamiliarWave(waveParams);  //  SquishPanel re-does this for SetWave
		if (traceFamiliarWave) console.log(`🚀  done with setFamiliarWave():`, JSON.stringify(this.mainEWave.wave));


		if (traceSpace) console.log(`🚀  done creating eSpace:`, this);
	}

	// delete, except 'delete' is a reserved word.  Turn everything off.
	// null out all other JS objects and buffers it points to, so ref counting can recycle it all
	liquidate() {
		// delete stuff that this object's creator created, in reverse order
		try {
			if (traceSpace) {
				// trace msgs in C++ should agree with these
				let mgAv =  '0x'+ this.miniGraphAvatar.pointer.toString(16);
				let mainAv = '0x'+  this.mainEAvatar.pointer.toString(16);
				let spP = '0x'+ this.pointer.toString(16);
				console.log(`🚀  liquidating mg avatar=${mgAv}  main avatar=${mainAv}  space=${spP} `,
					this);
			}
			this.miniGraphAvatar.liquidate();
			this.miniGraphAvatar = this.miniGraphVBuffer = this.miniGraphEWave = null;

			this.mainEAvatar.liquidate();
			this.mainEAvatar = this.mainVBuffer = this.mainEWave = null;

			this.voltageBuffer = this.dimensions = null;

			// finally, get rid of the C++ object
			if (traceSpace) console.log(`🚀  done  eSpace:`, this);
			qe.deleteTheSpace(this.pointer);
		} catch (ex) {
			// eslint-disable-next-line no-ex-assign
			ex = interpretCppException(ex);
			console.error(ex.stack ?? ex.message ?? ex);
		}
	}

	/* *************************************************************** Direct Accessors */
	// see qSpace.cpp and squish.h to regenerate this.

	get _voltage() { return this.ints[1]; }
 	get voltageFactor() { return this.doubles[1]; }

	get N() { return this.ints[4]; }
 	get continuum() { return this.ints[5]; }
 	get start() { return this.ints[6]; }
 	get end() { return this.ints[7]; }
 	get nStates0() { return this.ints[8]; }
 	get nPoints0() { return this.ints[9]; }
 	get spectrumLength0() { return this.ints[10]; }
 	get _label0() { return this.pointer + 44; }
 	get nDimensions() { return this.ints[26]; }
 	get nStates() { return this.ints[27]; }
 	get nPoints() { return this.ints[28]; }
 	get spectrumLength() { return this.ints[29]; }
 	get _mainAvatar() { return this.ints[30]; }
 	get _miniGraphAvatar() { return this.ints[31]; }
 	get _grinder() { return this.ints[32]; }
 	get _label() { return this.pointer + 132; }

	/* **************************** end of direct accessors */

	// call it like this: const {start, end, N, continuum} = space.startEnd;
	get startEnd() {
		const dim = this.dimensions[0];
		return {start: dim.start, end: dim.end, N: dim.N, nPoints: this.nPoints,
			continuum: dim.continuum};
	}

	// this will return the DOUBLE of start and end so you can just loop thru += 2
	// but NOT N, that's honest
	// call like this:       const {start2, end2, N} = this.space.startEnd2;
	// note start2, end2 NEED TO BE SPELLED exactly that way!
	get startEnd2() {
		const dim = this.dimensions[0];
		return {start2: dim.start*2, end2: dim.end*2, N: dim.N, nPoints2: this.nPoints * 2,
			continuum: dim.continuum};
	}



	/* **************************** Voltage Potential */


	// completely wipe out the quantum voltage and replace it with one of our familiar patterns.
	// Called upon set voltage in voltage tab
	populateFamiliarVoltage =
	(voltageParams) => {
		// sets the numbers
		setFamiliarVoltage(this.start, this.end, this.voltageBuffer, voltageParams);

		// no this doesn't affect the vBuffer
	}

	// voltage area needs to be told when the data changes.  can't put the whole voltage buffer in the state!
//	setUpdateVoltageArea =
//	(updateVoltageArea) => {
//		this.updateVoltageArea = updateVoltageArea;
//	};


}

export default eSpace;
