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

/* ****************************************************** Too Old */


const tryWebGL = `<p>Or if you can't, and you have an old browser, you can try (desktop):
	<p>Enable WebGL in Firefox by setting the about:config preference
	webgl.enable-prototype-webgl2 to true

	<p>Enable WebGL  in Chrome by passing the "--enable-unsafe-es3-apis"
	flag when starting the browser through the command line
	OR: chrome://flags/#enable-webgl-draft-extensions in Chromium based browsers (Chrome, Opera).

	<p>Enable WebGL Safari in the "Experimental Features" developer menu
`;

// call this if the browser/machine are just way too old to support the stuff we use:
// what = 'WebGL' at least v1, 'WebAssembly', dedicated 'WebWorkers', ...
export function tooOldTerminate(what) {
	let tooOldMessage = `<p>Sorry, your browser's ${what} is too old.
		For browsers from 2013 or 2014 or later:

		<p>Probably the best solution: click to get a more recent copy of
			<a href=https://www.mozilla.org/en-US/firefox/new/>Firefox</a>,
			<a href=https://www.google.com/chrome/dr/download>Google Chrome</a>,
			<a href=https://support.apple.com/downloads/safari>Safari</a>, or
			<a href=https://www.microsoft.com/en-us/edge>MS Edge</a>.
			If your machine is old, you might be able to download an older ('legacy') version.
	`;
	if ('WebGL' == what)
		tooOldMessage += tryWebGL;
	let inHere = document.querySelector('#theSquishPanel') || document.body;
	inHere.innerHTML = tooOldMessage;
	inHere.style.backgroundColor = '#f44' ;
	inHere.style.color = '#000' ;
	inHere.style.padding = '2em 4em' ;
	inHere.style.margin = '2em 4em' ;
	inHere.style.fontSize = '1.5em' ;
	throw `So long, and thanks for all the fish!`;
}

