/*
** store settings -- storing control panel settings in localStorage for the next session
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/


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
export const storeSettings =  {};

if (typeof storeSettings == 'undefined') debugger;  // webpack fuckups

// this is such a pile of shit
let alternateStoreDefaults = {};
let alternateStoreVerifiers = {};
export let alternateMinMaxs = {};

// somehow webpack fumbles this if it's extern, in SquishPanel
// no doesn't seem to make a diff
window.storeSettings = storeSettings;

// save in the localSettings
function saveGroup(groupName) {
	localStorage.setItem(groupName, JSON.stringify(storeSettings[groupName]));
}

// figure out a function that can validate this param quickly
function makeCriterionFunction(criterion) {
	switch (typeof criterion) {
	// always or never
	case 'boolean':
		return value => criterion;

	// any function that takes the value as the only param
	case 'function':
		return criterion;

	case 'object':
		switch (criterion.constructor.name) {

		// string matching
		case 'RegExp':
			return value => criterion.test(value);

		// must be one of the values in this array
		case 'Array':
			return value => criterion.includes(value);

		// must be like {min=-100, max=100}; optional step
		case 'Object':
			if (criterion.step)
				return value => (value >= criterion.min && value <= criterion.max
					&& 0 === value % criterion.step);
			else
				return value => (value >= criterion.min && value <= criterion.max);

		default:
			throw new Error(`bad criterion class ${criterion.constructor.name}`);
		}

	default:
		throw new Error(`bad criterion type ${typeof criterion})`);
	}
}

// make a parameter storeSettings.base.name, part of storeSettings[base]
// one value that knows what's valid for it, and that's stored in localStore.
// Undefined is an illegal value; also the default default value if never set.
function makeParam(groupName, varName, defaultValue, criterion) {
	const criterionFunction = makeCriterionFunction(criterion);


	// retrieve from localStorage and set this var, or set to default if not there yet.
	storeSettings[groupName] = storeSettings[groupName] || {};
	let group = storeSettings[groupName];
	let savedGroup = localStorage.getItem(groupName) || '{}';
	savedGroup = JSON.parse(savedGroup);
	let value = savedGroup[varName];
	if (value === undefined || !criterionFunction(value)) {
		savedGroup[varName] = value = defaultValue;
		localStorage.setItem(groupName,  JSON.stringify(savedGroup));
	}
	else {
		value = savedGroup[varName];
	}

	alternateStoreDefaults[groupName] = alternateStoreDefaults[groupName] || {};
	alternateStoreDefaults[groupName][varName] = defaultValue;
	alternateStoreVerifiers[groupName] = alternateStoreVerifiers[groupName] || {};
	alternateStoreVerifiers[groupName][varName] = criterionFunction;
	alternateMinMaxs[groupName] = alternateMinMaxs[groupName] || {};
	if (typeof criterion == 'object' && criterion.max !== undefined)
		alternateMinMaxs[groupName][varName] = criterion;



	// now for the shit that doesn't work
	Object.defineProperty(group, varName, {
		get: function() {
			return value
		},

		set: function(newVal) {
			if (newVal === undefined || ! criterionFunction(newVal))
				value = defaultValue;
			else
				value = newVal;

			saveGroup(group);
		},

		configurable: true,
		//configurable: false,
		enumerable: true,
	});
}

/* ************************************ spaceParams */
// somewhere you have to record the defaults and criterion for each setting, so here they are

function isPowerOf2(n) {
	//console.info(`isPowerOf2(${n}) `);
	while (n > 1 ){
		// if it's got more than 1 bit on
		if (n & 1) return false;
		n = n >> 1;
	}
	return true;
}

// these also define the controls mins and maxes

// see also resolution dialog for the slider
makeParam('spaceParams', 'N', 64,  N => isPowerOf2(N) );

// how to do this correctly with the defined constants???
makeParam('spaceParams', 'continuum', 2, [0, 1, 2]);
// makeParam('spaceParams', 'continuum', qe.contENDLESS,
// 	[qe.contDISCRETE, qe.contWELL, qe.contENDLESS]);

/* ************************************ waveParams */

// this keeps many settings that don't immediately affect running iteration.
// So 'Set Wave' button actually sets the wave, but meanwhile the setting sliders
// need to be remembered; this does it.  Potential and space too; not active until user does something.
// THis also defines slider mins and maxes!  One source of truth.

makeParam('waveParams', 'waveBreed', 'chord', ['circular', 'standing', 'gaussian', 'chord']);
makeParam('waveParams', 'waveFrequency', 16, {min: -50, max: 50, step: 0.5});
makeParam('waveParams', 'pulseWidth', 20, {min: 1, max: 100});
makeParam('waveParams', 'pulseOffset', 30, {min: 0, max: 100});

/* ************************************ potentialParams */
//makeParam('potentialParams', 'potentialBreed', 'flat', ['flat', 'valley']);
makeParam('potentialParams', 'valleyPower', 0, {min: -4, max: 4});
makeParam('potentialParams', 'valleyScale', 0, {min: -10, max: 10});
makeParam('potentialParams', 'valleyOffset', 50, {min: 0, max: 100});

/* ************************************ iterationParams */
makeParam('iterationParams', 'isTimeAdvancing', false,  [false, true]);
makeParam('iterationParams', 'iteratePeriod', 50, {min: 16, max: 60_001});
makeParam('iterationParams', 'dt', 0.002, {min: 1e-6, max: 1.0, });
makeParam('iterationParams', 'stepsPerIteration', 100, {min: 10, max: 1e5});
makeParam('iterationParams', 'lowPassFilter', 50, {min: 0, max: 75});

/* ************************************miscParams */
makeParam('miscParams', 'showingTab', 'wave', ['wave', 'potential', 'space', 'iteration']);
makeParam('miscParams', 'viewHeight', 400, {min: 50, max: 1e4});

// they should ALL be there
// function checkAllSettingData() {
// 	console.log(`stored group spaceParams: ${localStorage.spaceParams}`);
// 	console.log(`stored group waveParams: ${localStorage.waveParams}`);
// 	console.log(`stored group potentialParams: ${localStorage.potentialParams}`);
// 	console.log(`stored group iterationParams: ${localStorage.iterationParams}`);
// 	console.log(`stored group miscParams: ${localStorage.miscParams}`);
//
// 	console.log(`alternateStoreDefaults`, alternateStoreDefaults);
// 	console.log(`alternateStoreVerifiers`, alternateStoreVerifiers);
// 	console.log(`alternateMinMaxs`, alternateMinMaxs);
// }
//
//checkAllSettingData();

export function getAGroup(groupName) {
	if (!alternateStoreVerifiers
	|| !alternateStoreVerifiers[groupName]) debugger;

	let savedGroup = localStorage.getItem(groupName) || '{}';
	return JSON.parse(savedGroup);
}

// cuz of some magical bad ju-ju, this shit just doesn't owrk and i have to do it by hand.
export function storeASetting(groupName, varName, newValue) {
	if (!alternateStoreVerifiers
	|| !alternateStoreVerifiers[groupName]
	|| !alternateStoreVerifiers[groupName][varName]) debugger;

	// if bad value, just set to default
	if (newValue === undefined || !alternateStoreVerifiers[groupName][varName](newValue))
		newValue = alternateStoreDefaults[groupName][varName];

	let savedGroup = getAGroup(groupName);

	savedGroup[varName] = newValue;
	localStorage.setItem(groupName,  JSON.stringify(savedGroup));

	// also return the new, validated value; input could be weird!
	return newValue;
}

// might as well do this by hand, too

export function getASetting(groupName, varName) {
	let setting = getAGroup(groupName)[varName];
// 	console.info(`get some stuff please `, groupName, varName, alternateStoreVerifiers, setting);
// 	console.info(alternateStoreVerifiers[groupName]);////
// 	console.info(alternateStoreVerifiers[groupName][varName]);
	if (!alternateStoreVerifiers
	|| !alternateStoreVerifiers[groupName]
	|| !alternateStoreVerifiers[groupName][varName]) debugger;

	if (setting === undefined
	|| !alternateStoreVerifiers[groupName][varName](setting)) {
		return alternateStoreDefaults[groupName][varName];
	}
	return setting;
}


// useless
export default storeSettings;


