/*
** salientPointers - the JS mapping to c++ buffers
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/
//import eWave from './eWave.js';
//import eAvatar from './eAvatar.js';

// I guess you could have one of these for each space?  No, per avatar?
// Additional waves and avatars... um...
//  eventually these should be split out by major data structures - wave and view belong to avatar, etc
// this'll do for now ... STOP RE-ENGINEERING STUFF ALLAN!

// handed back when space is created by C++
// This is recreated every time the space changes dimension(s) -
// the salientPointers object is actually deleted and reconstructed along with space and all the rest
// this instance is kindof like the direct access eSpace
class salientPointersFactory {
	// hand in a pointer into C++ space for the the buffer pointers, as returned from completeNewSpace()
	constructor(space, salientPointersPointer) {
		if (!salientPointersPointer) {
			debugger;
			throw new Error(`falsy salientPointersPointer!`);
		}

		// a patch of memory returned from C++ with addresses of some important
		// buffers and C++ objects.
		const struct = new Uint32Array(window.Module.HEAPU32.buffer, salientPointersPointer, 20);

		this.spacePointer = struct[0];  // just the pointer...maybe not hooked up yet

		// one double per point.  One Float64Array per space.
		this.potentialBufferPointer = struct[1];
		//= new Float64Array(window.Module.HEAPF64.buffer,
		//	struct[1], space.nPoints);

		// avatars made in eSpace from avatar and vbuffer pointers
		this.mainVBufferPointer = struct[2];
		this.mainAvatarPointer = struct[3];


		// first create the avatar; it'll create the vBuffer and qW
		this.miniGraphVBufferPointer = struct[4]
		this.miniGraphAvatarPointer = struct[5];


//		this.miniGraphWaveBuffer = new eWave(space, struct[5]);
//		this.miniGraphVBuffer = new Float32Array(window.Module.HEAPF32.buffer, struct[6],
//			space.nPoints * 8); // two vec4 s per point
//		this.miniGraphAvatar = new eAvatar(struct[7]);
	}
}

export default salientPointersFactory;

