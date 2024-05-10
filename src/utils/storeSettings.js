/*
** store settings -- storing control panel settings in localStorage for the next session
** Copyright (C) 2022-2024 Tactile Interactive, all rights reserved
*/

import {isPowerOf2} from './powers.js';
import qe from '../engine/qe.js';

// what a disaster.   I made this whole subsystem, storeSettings (aka New)
// but somehow the compiler fucks it up,
// so I fell back to some lame functions.
// TURNS OUT, all those fuckups were because there were circular import dependencies.
// So, something gets loaded before something else, which ends up undefined!
// Move functions into different files, or rearrange them, to fix.  Should work then.
// should work now, if I reconstruct it.
// Reconstruction: to support both methods, must have code for both.
// setting: must set both, using either method
// getting: get either; calling code decides


// group, groupName = which component of storeSettings this is
// criterion: validator, see constructor
//     The criterion are fixed and more broad than some other parts of the code,
//     eg if 1/N is one of the limits, some other part of the code will enforce that, not here.
//		um... except for lowPassFilter
// The general interaction between component states and storeSettings is this:
// component states are initially set from storeSettings.
// When changed, both the state and storeSettings, and sending
// to C++ if applicable, are changed in parallel in same code.
// With a function that's general over the particular params group,
// in the component that holds the state.
// (maybe I should integrate these better...)
// upon load of this file, it'll retrieve all this stuff from localStore.
// Upon setting each var, group will be stored back in localStorage.

/* ************************************************** creation of groups & params */

// alternate system: these will work
export let alternateStoreDefaults = {};
export let alternateStoreVerifiers = {};
export let alternateMinMaxs = {};

export let alternateStore = {};  // try this again?

// New System: The Root.  All groups are properties of this.
export const storeSettings = {};

window.storeSettings = storeSettings;

// figure out a function that can validate this param quickly
function makeCriterionFunction(criterion) {
	// because the criterion can change value after this func returns, make
	// small closures to nail it down.
	switch (typeof criterion) {
	// always or never
	case 'boolean': {
		const crit = criterion;
		return value => crit;
	}

	// any function that takes the value as the only param
	case 'function':
		return criterion;

	case 'object':
		switch (criterion.constructor.name) {

		// string matching
		case 'RegExp': {
			const crit = new RegExp(criterion);
			return value => crit.test(value);
		}

		// must be one of the values in this array
		case 'Array': {
			let crit = [...criterion];
			return value => crit.includes(value);
		}

		// must be like {min=-100, max=100}; optional step = 20
		case 'Object': {
			let crit = {...criterion};
			let func;
			if (criterion.step) {
				func = value => (value >= crit.min && value <= crit.max
					&& 0 === (value - crit.min) % crit.step);
				func.step = crit.step;
			}
			else {
				func = value => (value >= crit.min && value <= crit.max);
			}
			func.min = crit.min;
			func.max = crit.max;
			return func;
		}

		default:
			debugger;
			throw new Error(`bad storeSettings criterion class ${criterion.constructor.name}`);
		}

	default:
		debugger;
		throw new Error(`bad storeSettings criterion type ${typeof criterion})`);
	}
}

// make a parameter storeSettings.base.name, part of storeSettings[base]
// one value that knows what's valid for it, and that's stored in localStore.
// Undefined is an illegal value; also the default default value if never set.
function makeParam(groupName, varName, defaultValue, criterion) {
	const criterionFunction = makeCriterionFunction(criterion);

	// retrieve from localStorage and set this var, or set to default if not there yet.
//storeSettings[groupName] = storeSettings[groupName] || {};
//let group = storeSettings[groupName];
//let savedGroup = localStorage.getItem(groupName) || '{}';
//savedGroup = JSON.parse(savedGroup);
//let value = savedGroup[varName];
//if (value === undefined || !criterionFunction(value)) {
//	savedGroup[varName] = value = defaultValue;
//	localStorage.setItem(groupName,  JSON.stringify(savedGroup));
//}
//else {
//	value = savedGroup[varName];
//}

	alternateStoreDefaults[groupName] ??= {};
	alternateStoreDefaults[groupName][varName] = defaultValue;
	alternateStoreVerifiers[groupName] ??= {};
	alternateStoreVerifiers[groupName][varName] = criterionFunction;
	alternateMinMaxs[groupName] ??= {};
	if (typeof criterion == 'object' && criterion.max !== undefined)
		alternateMinMaxs[groupName][varName] = criterion;


	// try again, meekly
	alternateStore[groupName] ??= {};
	alternateStore[groupName][varName] ??= {};
	let vari = alternateStore[groupName][varName];
	vari.default = defaultValue;
	vari.criterion = criterionFunction;
	if (criterionFunction.max != undefined) {
		Object.assign(vari, {...criterionFunction})
	}



	// now for the shit that doesn't work
//	Object.defineProperty(group, varName, {
//		get: function() {
//			return value
//		},
//
//		set: function(newVal) {
//			if (newVal === undefined || ! criterionFunction(newVal))
//				value = defaultValue;
//			else
//				value = newVal;
//
//			saveGroup(group);
//		},
//
//		configurable: true,
//		//configurable: false,
//		enumerable: true,
//	});
}

/* ********************************************************************** Params & Settings */
// settings are immediately effective
// params are effective after user clicks some button to effect or commit changes
// when referring to both, I use them interchangeably.
// To reset them all, just delete all the local storage for this app.  I should make a button...

// somewhere you have to record the defaults and criterion for each setting, so here they are
// these also define the controls mins and maxes
// unit tests want to recreate these from scratch
export function createStoreSettings() {

	/* ************************************ spaceParams */

	// see also resolution dialog to change these
	makeParam('spaceParams', 'N', 64,  N => isPowerOf2(N) );
	makeParam('spaceParams', 'continuum', qe.contENDLESS,
		[qe.contDISCRETE, qe.contWELL, qe.contENDLESS]);
	makeParam('spaceParams', 'spaceLength', 16, {min: 1e-3, max: 1e7});

	/* ************************************ waveParams */

	// These keep many settings that don't immediately affect running frame -
	// the immediate values of the sliders and controls. So 'Set Wave' button
	// actually sets the wave, but meanwhile the setting sliders need to be
	// remembered; this does it.  Voltage and space too; not active until user
	// does something. This also defines slider mins and maxes!  One source of
	// truth.

	makeParam('waveParams', 'waveBreed', 'gaussian', ['circular', 'standing', 'gaussian', 'chord']);
	makeParam('waveParams', 'waveFrequency', 6, {min: -100, max: 100, step: 0.5});
	makeParam('waveParams', 'pulseWidth', 10, {min: 1, max: 100});
	makeParam('waveParams', 'pulseOffset', 20, {min: 0, max: 100});

	/* ************************************ voltage */
	// the voltage controls
	makeParam('voltageParams', 'voltageBreed', 'flat', ['flat', 'canyon', 'double']);
	makeParam('voltageParams', 'canyonPower', 2, {min: -4, max: 6});
	makeParam('voltageParams', 'canyonScale', 1, {min: -10, max: 10});
	makeParam('voltageParams', 'canyonOffset', 50, {min: 0, max: 100});

	// where voltage line shows
	makeParam('voltageSettings', 'showVoltage', true, [true, false]);
	makeParam('voltageSettings', 'bottomVolts', -.25, {min: -256, max: 256});
	makeParam('voltageSettings', 'heightVolts', 1, {min: 1/64, max: 256});
	makeParam('voltageSettings', 'minBottom', -.5, {min: -256, max: 256});
	// always = min + 2 * heightVolts makeParam('voltageSettings', 'maxBottom', 16, {min: -256, max: 256});

	/* ************************************ frameSettings */

	// set in integration tab
	makeParam('frameSettings', 'shouldBeIntegrating', true,  [false, true]);
	makeParam('frameSettings', 'framePeriod', 50, {min: 16, max: 60_001});
	makeParam('frameSettings', 'dtStretch', 1, {min: .001, max: 1, });
	//makeParam('frameSettings', 'stepsPerFrame', 10, {min: 2, max: 50});
	//makeParam('frameSettings', 'lowPassFilter', 50, {min: 0, max: 75});

	/* ************************************miscSettings */
	// set by clicking on tab
	makeParam('miscSettings', 'showingTab', 'wave', ['wave', 'voltage', 'space', 'integration']);

	// set by size box on main view
	makeParam('miscSettings', 'waveViewHeight', 400, {min: 50, max: 1e4});

}

window.dumpSettings = () => {
	// this name comes from webpack.  Probably changes from time to time.
	// should not be needed if I watch out for circular dependencies
	// eslint-disable-next-line no-undef
	const zz = _utils_storeSettings_js__WEBPACK_IMPORTED_MODULE_3__;
	console.log(`\n🎛 Settings: alternateStoreDefaults=`,
		alternateStoreDefaults ?? zz.alternateStoreDefaults);
	console.log(`🎛 Settings: alternateStoreVerifiers=`,
		alternateStoreVerifiers ?? zz.alternateStoreVerifiers);
	console.log(`🎛 Settings: alternateMinMaxs=`,
		alternateMinMaxs ?? zz.alternateMinMaxs);
	console.log(`\n🎛 Settings: alternateStore=`,
		alternateStore ?? zz.alternateStore);
}

/* ********************************************************* Alternate setters/getters */

// retrieve a whole group, with defaults filled in as needed
export function getAGroup(groupName) {
	let group;
	try {
		let savedGroup = localStorage.getItem(groupName);
		group = JSON.parse(savedGroup);
	} catch (ex) {
		// in the event that some bogus value gets stored in the localStorage, revert to default.
		group = alternateStoreDefaults[groupName];
	}

	// if completely uninitialized, create.  (if user hacked on localStore)
	if (!group)
		group = {};

	// If some are missing, fill those in.
	const asg = alternateStore[groupName];
	for (let varName in asg)
		group[varName] ??= asg[varName].default;

	return group;
}

// store a whole group.  Eliminates values that aren't official, defaults missing ones.
// Returns clone of newGroup with defaults filled in, if any.
export function storeAGroup(groupName, newGroup) {
	// only set those that are official
	let toSet = {};
	const asg = alternateStore[groupName];
	for (let varName in asg) {
		if (newGroup[varName] == undefined)
			toSet[varName] = asg[varName].default;
		else
			toSet[varName] = newGroup[varName];
	}
	localStorage.setItem(groupName,  JSON.stringify(toSet));
	return toSet;
}

// store an individual value
export function storeASetting(groupName, varName, newValue) {
	if (!alternateStoreVerifiers
	|| !alternateStoreVerifiers[groupName]
	|| !alternateStoreVerifiers[groupName][varName]) debugger;

	// if bad value, just set to default.
	// Should clamp continuum variables to min or max!  should eliminate variables no longer part of the group!
// not sure what went wrong here but i fixed it...
//console.info(`groupName=${groupName}   varName=${varName}`);
//console.info(`alternateStoreVerifiers=`, alternateStoreVerifiers);
//console.info(`alternateStoreVerifiers[${groupName}]=`, alternateStoreVerifiers?.[groupName]);
//console.info(`alternateStoreVerifi...[${varName}]=`, alternateStoreVerifiers?.[groupName]?.[varName]);
//console.info(`alternateStoreVerif[...](newValue)=`, alternateStoreVerifiers?.[groupName]?.[varName]?.(newValue));

	let savedGroup = getAGroup(groupName);
	savedGroup[varName] = newValue;
	storeAGroup(groupName, savedGroup);

	return newValue;
}


export function getASetting(groupName, varName) {
	let setting = getAGroup(groupName)[varName];
	if (!alternateStoreVerifiers?.[groupName]?.[varName]) debugger;

	// this can still return undefined if the groupName or varName isn't there
	if (setting === undefined
			|| !alternateStoreVerifiers?.[groupName]?.[varName]?.(setting)) {
		return alternateStoreDefaults?.[groupName]?.[varName];
	}
	return setting;
}

export default storeSettings;

