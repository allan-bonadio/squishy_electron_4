/*
** eGrinder - the JS interface to c++ numbercrunching the Schrodinger's equation
** Copyright (C) 2023-2024 Tactile Interactive, all rights reserved
*/

//import inteStats from '../controlPanel/inteStats.js';
//import statGlobals from '../controlPanel/statGlobals.js';
import {prepForDirectAccessors} from '../utils/directAccessors.js';
import qe from './qe.js';
import {getASetting} from '../utils/storeSettings.js';

let traceCreation = false;
let traceIntegration = true;

// a qGrinder manages frame of a wave
class eGrinder {
	// eSpace we're in , creates its eGrinder
	constructor(space, avatar, pointer) {
		prepForDirectAccessors(this, pointer);
		this.label = window.Module.AsciiToString(this._label);

		this.space = space;
		this.avatar = avatar;
		avatar.grinder = this;

		if (traceCreation)
			console.log(`eGrinder constructed:`, this);
	}

	// delete, except 'delete' is a reserved word.  Turn everything off.
	// null out all other JS objects and buffers it points to, so ref counting can recycle it all
	liquidate() {
		this.ewave.liquidate();
		this.space = this.ewave = this.vBuffer = null;

		//qe.grinder_delete(this.pointer);
	}

	/* *************************************************************** Direct Accessors */
	// see qGrinder.cpp to regenerate this. Note these are all scalars; buffers
	// are passed by pointer and you need to allocate them in JS (eg see
	// eGrinder.constructor)


	get _space() { return this.ints[1]; }

 	get elapsedTime() { return this.doubles[2]; }
 	set elapsedTime(a) { this.doubles[2] = a; }
 	get frameSerial() { return this.doubles[3]; }
 	set frameSerial(a) { this.doubles[3] = a; }

 	get justNFrames() { return this.ints[33]; }
 	set justNFrames(a) { this.ints[33] = a; }
 	get frameCalcTime() { return this.doubles[9]; }
 	get shouldBeIntegrating() { return Boolean(this.bools[200]); }
 	set shouldBeIntegrating(a) { this.bools[200] = a; }
 	get isIntegrating() { return Boolean(this.bools[201]); }
 	set isIntegrating(a) { this.bools[201] = a; }
 	get pleaseFFT() { return Boolean(this.bools[202]); }
 	set pleaseFFT(a) { this.bools[202] = a; }
 	shouldBeIntegratingOffset = 50;

	get dt() { return this.doubles[4]; }
 	set dt(a) { this.doubles[4] = a; }
 	get lowPassFilter() { return this.ints[10]; }
 	set lowPassFilter(a) { this.ints[10] = a; }
 	get stepsPerFrame() { return this.ints[11]; }
 	set stepsPerFrame(a) { this.ints[11] = a; }
// 	get integrationEx() { return this.ints[-6446]; }
// 	set integrationEx(a) { this.ints[-6446] = a; }
 	get nSlaveThreads() { return this.ints[30]; }
 	get newFrameFactor() { return this.ints[24]; }
 	set newFrameFactor(a) { this.ints[24] = a; }
 	get newIntegrationFP() { return this.doubles[11]; }
 	set newIntegrationFP(a) { this.doubles[11] = a; }

 	get _qflick() { return this.ints[13]; }

	get _voltage() { return this.ints[14]; }
 	get voltageFactor() { return this.doubles[8]; }
 	set voltageFactor(a) { this.doubles[8] = a; }
 	get reversePercent() { return this.doubles[10]; }

 	get _qspect() { return this.ints[26]; }
 	get _stages() { return this.ints[27]; }
 	get _threads() { return this.ints[28]; }
 	get _label() { return this.pointer + 184; }

	/* ******************* end of direct accessors */

	/* ************************************************  */
//	static divergedBlurb = `Sorry, but your quantum wave diverged!  This isn't your fault; `
//	+` it's a limitation of the mathematical engine - it's just not as accurate as the real `
//	+` thing, and sometimes it just runs off the rails.  You can click on the Reset Wave `
//	+` button; lower frequencies and more space points will help.`;

	// call this to trigger all the threads to do the next iteration
	triggerIteration() {
		qe.grinder_triggerIteration(this.pointer);

	}

	// Single Threaded - deprecated sortof
	// should do the calc in the threads but for testing maybe keep the single threaded way
	// can throw std::runtime_error("divergence")
	oneFrame() {
		qe.grinder_oneFrame(this.pointer);
	}

	askForFFT() {
		qe.grinder_askForFFT(this.pointer);
	}

}

window.eGrinder = eGrinder;  // debugging
export default eGrinder;
