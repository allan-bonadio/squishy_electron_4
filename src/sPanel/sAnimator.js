/*
** squish panel animation -- real-time simulation and interactivity.
** Copyright (C) 2023-2024 Tactile Interactive, all rights reserved
*/

//import inteStats from '../controlPanel/inteStats.js';
//import statGlobals from '../controlPanel/statGlobals.js';
import ControlPanel from '../controlPanel/ControlPanel.js';
import {interpretCppException} from '../utils/errors.js';
import SquishPanel from './SquishPanel.js';
import CommonDialog from '../widgets/CommonDialog.js';

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

	// the variables that actually mark the various times
	// start them all at reasonable values
	initStats(now) {
		this.inteTimes = {
			startIntegrationTime: now,
			startDrawTime: now,
			//endReloadVarsNBuffer: now,
			endDraw: now,
			prevStartIntegrationTime: now,
		}
	}

	// update the stats, as displayed in the Integration tab
	refreshStatsOnScreen() {
		//	if (typeof statGlobals == 'undefined' || !statGlobals)
		//		return;  // why does this happen?!?!?!

		this.space.sIntStats.displayAllStats(this.inteTimes, this.grinder);

		// given a stat name, value and precision, display it using oldschool DOM
		//const st = this.inteTimes;
		//statGlobals.show('reversePercent', this.grinder.reversePercent);
		//statGlobals.show('frameCalcTime', this.grinder.frameCalcTime);
		//statGlobals.show('drawTime', st.endDraw - st.startDrawTime);
		//statGlobals.show('totalForFrame', st.endDraw - st.startIntegrationTime);  // draw + calc
		//const period = st.startIntegrationTime - st.prevStartIntegrationTime;
		//statGlobals.show('framePeriod', period);
		//statGlobals.show('framesPerSec', Math.round(1000 / period), 0)
		//statGlobals.show('rAFPeriod', st.rAFPeriod)
	}


	/* ******************************************************* frames */

	static divergedBlurb = `Sorry, but your quantum wave diverged!  This isn't your fault; `
	+` it's a limitation of the mathematical engine - it's just not as accurate as the real `
	+` thing, and sometimes it just runs off the rails.  You can click on the Reset Wave `
	+` button; lower frequencies and more space points will help.`;

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

	// Repaint. called frame
	// period in animateHeartbeat() while running, as often as the menu setting
	// says.  Not a render time thing.
	drawLatestFrame() {
		if (traceStats) console.log(`time since last tic: ${performance.now() - this.inteTimes.startIntegrationTime}ms`);
		//debugger;
		this.inteTimes.startIntegrationTime = performance.now();  // absolute beginning of integrate frame

//		if (shouldIntegrate)
//			this.crunchOneFrame();
		this.inteTimes.startDrawTime = performance.now();

		this.space.mainEAvatar.doRepaint?.();
		this.showTimeNFrame();

		//this.inteTimes.endReloadVarsNBuffer =
		this.inteTimes.endDraw = performance.now();

		this.refreshStatsOnScreen();
		this.inteTimes.prevStartIntegrationTime = this.inteTimes.startIntegrationTime;

		this.continueRunningDiagnosticCycle();
	}

	heartbeatSerial = 0;

	// This gets called once each animation period according to
	// requestAnimationFrame(), usually 60/sec or whatever your screen refresh rate is, and repeats as long as the
	// website is running.  Even if there's no apparent motion. it will advance
	// one heartbeat in animation time, which every so often calls
	// drawLatestFrame(), if appropriate
	animateHeartbeat =
	frameStart => {

		if (traceHeartbeats && ((this.heartbeatSerial & onceInAWhile) == 0))
			console.log(`🎥  a heartbeat, serial every ${onceInAWhile+1}: `
				+`${this.heartbeatSerial} = 0x${this.heartbeatSerial.toString(16)} `
				+ `.isRunning=${this.cPanel.isRunning} \n`
				+`frameStart >= this.timeForNextTic ${frameStart} >= ${this.timeForNextTic} `
				+` = ${frameStart >= this.timeForNextTic} `);

		// no matter how often animateHeartbeat is called, it'll only frame once per framePeriod
		if (this.cPanel.isRunning && frameStart >= this.timeForNextTic) {
			let framePeriod = this.cPanel.framePeriod;

			if (traceIntegrations)
				console.log(`🎥  an integration request serial: ${this.grinder.frameSerial} `);

			this.drawLatestFrame(true);

			// remember (frameStart) is the one passed in, before
			// drawLatestFrame(), so periods are exactly timed (unless it's so slow
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

