/*
** e Engine - main interface in JS to the quantumEngine in C++ and Emscripten
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import {defineQEngineFuncs} from './qeFuncs.js';
import App from '../App.js';
import {interpretCppException, excRespond} from '../utils/errors.js';
//import {resetObjectRegistry} from '../utils/directAccessors.js';
import {getASetting, storeASetting, createStoreSettings} from '../utils/storeSettings.js';
import eSpace from './eSpace.js';
//import eThread from './eThread.js';

// all of these must be attached to window to  get called by c++

let traceStartup = false;
let tracePromises = false;

/* ****************************************************** app startup */

// c++ main() calls us to tell us that it's up, and to pass some fundamental sizes
export let MAX_DIMENSIONS, MAX_LABEL_LEN, N_THREADS;

// this promise resolves when the main space is created.
// Create the promise tout de suite when app starts, so everybody can get at it.
// Recreate it when you know you're about to recreate the space and everything.

// TODO: I don't need this crap anymore, right?
let eSpaceCreatedSucceed, eSpaceCreatedFail;
function resetSpaceCreatedPromise() {
	let prom = new Promise((succeed, fail) => {
		eSpaceCreatedSucceed = succeed;
		eSpaceCreatedFail = fail;
		if (tracePromises)
			console.info(`🐥 eSpaceCreatedPromise (re)created:`, succeed, fail);
	});
	if (traceStartup)
		console.log(`spaceCreatedPromise 🐣 ... created but NOT YET RESOLVED`);
	return prom;
}

// for the first time when app starts up.  Because eSpaceCreatedPromise is an
// exported variable, that means there can only be one of them.  Therefore, only
// one space, and only one SquishPanel.  I was hoping to be able to have more
// than one SquishPanel.  Maybe if they all share the same spact... or if I pass
// down yet another variable down multiple layers of components...
export let eSpaceCreatedPromise = resetSpaceCreatedPromise();

// the Space for the SquishPanel
//let theSpace;

// called during startup, to create the space.  (Change Resolution reloads app - easier)
// spaceParams is {N, continuum, spaceLength, label: 'x'}
// label=label for this dimension, not the whole space
export function create1DMainSpace(spaceParams) {
	try {
		if (traceStartup)
			console.log(`space 🐣  before creation, spaceParams=`, spaceParams);

		// eSpace expects an array of param sets, one for each dimension
		let space = new eSpace([spaceParams], 'main');
		if (traceStartup)
			console.log(`space 🐣  created, spaceParams=`, spaceParams);

		// wakes up stuff all over the JS, and gives them the space,
		// that they've been waiting for
		eSpaceCreatedSucceed(space);
		if (traceStartup)
			console.log(`eSpaceCreatedPromise 🐣  resolved`);
	} catch (ex) {
		// this is called from eSpaceCreatedPromise so trigger its fail
		// eslint-disable-next-line no-ex-assign
		ex = interpretCppException(ex);
		debugger;
		eSpaceCreatedFail(ex);
	}
}


// create (almost) everything we know will be in production
// called after BOTH cpp and DOM loaded up
function startUpEverything() {
	if (traceStartup) console.log(`🐣  🐣  starting Up Almost Everything! 🐣  🐣  `);

	// create all the functions that JS uses to call into C++
	defineQEngineFuncs();
	if (traceStartup) console.log(`QEngineFuncs 🐣  defined`);

	// create the system for storing prefs and settings
	// must come After defineQEngineFuncs() cuz it uses continuum constants on qe
	createStoreSettings();
	if (traceStartup) console.log(`StoreSettings 🐣  created`);

	// Create The Space.  Asynchronous, then triggers the eSpaceCreatedPromise.
	// This can't happen until we have the storeSettings and QEngine funcs, and...
	create1DMainSpace({
		N: getASetting('spaceParams', 'N'),
		continuum: getASetting('spaceParams', 'continuum'),
		spaceLength: getASetting('spaceParams', 'spaceLength'),
		label: 'main'});

	if (traceStartup) console.log(`main space 🐣  created`);
}

// Called directly by main.cpp when C++ has
// finally started up.  Once only, at page load. do NOT export this; it's global
// cuz quantumEngine.js, the compiled C++ proxy, has to have access to it early
// on, and it's CJS and can't reach JS module exports.
function startUpFromCpp(maxDims, maxLab, nThreads) {
	MAX_DIMENSIONS = maxDims;
	MAX_LABEL_LEN = maxLab;
	N_THREADS = nThreads;

	window.cppRuntimeInitialized();

	// startup threads need, like everything else, the space
	// I guess we're starting up with threads anyway
	eSpaceCreatedPromise
	.then(space => {
		if (traceStartup) console.log(`threads 🐣  created`);
		if (tracePromises) console.log(
			`🐥 startUpFromCpp:  space created and resolving eSpaceCreatedPromise`);

	})
	.catch(ex => {
		excRespond(ex, `creating threads`);
		debugger;
	});

};
window.startUpFromCpp = startUpFromCpp;

/* ********************************************************** Main Startup */
// startup: both of these: domContentLoaded and cppInitialized must have
// happened (and turned true) in order for us to start threads and space and C++
// and everything. Don't care which came first, but the second one runs
// startUpWithThreads() or startUpEverything().

let cppInitialized = false, domContentLoaded = false;

// trigger when all the dom stuff is loaded.  (React not totally up yet)
document.addEventListener('DOMContentLoaded', ev => {
	if (traceStartup) console.log(`🐣 DOMContentLoaded`);
	domContentLoaded = true;
	if (cppInitialized)
		window.startUpEverything();
});


// trigger when the C++ runtime is up.  (threads may or may not exist yet)
window.cppRuntimeInitialized =
ev => {
	if (traceStartup) console.log(`🐣 cppRuntimeInitialized`);
	cppInitialized = true;
	if (domContentLoaded)
		startUpEverything();
};

