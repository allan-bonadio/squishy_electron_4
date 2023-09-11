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

let traceStartup = false;
let tracePromises = false;

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


/* ************************************************************************ what's really going on */

// this starts the major pieces of squish  in the right order.  But it can't
// happen immediately.  The content has to be loaded, and the C++ runtime has to
// be ready to go.  (see below)
function startUpEverything() {
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
	if (traceStartup) console.log(`main space 🐣  created`);

	// startup threads need, like everything else, especially the space
	eSpaceCreatedPromise
	.then(space => {
		eThread.createThreads(space.mainEAvatar);

		if (traceStartup) console.log(`threads 🐣  created`);
		if (tracePromises) console.log(
			`🐥 C++ initialized, DOM loaded, space created, and eSpaceCreatedPromise resolved`);
	})
	.catch(ex => {
		excRespond(ex, `creating threads`);
		debugger;
	});
}
//window.startUpEverything = startUpEverything;

// startup: both of these: domContentLoaded and mainCppRuntimeInitialized must
// have happened (and turned true) in order for us to start threads and space
// and C++ and everything.  Don't care which came first, but the second one runs
// startUpEverything().

let mainCppRuntimeInitialized = false, domContentLoaded = false;

// trigger when all the dom stuff is loaded.  (React not totally up yet)
document.addEventListener('DOMContentLoaded', ev => {
	if (traceStartup) console.log(`🐣 DOMContentLoaded`);
	domContentLoaded = true;
	if (mainCppRuntimeInitialized)
		window.startUpEverything();
});


// trigger when the C++ runtime is up.  (threads may or may not exist yet)
window.cppRuntimeInitialized =
ev => {
	if (traceStartup) console.log(`🐣 cppRuntimeInitialized`);
	mainCppRuntimeInitialized = true;
	if (domContentLoaded)
		startUpEverything();
};

