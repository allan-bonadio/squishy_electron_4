/*
** salientBuffers - the JS mapping to c++ buffers
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/
import eWave from './eWave';
import eAvatar from './eAvatar';

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
		const struct = new Uint32Array(window.Module.HEAPU32.buffer, salientPointersPointer, 20);

		this.space = struct[0];  // maybe not hooked up yet

		// one double per point
		this.potentialBuffer = new Float64Array(window.Module.HEAPF64.buffer, struct[1],
			space.nPoints);

		// eWave figures out the right buffer length
		this.mainQeWave = new eWave(space, struct[2]);

		// display also the boundary points?  if not, use nStates instead
		this.vBuffer = new Float32Array(window.Module.HEAPF32.buffer, struct[3],
			space.nPoints * 8); // two vec4 s per point

		this.theAvatar = new eAvatar(struct[4], this.mainQeWave);


		this.miniGraphWaveBuffer = new eWave(space, struct[5]);
		this.miniGraphVBuffer = new Float32Array(window.Module.HEAPF32.buffer, struct[6],
			space.nPoints * 8); // two vec4 s per point
		this.miniGraphAvatar = new eAvatar(struct[7]);
	}
}

export default salientBuffersFactory;

