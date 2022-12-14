/*
** store settings -- storing control panel settings in localStorage for the next session
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

import {isPowerOf2} from './powers.js';
import qe from '../engine/qe.js';

// what a disaster.   I made this whole subsystem,
// but somehow the compiler fucks it up,
// so I fell back to some lame functions.


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
// Upon setting each var, group will be stored in localStorage.

/* ************************************************** All Settings */
//debugger;

// these'll be filled in below, dynamically created.  but none of them work.
//export const storeSettings =  {};
//
//if (typeof storeSettings == 'undefined') debugger;  // webpack fuckups

// these will work - make them classes
export let alternateStoreDefaults = {};
export let alternateStoreVerifiers = {};
export let alternateMinMaxs = {};

export let alternateStore = {};  // try this again?


// somehow webpack fumbles this if it's extern, in SquishPanel
// no doesn't seem to make a diff
//window.storeSettings = storeSettings;

// save in the localSettings
//function saveGroup(groupName) {
//	localStorage.setItem(groupName, JSON.stringify(storeSettings[groupName]));
//}

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

		// must be like {min=-100, max=100}; optional step
		case 'Object': {
			let crit = {...criterion};
			let func;
			if (criterion.step) {
				func = value => (value >= crit.min && value <= crit.max
					&& 0 === value % crit.step);
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
			throw new Error(`bad criterion class ${criterion.constructor.name}`);
		}

	default:
		debugger;
		throw new Error(`bad criterion type ${typeof criterion})`);
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
// when referring to both, I use them interchangeably

// unit tests want to recreate these from scratch
export function createStoreSettings() {

	/* ************************************ spaceParams */
	// somewhere you have to record the defaults and criterion for each setting, so here they are
	// these also define the controls mins and maxes

	// see also resolution dialog for the slider
	makeParam('spaceParams', 'N', 64,  N => isPowerOf2(N) );

	makeParam('spaceParams', 'continuum', qe.contENDLESS,
		[qe.contDISCRETE, qe.contWELL, qe.contENDLESS]);

	/* ************************************ waveParams */

	// this keeps many settings that don't immediately affect running frame.
	// So 'Set Wave' button actually sets the wave, but meanwhile the setting sliders
	// need to be remembered; this does it.  Voltage and space too; not active until user does something.
	// THis also defines slider mins and maxes!  One source of truth.

	makeParam('waveParams', 'waveBreed', 'gaussian', ['circular', 'standing', 'gaussian', 'chord']);
	makeParam('waveParams', 'waveFrequency', 16, {min: -100, max: 100, step: 0.5});
	makeParam('waveParams', 'pulseWidth', 20, {min: 1, max: 100});
	makeParam('waveParams', 'pulseOffset', 30, {min: 0, max: 100});

	/* ************************************ voltageParams */
	makeParam('voltageParams', 'potentialBreed', 'flat', ['flat', 'valley', 'double']);
	makeParam('voltageParams', 'valleyPower', 0, {min: -4, max: 4});
	makeParam('voltageParams', 'valleyScale', 0, {min: -10, max: 10});
	makeParam('voltageParams', 'valleyOffset', 50, {min: 0, max: 100});

	makeParam('voltageSettings', 'showVoltage', true, [true, false]);
	makeParam('voltageSettings', 'scrollSetting', 0, {min: -256, max: 256});
	makeParam('voltageSettings', 'heightVolts', 4, {min: 1/64, max: 256});
	makeParam('voltageSettings', 'scrollMin', -16, {min: -256, max: 256});
	makeParam('voltageSettings', 'scrollMax', 16, {min: -256, max: 256});

	/* ************************************ frameSettings */
	makeParam('frameSettings', 'isTimeAdvancing', false,  [false, true]);
	makeParam('frameSettings', 'framePeriod', 50, {min: 16, max: 60_001});
	makeParam('frameSettings', 'deltaT', 1, {min: .01, max: 100.0, });
	makeParam('frameSettings', 'stepsPerFrame', 100, {min: 10, max: 1e5});
	makeParam('frameSettings', 'lowPassFilter', 50, {min: 0, max: 75});

	/* ************************************miscSettings */
	makeParam('miscSettings', 'showingTab', 'wave', ['wave', 'voltage', 'space', 'integrate']);
	makeParam('miscSettings', 'waveViewHeight', 400, {min: 50, max: 1e4});

}

export function getAGroup(groupName) {
	let group;
	try {
		let savedGroup = localStorage.getItem(groupName);
		group = JSON.parse(savedGroup);
	} catch (ex) {
		// in hte event that some bogus value gets stored in the localStorage, revert to default.
		group = alternateStoreDefaults[groupName];
	}

	// if completely uninitialized, create each var in the group
	if (!group) {
		const asg = alternateStore[groupName];
		group = {};
		for (let varName in asg)
			group[varName] = asg[varName].default;
	}
	return group;
}

// cuz of some magical bad ju-ju, this shit just doesn't owrk and i have to do it by hand.
export function storeAGroup(groupName, newGroup) {
	localStorage.setItem(groupName,  JSON.stringify(newGroup));
}

// cuz of some magical bad ju-ju, this shit just doesn't owrk and i have to do it by hand.
export function storeASetting(groupName, varName, newValue) {
	if (!alternateStoreVerifiers
	|| !alternateStoreVerifiers[groupName]
	|| !alternateStoreVerifiers[groupName][varName]) debugger;

	// if bad value, just set to default.  ////Should clamp continuum variables to min or max!
	if (newValue === undefined || !alternateStoreVerifiers[groupName][varName](newValue))
		newValue = alternateStoreDefaults[groupName][varName];

	let savedGroup = getAGroup(groupName);
	savedGroup[varName] = newValue;
	storeAGroup(groupName, savedGroup);

	// also return the new, validated value; input could be weird!
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


// useless
//export default storeSettings;

window.dumpSettings = () => {
	// this name comes from webpack.  Probably changes from time to time.
	// eslint-disable-next-line no-undef
	const zz = _utils_storeSettings_js__WEBPACK_IMPORTED_MODULE_3__;
	console.log(`\n???? Settings: alternateStoreDefaults=`,
		alternateStoreDefaults ?? zz.alternateStoreDefaults);
	console.log(`???? Settings: alternateStoreVerifiers=`,
		alternateStoreVerifiers ?? zz.alternateStoreVerifiers);
	console.log(`???? Settings: alternateMinMaxs=`,
		alternateMinMaxs ?? zz.alternateMinMaxs);
	console.log(`\n???? Settings: alternateStore=`,
		alternateStore ?? zz.alternateStore);
}

// _utils_storeSettings_js__WEBPACK_IMPORTED_MODULE_3__
