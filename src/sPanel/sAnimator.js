/*
** squish panel animation -- real-time simulation and interactivity.
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

import ControlPanel from '../controlPanel/ControlPanel.js';
import {interpretCppException} from '../utils/errors.js';
import SquishPanel from './SquishPanel.js';
//import WaveView from '../view/WaveView.js';
import CommonDialog from '../widgets/CommonDialog.js';
//import {getASetting, storeASetting} from '../utils/storeSettings.js';

let traceStats = false;
let traceTheViewBuffer = false;
let traceHeartbeats = false;
let traceIntegrations = false;

const onceInAWhile = 1023;
const everySoOften = 1023;



class sAnimator {

	constructor(spanel, space) {
		this.sPanel = spanel;
		this.cPanel = spanel.cPanel;
		this.space = space;
		this.grinder = space.grinder;

		// ticks and benchmarks
		const now = performance.now();
		this.timeForNextTic = now + 10;  // default so we can get rolling
		this.prevFrameStart = now;
		this.initStats(now);

		// stick ?allowRunningDiagnosticCycle at the end of URL to show runningDiagnosticCycle panel
		// advance forward with each iter.  NOT SAME as shown on WaveView!
		this.runningCycleElapsedTime = 0;
		this.runningCycleIntegrateSerial = 0;
		// eslint-disable-next-line
		this.allowRunningDiagnosticCycle = /allowRunningDiagnosticCycle/.test(location.search);

		// this should be the only place animateHeartbeat() should be called
		// except for inside the function itself
		if (traceHeartbeats)
			console.log(`🎥 sAnimator: about to kick off animateHeartbeat`);
		this.animateHeartbeat(performance.now());
	}

	/* ******************************************************* stats */

	// constructor only calls this (?)
	initStats(now) {
		this.iStats = {
			startIntegration: now,
			endCalc: now,
			endReloadVarsNBuffer: now,
			endDraw: now,
			prevStartIntegration: now,
		}
	}

	// update the stats, as displayed in the Integration tab
	refreshStatsOnScreen() {
		// given a stat name, value and precision, display it using oldschool DOM
		// TODO: should get el refs via React, then don't need the query selector stuff
		function show(cName, ms, nDigits = 2) {
//			const el = document.querySelector(`#${p.id}.SquishPanel .ControlPanel .SetIntegrationTab .${cName}`);
//			if (el) {
//				// hard to see if it's jumping around a lot
//		TODO		if (!el.iStatAvg)
//					el.iStatAvg = ms;
//				else
//					el.iStatAvg = (ms + 31 * el.iStatAvg) / 32;
//				el.innerHTML = el.iStatAvg.toFixed(nDigits);  // only if it's showing
//			}
		}

		const st = this.iStats;
		show('frameCalcTime', st.endCalc - st.startIntegration);
		show('reloadVarsNBuffer', st.endReloadVarsNBuffer - st.endCalc);
		show('drawTime', st.endDraw - st.endReloadVarsNBuffer);
//		show('reloadGlInputs', st.endReloadInputs - st.endReloadVarsNBuffer);
//		show('drawTime', st.endDraw - st.endReloadInputs);
		show('totalForIntegration', st.endDraw - st.startIntegration);
		const period = st.startIntegration - st.prevStartIntegration;
		show('framePeriod', period);
		show('framesPerSec', Math.round(1000 / period), 0)
	}


	/* ******************************************************* frames */

	static divergedBlurb = `Sorry, but your quantum wave diverged!  This isn't your fault; `
	+` it's a limitation of the mathematical engine - it's just not as accurate as the real `
	+` thing, and sometimes it just runs off the rails.  You can click on the Reset Wave `
	+` button; lower frequencies and more space points will help.`;

	// trigger one integration frame to be calculated, catch any errors, stop &
	// dialog if it catches one
	crunchOneFrame() {
		if (traceStats) console.log(`👑 SquishPanel. about to frame`);

		try {
			// hundreds of visscher steps
			this.grinder?.pleaseIntegrate();
		} catch (ex) {
			this.cPanel.stopAnimating();
			// eslint-disable-next-line no-ex-assign
			ex = interpretCppException(ex);
			CommonDialog.openErrorDialog(
				ex.message == 'diverged' ? SquishPanel.divergedBlurb : ex, 'while integrating');
		}

		if (traceStats) console.log(`👑 SquishPanel. did frame`);

		if (traceTheViewBuffer)
			this.dumpViewBuffer('SquishPanel. did frame()');
	}

	// the upper left and right numbers: insert them into the HTML.  Faster than react.
	// should move this to like WaveView
	showTimeNFrame() {
		// need them instantaneously - react is too slow.  but react replaces the whole screen upon error
		let nw = document.querySelector('.voNorthWest')
		if (nw)
			nw.innerHTML = this.grinder.elapsedTime.toFixed(2);
		let ne = document.querySelector('.voNorthEast')
		if (ne)
			ne.innerHTML =  this.grinder.frameSerial;
	}

	// Integrate the ODEs by one frame, or not.  and then repaint. called frame
	// period in animateHeartbeat() while running, as often as the menu setting
	// says.  Hmm I think TODO shouldIntegrate is always strue?
	integrateOneFrame(shouldIntegrate) {
		if (traceStats) console.log(`time since last tic: ${performance.now() - this.iStats.startIntegration}ms`);
// 		this.endCalc = this.startReloadViewBuffer = this.endReloadVarsNBuffer =
// 			this.endIntegration = 0;
		this.iStats.startIntegration = performance.now();  // absolute beginning of integrate frame

		if (shouldIntegrate)
			this.crunchOneFrame();
		this.iStats.endCalc = performance.now();

		this.space.mainEAvatar.doRepaint?.();
		this.showTimeNFrame();

		this.iStats.endReloadVarsNBuffer = this.iStats.endDraw = performance.now();

		// print out per-frame benchmarks.  This is now displayed in the Integrate tab.
		//if (areBenchmarking) {
		//console.log(`times:\n`+
		//	`frame calc time:     ${(this.iStats.endCalc - this.iStats.startIntegration).toFixed(2)}ms\n`+
		//	`reloadVarsNBuffer:     ${(this.iStats.endReloadVarsNBuffer - this.iStats.endCalc).toFixed(2)}ms\n`+
		//	//`reload GL variables:     ${(this.iStats.endReloadInputs - this.iStats.endReloadVarsNBuffer).toFixed(2)}ms\n`+
		//	`draw:   ${(this.iStats.endDraw - this.iStats.endReloadVarsNBuffer).toFixed(2)}ms\n`+
		//	`total for frame:  ${(this.iStats.endDraw - this.iStats.startIntegration).toFixed(2)}ms\n` +
		//	`period since last:  ${(this.iStats.startIntegration - this.iStats.prevStartIntegration).toFixed(2)}ms\n`);
		//}
		this.refreshStatsOnScreen();
		this.iStats.prevStartIntegration = this.iStats.startIntegration;

		this.continueRunningDiagnosticCycle();
	}

	heartbeatSerial = 0;

	// This gets called once each animation period according to
	// requestAnimationFrame(), usually 60/sec and repeats as long as the
	// website is running.  Even if there's no apparent motion. it will advance
	// one heartbeat in animation time, which every so often calls
	// integrateOneFrame(), if appropriate
	animateHeartbeat =
	frameStart => {
		// no matter how often animateHeartbeat is called, it'll only frame once per framePeriod
		if (traceHeartbeats && ((this.heartbeatSerial & onceInAWhile) == 0))
			console.log(`🎥  a heartbeat, serial every ${onceInAWhile+1}: `
				+`${this.heartbeatSerial} = 0x${this.heartbeatSerial.toString(16)} `
				+ `.isRunning=${this.cPanel.isRunning} \n`
				+`frameStart >= this.timeForNextTic ${frameStart} >= ${this.timeForNextTic} `
				+` = ${frameStart >= this.timeForNextTic} `);

		if (this.cPanel.isRunning && frameStart >= this.timeForNextTic) {
			let framePeriod = this.cPanel.framePeriod;

			if (traceIntegrations)
				console.log(`🎥  an integration request serial: ${this.grinder.frameSerial} `);

			this.integrateOneFrame(true);

			// remember (frameStart) is the one passed in, before
			// integrateOneFrame(), so periods are exactly timed (unless it's so slow
			// that we get behind).
			let rightNow = 	performance.now();

			// next time.  Trim by a few ms so random fluctuations don't make me skip periods
			this.timeForNextTic = rightNow + framePeriod - 5;
			if (!isFinite(this.timeForNextTic)) debugger;

			if (traceHeartbeats && ((this.grinder.frameSerial & everySoOften) == 0))
				console.log(`🎥  a frame: ${framePeriod} every ${everySoOften+1}; `
					+`serial: ${this.grinder.frameSerial}  .isRunning=${this.cPanel.isRunning}`);
		}

		if (traceHeartbeats && ((this.heartbeatSerial & onceInAWhile) == 0))
			console.log(`🎥  a heartbeat, serial every ${onceInAWhile+1}: `
				+` ${this.heartbeatSerial} = 0x${this.heartbeatSerial.toString(16)} `
				+`.isRunning=${this.cPanel.isRunning} time=${(performance.now() & 4095)}`);
		this.heartbeatSerial++;


		// frame period: this is in milliseconds
		//const timeSince = frameStart - this.prevFrameStart;
		this.prevFrameStart = frameStart;

		requestAnimationFrame(this.animateHeartbeat);
	}

	/* *******************************************************  runningDiagnosticCycle of circular wave*/

	// special test code
	// use for benchmarking with a circular wave.  Will start frame, and stop after
	// the leftmost state is at its peak.  Then display stats.
	// not used for a year or more, so probably broken somehow.

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
					// if we were going up, we've gone just 1 deltaT past the peak.  Good time to stop.
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

