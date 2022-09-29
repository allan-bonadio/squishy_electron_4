/*
** directAccessors -- helpers to generate direct accessor funcs for JS
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

// Use this to directly access C++ fields in a JS class that sortof mirrors the C++ class.
// In your JS constructor, call prepForDirectAccessors(this, pointer).
// pointer is the C++ pointer to the start of the obj in C++ memory.
// Then, see directAccessors.h and qAvatar.cpp
export function prepForDirectAccessors(_this, pointer) {
	// we directly access fields in this C++ object,
	// cuz the overhead from each js-C++ call is kindof large
	_this.pointer = pointer;
	_this.doubles = new Float64Array(window.Module.HEAPF64.buffer, pointer);
	_this.ints = new Uint32Array(window.Module.HEAPU32.buffer, pointer);
	_this.bools = new Uint8Array(window.Module.HEAPU8.buffer, pointer);
}
