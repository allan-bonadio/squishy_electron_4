/*
** errors - helpers for error handling and debugging
** Copyright (C) 2022-2025 Tactile Interactive, all rights reserved
*/

import PropTypes, {checkPropTypes} from 'prop-types';

import qeFuncs from '../engine/qeFuncs.js';

/* ****************************************************** diagnostics */

// this is global so we can use it anywhere in JS
window.isDevel = ('development' == process.env.NODE_ENV);


export function dumpJsStack(where = 'somewhere') {
	let tb = (new Error()).stack
		.replace(/^.*\n.*at dumpJsStack.*\n/, '\n')
		.replace(/Error: /, '\n')
		.substr(0, 500)
	console.info(`\n${where} traceback: ${tb}`);
}
window.dumpJsStack = dumpJsStack;

/* ************************************** error/exception handling from C++ */

// c++ will set this in exceptions.cpp someday
window.cppErrorStack = '';

// class of errors that come from inside C++
class cppError extends Error {
	constructor(exNumber) {
		super('from C++: ' + window.UTF8ToString(qeFuncs.getCppExceptionMessage(exNumber)));

		console.info(`🧯 cppError(${exNumber}) =>`, window.UTF8ToString(qeFuncs.getCppExceptionMessage(exNumber)));
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

// a full-featured exception
//	code: 25
//	columnNumber: 0
//	data: null
//	filename: "http://localhost:6600/qEng/quantumEngine.main.js"
//	lineNumber: 2795
//	message: "Function object could not be cloned."
//	name: "DataCloneError"
//	result: 2152923161
//	stack: "makeAWorker@http://localhost:6600/qEng/quantumEngine.main.js:2795:9\neThread@http://localhost:6600/static/js/bundle.js:53639:39\ncreateThreads@http://localhost:6600/static/js/bundle.js:53672:32\n./src/engine/eEngine.js/startUpWithThreads/<@http://localhost:6600/static/js/bundle.js:53046:57\npromise callback*startUpWithThreads@http://localhost:6600/static/js/bundle.js:53045:24\n@http://localhost:6600/qEng/quantumEngine.main.js:2866:10\nEventListener.handleEvent*@http://localhost:6600/qEng/quantumEngine.main.js:2861:10\n"

// TODO: use this all over
// general purpose exception reporter, use like this:
//  try/catch:      ...} catch (ex) {excRespond(ex, `reindexing of alligator`)}
//	promise:          .catch(ex => excRespond(ex, `reindexing of alligator`));
export function excRespond(exc, where, andDebug) {
	const ex = interpretCppException(exc);
	console.error(`Error in ${where}: `, ex.stack ?? ex.message ?? ex);
	if (andDebug)
		debugger;
}
window.excRespond = excRespond;  // make it global

// easier than writing out a try-catch all the time, this'll just guard a single function call
// use this for event handlers and React lifecycle methods where react swallows the exception
export function wrapForExc(func, where, andDebug) {
	try {
		func();
	} catch (ex) {excRespond(ex, where, andDebug)}
}


/* *********************************************** browser Too Old */

// TODO: isn't this a duplicate ofwhats in glAmbiance?
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
	//if ('WebGL' == what)
	//	tooOldMessage += tryWebGL;
	let inHere = document.querySelector('#theSquishPanel') || document.body;
	inHere.innerHTML = tooOldMessage;
	inHere.style.backgroundColor = '#f44' ;
	inHere.style.color = '#000' ;
	inHere.style.padding = '2em 4em' ;
	inHere.style.margin = '2em 4em' ;
	inHere.style.fontSize = '1.5em' ;
	throw `So long, and thanks for all the fish!`;
}


/* *********************************************** check prop types */

// React used to include PropTypes that had a function checkPropTypes().
// Then,they converted to TS.  I'm not.  And I want traditional PropTypes.
// They still allow original
// checkPropTypes(GLScene.propTypes, props, 'prop', 'GLScene');
//  ccpt(this, props);  // class component
//  cfpt(func, props);  // func component
// fully featured, this will print out a detailed msg and how to get to the code

// a class component.  Call this after super() call, or shortly after
function ccpt(_this, props) {
	const cons = _this.constructor;
	if (cons)
		checkPropTypes(cons.propTypes, props, 'prop', cons.name);
	else
		throw new Error(`no proptypes on comp class ${cons.name}`)
}

// a function component.  Crashes if propType isn't installed.    Call this as
// first call, or shortly after
function cfpt(func, props) {
	if (func.propTypes)
		checkPropTypes(func.propTypes, props, 'prop', func.name);
	else
		throw new Error(`no proptypes on comp function ${func.name}`)
}

// so I can get at them anywhere
window.ccpt = ccpt;
window.cfpt = cfpt;
