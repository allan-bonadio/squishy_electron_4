/*
** eGrinder - the JS interface to c++ numbercrunching the Schrodinger's equation
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

import {prepForDirectAccessors} from '../utils/directAccessors.js';
import qe from './qe.js';
import eThread from './eThread.js';

let traceCreation = false;
let traceIntegration = false;

// a qGrinder manages frame of a wave
class eGrinder {
	// eSpace we're in , creates its eGrinder
	constructor(space, avatar, pointer) {
		prepForDirectAccessors(this, pointer);
		this.label = window.Module.AsciiToString(this._label);

		this.space = space;
		this.avatar = avatar;
		avatar.grinder = this;

		// must allocate my qFlick
		//this.qflick = new qFlick(space, this, 4);

		if (traceCreation)
			console.log(`eGrinder constructed:`, this);
	}

	// delete, except 'delete' is a reserved word.  Turn everything off.
	// null out all other JS objects and buffers it points to, so ref counting can recycle it all
	liquidate() {
		this.ewave.liquidate();
		this.space = this.ewave = this.vBuffer = null;
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

 	get isIntegrating() { return this.bools[104]; }
 	set isIntegrating(a) { this.bools[104] = a; }
 	get pleaseFFT() { return this.bools[106]; }
 	set pleaseFFT(a) { this.bools[106] = a; }
 	get needsIntegration() { return this.ints[21]; }
 	set needsIntegration(a) { this.ints[21] = a; }
 	needsIntegrationOffset = 21;
 	get integrationFrameInProgress() { return this.bools[105]; }
 	set integrationFrameInProgress(a) { this.bools[105] = a; }

 	get dt() { return this.doubles[4]; }
 	set dt(a) { this.doubles[4] = a; }
 	get lowPassFilter() { return this.ints[10]; }
 	set lowPassFilter(a) { this.ints[10] = a; }
 	get stepsPerFrame() { return this.ints[11]; }
 	set stepsPerFrame(a) { this.ints[11] = a; }

 	get _qflick() { return this.ints[12]; }

 	get _voltage() { return this.ints[13]; }
 	get voltageFactor() { return this.doubles[7]; }
 	set voltageFactor(a) { this.doubles[7] = a; }
 	get reversePercent() { return this.doubles[8]; }

 	get _qspect() { return this.ints[18]; }
 	get _stages() { return this.ints[19]; }
 	get _threads() { return this.ints[20]; }
 	get _label() { return this.pointer + 88; }

	/* **************************** end of direct accessors */
	// can throw std::runtime_error("divergence")
	oneFrame() {
		qe.grinder_oneFrame(this.pointer);
	}

	// thisis what upper levels call when another frame is needed.
	// It either queues it out to a thread, if the threads are idle,
	// or sets needsIntegration if busy
	pleaseIntegrate() {
		if (traceIntegration)
				console.log(`🪓 eGrinder ${this.label}: pleaseIntegrate()`);
		if (this.integrationFrameInProgress) {
			// is actively in the middle of an integration frame
			if (traceIntegration)
				console.log(`🪓             eGrinder.pleaseIntegrate: needsIntegration = true cuz busy`);
			// threads are busy but we'll get to it after we're done with this frame
			this.needsIntegration = true;
			return false;
		}
		else {
			if (traceIntegration)
				console.log(`🪓             eGrinder.pleaseIntegrate doing oneItration`);
			this.needsIntegration = false;
			this.oneFrame(this);
			return true;
		}
	}

	askForFFT() {
		qe.grinder_askForFFT(this.pointer);
	}

	// delete the eGrinder and qGrinder and its owned buffers
	deleteGrinder() {
		qe.grinder_delete(this.pointer);
	}

}

window.eGrinder = eGrinder;  // debugging
export default eGrinder;
