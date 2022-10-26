/*
** directAccessors -- helpers to generate direct accessor funcs for JS
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

// lookup table from pointer to qObject in C++ space, to JS eObject it
// represents.  Cuz c++ can only return the pointer, take it here and find the
// obj it corresponds to.  (I would have made separate registries for each
// object class, but there'll be no collisions this way.)
// like this:     cppObjectRegistry[qe.avatar_getViewBuffer(this.pointer)];
export const cppObjectRegistry = {};

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

	// these lengths are only for convenience in the debugger; adjust as needed
	_this.doubles = new Float64Array(window.Module.HEAPF64.buffer, pointer, 10);
	_this.ints = new Uint32Array(window.Module.HEAPU32.buffer, pointer, 20);
	_this.bools = new Uint8Array(window.Module.HEAPU8.buffer, pointer, 80);

	cppObjectRegistry[pointer] = _this;
}


