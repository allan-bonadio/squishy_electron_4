/*
** squish panel -- like a self-contained quantum system, including space,
** 				waves, and drawings and interactivity.
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

// SquishPanel has a 1:1 relationship with the c++ qSpace.
// the ResolutionDialog changes the initialParams and recreates the qSpace.

import React from 'react';
import PropTypes from 'prop-types';

import ControlPanel from './controlPanel/ControlPanel.js';

import {eSpaceCreatedPromise} from './engine/eEngine.js';

import {interpretCppException} from './utils/errors.js';
import WaveView from './view/WaveView.js';
import CommonDialog from './widgets/CommonDialog.js';

import {getASetting, storeASetting} from './utils/storeSettings.js';
import {tooOldTerminate} from './utils/errors.js';


// runtime debugging flags - you can change in the debugger or here
let traceTheViewBuffer = false;
let tracePromises = false;
let traceSquishPanel = false;
let traceIntegration = false;
let traceIntegrateEssentials = false;
let traceWidth = true;

let verifyTickTimes = true;
let areBenchmarking = false;

const DEFAULT_VIEW_CLASS_NAME = 'flatDrawingViewDef';


export class SquishPanel extends React.Component {
	static propTypes = {
		id: PropTypes.string.isRequired,
		width: PropTypes.number,
	};

	/* ************************************************ construction & reconstruction */
	static squishPanelConstructed = 0;

	constructor(props) {
		super(props);
		SquishPanel.me = this;

		if (SquishPanel.squishPanelConstructed) {
			// should not be called twice!
			console.log(`annoying hot reload; continue to really reload page...`);
			debugger;
			location = location;  // eslint-disable-line no-restricted-globals
		}
		SquishPanel.squishPanelConstructed++;

		this.state = {
			// Many of these things should be in a lower component;
			// don't need to rerender the whole panel just cuz some params changed.

			mainViewClassName: DEFAULT_VIEW_CLASS_NAME,

			// this is controlled by the user (start/stop/step buttons)
			// does not really influence the rendering of the canvas... (other than running)

			//framePeriod: getASetting('frameSettings', 'framePeriod'),

			// advance forward with each iter
			// NOT SAME as shown on WaveView!
			runningCycleElapsedTime: 0,
			runningCycleIntegrateSerial: 0,

			showVoltage:  getASetting('voltageSettings', 'showVoltage'),

		};

		// ticks and benchmarks
		const now = performance.now();
		this.initStats(now);
		this.timeForNextTic = now + 10;  // default so we can get rolling
		this.prevFrameStart = now;

		// this is the actual 'frequency' as a period in milliseconds, as set by that menu.
		// convert between like 1000/n
		// eg the menu on the CPToolbar says 10/sec, so this becomes 100
		// we actually get it from the control panel which is the official rate keeper
		this.framePeriod = getASetting('frameSettings', 'framePeriod');

		// stick ?allowRunningOneCycle at the end of URL to show runningOneCycle panel
		// eslint-disable-next-line
		this.allowRunningOneCycle = /allowRunningOneCycle/.test(location.search);

		if (traceSquishPanel) console.log(`👑 SquishPanel constructor done`);
	}

	// this squishPanelConstructed count will detect hot reloading screwing up the app,
	// but the space dialog also wants to do this.  sigh.
	static anticipateConstruction() {
		SquishPanel.squishPanelConstructed = 0;
	}

	/* ******************************************************* space & wave creation */

	componentDidMount() {
		// upon startup, after C++ says it's ready.
		// why do this in DidMount and not in constructor?  dunno...
		eSpaceCreatedPromise
		.then((space) => {
			//const s = this.state;
			if (tracePromises) console.log(`👑 SquishPanel.compDidMount about to set state`);

			// space will end up in the state but meanwhile we need it now
			this.space = space;
			this.setState({space});

			this.mainEAvatar = space.mainEAvatar;
			this.grinder = space.grinder;
			//this.setDeltaT(s.deltaT);
			//this.setStepsPerFrame(s.stepsPerFrame);

			if (tracePromises) console.log(`👑 SquishPanel.compDidMount about to animateHeartbeat`);

			// this should be the only place animateHeartbeat() should be called
			// except for inside the function itself
			this.animateHeartbeat(performance.now());

			this.mainEAvatar?.doRepaint?.();

			if (tracePromises) console.log(`👑 SquishPanel.compDidMount done`);
		})
		.catch(ex => {
			// eslint-disable-next-line no-ex-assign
			ex = interpretCppException(ex);
			if ('from C++: Trying to start a new space when one already exists!' == ex.message) {
				// obnoxious hot reloading; always end up here, so let me reload the right way
				debugger;
				location = location;  // eslint-disable-line no-restricted-globals
				// never gets here
			}
			console.error(`error  SquishPanel.didMount.then():`, ex.stack ?? ex.message ?? ex);
			debugger;
		});

		// check for obsolescence.  Do this after the dummy SquishPanel appears.
		if (!window.WebAssembly)
			tooOldTerminate('WebAssembly');
		if (!window.Worker)
			tooOldTerminate('WebWorkers');
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
	refreshStats() {
		const p = this.props;

		// given a stat name, value and precision, display it using oldschool DOM
		function show(cName, ms, nDigits = 2) {
			const el = document.querySelector(`#${p.id}.SquishPanel .ControlPanel .SetIntegrationTab .${cName}`);
			if (el) {
				// hard to see if it's jumping around a lot
				if (!el.iStatAvg)
					el.iStatAvg = ms;
				else
					el.iStatAvg = (ms + 31 * el.iStatAvg) / 32;
				el.innerHTML = el.iStatAvg.toFixed(nDigits);  // only if it's showing
			}
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

	/* ******************************************************* frame & animation */

	static divergedBlurb = `Sorry, but your quantum wave diverged!  This isn't your fault; it's a bug or limitation of the mathematical engine - it's just not as accurate as the real thing, and sometimes it just runs off the rails.  Unfortunately, you'll have to start over with a new wave.  Click on the Reset Wave button.`;

	// do one integration frame
	crunchoneIntegration() {
		if (traceIntegration) console.log(`👑 SquishPanel. about to frame`);

		try {
			// hundreds of visscher steps
			this.grinder?.pleaseIntegrate();
		} catch (ex) {
			ControlPanel.stopAnimating();
			// eslint-disable-next-line no-ex-assign
			ex = interpretCppException(ex);
			CommonDialog.openErrorDialog(
				ex.message == 'diverged' ? SquishPanel.divergedBlurb : ex, 'while integrating');
		}

		if (traceIntegration) console.log(`👑 SquishPanel. did frame`);

		if (traceTheViewBuffer)
			this.dumpViewBuffer('SquishPanel. did frame()');
	}

	// the upper left and right numbers: insert them into the HTML.  Faster than react.
	// should move this to like WaveView
	showTimeNIntegration() {
		// need them instantaneously - react is too slow.  but react replaces the whole screen upon error
		let nw = document.querySelector('.voNorthWest')
		if (nw) nw.innerHTML = this.grinder.elapsedTime.toFixed(2);
		let ne = document.querySelector('.voNorthEast')
		if (ne) ne.innerHTML =  this.grinder.frameSerial;
	}

	// Integrate the ODEs by one 'integrate', or not.  and then display.  or not.
	// called every so often in animateHeartbeat() so it's called as often as the menu setting says
	// so if needsRepaint false or absent, it'll only repaint if frame has been done.
	// shouldIntegrate is often set to isTimeAdvancing, or you can pass in whatever eg for single frame
	integrateOneFrame(shouldIntegrate, needsRepaint) {
		if (traceIntegration) console.log(`time since last tic: ${performance.now() - this.iStats.startIntegration}ms`)
// 		this.endCalc = this.startReloadViewBuffer = this.endReloadVarsNBuffer =
// 			this.endIntegration = 0;
		this.iStats.startIntegration = performance.now();  // absolute beginning of integrate frame
		// could be slow.
		if (shouldIntegrate) {
			this.crunchoneIntegration();
			needsRepaint = true;
		}
		this.iStats.endCalc = performance.now();

		// if we need to repaint... if we're integrating, if the view says we have to,
		// or if this is a one shot step
		if (needsRepaint) {
			this.mainEAvatar.doRepaint?.();
			this.showTimeNIntegration();

			this.iStats.endReloadVarsNBuffer = this.iStats.endDraw = performance.now();
		}

		// print out per-frame benchmarks.  This is now displayed in the Integrate tab.
		if (areBenchmarking) {
			console.log(`times:\n`+
				`frame calc time:     ${(this.iStats.endCalc - this.iStats.startIntegration).toFixed(2)}ms\n`+
				`reloadVarsNBuffer:     ${(this.iStats.endReloadVarsNBuffer - this.iStats.endCalc).toFixed(2)}ms\n`+
				//`reload GL variables:     ${(this.iStats.endReloadInputs - this.iStats.endReloadVarsNBuffer).toFixed(2)}ms\n`+
				`draw:   ${(this.iStats.endDraw - this.iStats.endReloadVarsNBuffer).toFixed(2)}ms\n`+
				`total for frame:  ${(this.iStats.endDraw - this.iStats.startIntegration).toFixed(2)}ms\n` +
				`period since last:  ${(this.iStats.startIntegration - this.iStats.prevStartIntegration).toFixed(2)}ms\n`);
		}
		this.refreshStats();
		this.iStats.prevStartIntegration = this.iStats.startIntegration;

		this.continueRunningOneCycle();
	}


	// This gets called once each animation period according to requestAnimationFrame(), usually 60/sec
	// and maintaining that as long as the website is running.  Even if there's no apparent motion.
	// it will advance one heartbeat in animation time, which every so often calls integrateOneFrame()
	animateHeartbeat =
	frameStart => {
		if (verifyTickTimes) {
			if (!isFinite(this.timeForNextTic)) debugger;
			if (!isFinite(frameStart)) debugger;
			if (!isFinite(this.timeForNextTic)) debugger;
		}

		// no matter how often animateHeartbeat() is called, it'll only frame once per framePeriod
		if (frameStart >= this.timeForNextTic) {
			// no point in calling it continuously if it's not doing anything
			if (ControlPanel.isTimeAdvancing)
				this.integrateOneFrame(true, true);

			// remember (frameStart) is the one passed in, before
			// integrateOneFrame(), so periods are exactly timed (unless it's so slow
			// that we get behind).  Speaking of which, how far behind are we?
			let rightNow = 	performance.now();
			if (!isFinite(rightNow)) debugger;

			//// FOR NOW, avoid overlapping heartbeats.  They become recursive and the
			//// browser really slows down, and sometimes crashes
			this.timeForNextTic = rightNow + this.framePeriod;
			//this.timeForNextTic = rightNow + s.framePeriod;
			if (verifyTickTimes) {
				if (!isFinite(this.timeForNextTic)) debugger;
				if (!isFinite(this.framePeriod)) debugger;
			}
			if (traceIntegrateEssentials && ((this.grinder.frameSerial & 255) == 0))
				console.info(`the frame period: ${this.framePeriod}  serial: ${this.grinder.frameSerial} `);
		}

		// this is in milliseconds
		const timeSince = frameStart - this.prevFrameStart;
//		if (timeSince < 8) {
//			console.log(` skipping an ani frame cuz we got too much: ${timeSince} ms`)
//			return;  // we might have more than one cycle in here... this should fix it
//		}

		if (isNaN(timeSince)) debugger;
		this.prevFrameStart = frameStart;

		requestAnimationFrame(this.animateHeartbeat);
	}

	/* *******************************************************  OneCycle of circular wave*/

	// use for benchmarking with a circular wave.  Will start frame, and stop after
	// the leftmost state is at its peak.  Then display stats.
	// not used for several months so probably broken somehow.

	// button handler
	startRunningOneCycle =
	() => {
		if (!this.allowRunningOneCycle) return;
		this.runningOneCycle = true;
		this.runningCycleStartingTime = this.grinder.elapsedTime;
		this.runningCycleStartingSerial = this.grinder.frameSerial;
		ControlPanel.startAnimating();
	}

	// manage runningOneCycle - called each frame
	continueRunningOneCycle() {
		if (!this.allowRunningOneCycle) return
		if (this.runningOneCycle) {
			// get the real compoment of the first (#1) value of the wave
			const real0 = this.state.space.wave[2];

			if (real0 < this.prevReal0) {
				// we're going down - first half of the cycle
				if (this.goingUp) {
					// if we were going up, we've gone just 1 deltaT past the peak.  Good time to stop.
					this.runningOneCycle = false;

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

	renderRunningOneCycle() {
		if (!this.allowRunningOneCycle) return '';
		const s = this.state;

		// you can turn this on in the debugger anytime
		return <div className='runningOneCycle' style={{display: 'block'}}>
			<span>total frames: {s.runningCycleIntegrateSerial.toFixed(0)} &nbsp;
				elapsed vtime: {s.runningCycleElapsedTime.toFixed(3)} &nbsp;</span>
			<button className='round' onClick={this.startRunningOneCycle}>start running 1 cycle</button>
		</div>
	}

	/* ******************************************************* user settings */
	// others managed from ControlPanel
	// can i move these to the control panel?

	toggleShowVoltage =
	ev => {
		this.setState({showVoltage: ev.target.checked});
		storeASetting('voltageSettings', 'showVoltage', ev.target.checked);
	}

	// dump the view buffer, from the JS side.  Why not use the C++ version?
	dumpViewBuffer(title = '') {
		const s = this.state;
		let nRows = s.space.nPoints * 2;
		let vb = s.space.mainVBuffer;
		const _ = (f) => f.toFixed(3).padStart(6);
		console.log(`dump of view buffer '${title}' for ${s.space.nPoints} points in ${nRows} rows`);
		for (let i = 0; i < nRows; i++)
			console.log(_(vb[i*4]), _(vb[i*4+1]), _(vb[i*4+2]), _(vb[i*4+3]));
	}

	// get this from the control panel every time user changes it
	setFramePeriod =
	(period) => this.framePeriod = period;
//	(period) => this.setState({framePeriod: period},
//		() => console.log(`frame period is now set to ${this.state.framePeriod}`));

	/* ******************************************************* rendering */
	// call this when you change both the GL and iter and elapsed time
	// we need it here in SquishPanel cuz it's often called in ControlPanel but affects WaveView
	redrawWholeMainWave =
	() => {
		let avatar = this.mainEAvatar;
		let grinder = this.grinder;

		// trigger redrawing of WaveView cuz they're passed in via props
		grinder.elapsedTime = 0;
		grinder.frameSerial = 0;

		// directly redraw the GL
		avatar.reStartDrawing();
		avatar.doRepaint();
	}

	render() {
		const p = this.props;
		const s = this.state;

		if (traceWidth) console.log(`👑 SquishPanel render, p.width=${p.width}  body.clientWidth=${document.body.clientWidth}`);

		//setUpdateVoltageArea={this.setUpdateVoltageArea}
		//populateFamiliarVoltage={this.populateFamiliarVoltage}
		return (
			<div id={this.props.id} className="SquishPanel">
				<WaveView
					width={p.width}
					space={this.space}
					showVoltage={s.showVoltage}
				/>
				<ControlPanel
					frameAnimate={(shouldAnimate, freq) => this.frameAnimate(shouldAnimate, freq)}

					setFramePeriod={this.setFramePeriod}

					toggleShowVoltage={this.toggleShowVoltage}
					showVoltage={s.showVoltage}

					redrawWholeMainWave={this.redrawWholeMainWave}

					iStats={this.iStats}
					refreshStats={this.refreshStats}
				/>
				{this.renderRunningOneCycle()}
			</div>
		);

		// 					{/*setFrameFrequency={freq => this.setFrameFrequency(freq)}*/}
//							frameFrequency={1000 / s.framePeriod}
//					setFrameFrequency={freq => this.setFrameFrequency(freq)}


	}
}

export default SquishPanel;
