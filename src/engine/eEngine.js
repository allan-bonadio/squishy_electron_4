/*
** e Engine - main interface in JS to the quantumEngine in C++ and Emscripten
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import {qe, defineQEngineFuncs} from './qe.js';
import App from '../App.js';
import {interpretCppException, excRespond} from '../utils/errors.js';
import {resetObjectRegistry} from '../utils/directAccessors.js';
import {getASetting, storeASetting, createStoreSettings} from '../utils/storeSettings.js';
import eSpace from './eSpace.js';
import eThread from './eThread.js';

// all of these must be attached to window to  get called by c++

let traceStartup = true;
let tracePromises = true;

/* ****************************************************** app startup */

// c++ main() calls us to tell us that it's up, and to pass some fundamental sizes
export let MAX_DIMENSIONS, MAX_LABEL_LEN;

// this promise resolves when the main space is created.
// Create the promise tout de suite when app starts, so everybody can get at it.
// Recreate it when you know you're about to recreate the space and everything.

let eSpaceCreatedSucceed, eSpaceCreatedFail;
function resetSpaceCreatedPromise() {
	let prom = new Promise((succeed, fail) => {
		eSpaceCreatedSucceed = succeed;
		eSpaceCreatedFail = fail;
		if (tracePromises) console.info(`🐥 eSpaceCreatedPromise (re)created:`, succeed, fail);
	});
	if (traceStartup) console.log(`spaceCreatedPromise 🐣 ... created but NOT YET RESOLVED`);
	return prom;
}
// for the first time when app starts up
export let eSpaceCreatedPromise = resetSpaceCreatedPromise();

// export this?  shouldn't have to.  GET RID OF THIS!!
let theSpace;

// called during startup, and also upon every
// spaceParams is {N, continuum, label: 'x'}  label=label for this dimension, not the whole space
export function create1DMainSpace(spaceParams) {
	try {
		if (traceStartup) console.log(`theSpace 🐣  before creation, spaceParams=`, spaceParams);

		// eSpace expects an array of param sets, one for each dimension
		let space = theSpace = new eSpace([spaceParams], 'main');
		if (traceStartup) console.log(`theSpace 🐣  created, spaceParams=`, spaceParams);

		storeASetting('spaceParams', 'N', spaceParams.N);
		storeASetting('spaceParams', 'continuum', spaceParams.continuum);

		// wakes up stuff all over the JS, and gives them the space,
		// that they've been waiting for
		eSpaceCreatedSucceed(space);
		if (traceStartup) console.log(`eSpaceCreatedPromise 🐣  resolved`);
	} catch (ex) {
		// this is called from eSpaceCreatedPromise so trigger its fail
		// eslint-disable-next-line no-ex-assign
		ex = interpretCppException(ex);
		debugger;
		eSpaceCreatedFail(ex);
	}
}

// spaceParams is as above.  Liquidate/Delete the existing space, blink the SquishPanel,
// and start again just like the app starts over.
// This is stupid and overcomplicated.  The app should just reload upon res changes.
export function recreateMainSpace(spaceParams) {
	if (traceStartup) console.log(`recreateMainSpace 🐣  started, N=${spaceParams.N}, `
		+`continuum=${spaceParams.continuum}, spaceLength: ${spaceParams.spaceLength}`);
	resetSpaceCreatedPromise();

	App.blinkSquishPanel(() => {
		if (traceStartup) console.log(`new space 🐣  triggered`);
		create1DMainSpace(spaceParams);
	});

	// GET RID OF theSpace!!
	theSpace.liquidate();

	resetObjectRegistry();  // this will hang on to them otherwise!!
	if (traceStartup) console.log(`space 🐣  liquidated, obj registry reset`);
}
window.recreateMainSpace = recreateMainSpace;  // for debugging

/* ************************************************************************ Start Up */
redundant?  probably

// Called by C++ when C++ has finally started up.  Once only, at page load.
// do NOT export this; it's global cuz quantumEngine.js, the compiled C++ proxy,
// has to have access to it early on, and it can't reach JS exports.
function quantumEngineHasStarted(maxDims, maxLab) {
	MAX_DIMENSIONS = maxDims;
	MAX_LABEL_LEN = maxLab;

	// get out from under emscripten/C++; otherwise,
	// exceptions raised during initialization make a mess when it bubbles up there.
	setTimeout(() => {
		defineQEngineFuncs();
		if (traceStartup) console.log(`QEngineFuncs 🐣  defined`);

		// must come After defineQEngineFuncs() cuz it uses continuum constants on qe
		createStoreSettings();
		if (traceStartup) console.log(`StoreSettings 🐣  created`);

		qe.cppLoaded = true;

		// and this can't happen until the storeSettings and QEngine funcs
		create1DMainSpace({
			N: getASetting('spaceParams', 'N'),
			continuum: getASetting('spaceParams', 'continuum'),
			spaceLength: getASetting('spaceParams', 'spaceLength'),
			label: 'main'});
		if (traceStartup) console.log(`main space 🐣  created`);

		// startup threads needs avatar
		eSpaceCreatedPromise
		.then(space => {
			eThread.createThreads(space.mainEAvatar);

			if (traceStartup) console.log(`threads 🐣  created`);
			if (tracePromises) console.log(
				`🐥 quantumEngineHasStarted:  space created and resolving eSpaceCreatedPromise`);
		})
		.catch(ex => {
			// help!  Mister Wizard!
			// eslint-disable-next-line no-ex-assign
			ex = interpretCppException(ex);
			console.error(`eSpaceCreatedPromise failed`, ex);
			debugger;
		});
	}, 0);

};

window.recreateMainSpace = recreateMainSpace;  // for debugging
window.quantumEngineHasStarted = quantumEngineHasStarted;  // for emscripten

let domReady = false;
let cppReady = false;
let startedUp = false;

// create everything we know will be in production
function startUpAlmostEverything() {
	if (traceStartup) console.log(`🐣  🐣  starting Up Everything! 🐣  🐣  `);

	// create all the functions that JS uses to call into C++
	defineQEngineFuncs();
	if (traceStartup) console.log(`QEngineFuncs 🐣  defined`);

	// create the system for storing prefs and settings
	// must come After defineQEngineFuncs() cuz it uses continuum constants on qe
	createStoreSettings();
	if (traceStartup) console.log(`StoreSettings 🐣  created`);

	//debugger;
	qe.cppLoaded = true;

	// Create The Space.  Asynchronous, then triggers the eSpaceCreatedPromise.
	// This can't happen until we have the storeSettings and QEngine funcs, and...
	create1DMainSpace({
		N: getASetting('spaceParams', 'N'),
		continuum: getASetting('spaceParams', 'continuum'),
		spaceLength: getASetting('spaceParams', 'spaceLength'),
		label: 'main'});

	startedUp = true;
	if (traceStartup) console.log(`main space 🐣  created`);
}

document.addEventListener('DOMContentLoaded', ev => domReady = true);

// start up everything, but only when dom and C++ have started up, and only once.
function startUpWhenReady() {
	if (domReady && cppReady && !startedUp) {
		startUpAlmostEverything();
	}
}

// Called by main.cpp which doesn't get called if we're doing threads.  (hmmm
// should reenable that.  keep changin my mind.) Called by C++ when C++ has
// finally started up.  Once only, at page load. do NOT export this; it's global
// cuz quantumEngine.js, the compiled C++ proxy, has to have access to it early
// on, and it's CJS and can't reach JS module exports.
function startUpFromCpp(maxDims, maxLab) {
	MAX_DIMENSIONS = maxDims;
	MAX_LABEL_LEN = maxLab;

	// startup threads need, like everything else, the space
	// I guess we're starting up with threads anyway
	eSpaceCreatedPromise
	.then(space => {
		eThread.createThreads(space.grinder);

		if (traceStartup) console.log(`threads 🐣  created`);
		if (tracePromises) console.log(
			`🐥 startUpFromCpp:  space created and resolving eSpaceCreatedPromise`);

	})
	.catch(ex => {
		excRespond(ex, `creating threads`);
		debugger;
	});

	// this will ultimately trigger the eSpaceCreatedPromise so lets get it rolling now
	// get out from under emscripten/C++; otherwise,
	// exceptions raised during initialization make a mess when it bubbles up there.
	setTimeout(() => {
		startUpWhenReady();

	}, 0);

};
window.startUpFromCpp = startUpFromCpp;  // for emscripten

// this starts the major pieces of squish  in the right order, if the
// quantumEngine*.js files say we're doing threads.  .  But it can't happen
// immediately.  The content has to be loaded, and the C++ runtime has to be
// ready to go.
function startUpWithThreads() {
	// figure out some way to set these from the C++
	MAX_DIMENSIONS = 2;
	MAX_LABEL_LEN = 7;

	cppReady = true;
	startUpWhenReady();

	// startup threads need, like everything else, especially the space
	eSpaceCreatedPromise
	.then(space => {
		eThread.createThreads(space.mainEAvatar);

		if (traceStartup) console.log(`threads 🐣  created`);
		if (tracePromises) console.log(
			`🐥 startUpFromCpp:  space created and resolving eSpaceCreatedPromise`);
	})
	.catch(ex => {
		excRespond(ex, `creating threads`);
		debugger;
	});
}

window.startUpWithThreads = startUpWithThreads;


// startup: both of these: domContentLoaded and mainCppRuntimeInitialized must have
// happened (and turned true) in order for us to start threads and space and C++
// and everything.  Don't care which came first, but the second one runs
// startUpWithThreads().

let mainCppRuntimeInitialized = false, domContentLoaded = false;

// trigger when all the dom stuff is loaded.  (React not totally up yet)
document.addEventListener('DOMContentLoaded', ev => {
	console.log(`🐣 DOMContentLoaded`);
	domContentLoaded = true;
	if (mainCppRuntimeInitialized)
		window.startUpEverything();
});


// trigger when the C++ runtime is up.  (threads may or may not exist yet)
window.cppRuntimeInitialized =
ev => {
	console.log(`🐣 cppRuntimeInitialized`);
	mainCppRuntimeInitialized = true;
	if (domContentLoaded)
		startUpEverything();
};

