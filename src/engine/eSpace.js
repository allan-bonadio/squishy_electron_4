/*
** eSpace - the JS representations of the c++ qSpace object
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/
import qe from './qe';
//import eWave from './eWave';
import {setFamiliarPotential} from '../utils/potentialUtils';
import storeSettings from '../utils/storeSettings';
import salientBuffersFactory from './salientBuffersFactory';

let debugSpace = false;


const _ = num => num.toFixed(4).padStart(9);

// generate string for this one cx value, w, at location ix
// rewritten from the c++ version in qBuffer::dumpRow()
// pls keep in sync!
function dumpRow(ix, re, im, prev, isBorder) {
	const mag = re * re + im * im;

	let phase = 0;
	if (im || re) phase = Math.atan2(im, re) * 180 / Math.PI;  // pos or neg
	let dPhase = phase - prev.phase + 360;  // so now its positive, right?
	while (dPhase >= 360) dPhase -= 360;
	prev.phase = phase;

	if (!isBorder) prev.innerProd += mag;

	return`[${ix}] (${_(re)} , ${_(im)}) | `+
		`${_(phase)} ${_(dPhase)}} ${_(mag)}\n` ;
}

/* **************************************************************** Basic Space */

// really the qeBasicSpace was just one qDimension.
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





// stop using qeBasicSpace!!!  Must rewrite minigraph
// the dimensions part of the space
// this is enough to contruct a eWave with, so MiniGraph can use it (obsolete,tobe removed)
// pat of eSpace but also want to use independently (NO!  reunify with eSpace!)
// maybe not - nmight get rid of this given changes that are coming
// export class qeBasicSpace {
// 	// dims is the raw minimal definition of the dimensions for the space to be contructed.
// 	// here we fill in the details.
// 	constructor(dims) {
// console.info(`qeBasicSpace constructor just starting`);
// 		// this has SIDE EFFECTS!
// 		let nPoints = 1, nStates = 1;
// 		this.dimensions = dims.map(dim => {
// 				nStates *= d.nStates = d.N;
// 				nPoints *= d.nPoints = d.start + d.end;
// 				return new eDimension(dim)
// 			}
// 		);
// 		this.nPoints = nPoints;
// 		this.nStates = nStates;
//
// 		if (debugSpace) console.log(`🚀  the resulting qeBasicSpace: `, this);
// 	}
//
// 	// call it like this: const {start, end, N, continuum} = space.startEnd;
// 	get startEnd() {
// 		const dim = this.dimensions[0];
// 		return {start: dim.start, end: dim.end, N: dim.N, nPoints: this.nPoints,
// 			continuum: dim.continuum};
// 	}
//
// 	// this will return the DOUBLE of start and end so you can just loop thru += 2
// 	// but NOT N, that's honest
// 	get startEnd2() {
// 		const dim = this.dimensions[0];
// 		return {start: dim.start*2, end: dim.end*2, N: dim.N, nPoints: this.nPoints * 2,
// 			continuum: dim.continuum};
// 	}
//
// 	// a eSpace method to dump any wave buffer according to that space.
// 	// RETURNS A STRING of the wave.
// 	dumpThat(wave) {
// 		if (this.nPoints <= 0) throw "🚀  qeBasicSpace::dumpThat	() with zero points";
//
// 		const {start, end, continuum} = this.startEnd2;
// 		let ix = 0;
// 		let prev = {phase: 0, innerProd: 0};
// 		let output = '';
//
// 		if (continuum)
// 			output += dumpRow(ix, wave[0], wave[1], prev, true);
//
// 		for (ix = start; ix < end; ix += 2)
// 			output += dumpRow(ix/2, wave[ix], wave[ix+1], prev);
//
//
// 		if (continuum)
// 			output += 'end '+ dumpRow(ix/2, wave[end], wave[end+1], prev, true);
//
// 		return output.slice(0, -1) + ' innerProd=' + _(prev.innerProd) +'\n';
// 	}
//
// 	// refresh the wraparound points for ANY WAVE subscribing to this space
// 	// 'those' or 'that' means some wave other than this.wave
// 	// modeled after fixThoseBoundaries() in C++ pls keep in sync!
// 	fixThoseBoundaries(wave) {
// 		if (this.nPoints <= 0) throw "🚀  qSpace::fixThoseBoundaries() with zero points";
// 		const {end, continuum} = this.startEnd2;
//
// 		switch (continuum) {
// 		case qe.contDISCRETE:
// 			// no neighbor-to-neighbor crosstalk, well except...
// 			// I guess whatever the hamiltonion says.  Everybody's got a hamiltonian.
// 			break;
//
// 		case qe.contWELL:
// 			// the points on the end are ∞ potential, but the arithmetic goes bonkers
// 			// if I actually set the voltage to ∞.  Remember complex values 2 doubles
// 			wave[0] = wave[1] = wave[end] = wave[end+1] = 0;
// 			break;
//
// 		case qe.contENDLESS:
// 			// the points on the end get set to the opposite side.  Remember this is for complex, 2x floats
// 			wave[0] = wave[end-2];
// 			wave[1]  = wave[end-1];
// 			wave[end] = wave[2];
// 			wave[end+1] = wave[3];
// 			break;
//
// 		default: throw `🚀  bad continuum '${continuum}' in  eSpace.fixThoseBoundaries()`;
// 		}
// 	}
// }


/* **************************************************************** Space */
// this is how you create a qSpace - start from JS and call this.
// call like this:
// new eSpace([{N: 128, continuum: qe.contENDLESS, label: 'x', coord: 'x'}])
// labels must be unique.  Modeled after qSpace in C++,
// does all dimensions in constructor, at least.
// Coords are the same if two dims are parallel, eg two particles with x coords.
// Not the same if one particle with x and y coords; eg you could have an endless canal.
export class eSpace {
	//unused static contCodeToText = code => ['Discrete', 'Well', 'Endless'][code];

	constructor(dims) {
		console.info(`eSpace constructor just starting`);

		// this actually does it over on the C++ side
		qe.startNewSpace("a eSpace");

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

		if (debugSpace) console.log(`🚀  the resulting eSpace dimensions: `, this);


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
		const salientBuffers = this.salientBuffers = new salientBuffersFactory(this, sp);

		// this reaches into C++ space and accesses the main wave buffer of this space
		// hmmm space shouldn't point to this - just avatar?
		this.qewave = salientBuffers.mainQeWave;  // new eWave(this, salientPointers.mainWaveBuffer);
		this.wave = this.qewave.wave;

		// by default it's set to 1s, or zeroes?  but we want something good.
		this.qewave.setFamiliarWave(storeSettings.waveParams);  // wait - SquishPanel does this too

		// direct access into the potential buffer
		this.potentialBuffer = salientBuffers.potentialBuffer;
			//new Float64Array(window.Module.HEAPF64.buffer,
			//salientPointers.potentialBuffer, this.nPoints);
		setFamiliarPotential(this, this.potentialBuffer, storeSettings.potentialParams);

		this.theAvatar = salientBuffers.theAvatar;

		//let emscriptenMemory = window.Module.HEAPF32.buffer;
		//let address = qe.qViewBuffer_getViewBuffer();


		this.vBuffer = salientBuffers.vBuffer;
			// new Float32Array(emscriptenMemory, address, np);

		if (debugSpace) console.log(`🚀  done creating eSpace:`, this);
	}

	// call it like this: const {start, end, N, continuum} = space.startEnd;
	get startEnd() {
		const dim = this.dimensions[0];
		return {start: dim.start, end: dim.end, N: dim.N, nPoints: this.nPoints,
			continuum: dim.continuum};
	}

	// this will return the DOUBLE of start and end so you can just loop thru += 2
	// but NOT N, that's honest
	get startEnd2() {
		const dim = this.dimensions[0];
		return {start: dim.start*2, end: dim.end*2, N: dim.N, nPoints: this.nPoints * 2,
			continuum: dim.continuum};
	}

	// a eSpace method to dump any wave buffer according to that space.
	// RETURNS A STRING of the wave.
	dumpThat(wave) {
		if (this.nPoints <= 0) throw "🚀  eSpace::dumpThat	() with zero points";

		const {start, end, continuum} = this.startEnd2;
		let ix = 0;
		let prev = {phase: 0, innerProd: 0};
		let output = '';

		if (continuum)
			output += dumpRow(ix, wave[0], wave[1], prev, true);

		for (ix = start; ix < end; ix += 2)
			output += dumpRow(ix/2, wave[ix], wave[ix+1], prev);


		if (continuum)
			output += 'end '+ dumpRow(ix/2, wave[end], wave[end+1], prev, true);

		return output.slice(0, -1) + ' innerProd=' + _(prev.innerProd) +'\n';
	}

	// refresh the wraparound points for ANY WAVE subscribing to this space
	// 'those' or 'that' means some wave other than this.wave
	// modeled after fixThoseBoundaries() in C++ pls keep in sync!
	fixThoseBoundaries(wave) {
		if (this.nPoints <= 0) throw "🚀  qSpace::fixThoseBoundaries() with zero points";
		const {end, continuum} = this.startEnd2;

		switch (continuum) {
		case qe.contDISCRETE:
			// no neighbor-to-neighbor crosstalk, well except...
			// I guess whatever the hamiltonion says.  Everybody's got a hamiltonian.
			break;

		case qe.contWELL:
			// the points on the end are ∞ potential, but the arithmetic goes bonkers
			// if I actually set the voltage to ∞.  Remember complex values 2 doubles
			wave[0] = wave[1] = wave[end] = wave[end+1] = 0;
			break;

		case qe.contENDLESS:
			// the points on the end get set to the opposite side.  Remember this is for complex, 2x floats
			wave[0] = wave[end-2];
			wave[1]  = wave[end-1];
			wave[end] = wave[2];
			wave[end+1] = wave[3];
			break;

		default: throw `🚀  bad continuum '${continuum}' in  eSpace.fixThoseBoundaries()`;
		}
	}

}


export default eSpace;
