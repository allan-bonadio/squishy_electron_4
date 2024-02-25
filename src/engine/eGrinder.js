/*
** eGrinder - the JS interface to c++ numbercrunching the Schrodinger's equation
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

import {prepForDirectAccessors} from '../utils/directAccessors.js';
import qe from './qe.js';
import {getASetting} from '../utils/storeSettings.js';

let traceCreation = false;
let traceIntegration = true;
let traceFramePeriods = false;

// a qGrinder manages frame of a wave
class eGrinder {
	// eSpace we're in , creates its eGrinder
	constructor(space, avatar, pointer) {
		prepForDirectAccessors(this, pointer);
		this.label = window.Module.AsciiToString(this._label);

		this.space = space;
		this.avatar = avatar;
		avatar.grinder = this;

		this.initAnimationFP();

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

 	get justNFrames() { return this.doubles[15]; }
 	set justNFrames(a) { this.doubles[15] = a; }
 	get frameCalcTime() { return this.doubles[8]; }
 	get shouldBeIntegrating() { return this.bools[164]; }
 	set shouldBeIntegrating(a) { this.bools[164] = a; }
 	get isIntegrating() { return this.bools[165]; }
 	set isIntegrating(a) { this.bools[165] = a; }
 	get pleaseFFT() { return this.bools[166]; }
 	set pleaseFFT(a) { this.bools[166] = a; }
 	shouldBeIntegratingOffset = 41;

 	get dt() { return this.doubles[4]; }
 	set dt(a) { this.doubles[4] = a; }
 	get lowPassFilter() { return this.ints[10]; }
 	set lowPassFilter(a) { this.ints[10] = a; }
 	get stepsPerFrame() { return this.ints[11]; }
 	set stepsPerFrame(a) { this.ints[11] = a; }
 	get nSlaveThreads() { return this.ints[28]; }
 	get newFrameFactor() { return this.ints[22]; }
 	set newFrameFactor(a) { this.ints[22] = a; }
 	get newIntegrationFP() { return this.doubles[10]; }
 	set newIntegrationFP(a) { this.doubles[10] = a; }

 	get _qflick() { return this.ints[12]; }

 	get _voltage() { return this.ints[13]; }
 	get voltageFactor() { return this.doubles[7]; }
 	set voltageFactor(a) { this.doubles[7] = a; }
 	get reversePercent() { return this.doubles[9]; }

 	get _qspect() { return this.ints[24]; }
 	get _stages() { return this.ints[25]; }
 	get _threads() { return this.ints[26]; }
 	get _label() { return this.pointer + 148; }

	/* ******************* end of direct accessors */

	/* ************************************************ Frame timing */

	// animationFP = animation frame period, from requestAnimatioFrame.  Depends
	// on video; often 60/sec.  Can change as window moves to different monitor
	// or monitor frame rate changes.
	// targetFP = target (ui) frame period
	// integrationFP = frame period of actual calculations; rounded from targetFP
	//     to be an integer factor of animationFP

	// given new animationFP or anything else changed, or init, refigure
	// everything and alert the C++ code to change
	recalcIntegrationFP(newAnimationFP) {

		let targetFP = getASetting('frameSettings', 'framePeriod');

		// these will be reset to zero once the C++ threads have converted over
		// how many animationFP in an integrationFP?
		this.newFrameFactor = Math.round(targetFP / newAnimationFP);

		// for a grand total of...
		this.newIntegrationFP = this.newFrameFactor * newAnimationFP;

		if (traceFramePeriods) console.log(`targetFP=${targetFP}  newAnimationFP=${newAnimationFP} `
			+ ` newFrameFactor=${this.newFrameFactor}   newIntegrationFP=${this.newIntegrationFP}`);
	}

	// we have to measure animationFP in case it changes: user moves window to screen with diff
	// refresh rate, or user changes refresh rate in control panel
	eachAnimation =
	now => {
		let animationFP = now - this.prevFrame;
		this.prevFrame = now;

		// this jiggles around quite a  bit so smooth it.  I think individual
		// calls lag, so long periods come next to short periods, so this
		// averages out pretty well.  And, it's never more than 1/10 sec, unless
		// I'm tinkering in the debugger.
		this.avgAnimationFP  =
			Math.min(100, (animationFP + 3 * this.avgAnimationFP) / 4);

		// IF the frame period changed from recent cycles,
		if (Math.abs(animationFP - this.avgAnimationFP) > .5) {
			// ch ch ch changes
			this.unstableFP = true;
			if (traceFramePeriods) console.log(`🪓 aniFP change!  animationFP=${animationFP}  `
				+ ` this.animationFP = ${this.animationFP}  `
				+ `abs diff = ${Math.abs(animationFP - this.animationFP)} `);
		}
		else {
			// if the animationFP changed in the last cycle but is settling down
			if (this.unstableFP) {
				// it's calmed down!  the threads can now recalibrate.
				this.unstableFP = false;
				this.recalcIntegrationFP(animationFP);
			}
		}
		this.animationFP = animationFP;
		requestAnimationFrame(this.eachAnimation);
		// note: this here does NOT control integration itself.  Each thread actually uses rAF individually.
	}

	// start up all this stuff.  once.
	initAnimationFP() {
		// defaults - will soon be set by the real code
		this.animationFP = this.avgAnimationFP = 16.666666;
		this.prevFrame = performance.now();
		this.unstableFP = true;

		requestAnimationFrame(this.eachAnimation);
	}

	/* ************************************************  */

	// Single Threaded - deprecated
	// do the calc in the threads
	// can throw std::runtime_error("divergence")
	oneFrame() {
		qe.grinder_oneFrame(this.pointer);
	}

	// thisis what upper levels call when another frame is needed.
	// It either queues it out to a thread, if the threads are idle,
	// or sets shouldBeIntegrating if busy
	//pleaseIntegrate() {
	//	if (traceIntegration)
	//			console.log(`🪓 eGrinder ${this.label}: pleaseIntegrate()`);
	//	if (this.frameInProgress) {
	//		// is actively in the middle of an integration frame
	//		if (traceIntegration)
	//			console.log(`🪓             eGrinder.pleaseIntegrate: shouldBeIntegrating = true cuz busy`);
	//		// threads are busy but we'll get to it after we're done with this frame
	//		this.shouldBeIntegrating = true;
	//		return false;
	//	}
	//	else {
	//		if (traceIntegration)
	//			console.log(`🪓             eGrinder.pleaseIntegrate doing oneItration`);
	//		this.shouldBeIntegrating = false;
	//
	//		qe.grinder_startAFrame(this.pointer);  // threaded, at least 1
	//		//this.oneFrame(this);  // original, UI thread integration
	//		return true;
	//	}
	//}

	askForFFT() {
		qe.grinder_askForFFT(this.pointer);
	}

}

window.eGrinder = eGrinder;  // debugging
export default eGrinder;
