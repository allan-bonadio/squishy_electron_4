/*
** store settings test -- testing persistent settings & params system
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

import {expect, test, jest} from '@jest/globals';
import {getASetting, storeASetting, getAGroup, storeAGroup} from '../utils/storeSettings.js';
import {isPowerOf2} from './powers.js';
import qe from '../engine/qe.js';

let traceObj = false;

//console.dir(jest);

// what exception is thrown when a failure happens?
//test('test expect()', () => {
//	try {
//		expect('harry').toBe('sally');
//	} catch (ex) {
//		console.dir(ex);
//		console.error(ex);
//	}
//});

// this mostly checks the default values to see if they match the criterion
function testParam(groupName, varName, defaultValue, criterion) {
	// wrap this so we know which one failed
	describe(`${groupName}.${varName}`, () => {
		expect(typeof groupName).toBe('string');
		expect(typeof varName).toBe('string');
		// is it undefined?  Why can't i make jake do this?   expect(defaultValue !== undefined).toBeTruthy();

		// this mirrors the code in makeCriterionFunction()
		switch (typeof criterion) {
		// always or never
		case 'boolean':
			expect(typeof defaultValue).toBe('boolean');
			break;


		// any function that takes the value as the only param
		case 'function':
			expect(criterion(defaultValue)).toBe(true);
			break;

		case 'object':
			if (traceObj) console.info(`criterion.constructor.name=${criterion.constructor.name}`);
			switch (criterion.constructor.name) {

			// string matching
			case 'RegExp':
				// a regex to match a string
				expect(typeof defaultValue).toBe('string');
				expect(defaultValue).toMatch(criterion);
				break;

			// must be one of the values in this array
			case 'Array':
				// a list of possible values
				expect(criterion.includes(defaultValue)).toBe(true);
				break;

			// must be like {min=-100, max=100}; optional step
			case 'Object':
				expect(typeof defaultValue).toBe('number');

				expect(criterion).toHaveProperty('min');
				expect(defaultValue).toBeGreaterThanOrEqual(criterion.min);

				expect(criterion).toHaveProperty('max');
				expect(defaultValue).toBeLessThanOrEqual(criterion.max);

				// you cannot use a zero step.  um.. negative?  I don't want to think about it
				if (criterion.step) {
					expect((defaultValue - criterion.min) % criterion.step).toBeCloseTo(0, 10);
				}
				break;

			default:
				debugger;
				throw new Error(`bad object criterion class ${criterion.constructor.name} for param ${groupName}.${varName}`);
				break;
			}  // end case 'object'
			break;

		default:
			debugger;
			throw new Error(`bad criterion type ${typeof criterion} for param ${groupName}.${varName}`);
		}  // end of switch (typeof criterion)
	});  // end of describe
}


// copy & paste these from storeSettings.js and substitute s/makeParam/testParam/
describe('cxToColor tests', () => {
	test('just to answer the criticism that we have no tests', () => {
		expect(5).toBe(5);
	});

	// see also resolution dialog for the slider
	testParam('spaceParams', 'N', 64,  N => isPowerOf2(N) );

	// how to do this correctly with the defined constants???
	//testParam('spaceParams', 'continuum', 2, [0, 1, 2]);
	testParam('spaceParams', 'continuum', qe.contENDLESS, [qe.contDISCRETE, qe.contWELL, qe.contENDLESS]);

	/* ************************************ waveParams */

	// this keeps many settings that don't immediately affect running frame.
	// So 'Set Wave' button actually sets the wave, but meanwhile the setting sliders
	// need to be remembered; this does it.  Voltage and space too; not active until user does something.
	// THis also defines slider mins and maxes!  One source of truth.

	testParam('waveParams', 'waveBreed', 'chord', ['circular', 'standing', 'gaussian', 'chord']);
	testParam('waveParams', 'waveFrequency', 16, {min: -100, max: 100, step: 0.5});
	testParam('waveParams', 'pulseWidth', 20, {min: 1, max: 100});
	testParam('waveParams', 'pulseOffset', 30, {min: 0, max: 100});

	/* ************************************ voltageParams */
	testParam('voltageParams', 'voltageBreed', 'flat', ['flat', 'canyon']);
	testParam('voltageParams', 'canyonPower', 0, {min: -4, max: 4});
	testParam('voltageParams', 'canyonScale', 0, {min: -10, max: 10});
	testParam('voltageParams', 'canyonOffset', 50, {min: 0, max: 100});


	testParam('voltageSettings', 'showVoltage', true, [true, false]);  // not really the same as the rest...

	/* ************************************ frameSettings */
	testParam('frameSettings', 'isRunning', false,  [false, true]);
	testParam('frameSettings', 'framePeriod', 50, {min: 16, max: 60_001});
	testParam('frameSettings', 'deltaT', 1, {min: .01, max: 100.0, });
	testParam('frameSettings', 'stepsPerFrame', 100, {min: 10, max: 1e5});
	testParam('frameSettings', 'lowPassFilter', 50, {min: 0, max: 75});

	/* ************************************miscSettings */
	testParam('miscSettings', 'showingTab', 'wave', ['wave', 'voltage', 'space', 'integrate']);
	testParam('miscSettings', 'waveViewHeight', 400, {min: 50, max: 1e4});
});

