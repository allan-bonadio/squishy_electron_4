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

// Note: the sAnimator is NOT a React Component!  Just an object created in the SquishPanel
class sAnimator {

	// spanel is SquishPanel
	constructor(spanel, space) {
		this.sPanel = spanel;
		this.cPanel = spanel.cPanel;
		this.space = space;
		this.grinder = space.grinder;

		// ticks and benchmarks
		const now = performance.now();
		//this.timeForNextTic = now + 10;  // default so we can get rolling

		this.inteTimes = {totalDrawTime: 0};
		this.initAnimationFP();

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

	// animationFP = animation frame period, from requestAnimatioFrame().  Depends
	// on video; often 60/sec.  Can change as window moves to different monitor
	// or monitor frame rate changes (settings).

	// start up all the frame period numbers.  once.
	initAnimationFP() {
		// defaults - will work until set by real life
		this.avgAnimationFP = 18;
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
	rewriteFrameRateMenu() {
		const frameRateMenu = document.querySelector(`.frameRateBox .rateSelector`);
		if (!frameRateMenu) return;  // ???

		let optElements = [];
		this.frameRateMenuFreqs.forEach(rate => {
			if (qeConsts.FASTEST == rate) {
				optElements.push(`<option value=${qeConsts.FASTEST}>Fastest</option>`);
			}
			else if (rate >= 1) {
				// 1 per sec or more - phrase it this way
				optElements.push(`<option value=${rate}>${rate} per sec</option>`);
			}
			else {
				optElements.push(`<option value=${rate}>every ${1 / rate} sec</option>`);
			}

		});
		frameRateMenu.innerHTML = optElements.join('\n');
	}

	// given new animationFP or anything else changed, or init, refigure
	// all the frame periods
	// based on the detected screen frame rate, choose items on the Frame Rate menu
	recalcFrameMenuRates(animationRate) {
		// start the list on the Frame Rate menu.  Start with first two.
		this.frameRateMenuFreqs = [qeConsts.FASTEST, animationRate];

		let aRate = animationRate
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

		// Then, these are fixed for everybody
		this.frameRateMenuFreqs = this.frameRateMenuFreqs.concat([.5, .2, .1, 1/15, 1/30, 1/60]);
		if (traceFrameMenuRates) console.log(`traceFrameMenuRates: `, this.frameRateMenuFreqs)
	}

	// we have to measure requestAnimationFrame()'s animationFP in case
	// it changes: user moves window to screen with diff refresh rate,
	// or user changes refresh rate in control panel
	measureAndUpdateFramePeriods(now) {
		let animationFP = now - this.prevFrame;
		this.prevFrame = now;
		//this.rAFPeriod = animationFP;

		// this jiggles around quite a  bit so smooth it.  I think
		// individual periods lag into next period, so long periods come
		// next to short periods, so this averages out pretty well.
		// And, it's never more than 1/20 sec, unless I'm tinkering in
		// the debugger.
		this.avgAnimationFP  =
			Math.min(MAX_rAF_PERIOD, (animationFP + 3 * this.avgAnimationFP) / 4);

		// IF the frame period changed from recent cycles,
		if (Math.abs(animationFP - this.avgAnimationFP) > 4) {
			// something's changing, let it settle down.  Some timing
			// fumbles are tolerable while this is on.
			this.unstableFP = true;
			if (tracerAFPeriod) console.log(`🎥  aniFP change!  animationFP=${animationFP}  `
				+ ` this.avgAnimationFP = ${this.avgAnimationFP}  `
				+ `abs diff = ${Math.abs(animationFP - this.avgAnimationFP)} `);
		}
		else {
			// if the animationFP changed recently/last time, but is settling down
			if (this.unstableFP) {
				// it's calmed down!  the threads can now recalibrate.
				this.unstableFP = false;

				// round the FREQUENCY to an int
				let animationRate = round(1000 / this.avgAnimationFP);
				animationFP = this.inteTimes.rAFPeriod = 1000 / animationRate;
				this.recalcFrameMenuRates(animationRate);
				this.rewriteFrameRateMenu();

				// and soon, even more accurate
				setTimeout(() => {
					animationRate = round(1000 / this.avgAnimationFP);
					animationFP = this.inteTimes.rAFPeriod = 1000 / animationRate;
					this.recalcFrameMenuRates(animationRate);
					this.rewriteFrameRateMenu();
				}, 1000);
			}
		}
	}

	rAFHandler =
	now => {
		// sometimes these can pile up on the stack or list of threads or something
		// so here, if one already started, return quickly from any new ones that get started
		if (this.alreadyRAF)
			return;
		this.alreadyRAF = true;

		// an error (eg divergence) will halt integration.  Start Over will put it back.
		if (this.grinder.hadException) {
			this.cPanel.shouldBeIntegrating = false;
			this.errorMessage = qeFuncs.grinder_getExceptionMessage(this.grinder.pointer);
			if (!this.errorMessage) this.errorMessage = 'Bogus Error';
			console.error(`had Exception!  '${this.errorMessage}' `);
			debugger;  // won't stop if we're not in the debugger
			const ex = new Error(this.errorMessage);
			ex.code  = UTF8ToString(this.grinder._exceptionCode);

			// throwing in the rAF handler is problematic, but a dialog isn't.
			CommonDialog.openErrorDialog({message: this.errorMessage},
				`while integrating Schrodinger's`);
			this.grinder.hadException = false;
		}

		if (traceTheViewBuffer) {
			let ddd=new Date();
			let time = ddd.getSeconds() + ddd.getMilliseconds() / 1e9;
			console.log(`🎥 needsRepaint=${this.grinder.needsRepaint} latest frame `
				+ `${this.grinder.frameSerial} at :${time.toFixed(3)} `);
		}

		// this is turned on after each frame is ground
		if (this.grinder.needsRepaint) {
			this.drawLatestFrame();
			this.grinder.needsRepaint = false;
		}

		this.measureAndUpdateFramePeriods(now);

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

