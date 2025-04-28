/*
** eAvatar - the JS representations of the c++ Avatar object
** Copyright (C) 2022-2025 Tactile Interactive, all rights reserved
*/

import {cppObjectRegistry, prepForDirectAccessors} from '../utils/directAccessors.js';
import eWave from './eWave.js';
import qeFuncs from './qeFuncs.js';

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
	constructor(space, pointer) {
		prepForDirectAccessors(this, pointer);
		this.label = window.Module.AsciiToString(this._label);

		this.space = space;
		this.ewave = new eWave(space, null, this._qwave);
		this.vBuffer = new Float32Array(
			window.Module.HEAPF32.buffer, this._vBuffer,
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
	get _voltage() { return this.ints[3]; }
	get _vBuffer() { return this.ints[4]; }
	get _label() { return this.pointer + 20; }


	/* **************************** end of direct accessors */

	// this just gets the pointer to the view buffer...  the JS array
	getViewBuffer() {
		return cppObjectRegistry[qeFuncs.avatar_getViewBuffer(this.pointer)];
	}

	// qAvatar functions run from here
	dumpViewBuffer(title) {
		qeFuncs.avatar_dumpViewBuffer(this.pointer, title)
	}

	loadViewBuffer() {
		// flatDrawing will use this for tweaking the highest uniform
		this.highest = qeFuncs.avatar_loadViewBuffer(this.pointer);
		if (!this.smoothHighest)
			this.smoothHighest = this.highest;
		else
			this.smoothHighest = (this.highest + 3*this.smoothHighest) / 4;
		if (traceHighest) console.log(`🚦 eAvatar ${this.label}: highest=${this.highest}  `+
			`smoothHighest=${this.smoothHighest}`);
		if (traceVBuffer)
			this.dumpViewBuffer(`afterLoadViewBuffer`);
	}

	// delete the eAvatar and qAvatar and its owned buffers
	deleteAvatar() {
		qeFuncs.avatar_delete(this.pointer);
	}
}

export default eAvatar;

