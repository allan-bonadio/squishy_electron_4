/*
** eGrinder - the JS interface to c++ numbercrunching Schrodinger's equation
** Copyright (C) 2023-2026 Tactile Interactive, all rights reserved
*/

import eObject from './eObject.js';
//import {prepForDirectAccessors} from '../utils/directAccessors.js';
import qeFuncs from './qeFuncs.js';
// import qeConsts from './qeConsts.js';
import {getASetting} from '../utils/storeSettings.js';
import {thousandsSpaces} from '../utils/formatNumber.js';
import eFlick from './eFlick.js';

let traceCreation = false;
let traceIntegration = false;
let traceTriggerIteration = false;

// we're having trouble loading qeConsts.  Here, we only need to test
// if the offsets are (mostly) correct.  Normal functioning (cough)
// can continue.
function checkgrinderOffsets(grinder) {
	import( './qeConsts.js')
	.then(qec => {
		const qeConsts = qec.default;
		if (qeConsts.grSENTINEL_VALUE !== grinder.sentinel)
			console.error(`🔥 🔥 Grinder offsets not correct ${qeConsts.grSENTINEL_VALUE} `
				+` != ${grinder.sentinel} 🔥 🔥`);
		// but continue!  we're doing direct accessors and need the rest of them.
			//throw Error("🔥 🔥 Grinder offsets not correct (36) 🔥 🔥");
	});
}
// Some Calculation/Grinder terms: see qGrinder.h

// a qGrinder manages integration frames of a wave
class eGrinder extends eObject {
	// eSpace we're in , creates its eGrinder
	constructor(space) {
		super();
	//constructor(space, avatar, pointer) {
		let pointer = qeFuncs.grinder_create(space._pointer_, 1, 'main');
		/// ummm...
		//prepForDirectAccessors(this, pointer);
		// ?? this.label = window.Module.AsciiToString(this._label);
		this.setPointer(pointer);
		this.space = space;
// 		this.avatar = avatar;  // the avatar it loads into
// 		avatar.grinder = this;

		// for the flick we only have the pointer.  Similar to a eCavity
		this.flick = new eFlick(space, 'mainFlick', this._flick);

// 		if (qeConsts.grSENTINEL_VALUE !== this.sentinel)
// 			throw Error("🔥 🔥 Grinder offsets not correct (36) 🔥 🔥");
		if (traceCreation)
			console.log(`🪚 eGrinder constructed: %o`, this);

		checkgrinderOffsets(this);
	}

	// delete, except 'delete' is a reserved word.  Turn everything off.
	// null out all other JS objects and buffers it points to, so ref counting can recycle it all
	liquidate() {
		this.cavity.liquidate();
		this.space = this.cavity = this.vBuffer = null;

		qeFuncs.grinder_delete(this._pointer_);
	}

	/* *****************************    👽   👽    Direct Accessors */
	// see qGrinder.cpp to regenerate this. Note these are all scalars;
	// buffers are passed by pointer and you need to allocate them
	// elsewhere eg this._space is the c++ pointer to the c++ instance
	// of qSpace (in JS just an int); this.space is the JS reference to
	// the JS instance of eSpace

	get _space() { return this._ints_[1]; }
	get _flick() { return this._ints_[3]; }
	get _voltage() { return this._ints_[4]; }
	get _spect() { return this._ints_[5]; }
	get _stage() { return this._ints_[2]; }

	get videoFP() { return this._doubles_[4]; }
	set videoFP(a) { this._doubles_[4] = a; }
	get totalCalcTime() { return this._doubles_[5]; }
	get maxCalcTime() { return this._doubles_[6]; }

	get stretchedDt() { return this._doubles_[7]; }
	set stretchedDt(a) { this._doubles_[7] = a; }
	get divergence() { return this._doubles_[9]; }
	get elapsedTime() { return this._doubles_[10]; }
	set elapsedTime(a) { this._doubles_[10] = a; }
	get nGrWorkers() { return this._ints_[23]; }
	startAtomicOffset = 24;
	get startAtomic() { return this._ints_[24]; }

	get _exceptionCode() { return this._pointer_ + 112; }
	get hadException() { return Boolean(this._bytes_[127]); }
	set hadException(a) { this._bytes_[127] = Boolean(a); }
	get _label() { return this._pointer_ + 128; }

	get shouldBeIntegrating() { return Boolean(this._bytes_[160]); }
	set shouldBeIntegrating(a) { this._bytes_[160] = Boolean(a); }
	get isIntegrating() { return Boolean(this._bytes_[161]); }
	set isIntegrating(a) { this._bytes_[161] = Boolean(a); }
	get pleaseFFT() { return Boolean(this._bytes_[162]); }
	set pleaseFFT(a) { this._bytes_[162] = Boolean(a); }
	get needsRepaint() { return Boolean(this._bytes_[163]); }
	set needsRepaint(a) { this._bytes_[163] = Boolean(a); }
	get sentinel() { return this._bytes_[164]; }
	set sentinel(a) { this._bytes_[164] = a; }

	/* ******************* end of direct accessors */

	/* ************************************************  */
//	static divergedBlurb = `Sorry, but your quantum wave diverged!  This isn't your fault; `
//	+` it's a limitation of the mathematical engine - it's just not as accurate as the real `
//	+` thing, and sometimes it just runs off the rails.  You can click on the Reset Wave `
//	+` button; lower frequencies and more space points will help.`;

	// call this to trigger all the threads to do the next iteration.  We COULD do this in C++
	// but the Atomics api can do it, too.  So this is the bottleneck.
	triggerIteration() {

		if (true) {
			if (traceTriggerIteration) {
				console.log(`🪚 eGrinder.triggerIteration, Atomics.notify() starting  `
					+`shouldBeIntegrating=${this.shouldBeIntegrating}  isIntegrating=${this.isIntegrating} `
					+`voltageFactor=${this.voltageFactor}`);
			}

			// the 'new' way: triggering it in JS with Atomics api
			Atomics.store(this._ints_, this.startAtomicOffset, 0);
			let nWoke = Atomics.notify(this._ints_, this.startAtomicOffset);
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

			qeFuncs.grinder_triggerIteration(this._pointer_);
		}

		// if (qeConsts.grSENTINEL_VALUE !== this.sentinel) {
		// 	console.error("🔥\n🔥 🔥 Grinder offsets aren't correct (119) 🔥 🔥\n🔥");
		// }
	}

	// a consistent way to format these numbers, used in two places
	formatTime() {
		return {
			elapsedTimeText: this.elapsedTime.toFixed(3),
		}
	}

	// Grind one frame - Single Threaded - deprecated
	// for testing maybe keep the single threaded way
	// can throw std::runtime_error("divergence")
	// oneLap() {
	// 	qeFuncs.this_oneLap(this._pointer_);
	// }

	askForFFT() {
		qeFuncs.this_askForFFT(this._pointer_);
	}

}

window.eGrinder = eGrinder;  // debugging
export default eGrinder;
