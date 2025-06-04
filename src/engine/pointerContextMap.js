/*
** pointerContextMap - map C++ pointers to SquishPanel contexts
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/

// from C++: how are you going to tell what SquishPanel you're operating under?
// This.  Take a pointer to a qGrinder, and contextMap[pointer] = the context
// for that SquishPanel.  For that matter, you can also register any other
// pointer as belonging to a context.  Just as long as there's no collisions!

const pointerContextMap = [];

// sign me up!  remember this context goes with the c++ object pointed to by pointer
pointerContextMap.register =
function register(pointer, context) {
	pointerContextMap[pointer] = context;
}

pointerContextMap.dump =
function dump() {
	console.log(`pointerContextMap:`);
	for (let pointer in pointerContextMap) {
		if (/^\d+$/.test(pointer)) {
			const ctx = pointerContextMap[pointer];
			const hex = (+pointer).toString(16).padStart(8, ' ');
			console.log(` ${hex}  ${pointer}   ${ctx.name}`);
		}
	}
}

// so c++ can get at it
globalThis.pointerContextMap = pointerContextMap;

export default pointerContextMap;

