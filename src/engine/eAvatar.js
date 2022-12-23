/*
** eAvatar - the JS representations of the c++ Avatar object
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/
//import qe from './qe.js';
import {cppObjectRegistry, prepForDirectAccessors} from '../utils/directAccessors.js';
import eWave from './eWave.js';
//import eGrinder from './eGrinder.js';
//import eSpace from './eSpace.js';
import qe from './qe.js';
//import eThread from './eThread.js';

let traceCreation = false;
let traceHighest = false;
let traceVBuffer = false;

class eAvatar {
	// space is the eSpace we're in (note eSpace constructor constructs 2 Avatars
	// and they're the only ones who know nPoints etc)
	// pointer is an integer pointing into the C++ address space, to the qAvatar object.
	// We can then set and sample each of the member variables if we know the offset
	// Give us the pointer, we'll reach in and make an eWave from qwave.
	// the q objects must be in place.
	// this way we can't get the wrong wave in the wrong avatar.
	constructor(space, vBufferPointer, pointer) {
		prepForDirectAccessors(this, pointer);
		this.label = window.Module.AsciiToString(this._label);

		this.space = space;
		this.ewave = new eWave(space, null, this._qwave);
		this.vBuffer = new Float32Array(
			window.Module.HEAPF32.buffer, vBufferPointer,
				space.nPoints * 8); // two vec4 s per point

		// label everything for better traces
		this.ewave.avatarLabel = this.label;
		this.vBuffer.avatarLabel = this.label;  // yes this works on typedarraybuffers

		if (traceCreation)
			console.log(`eAvatar constructed:`, this);
	}

	// delete, except 'delete' is a reserved word.  Turn everything off.
	// null out all other JS objects and buffers it points to, so ref counting can recycle it all
	liquidate() {
		this.ewave.liquidate();
		this.space = this.ewave = this.vBuffer = null;
	}

	/* *************************************************************** Direct Accessors */
	// see qAvatar.cpp to regenerate this. Note these are all scalars; buffers
	// are passed by pointer and you need to allocate them in JS (eg see
	// eAvatar.constructor)

	get _space() { return this.ints[1]; }

	get _qwave() { return this.ints[2]; }

	get _vBuffer() { return this.ints[7]; }
	get _label() { return this.pointer + 40; }


	/* **************************** end of direct accessors */

	// this just gets the pointer to the view buffer...  the JS array
	getViewBuffer() {
		return cppObjectRegistry[qe.avatar_getViewBuffer(this.pointer)];
	}

	// qAvatar functions run from here
	dumpViewBuffer(title) { qe.avatar_dumpViewBuffer(this.pointer, title) }

	reStartDrawing() {
		// start the averaging over again
		this.smoothHighest = 0;
	}

	loadViewBuffer() {
		// flatDrawing will use this for tweaking the highest uniform
		this.highest = qe.avatar_loadViewBuffer(this.pointer);
		if (!this.smoothHighest)
			this.smoothHighest = this.highest;
		else
			this.smoothHighest = (this.highest + 3*this.smoothHighest) / 4;
		if (traceHighest) console.log(`🚦 eAvatar ${this.label}: highest=${this.highest}  `+
			`smoothHighest=${this.smoothHighest}`);
		if (traceVBuffer)
			this.dumpViewBuffer(`afterLoadViewBuffer`);
	}

	//// can throw std::runtime_error("divergence")
	//oneIntegration() {
	//	if (iterateWithGrinder)
	//		qe.grinder_oneIntegration(this.grinder.pointer);
	//	else
	//		qe.avatar_oneIntegration(this.pointer);
	//}
	//
	//// thisis what upper levels call when another frame is needed.
	//// It either queues it out to a thread, if the threads are idle,
	//// or sets needsIntegration if busy
	//pleaseIntegrate() {
	//	if (traceIntegration)
	//			console.log(`🚦 eAvatar ${this.label}: pleaseIntegrate()`);
	//	if (this.doingIntegration) {
	//		if (traceIntegration)
	//			console.log(`🚦             pleaseIntegrate: needsIntegration = true cuz busy`);
	//		// threads are busy but we'll get to it after we're done with this frame
	//		this.needsIntegration = true;
	//		return false;
	//	}
	//	else {
	//		if (traceIntegration)
	//			console.log(`🚦             pleaseIntegrate oneItration`);
	//		this.needsIntegration = false;
	//		this.oneIntegration();
	//		return true;
	//	}
	//}
	//
	//askForFFT() {
	//	qe.avatar_askForFFT(this.pointer);
	//}

	// delete the eAvatar and qAvatar and its owned buffers
	deleteAvatar() {
		qe.avatar_delete(this.pointer);
	}
}


window.eAvatar = eAvatar;  // debugging
export default eAvatar;

