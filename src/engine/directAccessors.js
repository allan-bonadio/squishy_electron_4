/*
** directAccessors -- helpers to generate direct accessor funcs for JS
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

import eAvatar from './eAvatar.js';
import eSpace from './eSpace.js';
import eWave from './eWave.js';
import eGrinder from './eGrinder.js';

/* ************************************************************* ObjectRegistry */

// lookup table from qObject pointer in C++, to JS eObject or TypedArray
// that it wraps.  Cuz c++ can only return the pointer, take it here and find the
// obj it corresponds to.  there'll be no collisions)
// Object constuctores generally do this automatically in prepForDirectAccessors()
// but for typed array you have to do this by hand.
// like this:     cppObjectRegistry[blah.pointer] = blah;
export let cppObjectRegistry = {};

// call this after all your spaces and avatars and buffers have been freed
// cuz you're recreating everything
export function resetObjectRegistry() {
	cppObjectRegistry = {};
}
resetObjectRegistry();

// given a magic value from an obj, tell me about it
const magicLookup = {
	Buff: {cppName: 'qBuffer'},
	VBuf: {cppName: 'qViewBuffer'},
	Avat: {cppName: 'qAvatar', jsCons: eAvatar},
	Spac: {cppName: 'qSpace', jsCons: eSpace},
	Flic: {cppName: 'qFlick'},
	Wave: {cppName: 'qWave', jsCons: eWave},
	Spec: {cppName: 'qSpectrum'},
	Grin: {cppName: 'qGrinder', jsCons: eGrinder},
};

// given a random pointer into C++, tell me what it is.  as much info as you can.
// For debugging
//function digUp(pointer) {
//	return;
//
//
//
//	if (typeof pointer != 'number' || !Number.isSafeInteger(pointer) || pointer < 1024 || pointer > 1e10) {
//		console.error(`digUp(number); number must be integer >0 and not too big`);
//		return;
//	}
//
//	let obj = cppObjectRegistry[pointer];
//	if (obj) {
//		// got lucky
//		console.log(`found in object registry: ${obj?.constuctor?.name || 'unknown contructor'}: `, obj);
//		return obj;
//	}
//
//	// ok roll up sleeves.
//	if (pointer & 7) {
//		console.log(`probably not an object pointer, pointer & 7=${pointer & 7}`);
//		return;
//	}
//
//	// See if there's magic:
//	let bytes;
//	try {
//		bytes = new Uint8Array(window.Module.HEAPF8.buffer, pointer, 32);
//	} catch (ex) {
//		console.error(ex.message);
//		return;
//	}
//	let magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
//	let info = magicLookup[magic];
//	if (info) {
//		console.log(`based on the magic, it's:'`, info);
//		return info;
//	}
//	else
//		console.log(`dunno, maybe implement searching to see if it's close to an existing object...'`)
//}
//window.digUp = digUp;
//

/* ************************************************************* DirectAccessors */

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
	_this.ints = new Uint32Array(window.Module.HEAPU32.buffer, pointer, 80);
	_this.bools = new Uint8Array(window.Module.HEAPU8.buffer, pointer, 320);

	cppObjectRegistry[pointer] = _this;
}

