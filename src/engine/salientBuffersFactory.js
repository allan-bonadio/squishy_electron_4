/*
** salientBuffers - the JS mapping to c++ buffers
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/
import eWave from './eWave';
import jsAvatar from './jsAvatar';

// I guess you could have one of these for each space?  No, per avatar?
// Additional waves and avatars... um...
//  eventually these should be split out by major data structures - wave and view belong to avatar, etc
// this'll do for now ... STOP RE-ENGINEERING STUFF ALLAN!

// handed back when space is created by C++
// This is recreated every time the space changes dimension(s) -
// the salientBuffers object is actually deleted and reconstructed along with space and all the rest
class salientBuffersFactory {
	// hand in a pointer into C++ space for the the buffer pointers, as returned from completeNewSpace()
	constructor(space, salientPointersPointer) {
		if (!salientPointersPointer)
			throw `falsy salientPointersPointer!`;

		// a patch of memory returned from C++ with addresses of some important buffers.
		const struct = new Uint32Array(window.Module.HEAPU32.buffer, salientPointersPointer);

		// now make the JS-usable versions.  Someday: pass in the length of each?
		//np = this.nPoints * 8;  // 8 = four floats for first row, four for second row

		// eWave figures out the right buffer length
		this.mainQeWave = new eWave(space, struct[1]);

		// one double per point
		this.potentialBuffer = new Float64Array(window.Module.HEAPF64.buffer, struct[2],
			space.nPoints * 2);

		// display also the boundary points?  if not, use nStates instead
		this.vBuffer = new Float32Array(window.Module.HEAPF64.buffer, struct[3],
			space.nPoints * 8); // two vec4 s per point

		this.theAvatar = new jsAvatar(struct[4], this.mainQeWave);
		this.miniGraphAvatar = new jsAvatar(struct[5]);  // not yet implemented or used...
	}

//	get mainWaveBuffer() { return this.struct[1]; }
//	get potentialBuffer() { return this.struct[2]; }
//	get vBuffer() { return this.struct[3]; }
//	get theAvatar() { return this.struct[4]; }
//	get miniGraphAvatar() { return this.struct[5]; }
}

export default salientBuffersFactory;

