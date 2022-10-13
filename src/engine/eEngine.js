/*
** e Engine - main interface in JS to the quantumEngine in C++ and Emscripten
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import {qe, defineQEngineFuncs} from './qe';
import eSpace from './eSpace';
import {getASetting} from '../utils/storeSettings';

// all of these must be attached to window to  get called by c++

let tracePromises = false;

/* ****************************************************** app startup */

// c++ main() calls us to tell us that it's up, and to pass the sizes of different data structures.
// (qspace can change; double and therefore eCx can change length)
export let maxDimensions, maxLabel;

// this resolves when emscripten starts up.  Create it tout suit when app starts.
// Also, importing this guarantees this file is included in the build!
// it's exported so everybody can get to it.
// set again if space recreated, then resolved again.  Therefore, don't pass this
// around; don't keep iit on this, always get it from import!
// Initially set to a promise that'll never get resolved until crate1DMainSpace() called.
let eSpaceCreatedSucceed;
let eSpaceCreatedFail;
export let eSpaceCreatedPromise = new Promise((succeed, fail) => {
	eSpaceCreatedSucceed = succeed;
	eSpaceCreatedFail = fail;
	if (tracePromises) console.info(`eSpaceCreatedPromise (re)created:`, succeed, fail);
});

// params is {N, continuum, label: 'x'}  label=label for this dimension, not the whole thing
export function create1DMainSpace(params) {
	try {
		// eSpace expects an array of param sets, one for each dimension
		let space = new eSpace([params], 'main');

		// wakes up stuff all over the JS, and gives them the space,
		// that they've been waiting for
		eSpaceCreatedSucceed(space);
	} catch (ex) {
		// this is called from eSpaceCreatedPromise so trigger its fail
		eSpaceCreatedFail(ex);
	}
}

// do NOT export this; it's global cuz quantumEngine.js, the compiled C++ proxy,
// has to have access to it early on
function quantumEngineHasStarted() {
	//console.log(`quantumEngineHas...Started`, mDimensions, mLabel);
	defineQEngineFuncs();
	//qeDefineAccess();

	qe.cppLoaded = true;

	create1DMainSpace({N: getASetting('spaceParams', 'N'), continuum: getASetting('spaceParams', 'continuum'), label: 'main'});

	if (tracePromises) console.log(
		`quantumEngineHasStarted:  space created and resolving eSpaceCreatedPromise`);
};
window.quantumEngineHasStarted = quantumEngineHasStarted;


