/*
** e Engine - main interface in JS to the quantumEngine in C++ and Emscripten
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

import {defineQEngineFuncs} from './qeFuncs.js';
//import App from '../App.js';
import {interpretCppException, excRespond} from '../utils/errors.js';
//import {resetObjectRegistry} from '../utils/directAccessors.js';
import {getASetting, storeASetting, getAGroup, createStoreSettings} from '../utils/storeSettings.js';
import eSpace from './eSpace.js';
//import eThread from './eThread.js';

// all of these must be attached to window to  get called by c++

let traceStartup = false;
let tracePromises = false;

/* ****************************************************** app startup (old) */

// c++ main() calls us to tell us that it's up, and to pass some fundamental sizes
export let MAX_DIMENSIONS, N_THREADS;

// this promise resolves when the main space is created.
// this is too much mechanism TODO
// Create the promise tout de suite when app starts, so everybody can get at it.
// 	let eSpaceCreatedSucceed, eSpaceCreatedFail;
// 	function resetSpaceCreatedPromise() {
// 		let prom = new Promise((succeed, fail) => {
// 			eSpaceCreatedSucceed = succeed;
// 			eSpaceCreatedFail = fail;
// 			if (tracePromises)
// 				console.log(`🐥 eSpaceCreatedPromise (re)created:`, succeed, fail);
// 		});
// 		if (traceStartup)
// 			console.log(`spaceCreatedPromise 🐣 ... returned`);
// 		return prom;
// 	}
//
// 	// for the first time when app starts up.  Because eSpaceCreatedPromise is an
// 	// exported variable, that means there can only be one of them.  Therefore, only
// 	// one space, and only one SquishPanel.  I was hoping to be able to have more
// 	// than one SquishPanel.  Maybe if they all share the same space... or if I pass
// 	// down yet another variable down multiple layers of components...
// 	export let eSpaceCreatedPromise = resetSpaceCreatedPromise();

/* ************************************************* cppActivePromise (new) */


// so this promise triggers when C++ is up and running.
// Making a space comes later.  So, this just does the first
export let cppActivePromise = new Promise((fulfiller, rejector) => {
	window.cppFulfiller = fulfiller;
	window.cppRejector = rejector;
});


/* *********************************************** creating the first space */
//  which snouldn't be special for the first space/panel

// called during startup, to create the space.  (Change Resolution reloads app - easier)
// // spaceParams is {N, continuum, dimLength, label: 'x'}
// // label=label for this dimension, not the whole space
// export function create1DMainSpace(spaceParams) {
// 	try {
// 		// eSpace expects an array of param sets, one for each dimension
// 		// N, continuum, etc
// 		let space = new eSpace([spaceParams], 'main');
// 		if (traceStartup)
// 			console.log(`space 🐣  created, `);
//
// 		// wakes up stuff all over the JS, and gives them the space,
// 		// that they've been waiting for
// 		eSpaceCreatedSucceed(space);
//
// 		if (traceStartup)
// 			console.log(`eSpaceCreatedPromise 🐣  resolved`);
// 	} catch (ex) {
// 		// this is called from eSpaceCreatedPromise so trigger its fail
// 		// eslint-disable-next-line no-ex-assign
// 		const iex = interpretCppException(ex);
// 		debugger;
// 		eSpaceCreatedFail(iex);
// 	}
// }


// create (almost) everything we know will be in production
// called after BOTH cpp and DOM loaded up
function startUpEverything() {
	if (traceStartup) console.log(`🐣  🐣  starting Up Almost Everything! 🐣  🐣  `);

	// create all the functions that JS uses to call into C++
	defineQEngineFuncs();
	if (traceStartup) console.log(`QEngineFuncs 🐣  defined`);

	window.cppFulfiller('c++ started');
	// pay careful attention to what isn't defined at this time, see below

	// create the system for storing prefs and settings
	// must come After defineQEngineFuncs() cuz it uses continuum constants on qeConsts
	createStoreSettings();
	if (traceStartup) console.log(`StoreSettings 🐣  created`);


	// Create The Space.  Asynchronous, then triggers the eSpaceCreatedPromise.
	// This can't happen until we have the storeSettings and QEngine funcs, and...
//MOVED TO squish panel for when that gets created
// 	create1DMainSpace({
// 		N: getASetting('spaceParams', 'N'),
// 		continuum: getASetting('spaceParams', 'continuum'),
// 		dimLength: getASetting('spaceParams', 'dimLength'),
// 		label: 'main'});
//
// 	if (traceStartup) console.log(`main space 🐣  created`);
}

/* ********************************************************** Main Startup */
// startup: both of these: domContentLoaded and cppInitialized must have
// happened (and turned true) in order for us to start threads and space and C++
// and everything. Don't care which came first, but the second one runs
// startUpEverything().

let cppInitialized = false, domContentLoaded = false;

// trigger when all the dom stuff is 'loaded'.  (really just the
// public/index.html file.  With the empty element.  React not totally up yet)
document.addEventListener('DOMContentLoaded', ev => {
	if (traceStartup) console.log(`🐣 DOMContentLoaded`);
	domContentLoaded = true;
	if (cppInitialized)
		startUpEverything();
});


// trigger when the C++ runtime is up, in main.cpp.  (threads may or may not exist yet)
window.cppRuntimeInitialized =
ev => {
	if (traceStartup) console.log(`🐣 cppRuntimeInitialized`);
	cppInitialized = true;

	if (domContentLoaded)
		startUpEverything();
};


/* ********************************************************** C++ Startup */

// Called directly by main.cpp when C++ has
// finally started up.  Once only, at page load. do NOT export this; it's global on window
// cuz quantumEngine.js, the compiled C++ proxy, has to have access to it early
// on, and it's CJS and can't reach JS module exports.
function startUpFromCpp(maxDims, nThreads, sqdevel) {
	MAX_DIMENSIONS = maxDims;
	N_THREADS = nThreads;
	//window.cppLabelText = labBuffer;

	// the global 'developnment' flag, zero for production
	globalThis.sqDEVEL = sqdevel;

	window.cppRuntimeInitialized();
	if (traceStartup) console.log(`threads 🐣  created`);


	// startup threads need, like everything else, the space
	// I guess we're starting up with threads anyway

	// thisd does nothing.
// 	context.spaceCreatedProm  // wait... where do I get context heree?!?!?!
// 	.then(space => {
// 		// SpaceCreated.
// 		if (traceStartup) console.log(`threads 🐣  created`);
// 		if (tracePromises) {
// 			console.log(
// 				`🐥 startUpFromCpp:  space created and resolving eSpaceCreatedPromise`);
// 		}
//
// 	})
// 	.catch(ex => {
// 		excRespond(ex, `spaceCreatedProm error`);
// 		debugger;
// 	});

};

let delay = 100;
function cppStartupRepeater() {
	if (window.startUpFromCpp) {
		// this function in src/engine/eEngine.js
		window.startUpFromCpp(max_dimensions, n_threads, sqdevel);
	}
	else {
		console.log(`try again later, 🐌  delay=${delay}  see if cpp set up yet` + (new Date));
		delay *= 1.4;
		setInterval(cppStartupRepeater, delay);
	}
}
window.cppStartupRepeater = cppStartupRepeater;

// so window.startUpFromCpp is also a flag that says that cpp is up?
// No, just that this sourcefile has executed all the way thru
window.startUpFromCpp = startUpFromCpp;
