/*
** store settings -- storing control panel settings in localStorage for the next session
** Copyright (C) 2022-2026 Tactile Interactive, all rights reserved
*/

import {isPowerOf2} from './powers.js';
import qeConsts from '../engine/qeConsts.js';
import {EFFECTIVE_VOLTS, AMPLE_VOLTS, LOW_VOLTS}
	from '../volts/voltConstants.js';
import sSettings from './sSettings.js';

// TODO: I made this whole subsystem, sSettings (aka New)
// but somehow the compiler fucks it up,
// so I fell back to some lame functions.
// TURNS OUT, all those fuckups were because there were circular import dependencies.
// So, something gets loaded before something else, which ends up undefined!
// Move functions into different files, or rearrange them, to fix.  Should work then.
// Actually, make all the data structures into its own file that doesn't import anything.

// Reconstruction: to support both methods, must have code for both.
// setting: must set both, using either method
// getting: get either; calling code decides


// group, groupName = which component of sSettings this is
// criterion: validator, see constructor
//     The criterion are fixed and more broad than some other parts of the code,
//     eg if 1/N is one of the limits, some other part of the code will enforce that, not here.
//		um... except for lowPassFilter
// The general interaction between component states and sSettings is this:
// component states are initially set from sSettings.
// When changed, both the state and sSettings, and sending
// to C++ if applicable, are changed in parallel in same code.
// With a function that's general over the particular params group,
// in the component that holds the state.
// (maybe I should integrate these better...)
// upon load of this file, it'll retrieve all this stuff from localStore.
// Upon setting each var, group will be stored back in localStorage.

/* ************************************************** creation of groups & params */

// alternate system: these will work
// export let sSettings.defaults = {};
// export let sSettings.verifiers = {};
// export let sSettings.minMaxes = {};
//
// export let sSettings = {};  // try this again?
//
// // New System: The Root.  All groups are properties of this.
// export const sSettings = {};
//
// window.sSettings = sSettings;

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
			throw new Error(`bad sSettings criterion class ${criterion.constructor.name}`);
		}

	default:
		debugger;
		throw new Error(`bad sSettings criterion type ${typeof criterion})`);
	}
}

// make a parameter sSettings.groupName.name, part of sSettings[groupName]
// one value that knows what's valid for it, and that's stored in localStore.
// Undefined is an illegal value; also the default default value if never set.
function makeParam(groupName, varName, defaultValue, criterion) {
	const criterionFunction = makeCriterionFunction(criterion);

	// retrieve from localStorage and set this var, or set to default if not there yet.
//sSettings[groupName] = sSettings[groupName] || {};
//let group = sSettings[groupName];
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

	sSettings.defaults[groupName] ??= {};
	sSettings.defaults[groupName][varName] = defaultValue;
	sSettings.verifiers[groupName] ??= {};
	sSettings.verifiers[groupName][varName] = criterionFunction;
	sSettings.minMaxes[groupName] ??= {};
	if (typeof criterion == 'object' && criterion.max !== undefined)
		sSettings.minMaxes[groupName][varName] = criterion;


	// try again, meekly
	sSettings[groupName] ??= {};
	sSettings[groupName][varName] ??= {};
	let vari = sSettings[groupName][varName];
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

/* **************************************************** Params & Settings */
// settings are immediately effective
// params are effective after user clicks some button to effect or commit changes
// when referring to both, I use them interchangeably.
// To reset them all, just delete all the local storage for this app.  I should make a button...

// somewhere you have to record the defaults and criterion for each
// setting, so here they are these also define the controls mins and
// maxes unit tests want to recreate these from scratch
export function createStoreSettings() {

	/* ************************************ spaceParams */

	// see also resolution dialog to change these.  Never changes after page loaded.
	makeParam('spaceParams', 'N', 64,  N => isPowerOf2(N) );
	makeParam('spaceParams', 'continuum', qeConsts.contENDLESS,
		[qeConsts.contDISCRETE, qeConsts.contWELL, qeConsts.contENDLESS]);
	makeParam('spaceParams', 'dimLength', 16, {min: 1e-3, max: 1e7});

	/* ************************************ waveParams */

	// These keep many settings that don't immediately affect running frame -
	// the immediate values of the sliders and controls. So 'Set Wave' button
	// actually sets the wave, but meanwhile the setting sliders need to be
	// remembered; this does it.  Voltage and space too; not active until user
	// does something. This also defines slider mins and maxes!  One source of
	// truth.

	makeParam('waveParams', 'waveBreed', 'gaussian', ['circular', 'standing', 'gaussian', 'chord']);
	makeParam('waveParams', 'waveFrequency', 6, {min: -5, max: 5, step: 0.5});
	makeParam('waveParams', 'pulseWidth', 10, {min: 1, max: 20});
	makeParam('waveParams', 'pulseCenter', 20, {min: 0, max: 100});

	/* ************************************ voltage */
	// the voltage controls   volts ≈ canyonScale * x ** canyonPower sortof
	// where x is centered at voltageCenter% across
	// again, params are stored until the user does something to fulfill it like clicking on Set Wave
	makeParam('voltageParams', 'voltageBreed', 'flat', ['flat', 'slot', 'block', 'canyon']);
	makeParam('voltageParams', 'voltageCenter', 50, {min: 0, max: 100});

	makeParam('voltageParams', 'blockWidth', 10, {min: 0, max: 100});  // 0 to 100 despite appearance
	makeParam('voltageParams', 'flatScale', 0, {min: -AMPLE_VOLTS, max: AMPLE_VOLTS});
	//makeParam('voltageParams', 'slotScale', -EFFECTIVE_VOLTS, {min: 0, max: AMPLE_VOLTS});
	makeParam('voltageParams', 'blockScale', EFFECTIVE_VOLTS, {min: 0, max: AMPLE_VOLTS});

	makeParam('voltageParams', 'canyonPower', 2, {min: 0.1, max: 20});
	makeParam('voltageParams', 'canyonScale', 0, {min: 0, max: AMPLE_VOLTS});

	// sets whether the voltage line shows or not
	makeParam('voltageSettings', 'showVoltage', 'hover', ['always', 'hover', 'never']);

	// voltage at bottom of wave view, 𝚫voltage of wave view height
	const extremes = {min: -1000 * EFFECTIVE_VOLTS, max: 1000 * EFFECTIVE_VOLTS}
	makeParam('voltageSettings', 'bottomVolts', -EFFECTIVE_VOLTS, extremes);
	makeParam('voltageSettings', 'heightVolts', 2 * EFFECTIVE_VOLTS,
		{min: EFFECTIVE_VOLTS * .001, max: EFFECTIVE_VOLTS * 1000});
	//makeParam('voltageSettings', 'minBottom', -.5, extremes);  // soon to be deprecated
	// always = min + 2 * heightVolts makeParam('voltageSettings', 'maxBottom', 16, {min: -256, max: 256});

	/* ************************************ lapSettings */

	// set in integration tab
	makeParam('lapSettings', 'shouldBeIntegrating', false,  [false, true]);
	//makeParam('lapSettings', 'chosenFP', 50, {min: 16, max: 60_001});
	makeParam('lapSettings', 'dtFactor', 1, {min: 1e-6, max: 100, });
	//makeParam('lapSettings', 'stepsPerLap', 10, {min: 2, max: 50});
	//makeParam('lapSettings', 'lowPassFilter', 50, {min: 0, max: 75});

	localStorage.removeItem("frameSettings");  // old name for lapSettings

	/* ************************************ orient for 3D */

	// set in Orient3D or PivotOverlay
	makeParam('orientSettings', 'x', 0,  {min: -360, max: +360});
	makeParam('orientSettings', 'y', 0,  {min: -360, max: +360});
	makeParam('orientSettings', 'z', 0,  {min: -360, max: +360});

	makeParam('orientSettings', 'xPos', 0,  {min: -100, max: +100});
	makeParam('orientSettings', 'yPos', 0,  {min: -100, max: +100});
	makeParam('orientSettings', 'zPos', -100,  {min: -200, max: +100});

	makeParam('orientSettings', 'foView', 45,  {min: 1, max: +179});


	/* ************************************miscSettings */
	// set by clicking on tab
	makeParam('miscSettings', 'showingTab', 'wave',
		['wave', 'voltage', 'space', 'integration', 'rainbow']);

	// set by size box on main view
	makeParam('miscSettings', 'viewHeight', 402, {min: 50, max: 1e4});
	makeParam('miscSettings', 'vistaHeight', 402, {min: 50, max: 1e4});

	makeParam('miscSettings', 'show2D', true,  [false, true]);
	makeParam('miscSettings', 'show3D', false,  [false, true]);
}

window.dumpSettings = () => {
	// this name comes from webpack.  Probably changes from time to time.
	// should not be needed if I watch out for circular dependencies
	// eslint-disable-next-line no-undef
	console.log(`\n🎛 Settings: sSettings.defaults=`, sSettings.defaults);
	console.log(`🎛 Settings: sSettings.verifiers=`, sSettings.verifiers);
	console.log(`🎛 Settings: sSettings.minMaxes=`, sSettings.minMaxes);
	console.log(`\n🎛 Settings: sSettings=`, sSettings);
}

/* ************************************************ setters/getters */

// retrieve a whole group, with defaults filled in as needed
export function getAGroup(groupName) {
	let gr;
	if (!sSettings.verifiers[groupName])
		throw Error(`No such group ${groupName}`);

	try {
		let savedGroup = localStorage.getItem(groupName);
		gr = JSON.parse(savedGroup);
	} catch (ex) {
		// in the event that some bogus value gets stored in the localStorage, revert to default.
		gr = {};
	}

	// If some are missing in the localStorage, from an old version, fill those in.
	let group = {...sSettings.defaults[groupName], ...gr};

	// if some old vars are left over from a previous version, remove them
	const asg = sSettings.verifiers[groupName];  // true only for vars that are supported
	let varName;
	for (varName in group) {
		if (!asg[varName])
		  delete group[varName];
	}

	//console.log(`😎  group: `, group);
	return group;
}

// store a whole group.  Eliminates values that aren't official, or undefined
// but official.  defaults missing ones. Returns clone of newGroup with defaults
// filled in, if any.
export function storeAGroup(groupName, newGroup) {
	// only set those that are official!  don't overwrite zeroes or empty strings.
	let toSet = {};
	const asg = sSettings[groupName];
	let varName;
	for (varName in asg) {
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
	if (!sSettings.verifiers
	|| !sSettings.verifiers[groupName]
	|| !sSettings.verifiers[groupName][varName]) debugger;

	let savedGroup = getAGroup(groupName);
	savedGroup[varName] = newValue;
	storeAGroup(groupName, savedGroup);

	return newValue;
}


export function getASetting(groupName, varName) {
	let setting = getAGroup(groupName)[varName];
	if (!sSettings.verifiers?.[groupName]?.[varName]) {
		console.error(`setting not found: ${groupName} , ${varName} = `)
		debugger;
	}

	// this can still return undefined if the groupName or varName isn't there
	if (setting === undefined
			|| !sSettings.verifiers?.[groupName]?.[varName]?.(setting)) {
		return sSettings.defaults?.[groupName]?.[varName];
	}
	return setting;
}

// in case you want only one exported name.  Kindof defeats the purpose huh?
export const storeSettings = {createStoreSettings, getAGroup, storeAGroup, storeASetting, getASetting, };
export default storeSettings;

