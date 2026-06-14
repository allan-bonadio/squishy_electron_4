/*
** eObject - superclass of objects that proxy in JS for C++ objects
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

// we directly access fields in this C++ object,
// cuz the overhead from each js-C++ call is kindof large
class eObject {
	// pointer is the C++ pointer to the C++ object (integer offset from the shared buffer)
	constructor() {
	}

	// some proxies don't figure out a pointer till a bit after construction so
	// this is sortof a post-constructor or a constructor finisher.  All proxy
	// objects must call it in constructor.
	setPointer(pointer)
	{
		if (!pointer)
			throw `Error in Direct Accessors: pointer is falsy ${pointer}`;
		if (pointer < 16)
			throw `Error in Direct Accessors: pointer is too small ${pointer}`;
		if (pointer & 3)
			throw `Error in Direct Accessors: pointer is odd ${pointer}`;
		//this.#pointer = pointer;

		// these lengths must be big enough to reach to all local variables on your objects
		// otherwise you can't set or retrieve them; adjust as needed.
		// These do not consume bytes; they merely allow addressing.
		// writable, enumerable and configurable are all false, so these are frozen.
		Object.defineProperty(this, '_pointer_', {value: pointer});
		Object.defineProperty(this, '_doubles_', {value: new Float64Array(window.Module.HEAPF64.buffer, pointer, 40)});
		Object.defineProperty(this, '_ints_', {value: new Int32Array(window.Module.HEAP32.buffer, pointer, 80)});
		Object.defineProperty(this, '_bytes_', {value: new Uint8Array(window.Module.HEAPU8.buffer, pointer, 320)});
	}
}

export default eObject;
