/*
** squish panel animator -- real-time simulation and interactivity.
** Copyright (C) 2023-2025 Tactile Interactive, all rights reserved
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
let traceFrameProgress = false;
let traceFrameMenuRates = false;

let tracerAFPeriod = false;
let traceSingleFrame = false;
let traceTypicalVideoPeriod = false;
let typical = 100;

// rAF should certainly call more often than this many ms
const MAX_rAF_PERIOD =  50;

const round = Math.round;
const abs = Math.abs;


// Note: the sAnimator is NOT a React Component!  Just an object created in the SquishPanel
class sAnimator {

	// spanel is SquishPanel
	constructor(spanel, space, setShouldBeIntegrating) {
		this.sPanel = spanel;
		this.space = space;
		this.grinder = space.grinder;
		this.setShouldBeIntegrating = setShouldBeIntegrating;

		this.frameProgress = 0;  // part of the FP stabilization
		this.chosenFP = getASetting('frameSettings', 'chosenFP')

		// defaults - will work until set by real life
		this.avgVideoFP = 1000 / 60;
		this.unstableFP = true;
		this.prevFrame = performance.now();

		this.nFramesToGo = -1;
		this.inteTimes = {totalDrawTime: 0};

		// Start the heartbeat.  on next tic
		if (traceHeartbeats)
			console.log(`🎥 sAnimator: about to kick off rAFHandler`);
		requestAnimationFrame(this.rAFHandler);

		/* ***************************** runningCycle tests */
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
		let tnf = this.grinder.formatTimeNFrame();
		let nw = document.querySelector('.voNorthWest')
		if (nw)
			nw.innerHTML = tnf.elapsedTimeText;
		let ne = document.querySelector('.voNorthEast')
		if (ne)
			ne.innerHTML =  tnf.frameSerialText;
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

		this.inteTimes.prevStartIntegrationTime = this.inteTimes.startIntegrationTime;

		this.continueRunningDiagnosticCycle();
	}

	/* ************************************************ Frame timing */

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
			Math.min(MAX_rAF_PERIOD, (videoFP + 255 * this.avgVideoFP) / 256);

		if (traceTypicalVideoPeriod && typical-- <= 0) {
			console.log(`🎥  TypicalVideoPeriod at ${performance.now().toFixed(4)}ms `
					+` videoFP=${videoFP.toFixed(4)}  `
					+ ` this.avgVideoFP = ${this.avgVideoFP.toFixed(4)}  `
					+ `abs diff = ${abs(videoFP - this.avgVideoFP).toFixed(4)} `);
			typical = 100;
		}

		// IF the frame period changed from recent cycles,
			// something's changing, let it settle down.  Some timing fumbles
			// are tolerable while this is on.
		if (abs(videoFP - this.avgVideoFP) > 4) {
			this.unstableFP = true;
			if (tracerAFPeriod) {
				console.log(`🎥  aniFP change at ${performance.now().toFixed(4)}ms `
						+` videoFP=${videoFP.toFixed(4)}  `
						+ ` this.avgVideoFP = ${this.avgVideoFP.toFixed(4)}  `
						+ `abs diff = ${abs(videoFP - this.avgVideoFP).toFixed(4)} `);
			}
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
					//this.recalcFrameMenuRates(videoRate);
					this.grinder.videoFP = videoFP;
				}

				setAnimationFP();

				// and soon, even more accurate.  After this, it's usually
				// exactly what's in the control panel for this vid display.
				setTimeout(setAnimationFP, 60_000);
			}
		}
	}

	/* ********************************************************* single frame */

	// call when human clicks on Single Frame button, with n of frames they asked for
	singleFrame = (nFrames) => {
		console.log(`🎥 sAnimator singleFrame starts with '${nFrames}'`);
		this.setShouldBeIntegrating(true);
		this.nFramesToGo = nFrames - 1;

		if (traceSingleFrame) console.log(`🎥  sAnimator singleFrame,`
			+` nFramesToGo=${this.nFramesToGo}, `
			+` ctx.shouldBeIntegrating=${this.context.shouldBeIntegrating}, `
			+` gr.shouldBeIntegrating=${this.grinder.shouldBeIntegrating}, `
			+`isIntegrating=${this.grinder.isIntegrating}   `);
	}

	/* *************************************  retrieving chosen frequency setting */

	// given an FP that may be from a different set of frameRateMenuFreqs, find
	// the closest frequency that's listed in the menus.  Note this takes in a
	// PERIOD but returns a FREQUENCY (rate)
//	findNearestMenuFreq(anFP) {
//		const frmf = this.frameRateMenuFreqs;
//		const aRate = 1000 / anFP;
//
//		// first some special values that won't work with the loop
//		if (qeConsts.FASTEST == anFP)
//			return qeConsts.FASTEST;
//
//		//console.log(`here it iz: aRate=${aRate}, frmf.length=${frmf.length}   frmf=`, frmf);
//		if (aRate < frmf[frmf.length - 1])
//			return frmf[frmf.length - 1];
//
//		if (aRate > frmf[1])
//			return frmf[1];
//
//		// now find space between two rates
//		debugger;
//		let f;
//		for (f = 1; aRate <= frmf[f]; f++) {
//			if (aRate == frmf[f])
//				return aRate;  // most typical
//		}
//
//		// ok now we're between; which is closer?
//		if (abs(aRate - frmf[f]) > abs(aRate - frmf[f - 1]))
//			return frmf[f - 1];
//		else
//			return frmf[f];
//	}

	// nobody uses this
	// Get chosen frame rate from storage, but make sure it's listed in the menu.
	// Rounding to a menu freq usually not needed, but from the store, it may have been
	// a different videoFP, different set of freqs.  Need this to clear up ambiguities.
	// Then you can set the <select to the returned value and it'll set to one of the given items.
	//getChosenRateFromStorage() {
	//	return getASetting('frameSettings', 'chosenFP');
	//	//return this.findNearestMenuFreq(getASetting('frameSettings', 'chosenFP'));
	//}

	/* *************************************  the heartbeat */

	rAFHandler =
	now => {
		this.measureAndUpdateVideoFP(now);  // must measure  rAF frequency always

		// sometimes these can pile up on the stack or list of threads or something
		// so here, if one already started, return quickly from any new ones that get started
		if (this.alreadyRAF) {
			console.log(`skipping RAF beat`);
			return;
		}
		this.alreadyRAF = true;

		const grinder = this.grinder;

		// an error (eg divergence) will halt integration.  Start Over will put it back.
		if (grinder.hadException) {
			console.log(`🎥 sAnimator: hadException   will dialog`);
			this.context?.controlPanel?.stopAnimation();
			this.errorMessage = qeFuncs.grinder_getExceptionMessage(grinder.pointer);
			if (!this.errorMessage) this.errorMessage = 'sorry, no message.  🫦 🥺';
			console.error(`had Exception!  '${this.errorMessage}'  ex=${this.grinder.hadException} `);
			debugger;  // won't stop if we're not in the debugger
			const ex = new Error(this.errorMessage);
			ex.code  = UTF8ToString(grinder._exceptionCode);

			// throwing in the rAF handler is problematic, but a dialog isn't.
			CommonDialog.openErrorDialog({message: this.errorMessage},
				`while integrating Schrodinger's`);
			grinder.hadException = false;
		}

		if (traceFrameProgress) {
			let da = new Date();
			let time = da.getSeconds() + da.getMilliseconds() / 1e3;
			if (da.getMilliseconds() < 14) {
				console.log(`🎥 b4 needsRepaint=${grinder.needsRepaint} latest frame `
					+ `nFramesToGo=${this.nFramesToGo} `
					+ `frameSerial=${this.frameSerial} at :${time.toFixed(3)} seconds (wall)`,
					this.context, this.context?.controlPanel);
			}
		}

		if (this.context?.shouldBeIntegrating) {    // && qeConsts.FASTEST != this.chosenFP
			// do the integration, if on a numerical frame rate.
			// NOT fastest, so integration is only triggered according to the chosen rate
			this.frameProgress += this.avgVideoFP;

			if (this.frameProgress >= this.chosenFP) {
				// singleFrame - are we at the end?
				if (0 == this.nFramesToGo--) {
					// nFramesToGo next time will become -1 and then more negative
					this.context.controlPanel?.stopAnimating?.();
				}
				else {
					// time for another grind.  Trigger the threads.
					this.grinder.triggerIteration();
				}

				// even if the chosenFP doesn't evenly divide by videoFP,
				// this'll do it (approximately) right.  Leftovers goes into next period.
				// you might get like chosen/video = 6 6 5 6 6 6 5 6 6 5 but user won't notice
				this.frameProgress -= this.chosenFP
				if (traceFrameProgress) {
					let da = new Date();
					let time = da.getSeconds() + da.getMilliseconds() / 1e3;
					console.log(`🎥 after grind frameProgress=${this.frameProgress}  `
						+ `chosenFP=${this.chosenFP} at :${time.toFixed(3)} `
						+ `nFramesToGo=${this.nFramesToGo}`);
				}
			}
		}

		// this is turned on after each frame is ground, in c++.  but only if it's ground.
		if (grinder.needsRepaint) {
			this.drawLatestFrame();
			grinder.needsRepaint = false;
		}

		requestAnimationFrame(this.rAFHandler);
		this.alreadyRAF = false;
	}

	/* *************************************  runningDiagnosticCycle of circular wave*/

	// special test code.  probably broken
	// use for benchmarking with a circular wave.  Will start frame, and stop after
	// the leftmost state is at its peak.  Then display stats.
	// not used for a year or more, so probably broken.

	// button handler
	startRunningDiagnosticCycle =
	() => {
		if (!this.allowRunningDiagnosticCycle) return;
		this.runningDiagnosticCycle = true;
		this.runningCycleStartingTime = this.grinder.elapsedTime;
		this.runningCycleStartingSerial = this.frameSerial;
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

