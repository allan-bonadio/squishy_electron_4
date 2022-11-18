/*
** e Engine - main interface in JS to the quantumEngine in C++ and Emscripten
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import {qe, defineQEngineFuncs} from './qe';
import eSpace from './eSpace';
import App from '../App';
import {getASetting} from '../utils/storeSettings';
import {interpretCppException} from '../utils/errors';
import {resetObjectRegistry} from '../utils/directAccessors';
import {storeASetting} from '../utils/storeSettings';

// all of these must be attached to window to  get called by c++

let tracePromises = false;

/* ****************************************************** app startup */

// c++ main() calls us to tell us that it's up, and to pass the sizes of different data structures.
// (qspace can change; double and therefore eCx can change length)
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
		if (tracePromises) console.info(`eSpaceCreatedPromise (re)created:`, succeed, fail);
	});
}
resetSpaceCreatedPromise();  // for the first time when app starts up

// export this?  shouldn't have to.
let theSpace;

// params is {N, continuum, label: 'x'}  label=label for this dimension, not the whole space
export function create1DMainSpace(params) {
	try {
		// eSpace expects an array of param sets, one for each dimension
		let space = theSpace = new eSpace([params], 'main');

		storeASetting('spaceParams', 'N', params.N);
		storeASetting('spaceParams', 'continuum', params.continuum);

		// wakes up stuff all over the JS, and gives them the space,
		// that they've been waiting for
		eSpaceCreatedSucceed(space);
	} catch (ex) {
		// this is called from eSpaceCreatedPromise so trigger its fail
		// eslint-disable-next-line no-ex-assign
		ex = interpretCppException(ex);
		debugger;
		eSpaceCreatedFail(ex);
	}
}

// params is as above.  Liquidate/Delete the existing space, blink the SquishPanel,
// and start again just like the app starts over.
export function recreateMainSpace(params) {
	resetSpaceCreatedPromise();

	App.blinkSquishPanel(() => {
		create1DMainSpace(params);
	});

	theSpace.liquidate();

	resetObjectRegistry();  // this will hang on to them otherwise!!
}

// Called by C++ when C++ has finally started up.
// do NOT export this; it's global cuz quantumEngine.js, the compiled C++ proxy,
// has to have access to it early on, and it doesn't understand JS exports.
// these arguments are only passed once, at app startup
function quantumEngineHasStarted(maxDims, maxLab) {
	MAX_DIMENSIONS = maxDims;
	MAX_LABEL_LEN = maxLab;

	//console.log(`quantumEngineHas...Started`, mDimensions, mLabel);
	defineQEngineFuncs();
	//qeDefineAccess();

	qe.cppLoaded = true;

	create1DMainSpace({
		N: getASetting('spaceParams', 'N'),
		continuum: getASetting('spaceParams', 'continuum'),
		label: 'main'});

	if (tracePromises) console.log(
		`quantumEngineHasStarted:  space created and resolving eSpaceCreatedPromise`);
};

window.recreateMainSpace = recreateMainSpace;  // for debugging
window.quantumEngineHasStarted = quantumEngineHasStarted;  // for emscripten

