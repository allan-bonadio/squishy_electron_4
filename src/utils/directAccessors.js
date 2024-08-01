/*
** directAccessors -- helpers to generate direct accessor funcs for JS
** Copyright (C) 2022-2024 Tactile Interactive, all rights reserved
*/

// lookup table from qObject pointer in C++, to JS eObject or TypedArray
// that it wraps.  Cuz c++ can only return the pointer, take it here and find the
// obj it corresponds to.  there'll be no collisions)
// Object constuctores generally do this automatically in prepForDirectAccessors()
// but for typed array you have to do this by hand.
// like this:     cppObjectRegistry[blah.pointer] = blah;
export let cppObjectRegistry = {};

// Use this to directly access C++ fields in a JS class that sortof mirrors the C++ class.
// In your JS constructor, call prepForDirectAccessors(this, pointer).
// pointer is the C++ pointer to the start of the obj in C++ memory.
// Then, see directAccessors.h and qAvatar.cpp
export function prepForDirectAccessors(_this, pointer) {
	// we directly access fields in this C++ object,
	// cuz the overhead from each js-C++ call is kindof large
	_this.pointer = pointer;

	// forget the rest if there's no C++ version of this (see qWave)
	if (!pointer)
		return;

	// these lengths must be big enough to reach to all local variables on your objects
	// otherwise you can't set or retrieve them; adjust as needed
	// (these are not used for arrays or buffers)
	_this.doubles = new Float64Array(window.Module.HEAPF64.buffer, pointer, 40);
	_this.ints = new Int32Array(window.Module.HEAP32.buffer, pointer, 80);
	_this.bools = new Uint8Array(window.Module.HEAPU8.buffer, pointer, 320);

	cppObjectRegistry[pointer] = _this;
}

// call this after all your spaces and avatars and buffers have been freed
// cuz you're recreating everything
export function resetObjectRegistry() {
	cppObjectRegistry = {};
}
resetObjectRegistry();
