/*
** squish panel animation -- real-time simulation and interactivity.
** Copyright (C) 2023-2024 Tactile Interactive, all rights reserved
*/

import ControlPanel from '../controlPanel/ControlPanel.js';
import {interpretCppException} from '../utils/errors.js';
import SquishPanel from './SquishPanel.js';
import CommonDialog from '../widgets/CommonDialog.js';
import {getASetting} from '../utils/storeSettings.js';
import {thousands, thousandsSpaces} from '../utils/formatNumber.js';
import qeFuncs from '../engine/qeFuncs.js';
import qeConsts from '../engine/qeConsts.js';

let traceTheViewBuffer = false;
let traceHeartbeats = false;
let tracerAFPeriod = false;
let traceFrameMenuRates = false;

// rAF should certainly call more often than this many ms
const MAX_rAF_PERIOD =  50;

const round = Math.round;
const abs = Math.abs;


// Note: the sAnimator is NOT a React Component!  Just an object created in the SquishPanel
class sAnimator {

	// spanel is SquishPanel
	constructor(spanel, space, pickupFreqs) {
		this.sPanel = spanel;
		this.cPanel = spanel.cPanel;
		this.space = space;
		this.grinder = space.grinder;

		this.pickupFreqs = pickupFreqs;

		// ticks and benchmarks
		const now = performance.now();
		//this.timeForNextTic = now + 10;  // default so we can get rolling

		this.frameProgress = 0;
		this.chosenFP = getASetting('frameSettings', 'chosenFP')
		this.inteTimes = {totalDrawTime: 0};
		this.initVideoFP();

		// stick ?allowRunningDiagnosticCycle at the end of URL to show runningDiagnosticCycle panel
		// advance forward with each iter.  NOT SAME as shown on WaveView!
		this.runningCycleElapsedTime = 0;
		this.runningCycleIntegrateSerial = 0;
		// eslint-disable-next-line
		this.allowRunningDiagnosticCycle = /allowRunningDiagnosticCycle/.test(location.search);

	}

	/* ******************************************************* frames */

	// elapsed (virtual) picoseconds and frame count: insert them into
	// the SVG in the HTML.  Faster than react. should move this to like
	// WaveView
	showTimeNFrame() {
		let nw = document.querySelector('.voNorthWest')
		if (nw)
			nw.innerHTML = this.grinder.elapsedTime.toFixed(3);
		let ne = document.querySelector('.voNorthEast')
		if (ne)
			ne.innerHTML =  thousandsSpaces(this.grinder.frameSerial);
	}

	// Repaint, with webgl, the waveview.  (not render!)
	drawLatestFrame() {
		//if (traceStats) console.log(`🎥 time since last tic: ${performance.now()
		//		- this.inteTimes.startIntegrationTime}ms`);
		let startDrawTime = performance.now();
		this.inteTimes.frameDrawPeriod = startDrawTime - this.inteTimes.prevDrawTime;
		this.inteTimes.prevDrawTime = startDrawTime;

			this.space.mainEAvatar.doRepaint?.();
			this.showTimeNFrame();  // part of the draw time


			// update dom elements in integration tab to latest stats
			this.space.sInteStats.displayAllStats(this.inteTimes, this.grinder);

		//this.inteTimes.endReloadVarsNBuffer =
		let endDrawTime = performance.now();
		this.inteTimes.totalDrawTime = endDrawTime - startDrawTime;

		//this.inteTimes.prevStartIntegrationTime = this.inteTimes.startIntegrationTime;

		this.continueRunningDiagnosticCycle();
	}



	/* ************************************************ Frame timing */

	// videoFP = measured frame period from requestAnimatioFrame().  Depends on
	// video; often 60/sec => 16.666...  Can change as window moves to different
	// monitor or monitor frame rate changes (settings).  See machine control panel.
	// avgVideoFP = running avg, smoothed.  We use this as videoFP

	// start up all the frame period numbers.  once.  So undefined don't make NaNs.
	initVideoFP() {
		// defaults - will work until set by real life
		this.avgVideoFP = 18;
		this.prevFrame = performance.now();
		this.unstableFP = true;

		// Start the heartbeat.   This should be the only place rAFHandler()
		// should be called except for inside the function itself
		if (traceHeartbeats)
			console.log(`🎥 sAnimator: about to kick off rAFHandler  ${this.grinder.hadException}`);
		this.rAFHandler(performance.now());
	}

	// given new frameRateMenuFreqs changed,
	// figure out the new <option items for the frame rate menu, and place them
	// rewriteFrameRateMenu() {
	// 	const frameRateMenu = document.querySelector(`.frameRateBox .rateSelector`);
	// 	if (!frameRateMenu) return;  // ???
	//
	// 	let optElements = [];
	// 	this.frameRateMenuFreqs.forEach(rate => {
	// 		if (qeConsts.FASTEST == rate) {
	// 			optElements.push(`<option value=${qeConsts.FASTEST}>Fastest</option>`);
	// 		}
	// 		else if (rate > 1) {
	// 			// 1 per sec or more - phrase it this way
	// 			optElements.push(`<option value=${rate}>${rate} per sec</option>`);
	// 		}
	// 		else if (rate == 1) {
	// 			// 1 per sec or more - phrase it this way
	// 			optElements.push(`<option value=${rate}>once per sec</option>`);
	// 		}
	// 		else {
	// 			optElements.push(`<option value=${rate}>every ${1 / rate} sec</option>`);
	// 		}
	//
	// 	});
	// 	frameRateMenu.innerHTML = optElements.join('\n');
	// }

	// given new videoFP or anything else changed, or init, refigure
	// all the frame periods
	// based on the detected screen frame rate, choose items on the Frame Rate menu
	recalcFrameMenuRates(videoRate) {
		console.log(`🎥 recalcFrameMenuRates(${videoRate}) `)
		// start the list on the Frame Rate menu.
		this.frameRateMenuFreqs = [qeConsts.FASTEST, videoRate];

		let aRate = videoRate
		while (round(aRate / 2) * 2 == aRate) {
			// even!
			aRate /= 2;
			this.frameRateMenuFreqs.push(aRate);
		}
		while (round(aRate / 3) * 3 == aRate) {
			// divisible by 3!
			aRate /= 3;
			this.frameRateMenuFreqs.push(aRate);
		}
		while (round(aRate / 5) * 5 == aRate) {
			// divisible by 5!  My monitor does 85/sec so this is important
			// but x5 is a big jump, so... just use a fraction
			this.frameRateMenuFreqs.push(round(aRate / 2 - 0.01));
			aRate /= 5;
			this.frameRateMenuFreqs.push(aRate);
		}

		// depending on the original rate, we could be left with a big number or 1.
		// now just halve the rate till you get to...
		while (aRate > 1) {
			aRate = round(aRate / 2);
			this.frameRateMenuFreqs.push(aRate);
		}

		// Then, these are fixed for all videoFPs
		this.frameRateMenuFreqs = this.frameRateMenuFreqs.concat([.5, .2, .1, 1/15, 1/30, 1/60]);
		this.pickupFreqs(this.frameRateMenuFreqs);

		if (traceFrameMenuRates) console.log(`🎥 traceFrameMenuRates: `, this.frameRateMenuFreqs)
	}

	// we have to measure requestAnimationFrame()'s videoFP in case
	// it changes: user moves window to screen with diff refresh rate,
	// or user changes refresh rate in control panel
	measureAndUpdateVideoFP(now) {
		let videoFP = now - this.prevFrame;
		this.prevFrame = now;
		//this.rAFPeriod = videoFP;

		// this jiggles around quite a  bit so smooth it.  I think individual
		// periods lag into next period, so long periods come next to short
		// periods, so this averages out pretty well. And, it's never more than
		// 1/20 sec, unless I'm tinkering in the debugger.
		this.avgVideoFP  =
			Math.min(MAX_rAF_PERIOD, (videoFP + 3 * this.avgVideoFP) / 4);

		// IF the frame period changed from recent cycles,
		if (abs(videoFP - this.avgVideoFP) > 4) {
			// something's changing, let it settle down.  Some timing
			// fumbles are tolerable while this is on.
			this.unstableFP = true;
			if (tracerAFPeriod) console.log(`🎥  aniFP change!  videoFP=${videoFP}  `
				+ ` this.avgVideoFP = ${this.avgVideoFP}  `
				+ `abs diff = ${abs(videoFP - this.avgVideoFP)} `);
		}
		else {
			// if the videoFP changed recently/last time, but is settling down
			if (this.unstableFP) {
				// it's calmed down!  the threads can now recalibrate.
				this.unstableFP = false;

				const setAnimationFP = () => {
					// round the FREQUENCY to an int
					let videoRate = round(1000 / this.avgVideoFP);
					videoFP = this.inteTimes.rAFPeriod = 1000 / videoRate;
					this.recalcFrameMenuRates(videoRate);
					this.grinder.videoFP = videoFP;
					//this.videoFP = videoFP;
				}

				setAnimationFP();

				// and soon, even more accurate.  After this, it's usually
				// exactly what's in the control panel for this vid display.
				setTimeout(setAnimationFP, 1000);
			}
		}
	}

	/* *************************************  retrieving chosen frequency setting */

	// given an FP that may be from a different set of frameRateMenuFreqs, find
	// the closest frequency that's listed in the menus.  Note this takes in a
	// PERIOD but returns a FREQUENCY (rate)
	findNearestMenuFreq(anFP) {
		const frmf = this.frameRateMenuFreqs;
		const aRate = 1000 / anFP;

		// first some special values that won't work with the loop
		if (qeConsts.FASTEST == anFP)
			return qeConsts.FASTEST;

		//console.log(`here it iz: aRate=${aRate}, frmf.length=${frmf.length}   frmf=`, frmf);
		if (aRate < frmf[frmf.length - 1])
			return frmf[frmf.length - 1];

		if (aRate > frmf[1])
			return frmf[1];

		// now find space between two rates
		debugger;
		let f;
		for (f = 1; aRate <= frmf[f]; f++) {
			if (aRate == frmf[f])
				return aRate;  // most typical
		}

		// ok now we're between; which is closer?
		if (abs(aRate - frmf[f]) > abs(aRate - frmf[f - 1]))
			return frmf[f - 1];
		else
			return frmf[f];
	}

	// Get chosen frame rate from storage, but make sure it's listed in the menu.
	// Rounding to a menu freq usually not needed, but from the store, it may have been
	// a different videoFP, different set of freqs.  Need this to clear up ambiguities.
	// Then you can set the <select to the returned value and it'll set to one of the given items.
	getChosenRateFromStorage() {
		return this.findNearestMenuFreq(getASetting('frameSettings', 'chosenFP'));
	}

	/* *************************************  runningDiagnosticCycle of circular wave*/

	rAFHandler =
	now => {
		// sometimes these can pile up on the stack or list of threads or something
		// so here, if one already started, return quickly from any new ones that get started
		if (this.alreadyRAF)
			return;
		this.alreadyRAF = true;

		const grinder = this.grinder;

		// an error (eg divergence) will halt integration.  Start Over will put it back.
		if (grinder.hadException) {
			this.cPanel.shouldBeIntegrating = false;
			this.errorMessage = qeFuncs.grinder_getExceptionMessage(grinder.pointer);
			if (!this.errorMessage) this.errorMessage = 'Bogus Error';
			console.error(`had Exception!  '${this.errorMessage}' `);
			debugger;  // won't stop if we're not in the debugger
			const ex = new Error(this.errorMessage);
			ex.code  = UTF8ToString(grinder._exceptionCode);

			// throwing in the rAF handler is problematic, but a dialog isn't.
			CommonDialog.openErrorDialog({message: this.errorMessage},
				`while integrating Schrodinger's`);
			grinder.hadException = false;
		}

		if (traceTheViewBuffer) {
			let ddd = new Date();
			let time = ddd.getSeconds() + ddd.getMilliseconds() / 1e9;
			console.log(`🎥 needsRepaint=${grinder.needsRepaint} latest frame `
				+ `${grinder.frameSerial} at :${time.toFixed(3)} `);
		}

		//console.log(`🎥 qeConsts.FASTEST=${qeConsts.FASTEST}  this.chosenFP=${this.chosenFP}`)
		if (grinder.shouldBeIntegrating && qeConsts.FASTEST != this.chosenFP) {
			// do the integration, if on a numerical frame rate.
			// NOT fastest, so integration is only triggered according to the chosen rate
			this.frameProgress += this.avgVideoFP;
			if (this.frameProgress >= this.chosenFP) {
				// time for another grind.  Trigger the threads.
				// 	Atomics.store(grinder.ints, this.startAtomicOffset, 0);
				// 	let nWoke = Atomics.notify(grinder.ints, grinder.startAtomicOffset);
				this.grinder.triggerIteration();

				// even if the chosenFP doesn't evenly divide by videoFP,
				// this'll do it (approximately) right.  Leftovers goes into next period.
				// you might get like chosen/video = 6 6 5 6 6 6 5 6 6 5 but user won't notice
				this.frameProgress -= this.chosenFP
			}
		}

		// this is turned on after each frame is ground, in c++.  but only if it's ground.
		if (grinder.needsRepaint) {
			this.drawLatestFrame();
			grinder.needsRepaint = false;
		}

		this.measureAndUpdateVideoFP(now);

		requestAnimationFrame(this.rAFHandler);
		this.alreadyRAF = false;
	}

	/* *************************************  runningDiagnosticCycle of circular wave*/

	// special test code.  orobably broken
	// use for benchmarking with a circular wave.  Will start frame, and stop after
	// the leftmost state is at its peak.  Then display stats.
	// not used for a year or more, so probably broken.

	// button handler
	startRunningDiagnosticCycle =
	() => {
		if (!this.allowRunningDiagnosticCycle) return;
		this.runningDiagnosticCycle = true;
		this.runningCycleStartingTime = this.grinder.elapsedTime;
		this.runningCycleStartingSerial = this.grinder.frameSerial;
		this.cPanel.startAnimating();
	};

	// manage runningDiagnosticCycle - called each frame
	continueRunningDiagnosticCycle() {
		if (!this.allowRunningDiagnosticCycle) return;
		if (this.runningDiagnosticCycle) {
			// get the real compoment of the first (#1) value of the wave
			const real0 = this.state.space.wave[2];

			if (real0 < this.prevReal0) {
				// we're going down - first half of the cycle
				if (this.goingUp) {
					// if we were going up, we've gone just 1 step past the peak.  Good time to stop.
					this.runningDiagnosticCycle = false;

					ControlPanel.stopAnimating();

					this.setState({
						runningCycleElapsedTime: this.mainEAvatar.elapsedTime - this.runningCycleStartingTime,
						runningCycleIntegrateSerial: this.mainEAvatar.frameSerial - this.runningCycleStartingSerial,
					});

					this.goingDown = false;
					this.goingUp = false;
				}
				else {
					this.goingDown = true;
					this.goingUp = false;
				}
			}
			else {
				// we're going up - second half.  Watch out for the switchover
				this.goingDown = false;
				this.goingUp = true;
			}

			this.prevReal0 = real0;
		}
	}

	renderRunningDiagnosticCycle() {
		if (!this.allowRunningDiagnosticCycle) return '';
		const s = this.state;

		// you can turn this on in the debugger anytime
		return <div className='runningDiagnosticCycle' style={{display: 'block'}}>
			<span>total frames: {s.runningCycleIntegrateSerial.toFixed(0)} &nbsp;
				elapsed vtime: {s.runningCycleElapsedTime.toFixed(3)} &nbsp;</span>
			<button onClick={this.startRunningDiagnosticCycle}>start running 1 cycle</button>
		</div>
	}

}

export default sAnimator;

