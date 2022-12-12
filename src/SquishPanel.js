/*
** squish panel -- like a self-contained quantum system, including space,
** 				waves, and drawings and interactivity.
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
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
import {setFamiliarPotential} from './utils/potentialUtils.js';

import {getASetting, storeASetting} from './utils/storeSettings.js';

// runtime debugging flags - you can change in the debugger or here
let areBenchmarking = false;
let traceTheViewBuffer = false;
let traceSetPanels = false;
let tracePromises = false;
let traceSquishPanel = false;
let traceIteration = false;
//let traceConstructor = false;

//if (typeof storeSettings == 'undefined') debugger;

const DEFAULT_VIEW_CLASS_NAME = 'flatDrawingViewDef';

// iterations always need specific numbers of steps.
const N_EXTRA_STEPS = 1;


// figure out how long requestAnimationFrame()'s period is, in ms
//let rafPeriod = 16.667;
//setTimeout(() => {
//	requestAnimationFrame(time => {
//		let firstTime = time;
//		requestAnimationFrame(time => {
//			rafPeriod = time - firstTime;
//			console.log(`⏱ rafPeriod = ${rafPeriod}  rate=${Math.round(1000/rafPeriod)}`);
//		});
//	});
//}, 10000);  // time for things to settle down

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

			// THE N and continuum for THE space we're currently doing
			// kept between sessions in localStore
			N: getASetting('spaceParams', 'N'),

			continuum: getASetting('spaceParams', 'continuum'),
			mainViewClassName: DEFAULT_VIEW_CLASS_NAME,

			// the eSpace
			space: null,

			// this is controlled by the user (start/stop/step buttons)
			// does not really influence the rendering of the canvas... (other than running)
			//isTimeAdvancing: getASetting('iterationSettings', 'isTimeAdvancing'),

			// this is the actual 'frequency' in actual milliseconds, as set by that menu.
			// convert between like 1000/n
			// eg the menu on the CPToolbar says 10/sec, so this becomes 100
			iteratePeriod: getASetting('iterationSettings', 'iteratePeriod'),

			// defaults for sliders for deltaT & spi
			deltaT: getASetting('iterationSettings', 'deltaT'),
			stepsPerIteration: getASetting('iterationSettings', 'stepsPerIteration'),
			lowPassFilter: getASetting('iterationSettings', 'lowPassFilter'),

			// advance forward with each iter
			// NOT SAME as shown on WaveView!
			runningCycleElapsedTime: 0,
			runningCycleIterateSerial: 0,

			showPotential:  getASetting('potentialSettings', 'showPotential'),

		};

		// ticks and benchmarks
		const now = performance.now();
		this.initStats(now);
		this.timeForNextTic = now + 10;  // default so we can get rolling
		this.lastAniteration = now;

		// stick ?allowRunningOneCycle at the end of URL to show runningOneCycle panel
		// eslint-disable-next-line
		this.allowRunningOneCycle = /allowRunningOneCycle/.test(location.search);

		if (traceSquishPanel) console.log(`SquishPanel constructor done`);
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
			const s = this.state;
			if (tracePromises) console.log(`SquishPanel.compDidMount about to set state`);

			// space will end up in the state but meanwhile we need it now
			this.space = space;
			this.setState({space});

			this.mainEAvatar = space.mainEAvatar;
			this.setDeltaT(s.deltaT);
			//this.mainEAvatar.dt = s.deltaT / (s.stepsPerIteration + N_EXTRA_STEPS);  // always one more!
			this.setStepsPerIteration(s.stepsPerIteration);
			//this.mainEAvatar.stepsPerIteration = s.stepsPerIteration;

			if (tracePromises) console.log(`SquishPanel.compDidMount about to animateHeartbeat`);

			// this should be the only place animateHeartbeat() should be called
			// except for inside the function itself
			this.animateHeartbeat(performance.now());

			this.mainEAvatar?.doRepaint?.();

			if (tracePromises) console.log(`SquishPanel.compDidMount done`);
		})
		.catch(ex => {
			//stackTrace();
			// eslint-disable-next-line no-ex-assign
			ex = interpretCppException(ex);
			if ('from C++: Trying to start a new space when one already exists!' == ex.message) {
				// obnoxious hot reloading; always end up here, so let me reload the right way
				debugger;
				location = location;  // eslint-disable-line no-restricted-globals
				debugger;
				return;  // needed?  no.
			}
			//if (typeof ex == 'object')
			console.error(`error  SquishPanel.didMount.then():`, ex.stack ?? ex.message ?? ex);
			//else console.error(`error  SquishPanel.raw:`, ex);
			//debugger;
		});

	}


//	// puts up the resolution dialog, starting with the values from this.state
//	openResolutionDialog() {
//		const s = this.state;
//
//		// freeze the iteration while this is going on ... but not if relaxing
//		const timeWasAdvancing = s.isTimeAdvancing;
//		this.setState({isTimeAdvancing: false});
//
//		// pass our state upward to load into the dialog
//		ResolutionDialog.openResDialog(
//			// this is the initialParams
//			{N: s.N, continuum: s.continuum, mainViewClassName: s.mainViewClassName},
//
//			// OK callback
//			finalParams => {
//				// let prevLowPassFilter = s.lowPassFilter;
//				// let prevN = s.N;
//				this.setState({mainViewClassName: finalParams.mainViewClassName});
//
//				qe.deleteTheSpace();
//
//				create1DMainSpace({N: finalParams.N, continuum: finalParams.continuum, label: 'main'});
//
//				// do i really have to wait?  I think the promise only works the first time.
//				eSpaceCreatedPromise
//				.then(space => {
//					this.setState({isTimeAdvancing: timeWasAdvancing,
//						N: finalParams.N, continuum: finalParams.continuum});
//					storeASetting('spaceParams', 'N', finalParams.N);
//					storeASetting('spaceParams', 'continuum', finalParams.continuum);
//				});
//
//				//storeASetting('spaceParams', 'N', finalParams.N);
//				//localStorage.space0 = JSON.stringify({N: finalParams.N, continuum: finalParams.continuum});
//				// should also work storeSettings.setSetting('space0.N, finalParams.N);
//				// and storeSettings.setSetting('space0.continuum, finalParams.continuum);
//
//			},  // end of OK callback
//
//			// cancel callback
//			() => {
//				this.setState({isTimeAdvancing: timeWasAdvancing});
//			}
//		);
//	}
//
	/* ******************************************************* stats */

	// the upper left and right numbers
	showTimeNIteration() {
		// need them instantaneously - react is too slow
		document.querySelector('.voNorthWest').innerHTML = this.mainEAvatar.elapsedTime.toFixed(2);
		document.querySelector('.voNorthEast').innerHTML =  this.mainEAvatar.iterateSerial;
	}

	// constructor only calls this (?)
	initStats(now) {
		this.iStats = {
			startIteration: now,
			endCalc: now,
			endReloadVarsNBuffer: now,
			//endReloadInputs: now,
			endDraw: now,
			prevStart: now,
		}
	}

	// update the stats, as displayed in the Integration tab
	refreshStats() {
		const p = this.props;

		// given a stat name, value and precision, display it using oldschool DOM
		function show(cName, ms, nDigits = 2) {
			const el = document.querySelector(`#${p.id}.SquishPanel .ControlPanel .SetIterationTab .${cName}`);
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
		show('iterationCalcTime', st.endCalc - st.startIteration);
		show('reloadVarsNBuffer', st.endReloadVarsNBuffer - st.endCalc);
		show('drawTime', st.endDraw - st.endReloadVarsNBuffer);
//		show('reloadGlInputs', st.endReloadInputs - st.endReloadVarsNBuffer);
//		show('drawTime', st.endDraw - st.endReloadInputs);
		show('totalForIteration', st.endDraw - st.startIteration);
		const period = st.startIteration - st.prevStart;
		show('iterationPeriod', period);
		show('iterationsPerSec', Math.round(1000 / period), 0)
	}

	/* ******************************************************* iteration & animation */

	static divergedBlurb = `Sorry, but your quantum wave diverged!  This isn't your fault; it's a bug or limitation of the mathematical engine - it's just not as accurate as the real thing, and sometimes it just runs off the rails.  Unfortunately, you'll have to start over with a new wave.  Click on the Reset Wave button.`;

	// do one integration iteration
	crunchOneIteration() {
		if (traceIteration) console.log(`SquishPanel. about to iterate`);

		try {
			// hundreds of visscher steps
			this.mainEAvatar?.pleaseIterate();
			//this.mainEAvatar?.oneIteration();
		} catch (ex) {
			ControlPanel.stopIterating();
			// eslint-disable-next-line no-ex-assign
			ex = interpretCppException(ex);
			CommonDialog.openErrorDialog(
				ex.message == 'diverged' ? SquishPanel.divergedBlurb : ex, 'while iterating');
		}

		if (traceIteration) console.log(`SquishPanel. did iterate`);

		if (traceTheViewBuffer)
			this.dumpViewBuffer('SquishPanel. did iterate()');
	}

	// Integrate the ODEs by one 'iteration', or not.  and then display.  or not.
	// called every so often in animateHeartbeat() so it's called as often as the menu setting says
	// so if needsRepaint false or absent, it'll only repaint if an iteration has been done.
	// shouldIterate is often set to isTimeAdvancing, or you can pass in whatever eg for single iteration
	iterateOneIteration(shouldIterate, needsRepaint) {
		if (traceIteration) console.log(`time since last tic: ${performance.now() - this.iStats.startIteration}ms`)
// 		this.endCalc = this.startReloadViewBuffer = this.endReloadVarsNBuffer =
// 			this.endIteration = 0;
		this.iStats.startIteration = performance.now();  // absolute beginning of integrate iteration
		// could be slow.
		if (shouldIterate) {
			this.crunchOneIteration();
			needsRepaint = true;
		}
		this.iStats.endCalc = performance.now();

		// if we need to repaint... if we're iterating, if the view says we have to,
		// or if this is a one shot step
		if (needsRepaint) {
			this.mainEAvatar.doRepaint?.();
			this.showTimeNIteration();

			this.iStats.endReloadVarsNBuffer = this.iStats.endDraw = performance.now();
			//this.iStats.endReloadVarsNBuffer = this.iStats.endReloadInputs = this.iStats.endDraw = performance.now();
		}

		// print out per-iteration benchmarks.  This is now displayed in the Iterate tab.
		if (areBenchmarking) {
			console.log(`times:\n`+
				`iteration calc time:     ${(this.iStats.endCalc - this.iStats.startIteration).toFixed(2)}ms\n`+
				`reloadVarsNBuffer:     ${(this.iStats.endReloadVarsNBuffer - this.iStats.endCalc).toFixed(2)}ms\n`+
				//`reload GL variables:     ${(this.iStats.endReloadInputs - this.iStats.endReloadVarsNBuffer).toFixed(2)}ms\n`+
				`draw:   ${(this.iStats.endDraw - this.iStats.endReloadVarsNBuffer).toFixed(2)}ms\n`+
				`total for iteration:  ${(this.iStats.endDraw - this.iStats.startIteration).toFixed(2)}ms\n` +
				`period since last:  ${(this.iStats.startIteration - this.iStats.prevStart).toFixed(2)}ms\n`);
		}
		this.refreshStats();
		this.iStats.prevStart = this.iStats.startIteration;

		this.continueRunningOneCycle();
	}


	// This gets called once each animation period according to requestAnimationFrame(), usually 60/sec
	// and maintaining that as long as the website is running.  Even if there's no apparent motion.
	// it will advance one heartbeat in animation time, which every so often calls iterateOneIteration()
	animateHeartbeat =
	iterationStart => {
		const s = this.state;

		// no matter how often animateHeartbeat() is called, it'll only iterate once per iteratePeriod
		if (iterationStart >= this.timeForNextTic) {
			// no point in calling it continuously if it's not doing anything
			if (ControlPanel.isTimeAdvancing)
				this.iterateOneIteration(true, true);
			//this.iterateOneIteration(s.isTimeAdvancing, false);

			// remember (iterationStart) is the one passed in, before
			// iterateOneIteration(), so periods are exactly timed (unless it's so slow
			// that we get behind).  Speaking of which, how far behind are we?
			let rightNow = 	performance.now();
			//let itReallyTook = (rightNow - iterationStart) / s.iteratePeriod;

			//// FOR NOW, avoid overlapping heartbeats.  They become recursive and the
			//// browser really slows down, and sometimes crashes
			this.timeForNextTic = rightNow + s.iteratePeriod;
			//this.timeForNextTic = iterationStart + s.iteratePeriod;
		}

		// this is in milliseconds
		const timeSince = iterationStart - this.lastAniteration;
//		if (timeSince < 8) {
//			console.log(` skipping an ani frame cuz we got too much: ${timeSince} ms`)
//			return;  // we might have more than one cycle in here... this should fix it
//		}

		if (isNaN(timeSince)) debugger;
		//console.log(` maintaining the rAF cycle: ${timeSince.toFixed(1)} ms`)
		this.lastAniteration = iterationStart;

		requestAnimationFrame(this.animateHeartbeat);
	}

	/* ******************************************************* runningOneCycle of circular wave*/

	// use for benchmarking with a circular wave.  Will start iteration, and stop after
	// the leftmost state is at its peak.  Then display stats.
	// not used for several months so probably broken somehow.

	// button handler
	startRunningOneCycle =
	() => {
		if (!this.allowRunningOneCycle) return;
		this.runningOneCycle = true;
		this.runningCycleStartingTime = this.mainEAvatar.elapsedTime;
		this.runningCycleStartingSerial = this.mainEAvatar.iterateSerial;
		ControlPanel.startIterating();
	}

	// manage runningOneCycle - called each iteration
	continueRunningOneCycle() {
		if (!this.allowRunningOneCycle) return
		//debugger;
		if (this.runningOneCycle) {
			// get the real compoment of the first (#1) value of the wave
			const real0 = this.state.space.wave[2];

			if (real0 < this.prevReal0) {
				// we're going down - first half of the cycle
				if (this.goingUp) {
					// if we were going up, we've gone just 1 deltaT past the peak.  Good time to stop.
					this.runningOneCycle = false;

					ControlPanel.stopIterating();

					this.setState({
						runningCycleElapsedTime: this.mainEAvatar.elapsedTime - this.runningCycleStartingTime,
						runningCycleIterateSerial: this.mainEAvatar.iterateSerial - this.runningCycleStartingSerial,
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
			<span>total iterations: {s.runningCycleIterateSerial.toFixed(0)} &nbsp;
				elapsed vtime: {s.runningCycleElapsedTime.toFixed(3)} &nbsp;</span>
			<button className='round' onClick={this.startRunningOneCycle}>start running 1 cycle</button>
		</div>
	}

	/* ******************************************************* user settings */
	// iteration params managed from SquishPanel; others managed from ControlPanel
	// can i move these to the control panel?

	// dt is time per step, for the algorithm; deltaT is time per iteration, the user/UI control)
	setDeltaT = deltaT => {
		deltaT = storeASetting('iterationSettings', 'deltaT', deltaT);
		this.setState({deltaT});
		//this.mainEAvatar.dt = deltaT;
		this.mainEAvatar.dt = deltaT / (this.state.stepsPerIteration + N_EXTRA_STEPS);  // always one more!
		//qe.Avatar_setDt(dt);
		//if (typeof storeSettings != 'undefined' && storeSettings.iterationSettings)  // goddamned bug in importing works in constructor
	}

	setStepsPerIteration =
	stepsPerIteration => {
		try {
			if (traceSetPanels) console.log(`js setStepsPerIteration(${stepsPerIteration})`);
			storeASetting('iterationSettings', 'stepsPerIteration', stepsPerIteration);
			this.setState({stepsPerIteration});
			this.mainEAvatar.stepsPerIteration = stepsPerIteration;
		} catch (ex) {
			// eslint-disable-next-line no-ex-assign
			ex = interpretCppException(ex);
			console.error(`setStepsPerIteration error:`,
				ex.stack ?? ex.message ?? ex);
			////debugger;
		}
	}

	// sets the LPF in both SPanel state AND in the C++ area
	setLowPassFilter =
	lowPassFilter => {
		if (traceSetPanels) console.log(`js setLowPassFilter(${lowPassFilter})`)

		let lpf = storeASetting('iterationSettings', 'lowPassFilter', lowPassFilter);
		this.setState({lowPassFilter: lpf});

		// here's where it converts from percent to the C++ style integer number of freqs
		this.mainEAvatar.lowPassFilter = Math.round(lpf / 200 * this.state.N);
		//qe.Avatar_setLowPassFilter(Math.round(lpf / 200 * this.state.N));
	}

	// completely wipe out the quantum potential and replace it with one of our canned patterns.
	// (but do not change N or anything else in the state)  Called upon set potential in potential tab
	setPotential =
	(potentialParams) => {
		// sets the numbers
		setFamiliarPotential(this.state.space, this.state.space.potentialBuffer, potentialParams);
		//this.iterateOneIteration(true, true);  // ???  take this out - jus ttrigger a PotentialArea render

		this.updatePotentialArea();

		// no this doesn't affect the vBuffer
	}

	// potential area needs to be told when the data changes.  can't put the whole potential buffer in the state!
	setUpdatePotentialArea =
	(updatePotentialArea) => {
		this.updatePotentialArea = updatePotentialArea;
	};

	toggleShowPotential =
	ev => {
		this.setState({showPotential: ev.target.checked});
		storeASetting('potentialSettings', 'showPotential', ev.target.checked);
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


	/* ******************************************************* rendering */
	// call this when you change both the GL and iter and elapsed time
	// we need it here in SquishPanel cuz it's often called in ControlPanel but affects WaveView
	redrawWholeMainWave =
	() => {
		let avatar = this.mainEAvatar;

		// trigger redrawing of WaveView cuz they're passed in via props
		avatar.elapsedTime = 0;
		avatar.iterateSerial = 0;

		// directly redraw the GL
		avatar.reStartDrawing();
		avatar.doRepaint();
	}

	//static whyDidYouRender = true;
	render() {
		const p = this.props;
		const s = this.state;
		let avatar = this.mainEAvatar;

		return (
			<div id={this.props.id} className="SquishPanel">
				<WaveView
					viewClassName={s.mainViewClassName}
					viewName='mainView'
					width={p.width}
					elapsedTime={avatar?.elapsedTime ?? 0}
					iterateSerial={avatar?.iterateSerial ?? 0}
					setUpdatePotentialArea={this.setUpdatePotentialArea}
					showPotential={s.showPotential}
				/>
				<ControlPanel
					space={s.space}
					N={this.state.N}

					iterateAnimate={(shouldAnimate, freq) => this.iterateAnimate(shouldAnimate, freq)}

					setPotential={this.setPotential}
					toggleShowPotential={this.toggleShowPotential}
					showPotential={s.showPotential}

					redrawWholeMainWave={this.redrawWholeMainWave}

					iterateFrequency={1000 / s.iteratePeriod}

					deltaT={s.deltaT}
					setDeltaT={this.setDeltaT}
					stepsPerIteration={s.stepsPerIteration}
					setStepsPerIteration={this.setStepsPerIteration}
					lowPassFilter={s.lowPassFilter}
					setLowPassFilter={this.setLowPassFilter}

					iStats={this.iStats}
					refreshStats={this.refreshStats}
				/>
				{this.renderRunningOneCycle()}
			</div>
		);

		// 					{/*setIterateFrequency={freq => this.setIterateFrequency(freq)}*/}
	}
}

export default SquishPanel;
