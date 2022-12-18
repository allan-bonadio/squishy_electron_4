/*
** eGrinder - the JS interface to c++ numbercrunching the Schrodinger's equation
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/
//import qe from './qe.js';
import {cppObjectRegistry, prepForDirectAccessors} from '../utils/directAccessors.js';
//import eWave from './eWave.js';
//import eSpace from './eSpace.js';
import qe from './qe.js';
import eThread from './eThread.js';

let traceCreation = false;
let traceIteration = false;

// a qGrinder manages iteration of a wave
class eGrinder {
	// eSpace we're in , creates its eGrinder
	constructor(space, avatar, pointer) {
		prepForDirectAccessors(this, pointer);
		this.label = window.Module.AsciiToString(this._label);

		this.space = space;
		this.avatar = avatar;
		avatar.grinder = this;

		// must allocate my qFlick
		//this.qflick = new qFlick(space, this, 4);

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

	get isIterating() { return this.bools[92]; }
	set isIterating(a) { this.bools[92] = a; }
	get pleaseFFT() { return this.bools[95]; }
	set pleaseFFT(a) { this.bools[95] = a; }
	get needsIteration() { return this.bools[93]; }
	set needsIteration(a) { this.bools[93] = a; }
	get doingIteration() { return this.bools[94]; }
	set doingIteration(a) { this.bools[94] = a; }

	get dt() { return this.doubles[4]; }
	set dt(a) { this.doubles[4] = a; }
	get lowPassFilter() { return this.ints[10]; }
	set lowPassFilter(a) { this.ints[10] = a; }
	get stepsPerIteration() { return this.ints[11]; }
	set stepsPerIteration(a) { this.ints[11] = a; }

	get _qflick() { return this.ints[12]; }

	get _potential() { return this.ints[13]; }
	get potentialFactor() { return this.doubles[7]; }
	set potentialFactor(a) { this.doubles[7] = a; }

	get _qspect() { return this.ints[16]; }
	get _stages() { return this.ints[17]; }
	get _threads() { return this.ints[18]; }
	get _label() { return this.pointer + 76; }





	/* **************************** end of direct accessors */

	// this just gets the pointer to the view buffer...  integer pointer to C++ array
	//getViewBuffer() {
	//	return cppObjectRegistry[qe.grinder_getViewBuffer(this.pointer)];
	//}
	//
	//// qGrinder functions run from here
	//dumpViewBuffer(title) { qe.grinder_dumpViewBuffer(this.pointer, title) }
	//
	//reStartDrawing() {
	//	// start the averaging over again
	//	this.smoothHighest = 0;
	//}
	//
	//loadViewBuffer() {
	//	// flatDrawing will use this for tweaking the highest uniform
	//	this.highest = qe.grinder_loadViewBuffer(this.pointer);
	//	if (!this.smoothHighest)
	//		this.smoothHighest = this.highest;
	//	else
	//		this.smoothHighest = (this.highest + 3*this.smoothHighest) / 4;
	//	if (traceHighest) console.log(`🪓 eGrinder ${this.label}: highest=${this.highest}  `+
	//		`smoothHighest=${this.smoothHighest}`);
	//	if (traceVBuffer)
	//		this.dumpViewBuffer(`afterLoadViewBuffer`);
	//}

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
				console.log(`🪓             eGrinder.pleaseIterate: needsIteration = true cuz busy`);
			// threads are busy but we'll get to it after we're done with this iteration
			this.needsIteration = true;
			return false;
		}
		else {
			if (traceIteration)
				console.log(`🪓             eGrinder.pleaseIterate doing oneItration`);
			this.needsIteration = false;
			eThread.oneIteration(this);
			return true;
		}
	}

	askForFFT() {
		qe.grinder_askForFFT(this.pointer);
	}

	// delete the eGrinder and qGrinder and its owned buffers
	deleteGrinder() {
		qe.grinder_delete(this.pointer);
	}
}


window.eGrinder = eGrinder;  // debugging
export default eGrinder;

