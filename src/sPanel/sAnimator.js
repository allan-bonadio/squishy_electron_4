/*
** squish panel animator -- real-time simulation and interactivity.
** Copyright (C) 2023-2025 Tactile Interactive, all rights reserved
*/

import ControlPanel from '../controlPanel/ControlPanel.js';
import {interpretCppException} from '../utils/errors.js';
//import SquishPanel from './SquishPanel.js';
import CommonDialog from '../widgets/CommonDialog.js';
import {getASetting} from '../utils/storeSettings.js';
import {thousands, thousandsSpaces} from '../utils/formatNumber.js';
import qeFuncs from '../engine/qeFuncs.js';
import qeConsts from '../engine/qeConsts.js';

let traceTheViewBuffer = false;
let traceHeartbeats = false;
//let traceFrameProgress = false;
let traceFrameMenuRates = false;
let traceSingleFrame = false;
let traceIntegration = true;

let tracerAFPeriod = false;
let traceTypicalVideoPeriod = false;
let traceEachRaf = false;

let typical = 100;

// rAF should certainly call more often than this many ms
const MAX_rAF_PERIOD =  50;
const MAX_DIVERGENCE = 10;

const round = Math.round;
const abs = Math.abs;

// This manages animation of the main glScene.  TODO: split off a version that works on any canvas
// Note: the sAnimator is NOT a React Component!  Just an object created in the SquishPanel
class sAnimator {

	// sqPanel is SquishPanel actual component obj
	constructor(sqPanel, setShouldBeIntegrating, getContext) {
		this.sqPanel = sqPanel;
		this.setShouldBeIntegrating = setShouldBeIntegrating;
		this.getContext = getContext;

		// will still need grinder, mainRepaint(), available later in SquishPanel

		//this.frameProgress = 0;  // part of the FP stabilization
		this.chosenFP = getASetting('frameSettings', 'chosenFP')
		//this.nFramesToGo = 0;

		// defaults - will work until set by real life
		this.avgVideoFP = 1000 / 60;
		this.unstableFP = true;
		this.prevFrame = performance.now();

		// inteTimes holds the stats calculated in sAnimator
		this.inteTimes = {totalDrawTime: 0};

		// Start the heartbeat.  on next tic
		if (traceHeartbeats)
			console.log(`🎥 sAnimator: about to kick off rAFHandler`);
		requestAnimationFrame(this.rAFHandler);

		/* ***************************** runningCycle tests */
		// this is unused and probabbly out of maintenence
		// stick '?allowRunningDiagnosticCycle' at the end of URL to show runningDiagnosticCycle panel
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

		// concept of 'frame' is going away, at least for the user
		// let ne = document.querySelector('.voNorthEast')
		// if (ne)
		// 	ne.innerHTML =  tnf.frameSerialText;
	}

	// Repaint, with webgl, the latest waveview.  Whether it needs it or not.
	// Measure how long it takes to paint; update integration statistics.
	drawLatestFrame() {
		//if (traceStats) console.log(`🎥 time since last tic: ${performance.now()
		//		- this.inteTimes.startIntegrationTime}ms`);
		let startDrawTime = performance.now();
		this.inteTimes.frameDrawPeriod = startDrawTime - this.inteTimes.prevDrawTime;
		this.inteTimes.prevDrawTime = startDrawTime;

		this.mainRepaint?.();   // mainRepaint() func won't be here until GLScene renders
		this.showTimeNFrame();  // part of the draw time - the picoseconds and frame serial

		// update dom elements in integration tab to latest stats (if it's been shown at least once)
		this.grinder.displayAllStats?.(this.inteTimes, this.grinder);

		//this.inteTimes.endReloadVarsNBuffer =
		let endDrawTime = performance.now();
		this.inteTimes.totalDrawTime = endDrawTime - startDrawTime;

		this.inteTimes.prevStartIntegrationTime = this.inteTimes.startIntegrationTime;

		this.continueRunningDiagnosticCycle();
	}

	// do the paint showing new frame
	rAFPaint() {
		// needsRepaint is turned on after each frame is ground, in c++.  but only if it's ground.
		if (!this.grinder.needsRepaint) return;

		this.drawLatestFrame();
		this.grinder.needsRepaint = false;
	}


	/* ************************************************ Frame timing */

	// we have to measure requestAnimationFrame()'s videoFP in case
	// it changes: user moves window to screen with diff refresh rate,
	// or user changes refresh rate in OS control panel
	measureAndUpdateVideoFP(now) {
		let videoFP = now - this.prevFrame;
		this.prevFrame = now;
		//this.rAFPeriod = videoFP;

		// videoFP jiggles around quite a  bit so smooth it.  I think individual
		// periods lag into next period, so long periods come next to short
		// periods, so this averages out pretty easily. And, videoFP is rarely more than
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

		// IF the frame period changed from recent cycles, set unstableFP.
		// Until it settles down.  Some timing fumbles
		// are tolerable while unstableFP is on.
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
			// if the videoFP changed recently/last time,
			if (this.unstableFP) {
				// but is settling down, the threads can now recalibrate.
				this.unstableFP = false;

				const setAnimationFP = () => {
					// round the FREQUENCY to an int, to get the authoritative FP
					let videoRate = round(1000 / this.avgVideoFP);
					videoFP = this.inteTimes.rAFPeriod = 1000 / videoRate;
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
	// startSingleFrame = (nFrames) => {
	// 	console.log(`🎥 sAnimator startSingleFrame starts with '${nFrames}'`);
	// 	this.setShouldBeIntegrating(true);
	// 	ldkrjfghksdjfhhg this.nFramesToGo = nFrames - 1;
	//
	// 	if (traceSingleFrame) console.log(`🎥  sAnimator singleFrame,`
	// 		+` nFramesToGo=${this.nFramesToGo}, `
	// 		+` this.shouldBeIntegrating=${this.shouldBeIntegrating}, `
	// 		+` gr.shouldBeIntegrating=${this.grinder?.shouldBeIntegrating}, `
	// 		+`isIntegrating=${this.grinder?.isIntegrating}   `);
	// }

	/* *************************************  divergence */
	// start to jiggle whole squishPanel if starting to diverge.  Directly, not thru React
	divergenceJiggle(divergence)  {
		let sps = this.sqPanel.squishPanelEl.style;
		if (divergence < MAX_DIVERGENCE) {
			sps.marginLeft = sps.marginRight = sps.marginTop = sps.marginBottom = '0';
			return;
		}

		let divergenceJiggle = divergence / 10;
		let jLeft = (Math.random() * 2 - 1) * divergenceJiggle + 'px';
		let jTop = (Math.random() * 2 - 1) * divergenceJiggle + 'px';
		sps.marginLeft = jLeft;
		sps.marginRight = '-'+  jLeft;
		sps.marginTop = jTop;
		sps.marginBottom = '-'+ jTop;
	}

	// jiggle the SP if it starts to diverge
	rAFDivergence() {
		if (this.grinder.divergence <= MAX_DIVERGENCE) return;

		// normally we don't go thru this overhead, but it's diverging
		if (this.shouldBeIntegrating)
			this.divergenceJiggle(this.grinder.divergence);
		else
			this.divergenceJiggle(0);  // make sure it's off
	}

	/* *************************************  exceptions */
	// handle any mishaps (prob in the C++) during the cycle
	rAFExceptions() {
		if (!this.grinder.hadException) return;

		// an error (eg divergence) will halt integration.  Start Over will put it back.
		console.log(`🎥 sAnimator: hadException   will dialog`);
		this.context.controlPanel.stopAnimating();
		this.errorMessage = qeFuncs.grinder_getExceptionMessage(this.grinder.pointer);
		if (!this.errorMessage) this.errorMessage = 'sorry, no message.  🫦 🥺';
		console.error(`had Exception!  '${this.errorMessage}'  ex=${this.grinder.hadException} `);
		debugger;  // won't stop if we're not in the debugger
		const ex = new Error(this.errorMessage);
		ex.code  = UTF8ToString(this.grinder._exceptionCode);

		this.divergenceJiggle(0);  // stop it

		// throwing in the rAF handler is problematic, but a dialog isn't.
		// twice just means the msg gets updated
		CommonDialog.openErrorDialog({message: this.errorMessage},
			`while integrating Schrodinger's`);
		this.grinder.hadException = false;
	}

	// do the grind for this time around
	rAFIntegrate() {
		if (!this.context.shouldBeIntegrating) return;

		// do the integration, one  frame = one video frame
		//this.frameProgress += this.avgVideoFP;

		// if (traceIntegration)
		// 	console.log(`🎥 frameProgress (${this.frameProgress}) vs  chosenFP (${this.chosenFP})`);

		// singleFrame - are we at the end?
		// if (traceSingleFrame)
		// 	console.log(`🎥 singleFrame - are we at the end?  nFramesToGo=${this.nFramesToGo}`);
		// if (this.nFramesToGo) {
		// 	this.grinder.triggerIteration();
		// 	// 'single' frames - whatever the count is.  or we just go around again
		// 	if (0 == this.nFramesToGo--) {
		// 		// we're done
		// 		this.context.controlPanel.stopAnimating();
		// 		if (traceSingleFrame) console.log(`🎥 stopped single frame 🟥`);
		// 	}
		// }
		// else {
			// time for another normal iteration.  Trigger the threads.
			this.grinder.triggerIteration();
			if (traceIntegration) {
				console.log(`🎥 another normal integration frame done `
					+`at ${performance.now() & 16383} arbitrary ms`);
			}
		//}

	}

	// do one frame - one video frame's worth of integration & whatever
	rAFFrame() {
		if (traceEachRaf) {
			console.log(`🎥 another rAF ctx.sbi=${this.context.shouldBeIntegrating}, `
			+` gr.sbi=${this.grinder.shouldBeIntegrating}, `
			+` gr.isIntegrating=${this.grinder.isIntegrating}`);
		}

		//this.context = this.getContext();
		if (this.grinder) {
			this.rAFDivergence();
			this.rAFExceptions();
			this.rAFIntegrate();
			this.rAFPaint();
		}
	}

	rAFHandler =
	now => {
		this.measureAndUpdateVideoFP(now);  // must measure  rAF frequency continuously

		//if (this.frameProgress >= this.chosenFP) {
			// we only get here every chosenFP ms

			// sometimes (debugger) these can pile up on the stack or list of threads or something
			// so here, if one already started, return quickly from any new ones that get started
			// this doesn't work
			// if (this.alreadyRAF) {
			// 	console.log(`skipping RAF beat`);
			// 	debugger;  // this doesn't do anything
			// 	return;
			// }
			// this.alreadyRAF = true;

			this.rAFFrame();

			// even if the chosenFP doesn't evenly divide by videoFP,
			// this'll do it (approximately) right.  Leftovers goes into next period.
			// you might get like chosen/video = 6 6 5 6 6 6 5 6 6 5 but user won't notice
			// this.frameProgress -= this.chosenFP
			// if (traceFrameProgress) {
			// 	let da = new Date();
			// 	let time = da.getSeconds() + da.getMilliseconds() / 1e3;
			// 	console.log(`🎥 after grind frameProgress=${this.frameProgress}  `
			// 		+ `chosenFP=${this.chosenFP} at :${time.toFixed(3)} `
			// 		+ `nFramesToGo=${this.nFramesToGo}`);
			// }
		//}
		// this.frameProgress += this.avgVideoFP;
		// this.alreadyRAF = false;
		requestAnimationFrame(this.rAFHandler);
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
						runningCycleElapsedTime: this.mainAvatar.elapsedTime - this.runningCycleStartingTime,
						runningCycleIntegrateSerial: this.mainAvatar.frameSerial - this.runningCycleStartingSerial,
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

