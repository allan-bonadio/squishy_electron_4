/*
** eGrinder - the JS interface to c++ numbercrunching the Schrodinger's equation
** Copyright (C) 2023-2024 Tactile Interactive, all rights reserved
*/

//import inteStats from '../controlPanel/inteStats.js';
//import statGlobals from '../controlPanel/statGlobals.js';
import {prepForDirectAccessors} from '../utils/directAccessors.js';
import qeFuncs from './qeFuncs.js';
import qeConsts from './qeConsts.js';
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

		//console.log(`matching sentinel:
		//qeConsts.grSENTINEL_VALUE=${qeConsts.grSENTINEL_VALUE} !==
		//this.sentinel=${this.sentinel}`)

		if (qeConsts.grSENTINEL_VALUE !== this.sentinel)
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
	get _qflick() { return this.ints[3]; }

	get _voltage() { return this.ints[4]; }
	get _qspect() { return this.ints[5]; }

	get elapsedTime() { return this.doubles[11]; }
	set elapsedTime(a) { this.doubles[11] = a; }
	get frameSerial() { return this.ints[24]; }
	set frameSerial(a) { this.ints[24] = a; }

	get totalCalcTime() { return this.doubles[6]; }
	get maxCalcTime() { return this.doubles[7]; }
	get divergence() { return this.doubles[10]; }

	get needsRepaint() { return Boolean(this.bytes[159]); }
	set needsRepaint(a) { this.bytes[159] = Boolean(a); }
	get hadException() { return Boolean(this.bytes[139]); }
	set hadException(a) { this.bytes[139] = Boolean(a); }
	get _exceptionCode() { return this.pointer + 124; }

	get stretchedDt() { return this.doubles[8]; }
	set stretchedDt(a) { this.doubles[8] = a; }
	get nGrWorkers() { return this.ints[26]; }
	get videoFP() { return this.doubles[4]; }
	set videoFP(a) { this.doubles[4] = a; }
	get chosenFP() { return this.doubles[5]; }
	set chosenFP(a) { this.doubles[5] = a; }
	startAtomicOffset = 27;
	get startAtomic() { return this.ints[27]; }


	get divergence() { return this.doubles[10]; }

	get _label() { return this.pointer + 140; }

	get shouldBeIntegrating() { return Boolean(this.bytes[156]); }
	set shouldBeIntegrating(a) { this.bytes[156] = Boolean(a); }
	get isIntegrating() { return Boolean(this.bytes[157]); }
	set isIntegrating(a) { this.bytes[157] = Boolean(a); }
	get pleaseFFT() { return Boolean(this.bytes[158]); }
	set pleaseFFT(a) { this.bytes[158] = Boolean(a); }


	get sentinel() { return this.bytes[160]; }

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

		//qeFuncs.grinder_triggerIteration(this.pointer);
	}

	// Grind one frame - Single Threaded - deprecated sortof
	// for testing maybe keep the single threaded way
	// can throw std::runtime_error("divergence")
	oneFrame() {
		qeFuncs.grinder_oneFrame(this.pointer);
	}

	askForFFT() {
		qeFuncs.grinder_askForFFT(this.pointer);
	}

}

window.eGrinder = eGrinder;  // debugging
export default eGrinder;
