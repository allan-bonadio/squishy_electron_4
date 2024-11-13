/*
** eGrinder - the JS interface to c++ numbercrunching the Schrodinger's equation
** Copyright (C) 2023-2024 Tactile Interactive, all rights reserved
*/

//import inteStats from '../controlPanel/inteStats.js';
//import statGlobals from '../controlPanel/statGlobals.js';
import {prepForDirectAccessors} from '../utils/directAccessors.js';
import qeFuncs from './qeFuncs.js';
import {getASetting} from '../utils/storeSettings.js';

let traceCreation = false;
let traceIntegration = false;
let traceTriggerIteration = false;

// a qGrinder manages frame of a wave
class eGrinder {
	// eSpace we're in , creates its eGrinder
	constructor(space, avatar, pointer) {
		prepForDirectAccessors(this, pointer);
		this.label = window.Module.AsciiToString(this._label);

		this.space = space;
		this.avatar = avatar;
		avatar.grinder = this;

		if (this.sentinel !== true)
			throw "🔥 🔥 Grinder offsets not correct 🔥 🔥";
		if (traceCreation)
			console.log(`🪚 eGrinder constructed:`, this);
	}

	// delete, except 'delete' is a reserved word.  Turn everything off.
	// null out all other JS objects and buffers it points to, so ref counting can recycle it all
	liquidate() {
		this.ewave.liquidate();
		this.space = this.ewave = this.vBuffer = null;

		//qeFuncs.grinder_delete(this.pointer);
	}

	/* *************************************************************** Direct Accessors */
	// see qGrinder.cpp to regenerate this. Note these are all scalars; buffers
	// are passed by pointer and you need to allocate them in JS (eg see
	// eGrinder.constructor)

	get _space() { return this.ints[1]; }

	get elapsedTime() { return this.doubles[2]; }
	set elapsedTime(a) { this.doubles[2] = a; }
	get frameSerial() { return this.ints[3]; }
	set frameSerial(a) { this.ints[3] = a; }

	get justNFrames() { return this.ints[34]; }
	set justNFrames(a) { this.ints[34] = a; }
	get totalCalcTime() { return this.doubles[12]; }
	get maxCalcTime() { return this.doubles[13]; }
	get divergence() { return this.doubles[14]; }

	get shouldBeIntegrating() { return Boolean(this.bools[168]); }
	set shouldBeIntegrating(a) { this.bools[168] = a; }
	get isIntegrating() { return Boolean(this.bools[169]); }
	set isIntegrating(a) { this.bools[169] = a; }
	get pleaseFFT() { return Boolean(this.bools[170]); }
	set pleaseFFT(a) { this.bools[170] = a; }

	get needsRepaint() { return Boolean(this.bools[171]); }
	set needsRepaint(a) { this.bools[171] = a; }
	get hadException() { return Boolean(this.bools[63]); }
	set hadException(a) { this.bools[63] = a; }
	get _exceptionCode() { return this.pointer + 48; }

	get stretchedDt() { return this.doubles[3]; }
	set stretchedDt(a) { this.doubles[3] = a; }
	get nGrinderThreads() { return this.ints[33]; }
	get videoFP() { return this.doubles[9]; }
	set videoFP(a) { this.doubles[9] = a; }
	get chosenFP() { return this.doubles[10]; }
	set chosenFP(a) { this.doubles[10] = a; }
	startAtomicOffset = 35;

	get _qflick() { return this.ints[22]; }

	get _voltage() { return this.ints[23]; }
	get divergence() { return this.doubles[14]; }

	get _qspect() { return this.ints[30]; }
	get _stages() { return this.ints[31]; }
	get _threads() { return this.ints[32]; }
	get _label() { return this.pointer + 152; }

	get sentinel() { return Boolean(this.bools[172]); }

 	/* ******************* end of direct accessors */

	/* ************************************************  */
//	static divergedBlurb = `Sorry, but your quantum wave diverged!  This isn't your fault; `
//	+` it's a limitation of the mathematical engine - it's just not as accurate as the real `
//	+` thing, and sometimes it just runs off the rails.  You can click on the Reset Wave `
//	+` button; lower frequencies and more space points will help.`;

	// call this to trigger all the threads to do the next iteration
	triggerIteration() {
		if (traceTriggerIteration) {
			console.log(`🪚 eGrinder.triggerIteration, ${this.pointer.toString(16)} starting  `
				+`shouldBeIntegrating=${this.shouldBeIntegrating}  isIntegrating=${this.isIntegrating} `
				+`voltageFactor=${this.voltageFactor}`);
		}
		Atomics.store(this.ints, this.startAtomicOffset, 0);
		let nWoke = Atomics.notify(this.ints, this.startAtomicOffset);
		//console.log(`🎥 nWoke:`, nWoke);

		//qeFuncs.this_triggerIteration(this.pointer);
	}

	// Grind one frame - Single Threaded - deprecated sortof
	// for testing maybe keep the single threaded way
	// can throw std::runtime_error("divergence")
	oneFrame() {
		qeFuncs.this_oneFrame(this.pointer);
	}

	askForFFT() {
		qeFuncs.this_askForFFT(this.pointer);
	}

}

window.eGrinder = eGrinder;  // debugging
export default eGrinder;
