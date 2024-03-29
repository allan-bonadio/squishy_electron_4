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
import {getASetting} from '../utils/storeSettings.js';

let traceStats = false;
let traceTheViewBuffer = false;
let traceHeartbeats = false;
let traceIntegrations = false;
let traceFramePeriods = false;

const onceInAWhile = 1023;
const everySoOften = 1023;

// rAF should certainly call more often than this many ms
const MAX_rAF_PERIOD =  50;


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

		this.initStats(now);
		this.initAnimationFP();

		// stick ?allowRunningDiagnosticCycle at the end of URL to show runningDiagnosticCycle panel
		// advance forward with each iter.  NOT SAME as shown on WaveView!
		this.runningCycleElapsedTime = 0;
		this.runningCycleIntegrateSerial = 0;
		// eslint-disable-next-line
		this.allowRunningDiagnosticCycle = /allowRunningDiagnosticCycle/.test(location.search);

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

	// elapsed (virtual) picoseconds and frame count: insert them into the HTML.  Faster than react.
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

	// Repaint, with webgl, the waveview.
	drawLatestFrame() {
		if (traceStats) console.log(`time since last tic: ${performance.now()
				- this.inteTimes.startIntegrationTime}ms`);
		//debugger;
		//this.inteTimes.startIntegrationTime = performance.now();  // absolute beginning of integrate frame

//		if (shouldIntegrate)
//			this.crunchOneFrame();
		this.inteTimes.startDrawTime = performance.now();

		this.space.mainEAvatar.doRepaint?.();
		this.showTimeNFrame();

		// update dom elements in integration tab to latest stats
		this.refreshStatsOnScreen();

		//this.inteTimes.endReloadVarsNBuffer =
		this.inteTimes.endDraw = performance.now();

		this.inteTimes.prevStartIntegrationTime = this.inteTimes.startIntegrationTime;

		this.continueRunningDiagnosticCycle();
	}



	/* ************************************************ Frame timing */

	// animationFP = animation frame period, from requestAnimatioFrame().  Depends
	// on video; often 60/sec.  Can change as window moves to different monitor
	// or monitor frame rate changes (settings).
	// targetFP = target (ui) frame period, what user chose from menu
	// integrationFP = frame period of actual calculations; rounded from targetFP
	//     to be an integer factor of animationFP

	// start up all the frame period numbers.  once.
	initAnimationFP() {
		// defaults - will work until set by the real code
		this.animationFP = this.avgAnimationFP = 16.666666;
		this.frameFactor = 3;
		this.prevFrame = performance.now();
		this.unstableFP = true;

		// Start the heartbeat.   This should be the only place rafHandler()
		// should be called except for inside the function itself
		if (traceHeartbeats)
			console.log(`🎥 sAnimator: about to kick off rafHandler`);
		this.rafHandler(performance.now());
	}

	// given new animationFP or anything else changed, or init, refigure
	// everything
	recalcIntegrationFP(newAnimationFP) {
		let targetFP = getASetting('frameSettings', 'framePeriod');

		// how many animationFP in an integrationFP?  This is the FrameFactor
		this.newFrameFactor = Math.round(targetFP / newAnimationFP);

		// for a grand total of...
		this.newIntegrationFP = this.newFrameFactor * newAnimationFP;

		if (traceFramePeriods) console.log(`targetFP=${targetFP}  newAnimationFP=${newAnimationFP} `
			+ ` newFrameFactor=${this.newFrameFactor}   newIntegrationFP=${this.newIntegrationFP}`);
	}

	// we have to measure animationFP in case it changes: user moves window to screen with diff
	// refresh rate, or user changes refresh rate in control panel
	measureAndUpdateFramePeriods(now) {
		let animationFP = now - this.prevFrame;
		this.prevFrame = now;
		//this.rAFPeriod = animationFP;

		// this jiggles around quite a  bit so smooth it.  I think individual
		// calls lag, so long periods come next to short periods, so this
		// averages out pretty well.  And, it's never more than 1/20 sec, unless
		// I'm tinkering in the debugger.
		this.avgAnimationFP  =
			Math.min(MAX_rAF_PERIOD, (animationFP + 3 * this.avgAnimationFP) / 4);

		// IF the frame period changed from recent cycles,
		if (Math.abs(animationFP - this.avgAnimationFP) > 4) {
			// something's changing, let it settle down
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

	}




	// counts off frameFactor raf periods then starts next iteration
	// requestAnmationFrame() (rAF) calls rafHandler(), which increments scanCount up to
	// frameFactor to call triggerIteration().
	scanCount = 0;

	//	This gets called once each animation scan period according to
	//	requestAnimationFrame(), usually 60/sec or whatever your screen refresh
	//	rate is, and repeats as long as the website is running.  Even if there's
	//	no apparent motion.  It will advance frameFactor scan periods, which
	//	often calls drawLatestFrame(), if appropriate.  frameFactor can change
	//	if user changes display scan rate, or the frame rate menu on
	//	CPToolbar, or moves to a screen with a different scan rate.
	rafHandler =
	now => {

		//		if (traceHeartbeats && ((this.heartbeatSerial & onceInAWhile) == 0))
		//			console.log(`🎥  a heartbeat, serial every ${onceInAWhile+1}: `
		//				+`${this.heartbeatSerial} = 0x${this.heartbeatSerial.toString(16)} `
		//				+ `.shouldBeIntegrating=${this.grinder.shouldBeIntegrating} \n`
		//				+`now >= this.timeForNextTic ${now} >= ${this.timeForNextTic} `
		//				+` = ${now >= this.timeForNextTic} `);

		// no matter how often rafHandler is called, it'll only frame once per frameFactor
		if (this.scanCount >= this.frameFactor) {

			if (this.grinder.shouldBeIntegrating) {
				this.grinder.triggerIteration();
				this.needsRepaint = true;
			}

			//if (traceIntegrations)
			//	console.log(`🎥  an integration request serial: ${this.grinder.frameSerial} `);

			if (this.needsRepaint) {
				this.drawLatestFrame();
				this.needsRepaint = false;
			}
			this.scanCount = 0;
		}

		//if (traceHeartbeats && ((this.heartbeatSerial & onceInAWhile) == 0))
		//	console.log(`🎥  a heartbeat, serial every ${onceInAWhile+1}: `
		//		+` ${this.heartbeatSerial} = 0x${this.heartbeatSerial.toString(16)} `
		//		+`.shouldBeIntegrating=${this.grinder.shouldBeIntegrating} time=${(performance.now() & 4095)}`);
		//this.heartbeatSerial++;
		this.scanCount++;

		this.measureAndUpdateFramePeriods(now);

		requestAnimationFrame(this.rafHandler);
	}

	/* *******************************************************  runningDiagnosticCycle of circular wave*/

	// special test code.  orobably broken
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

