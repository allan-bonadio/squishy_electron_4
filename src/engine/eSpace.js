/*
** eSpace - the JS representations of the c++ qSpace object
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/
import qe from './qe';
//import eWave from './eWave';
import {setFamiliarPotential} from '../utils/potentialUtils';
import salientPointersFactory from './salientPointersFactory';
import eAvatar from './eAvatar';
import {getAGroup} from '../utils/storeSettings';
import {cppObjectRegistry} from '../utils/directAccessors';
import {interpretCppException} from '../utils/errors';
import {MAX_DIMENSIONS} from './eEngine';

let traceSpace = false;
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
	//unused static contCodeToText = code => ['Discrete', 'Well', 'Endless'][code];

	constructor(dims, spaceLabel) {
		if (traceSpace) console.log(`eSpace constructor just starting`, dims, spaceLabel);
		if (dims.length > MAX_DIMENSIONS)
			throw new Error(`Too many dimensions for space: ${dims.length} given but max is ${MAX_DIMENSIONS}`);

		// this actually does it over on the C++ side
		qe.startNewSpace(spaceLabel);

		// make each dimension (someday there'll be more than 1)
		let nPoints = 1, nStates = 1;
		this.dimensions = dims.map(d => {
				qe.addSpaceDimension(d.N, d.continuum, d.label);  // c++

				let dim = new eDimension(d)
				nStates *= dim.N;
				nPoints *= dim.start + dim.end;
				return dim;
			}
		);

		// total for the space = must agree with qSpace
		this.nPoints = nPoints;
		this.nStates = nStates;

		if (traceSpace) console.log(`🚀  the resulting eSpace dimensions: `, this);


// 		dims.forEach(dim => {
//
// 			// these are convenient to have
// 			// change this when we get to multiple dimensions
// 			this.N = dim.N;
// 			this.start = dim.continuum ? 1 : 0;
// 			this.end = this.start + this.N;
// 			this.nPoints = this.start + this.end;
// 		});

		// salientPointers will give us pointers to buffers and stuff we need
		let sp = qe.completeNewSpace();
		let salientPointers = this.salientPointers = new salientPointersFactory(this, sp);

		// remember that eSpace.salientPointers doesn't work for multiple spaces or multiple dimensions
		eSpace.salientPointers = salientPointers;

		// this reaches into C++ space and accesses the main wave buffer of this space
		// hmmm space shouldn't point to this - just avatar?
		//this.ewave = salientPointers.mainEWavethis.mainEAvatar;
		//this.wave = this.ewave.wave;

		this.pointer = salientPointers.spacePointer;
		cppObjectRegistry[this.pointer] = this;


		// direct access into the potential buffer
		this.potentialBuffer = new Float64Array(window.Module.HEAPF64.buffer,
				salientPointers.potentialBufferPointer, this.nPoints);;
		let potentialParams = getAGroup('potentialParams');
		setFamiliarPotential(this, this.potentialBuffer, potentialParams);
			//

		// the avatars create their vbufs and waves, and we make a copy for ourselves
		this.mainEAvatar = new eAvatar(this,
				salientPointers.mainVBufferPointer, salientPointers.mainAvatarPointer);
		//this.mainEAvatar = salientPointers.mainEAvatarPointer;
		this.mainVBuffer = this.mainEAvatar.vBuffer;
		this.mainEWave = this.mainEAvatar.ewave;

		this.miniGraphAvatar = new eAvatar(this,
				salientPointers.miniGraphVBufferPointer, salientPointers.miniGraphAvatarPointer);
		this.miniGraphVBuffer = this.miniGraphAvatar.vBuffer;
		this.miniGraphEWave = this.miniGraphAvatar.mainEWave

		// by default it's set to 1s, or zeroes?  but we want something good.
		let waveParams = getAGroup('waveParams');
		this.mainEWave.setFamiliarWave(waveParams);  //  SquishPanel re-does this for SetWave
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

			this.potentialBuffer = this.dimensions = null;

			// finally, get rid of the C++ object
			if (traceSpace) console.log(`🚀  done  eSpace:`, this);
			qe.deleteTheSpace(this.pointer);
		} catch (ex) {
			// eslint-disable-next-line no-ex-assign
			ex = interpretCppException(ex);
			console.error(ex.stack ?? ex.message ?? ex);
		}
	}

	/* ******************************************************************************************* arithmetic */
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

	// refresh the wraparound points for ANY WAVE subscribing to this space
	// 'those' or 'that' means some wave other than this.wave
	// modeled after fixThoseBoundaries() in C++ pls keep in sync!
	//fixThoseBoundaries(wave) {
	//	if (this.nPoints <= 0) throw "🚀  qSpace::fixThoseBoundaries() with zero points";
	//	const {end2, continuum} = this.startEnd2;
	//
	//	switch (continuum) {
	//	case qe.contDISCRETE:
	//		// no neighbor-to-neighbor crosstalk, well except...
	//		// I guess whatever the hamiltonion says.  Everybody's got a hamiltonian.
	//		break;
	//
	//	case qe.contWELL:
	//		// the points on the end are ∞ potential, but the arithmetic goes bonkers
	//		// if I actually set the voltage to ∞.  Remember complex values 2 doubles
	//		wave[0] = wave[1] = wave[end2] = wave[end2+1] = 0;
	//		break;
	//
	//	case qe.contENDLESS:
	//		// the points on the end get set to the opposite side.  Remember this is for complex, 2x floats
	//		wave[0] = wave[end2-2];
	//		wave[1]  = wave[end2-1];
	//		wave[end2] = wave[2];
	//		wave[end2+1] = wave[3];
	//		break;
	//
	//	default: throw new Error(`🚀  bad continuum '${continuum}' in  eSpace.fixThoseBoundaries()`);
	//	}
	//}

}

export default eSpace;

