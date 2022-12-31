/*
** errors - helpers for error handling and debugging
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

import qe from '../engine/qe.js';

/* ****************************************************** diagnostics */

// this is global so we can use it anywhere in JS
window.isDevel = (process.env.NODE_ENV === 'development');


export function dumpJsStack(where = 'somewhere') {
	console.info(`${where} traceback: ${(new Error()).stack.replace(/^.*\n.*at dumpJsStack.*\n/, '\n')}`);
}
window.dumpJsStack = dumpJsStack;

export function dAssert(condition, msg) {
	if (window.isDevel && !condition)
		throw `Assertion failed: ${msg}`;
}
window.dAssert = dAssert;

/* ****************************************************** error/exception handling from C++ */

// c++ will set this in exceptions.cpp
window.cppErrorStack = '';

// class of errors that come from inside C++
class cppError extends Error {
	constructor(exNumber) {
		super('from C++: ' + window.UTF8ToString(qe.getCppExceptionMessage(exNumber)));

		console.info(`🧯 cppError(${exNumber}) =>`, window.UTF8ToString(qe.getCppExceptionMessage(exNumber)));
		this.exPointer = exNumber;
	}

	name = 'cppError';
}

// every time you catch an exception, take the message or whatever and send it through this
// THEN the result (returned) is an Error as normal.  C++ can throw, but only integers.
// Normal JS exceptions pass through unchanged.
// must put this on line before assiging to ex:   		// eslint-disable-next-line no-ex-assign
export function interpretCppException(ex) {
	if (typeof ex != 'number')
		return ex;

	return new cppError(ex);
}

// easier than writing out a try-catch all the time, this'll just guard a single function call
// use this for event handlers and React lifecycle methods
export function catchEx(func, where) {
	try {
		func();
	} catch (ex) {
		// eslint-disable-next-line no-ex-assign
		ex = interpretCppException(ex);
		console.error(`error ${where}: `, ex.stack ?? ex.message ?? ex);
	}
}
