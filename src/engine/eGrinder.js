/*
** eGrinder - the JS representations of the c++ Grinderobject
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/
//import qe from './qe.js';
import {cppObjectRegistry, prepForDirectAccessors} from '../utils/directAccessors.js';
import eWave from './eWave.js';
//import eSpace from './eSpace.js';
import qe from './qe.js';
import eThread from './eThread.js';

let traceCreation = false;
let traceHighest = false;
let traceVBuffer = false;
let traceIteration = false;

// a qGrindermanages iteration of a wave, and display on a GLView. I keep
// thinking that I should separate the functions, but what will you do with an itration
// if you're not going to view it in GL?
class eGrinder {
	// space is the eSpace we're in (note eSpace constructor constructs 2 Grinders
	// and they're the only ones who know nPoints etc)
	// pointer is an integer pointing into the C++ address space, to the qGrinderobject.
	// We can then set and sample each of the member variables if we know the offset
	// Give us the pointer, we'll reach in and make an eWave from qwave.
	// the q objects must be in place.
	// this way we can't get the wrong wave in the wrong grinder.
	constructor(space, vBufferPointer, pointer) {
		prepForDirectAccessors(this, pointer);
		this.label = window.Module.AsciiToString(this._label);

		this.space = space;
		//this.ewave = new eWave(space, null, this._qwave);
//		this.vBuffer = new Float32Array(
//			window.Module.HEAPF32.buffer, vBufferPointer,
//				space.nPoints * 8); // two vec4 s per point

		if (traceCreation)
			console.log(`eGrinder constructed:`, this);
	}

	// delete, except 'delete' is a reserved word.  Turn everything off.
	// null out all other JS objects and buffers it points to, so ref counting can recycle it all
	liquidate() {
		this.ewave.liquidate();
		this.space = this.ewave = this.vBuffer = null;
	}

	/* *************************************************************** Direct Accessors */
	// see qGrinder.cpp to regenerate this. Note these are all scalars; buffers
	// are passed by pointer and you need to allocate them in JS (eg see
	// eGrinder.constructor)

	get _space() { return this.ints[1]; }

	get elapsedTime() { return this.doubles[2]; }
	set elapsedTime(a) { this.doubles[2] = a; }
	get iterateSerial() { return this.doubles[3]; }
	set iterateSerial(a) { this.doubles[3] = a; }

	get isIterating() { return this.bools[96]; }
	set isIterating(a) { this.bools[96] = a; }
	get pleaseFFT() { return this.bools[99]; }
	set pleaseFFT(a) { this.bools[99] = a; }
	get needsIteration() { return this.bools[97]; }
	set needsIteration(a) { this.bools[97] = a; }
	get doingIteration() { return this.bools[98]; }
	set doingIteration(a) { this.bools[98] = a; }

	get dt() { return this.doubles[4]; }
	set dt(a) { this.doubles[4] = a; }
	get lowPassFilter() { return this.ints[10]; }
	set lowPassFilter(a) { this.ints[10] = a; }
	get stepsPerIteration() { return this.ints[11]; }
	set stepsPerIteration(a) { this.ints[11] = a; }

	get _qwave() { return this.ints[12]; }

	get _potential() { return this.ints[13]; }
	get potentialFactor() { return this.doubles[7]; }
	set potentialFactor(a) { this.doubles[7] = a; }

	get _scratchQWave() { return this.ints[16]; }

	get _qspect() { return this.ints[17]; }
	get _stages() { return this.ints[18]; }
	get _threads() { return this.ints[19]; }
	get _label() { return this.pointer + 80; }

	/* **************************** end of direct accessors */

	// this just gets the pointer to the view buffer...  the JS array
	getViewBuffer() {
		return cppObjectRegistry[qe.grinder_getViewBuffer(this.pointer)];
	}

	// qGrinderfunctions run from here
	dumpViewBuffer(title) { qe.grinder_dumpViewBuffer(this.pointer, title) }

	reStartDrawing() {
		// start the averaging over again
		this.smoothHighest = 0;
	}

	loadViewBuffer() {
		// flatDrawing will use this for tweaking the highest uniform
		this.highest = qe.grinder_loadViewBuffer(this.pointer);
		if (!this.smoothHighest)
			this.smoothHighest = this.highest;
		else
			this.smoothHighest = (this.highest + 3*this.smoothHighest) / 4;
		if (traceHighest) console.log(`🪓 eGrinder ${this.label}: highest=${this.highest}  `+
			`smoothHighest=${this.smoothHighest}`);
		if (traceVBuffer)
			this.dumpViewBuffer(`afterLoadViewBuffer`);
	}

	// can throw std::runtime_error("divergence")
	oneIteration() {
		qe.grinder_oneIteration(this.pointer);
	}

	// thisis what upper levels call when another iteration is needed.
	// It either queues it out to a thread, if the threads are idle,
	// or sets needsIteration if busy
	pleaseIterate() {
		if (traceIteration)
				console.log(`🪓 eGrinder ${this.label}: pleaseIterate()`);
		if (this.doingIteration) {
			if (traceIteration)
				console.log(`🪓             pleaseIterate: needsIteration = true cuz busy`);
			// threads are busy but we'll get to it after we're done with this iteration
			this.needsIteration = true;
			return false;
		}
		else {
			if (traceIteration)
				console.log(`🪓             pleaseIterate oneItration`);
			this.needsIteration = false;
			eThread.oneIteration(this);
			return true;
		}
	}

	askForFFT() {
		qe.grinder_askForFFT(this.pointer);
	}

	// delete the eGrinder and qGrinderand its owned buffers
	deleteGrinder() {
		qe.grinder_delete(this.pointer);
	}
}


window.eGrinder = eGrinder;  // debugging
export default eGrinder;

