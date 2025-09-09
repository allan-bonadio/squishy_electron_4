/*
** eGrinder - the JS interface to c++ numbercrunching Schrodinger's equation
** Copyright (C) 2023-2025 Tactile Interactive, all rights reserved
*/

//import inteStats from '../controlPanel/inteStats.js';
//import statGlobals from '../controlPanel/statGlobals.js';
import {prepForDirectAccessors} from '../utils/directAccessors.js';
import qeFuncs from './qeFuncs.js';
import qeConsts from './qeConsts.js';
import {getASetting} from '../utils/storeSettings.js';
import {thousandsSpaces} from '../utils/formatNumber.js';
import eFlick from './eFlick.js';

let traceCreation = true;
let traceIntegration = false;
let traceTriggerIteration = false;

// a qGrinder manages integration frames of a wave
class eGrinder {
	// eSpace we're in , creates its eGrinder
	constructor(space) {
	//constructor(space, avatar, pointer) {
		let pointer = qeFuncs.grinder_create(space.pointer, 1, 'main');
		/// ummm...


		prepForDirectAccessors(this, pointer);
		// ?? this.label = window.Module.AsciiToString(this._label);

		this.space = space;
// 		this.avatar = avatar;  // the avatar it loads into
// 		avatar.grinder = this;

		// for the flick we only have the pointer.  Similar to a eWave and cross fingers.
		this.flick = new eFlick(space, this._flick);

		//console.log(`sentinels: ${qeConsts.grSENTINEL_VALUE} ≟ ${this.sentinel}`);

		if (qeConsts.grSENTINEL_VALUE !== this.sentinel)
			throw Error("🔥 🔥 Grinder offsets not correct (36) 🔥 🔥");
		if (traceCreation)
			console.log(`🪚 eGrinder constructed: %o`, this);
	}

	// delete, except 'delete' is a reserved word.  Turn everything off.
	// null out all other JS objects and buffers it points to, so ref counting can recycle it all
	liquidate() {
		this.ewave.liquidate();
		this.space = this.ewave = this.vBuffer = null;

		qeFuncs.grinder_delete(this.pointer);
	}

	/* ***************************** 🥽 Direct Accessors */
	// see qGrinder.cpp to regenerate this. Note these are all scalars; buffers
	// are passed by pointer and you need to allocate them in JS (eg see
	// eGrinder.constructor)


	get _space() { return this.ints[1]; }
	get _flick() { return this.ints[3]; }
	get _voltage() { return this.ints[4]; }
	get _spect() { return this.ints[5]; }
	get _stage() { return this.ints[2]; }

	get stepsPerFrame() { return this.ints[7]; }
	set stepsPerFrame(a) { this.ints[7] = a; }
	get videoFP() { return this.doubles[4]; }
	set videoFP(a) { this.doubles[4] = a; }
	get chosenFP() { return this.doubles[5]; }
	set chosenFP(a) { this.doubles[5] = a; }
	get totalCalcTime() { return this.doubles[6]; }
	get maxCalcTime() { return this.doubles[7]; }

	get stretchedDt() { return this.doubles[8]; }
	set stretchedDt(a) { this.doubles[8] = a; }
	get divergence() { return this.doubles[10]; }
	get elapsedTime() { return this.doubles[11]; }
	set elapsedTime(a) { this.doubles[11] = a; }
	get frameSerial() { return this.ints[6]; }
	set frameSerial(a) { this.ints[6] = a; }
	get nGrWorkers() { return this.ints[25]; }
	startAtomicOffset = 26;
	get startAtomic() { return this.ints[26]; }

	get _exceptionCode() { return this.pointer + 120; }
	get hadException() { return Boolean(this.bytes[135]); }
	set hadException(a) { this.bytes[135] = Boolean(a); }
	get _label() { return this.pointer + 136; }

	get shouldBeIntegrating() { return Boolean(this.bytes[152]); }
	set shouldBeIntegrating(a) { this.bytes[152] = Boolean(a); }
	get isIntegrating() { return Boolean(this.bytes[153]); }
	set isIntegrating(a) { this.bytes[153] = Boolean(a); }
	get pleaseFFT() { return Boolean(this.bytes[154]); }
	set pleaseFFT(a) { this.bytes[154] = Boolean(a); }
	get needsRepaint() { return Boolean(this.bytes[155]); }
	set needsRepaint(a) { this.bytes[155] = Boolean(a); }
	get sentinel() { return this.bytes[156]; }
	set sentinel(a) { this.bytes[156] = a; }

	/* ******************* end of direct accessors */

	/* ************************************************  */
//	static divergedBlurb = `Sorry, but your quantum wave diverged!  This isn't your fault; `
//	+` it's a limitation of the mathematical engine - it's just not as accurate as the real `
//	+` thing, and sometimes it just runs off the rails.  You can click on the Reset Wave `
//	+` button; lower frequencies and more space points will help.`;

	// call this to trigger all the threads to do the next iteration.  We COULD do this in C++
	// but the Atomics api can do it, too.
	triggerIteration() {

		if (true) {
			if (traceTriggerIteration) {
				console.log(`🪚 eGrinder.triggerIteration, Atomics.notify() starting  `
					+`shouldBeIntegrating=${this.shouldBeIntegrating}  isIntegrating=${this.isIntegrating} `
					+`voltageFactor=${this.voltageFactor}`);
			}

			// the 'new' way: triggering it in JS with Atomics api
			Atomics.store(this.ints, this.startAtomicOffset, 0);
			let nWoke = Atomics.notify(this.ints, this.startAtomicOffset);
			if (traceTriggerIteration)
				console.log(`triggerIteration 🎥 nWoke:`, nWoke);
		}
		else {
			// old, but still viable, way: doing it by C++
			if (traceTriggerIteration) {
				console.log(`🪚 eGrinder.triggerIteration,  starting  qeFuncs.grinder_triggerIteration()`
					+`shouldBeIntegrating=${this.shouldBeIntegrating}  isIntegrating=${this.isIntegrating} `
					+`voltageFactor=${this.voltageFactor}`);
			}

			qeFuncs.grinder_triggerIteration(this.pointer);
		}

		if (qeConsts.grSENTINEL_VALUE !== this.sentinel)
			throw "🔥 🔥 Grinder offsets aren't correct (119) 🔥 🔥";
	}

	// a consistent way to format these numbers, used in two places
	formatTimeNFrame() {
		return {
			elapsedTimeText: this.elapsedTime.toFixed(3),
			frameSerialText: thousandsSpaces(this.frameSerial),
		}
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
