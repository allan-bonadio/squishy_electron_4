/*
** e Engine - main interface in JS to the quantumEngine in C++ and Emscripten
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import {qe, defineQEngineFuncs} from './qe.js';
import App from '../App.js';
import {interpretCppException} from '../utils/errors.js';
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
export let eSpaceCreatedPromise;

let eSpaceCreatedSucceed, eSpaceCreatedFail;
function resetSpaceCreatedPromise() {
	eSpaceCreatedPromise = new Promise((succeed, fail) => {
		eSpaceCreatedSucceed = succeed;
		eSpaceCreatedFail = fail;
		if (tracePromises) console.info(`🐥 eSpaceCreatedPromise (re)created:`, succeed, fail);
	});
	if (traceStartup) console.log(`spaceCreatedPromise 🐣 ... created`);
}
resetSpaceCreatedPromise();  // for the first time when app starts up

// export this?  shouldn't have to.
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
export function recreateMainSpace(spaceParams) {
	if (traceStartup) console.log(`recreateMainSpace 🐣  started`);
	resetSpaceCreatedPromise();

	App.blinkSquishPanel(() => {
		if (traceStartup) console.log(`new space 🐣  triggered`);
		create1DMainSpace(spaceParams);
	});

	theSpace.liquidate();

	resetObjectRegistry();  // this will hang on to them otherwise!!
	if (traceStartup) console.log(`space 🐣  liquidated, obj registry reset`);
}

// Called by C++ when C++ has finally started up.  Once only, at page load.
// do NOT export this; it's global cuz quantumEngine.js, the compiled C++ proxy,
// has to have access to it early on, and it doesn't understand JS exports.
function quantumEngineHasStarted(maxDims, maxLab) {
	MAX_DIMENSIONS = maxDims;
	MAX_LABEL_LEN = maxLab;

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
		console.error(`eSpaceCreatedPromise failed`, ex);
		debugger;
	});

};

window.recreateMainSpace = recreateMainSpace;  // for debugging
window.quantumEngineHasStarted = quantumEngineHasStarted;  // for emscripten

//let noWebAssy = () => {
//	let webAssyThere = setTimeout(() => {
//		// too many test situations & breakpoints can falsely trigger this
//		if (!window.isDevel)
//			tooOldTerminate('WebAssembly');
//	}, 20_000);
//
//	eSpaceCreatedPromise.then(space => {
//		clearTimeout(this.webAssyThere);
//		noWebAssy = null;
//	});
//};
//noWebAssy();

