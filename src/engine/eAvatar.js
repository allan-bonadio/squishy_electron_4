/*
** eAvatar - the JS representations of the c++ Avatar object
** Copyright (C) 2022-2025 Tactile Interactive, all rights reserved
*/

import {cppObjectRegistry, prepForDirectAccessors} from '../utils/directAccessors.js';
//import eCavity from './eCavity.js';
import qeFuncs from './qeFuncs.js';
import qeConsts from './qeConsts.js';

let traceCreation = false;
//let traceHighest = false;
let traceVBuffer = false;

// HOW TO USE     use avatars this way:
// create one with eAvatar.createAvatar()
// use attachViewBuffer() to attach each of your buffers (max 4)

// OR adapt a qAvatar (eg one on qSpace) with eAvatar.adaptAvatar()
// the integration engine should usually populate the buffers as part
// of its cycle, at the end of an integration frame.


class eAvatar {
	// create An eAvatar complete with its inner qAvatar.  (zero buffers)
	// use this if you're doing something other than the original  space's avatars
	static createAvatar(avatarBreed, label) {
		if (traceCreation)
			console.log(`🚦 createAvatar: avatarBreed=${avatarBreed} lab='${label}'`);
		let qA = qeFuncs.avatar_create(avatarBreed, label);
		return new eAvatar(qA);
	}

	// given a pointer to a qAvatar, return  an eAvatar that wraps it.
	// Including existing buffers.
	static adaptAvatar(pointer) {
		if (traceCreation)
			console.log(`🚦 adaptAvatar lab='${UTF8ToString(this._label, qeConsts.MAX_LABEL_LEN)}'`);
		let av = new eAvatar(pointer);
		av.wrapViewBuffers();
		return av;
	}

	// DO NOT USE THIS to create an eAvatar in JS!  use adaptAvatar() or
	// createAvatar() above.  To create an eAvatar, you must already have an
	// existing qAvatar and pointer to it. pointer is an integer pointing into
	// the C++ address space, to the qAvatar object. The space comes with 2
	// qAvatars already. Or, call createAvatar() above.
	constructor(pointer) {
		if (!pointer) throw Error("Need pointer to create eAvatar")
		prepForDirectAccessors(this, pointer);
		if (!pointer || pointer < 10)
			throw "cannot construct eAvatar without qAvatar pointer: ${pointer}";

		// for the Float32Arrays for each C++ float arrays
		this.typedArrays = new Array(4);
		this.bufferNames = new Array(4);

		this.label = UTF8ToString(this._label, qeConsts.MAX_LABEL_LEN);

		if (traceCreation)
			console.log(`🚦 cti eAvatar constructed:`, this);
	}

	// delete, except 'delete' is a reserved word.  Turn everything off. null out
	// all other JS objects and buffers it points to, so ref counting can recycle
	// it all
	liquidate() {
		throw Error("eAvatar liquidate not yet implemented")
		//this.cavity.liquidate();
		//this.space = this.cavity = this.vBuffer = null;
	}

	// set an element in the typedArray bloc
	reserveTypedArray(whichBuffer, array) {
		if (this.typedArrays[whichBuffer])
			throw Error(`🚦 typed array ${whichBuffer} already reserved in ${this.label} avatar`);
		return this.typedArrays[whichBuffer] = array;
	}

	// adds another view buffer onto the avatar.  You choose which one, need not
	// be consecutive. But cannot do duplicates.  Returns the typed array itself.
	// Will ultimately hold
	// (nCoordsPerVertex * nVertices) single floats. useThisMemory is a float *
	// pointer for the array in C++ memory.  Just an integer, in C++ global
	// space. pass it if you have one, or else it'll allocate its own in C++ space.
	// allocate the index buf bloc in C++, then wrap it in a typed array in JS
	attachViewBuffer(whichBuffer, useThisMemory,
				nCoordsPerVertex, nVertices, name) {
		if (this.typedArrays[whichBuffer])
			throw `🚦 Second allocate of typed array ${this.label} buffer ${whichBuffer}`;
		this.bufferNames[whichBuffer] = name;

		// buffer of floats, 4 by apiece.  Extra factor of 2 cuz I dunno
		const nFloats = nCoordsPerVertex * nVertices;
		if (!useThisMemory)
			useThisMemory = qeFuncs.buffer_allocateBuffer(nFloats * 8);

		let pointer = qeFuncs.avatar_attachViewBuffer(this.pointer, whichBuffer,
				useThisMemory, nCoordsPerVertex, nVertices);
		const tArray = new Float32Array(window.Module.HEAPF32.buffer, pointer, nFloats);
		tArray.nTuples = nVertices;  // hack so you can pass around the array and its size,
					//  and change the size from one draw to the next.  someday.

		return this.reserveTypedArray(whichBuffer, tArray);
	}

	// allocate the index buf bloc in C++, then wrap it in a typed array in JS
	attachIndexBuffer(useThisMemory, nItems) {

		if (this.indexBuffer)
			throw `🚦 Second allocate of typed array ${this.label} buffer ${whichBuffer}`;

		if (!useThisMemory)
			useThisMemory = qeFuncs.buffer_allocateBuffer(2 * nItems);

		// buffer of short ints, 16 bits apiece
		const pointer = qeFuncs.avatar_attachIndexBuffer(this.pointer, useThisMemory, nItems);
		this.indexBuffer = new Uint16Array(window.Module.HEAPU16.buffer, pointer, nItems);

		return this.indexBuffer;
	}

	// our pre-allocated qAvatar has view buffers in C++ space that we don't have
	// typed arrays for yet.  Set those up.  Called by adaptAvatar()
	wrapViewBuffers() {
		// crawl the viewBuffers array; 3 words apiece
		let nBuffers = this.nBuffers;
		const vbb = this.viewBufferBlock = new Uint32Array(
			window.Module.HEAP32.buffer, this._viewBuffers, nBuffers * 3);
			// three ints for each viewBufInfo

		for (let b = 0; b < nBuffers; b++) {
			let wordLength = vbb[b * 3 + 1] * vbb[b * 3 + 2];
			this.typedArrays[b] = new Float32Array(window.Module.HEAPF32.buffer,
				vbb[b * 3], wordLength);
		}
	}

	// populate whatever buffers in this avatar, written in C++.
	// Go ahead and write your own in JS if you want and use that instead.
	//loadViewBuffers(breed) {
	//qeFuncs.avatar_loadViewBuffers(this.pointer, breed);
	//}

	/* ***************************************** 🥽 Direct Accessors */
	// see qAvatar.cpp to regenerate this. Note these are all scalars; buffers
	// are passed by pointer ... long story, see code and directAccessors.h



	get avatarBreed() { return this.ints[1]; }
	set avatarBreed(a) { this.ints[1] = a; }
	get _space() { return this.ints[3]; }
	get _cavity() { return this.ints[4]; }
	get int0() { return this.ints[5]; }
	set int0(a) { this.ints[5] = a; }
	get int1() { return this.ints[6]; }
	set int1(a) { this.ints[6] = a; }
	get double0() { return this.doubles[4]; }
	set double0(a) { this.doubles[4] = a; }
	get double1() { return this.doubles[5]; }
	set double1(a) { this.doubles[5] = a; }
	get _label() { return this.pointer + 48; }
	get _indexBuffer() { return this.ints[16]; }
	set _indexBuffer(a) { this.ints[16] = a; }
	get _nIndices() { return this.ints[17]; }
	get _viewBuffers() { return this.pointer + 72; }

	/* **************************** 🥽 end of direct accessors */

	// this just gets the TypedArray, ready to use.  attachViewBuffer() also returns it.
	getViewBuffer(bufferIx) {
		return this.typedArrays[bufferIx];
		//avatar_getViewBuffer(this.pointer, bufferIx);
	}

	dumpMeta(title) {
		qeFuncs.avatar_dumpMeta(this.pointer, title);
	}

	// 0-15 for vertex bufs, any combo; 128 for index buf
	dumpViewBuffers(bufferMask, title) {
		console.group(title);
		qeFuncs.avatar_dumpViewBuffers(this.pointer, bufferMask, ' ');
		console.groupEnd();
	}

	dumpIndex(title) {
		console.group(title);
		qeFuncs.avatar_dumpIndex(this.pointer, title);
		console.groupEnd();
	}
}

export default eAvatar;

