/*
** squish panel -- like a self-contained quantum system, including space,
** 				waves, and drawings and interactivity.
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

// SquishPanel has a 1:1 relationship with the c++ qSpace.
// the ResolutionDialog changes the initialParams and recreates the qSpace.

import React from 'react';
import PropTypes from 'prop-types';

import ControlPanel from './controlPanel/ControlPanel';

// eslint-disable-next-line no-unused-vars
import {eSpace} from './engine/eSpace';
// import eWave from './engine/eWave';
import {create1DMainSpace, eSpaceCreatedPromise} from './engine/eEngine';


import {interpretCppException} from './utils/errors';
//import {interpretCppException, dumpJsStack} from './utils/errors';

import qe from './engine/qe';

import WaveView from './view/WaveView';
import ResolutionDialog from './controlPanel/ResolutionDialog';
import {setFamiliarPotential} from './utils/potentialUtils';

// why doesn't this work?!?!!?
//import {storeSettings} from './utils/storeSettings';
//import storeSettings from './utils/storeSettings';
import {getASetting, storeASetting} from './utils/storeSettings';

// runtime debugging flags - you can change in the debugger or here
let areBenchmarking = false;
let dumpingTheViewBuffer = false;
let traceSetPanels = false;
let tracePromises = false;
let traceSquishPanel = false;
//let traceConstructor = false;

if (typeof storeSettings == 'undefined') debugger;

const DEFAULT_VIEW_CLASS_NAME = 'flatDrawingViewDef';

window.squishPanelConstructed = 0;

export class SquishPanel extends React.Component {
	static propTypes = {
		//token: PropTypes.number,
		id: PropTypes.string.isRequired,
		width: PropTypes.number,
	};

	/* ************************************************ construction & reconstruction */

	constructor(props) {
		super(props);

		if (window.squishPanelConstructed) {
			// should not be called twice!
			console.log(`annoying hot reload; continue to really reload page...`);
			debugger;
			location = location;  // eslint-disable-line no-restricted-globals
		}
		window.squishPanelConstructed++;

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

			// see the view dir, this is for the viewDef instance.  Created in GLView
			//effectiveView: null,

			// this is controlled by the user (start/stop/step buttons)
			// does not really influence the rendering of the canvas... (other than running)
			isTimeAdvancing: getASetting('iterationParams', 'isTimeAdvancing'),

			// this is the actual 'frequency' in actual milliseconds, as set by that menu.
			// convert between like 1000/n
			// eg the menu on the CPToolbar says 10/sec, so this becomes 100
			iteratePeriod: getASetting('iterationParams', 'iteratePeriod'),

			// defaults for sliders for dt & spi
			dt: getASetting('iterationParams', 'dt'),
			stepsPerIteration: getASetting('iterationParams', 'stepsPerIteration'),
			lowPassFilter: getASetting('iterationParams', 'lowPassFilter'),

			// advance forward with each iter
			// NOT SAME as shown on WaveView!
			runningCycleElapsedTime: 0,
			runningCycleIterateSerial: 0,
		};

		// will be resolved when the space has been created; result will be eSpace.
		// this requires C++ to have started up.
		//this.createdSpacePromise = new Promise((succeed, fail) => {
		//	//this.createdSpace = succeed;
		//	if (tracePromises) console.log(`SquishPanel:  eSpaceCreatedPromise created:`, succeed, fail);
		//});

		// ticks and benchmarks
		const now = performance.now();
		this.initStats(now);
		this.timeForNextTic = now + 10;  // default so we can get rolling
		this.lastAniIteration = now;

		// stick ?allowRunningOneCycle at the end of URL to show runningOneCycle panel
		// eslint-disable-next-line
		this.allowRunningOneCycle = /allowRunningOneCycle/.test(location.search);

		if (traceSquishPanel) console.log(`SquishPanel constructor done`);
	}

	// NO!  get these from the avatar  working with GLView, it'll pass me back some functions
	// Just for the main avatar
	//returnGLFuncs =
	//(doRepaint, resetWave, setGeometry) => {
	//	this.doRepaint = doRepaint;
	//	this.resetWave = resetWave;
	//	this.setGeometry = setGeometry;
	//}


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
			this.mainEAvatar.dt = s.dt;
			this.mainEAvatar.stepsPerIteration = s.stepsPerIteration;

			if (tracePromises) console.log(`SquishPanel.compDidMount about to animateHeartbeat`);

			// this should be the only place animateHeartbeat() should be called
			// except for inside the function itself
			this.animateHeartbeat(performance.now());

			this.mainEAvatar?.doRepaint?.();

			if (tracePromises) console.log(`SquishPanel.compDidMount done`);
		})
		.catch(ex => {
			//stackTrace();
			ex = interpretCppException(ex);
			if ('from C++: Trying to start a new space when one already exists!' == ex.message) {
				// obnoxious hot reloading
				debugger;
				location = location;  // eslint-disable-line no-restricted-globals
				debugger;
				return;  // needed?
			}
			//if (typeof ex == 'object')
			console.error(`error  SquishPanel.didMount.then():`, ex.stack || ex.message || ex);
			//else console.error(`error  SquishPanel.raw:`, ex);
			//debugger;
		});

	}


	//setEffectiveView =
	//view => {
	//	this.effectiveView = view;
	//	this.setState({effectiveView: view})
	//}

	// init or re-init the space and the panel
	//setNew1DResolution(N, continuum) {
	//
	//	// usually this is the initial space created
	//	const space = new eSpace([{N, continuum, label: 'x'}]);
	//	this.setState({space});
	//	this.space = space;
	//
	//	this.mainEAvatar = space.mainEAvatar;
	//	return space;
	//}

	// puts up the resolution dialog, starting with the values from this.state
	openResolutionDialog() {
		const s = this.state;

		// freeze the iteration while this is going on ... but not if relaxing
		const timeWasAdvancing = s.isTimeAdvancing;
		this.setState({isTimeAdvancing: false});

		// pass our state upward to load into the dialog
		ResolutionDialog.openResDialog(
			// this is the initialParams
			{N: s.N, continuum: s.continuum, mainViewClassName: s.mainViewClassName},

			// OK callback
			finalParams => {
				// let prevLowPassFilter = s.lowPassFilter;
				// let prevN = s.N;
				this.setState({mainViewClassName: finalParams.mainViewClassName});

				qe.deleteTheSpace();

				create1DMainSpace({N: finalParams.N, continuum: finalParams.continuum, label: 'main'});

				// do i really have to wait?  I thiink the promise only works the first time.
				eSpaceCreatedPromise
				.then(space => {
					this.setState({isTimeAdvancing: timeWasAdvancing,
						N: finalParams.N, continuum: finalParams.continuum});
					storeASetting('spaceParams', 'N', finalParams.N);
					storeASetting('spaceParams', 'continuum', finalParams.continuum);
				});

				//storeASetting('spaceParams', 'N', finalParams.N);
				//localStorage.space0 = JSON.stringify({N: finalParams.N, continuum: finalParams.continuum});
				// should also work storeSettings.setSetting('space0.N, finalParams.N);
				// and storeSettings.setSetting('space0.continuum, finalParams.continuum);

			},  // end of OK callback

			// cancel callback
			() => {
				this.setState({isTimeAdvancing: timeWasAdvancing});
			}
		);
	}

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

	// do one integration iteration
	crunchOneIteration() {
		if (traceSquishPanel) console.log(`SquishPanel. about to iterate`);

		// (actually many visscher steps)
		this.mainEAvatar.oneIteration();

		if (traceSquishPanel) console.log(`SquishPanel. did iterate`);



		if (dumpingTheViewBuffer)
			this.dumpViewBuffer('SquishPanel. did iterate()');
	}

	// Integrate the ODEs by one 'iteration', or not.  and then display.
	// called every so often in animateHeartbeat() so it's called as often as the menu setting says
	// so if needsRepaint false or absent, it'll only repaint if an iteration has been done.
	iterateOneIteration(isTimeAdvancing, needsRepaint) {
		if (traceSquishPanel) console.log(`time since last tic: ${performance.now() - this.iStats.startIteration}ms`)
// 		this.endCalc = this.startReloadViewBuffer = this.endReloadVarsNBuffer =
// 			this.endIteration = 0;
		this.iStats.startIteration = performance.now();  // absolute beginning of integrate iteration
		// could be slow.
		if (isTimeAdvancing) {
			this.crunchOneIteration();
			needsRepaint = true;
		}
		this.iStats.endCalc = performance.now();

		// if we need to repaint... if we're iterating, if the view says we have to,
		// or if this is a one shot step
		this.iStats.endReloadVarsNBuffer = this.iStats.endDraw = performance.now();
		//this.iStats.endReloadVarsNBuffer = this.iStats.endReloadInputs = this.iStats.endDraw = performance.now();
		if (needsRepaint) {
			this.mainEAvatar.doRepaint();
			this.showTimeNIteration();


			// this is kinda cheating, but the effectiveView in the state takes some time to
			// get set; but we need it immediately.  So we also set it as a variable on this.
			// see similar code below; keep in sync.  Also, early on, it might not be done at all yet.
//			const curView = this.effectiveView || this.state.effectiveView;
//			if (curView) {
////				curView.reloadAllVariables();
////
////				// copy from latest wave to view buffer (c++)
////				qe.qViewBuffer_getViewBuffer();
////				this.iStats.endReloadVarsNBuffer = performance.now();
////
////				curView.createVariablesOnDrawings();
////				//this.iStats.endReloadInputs = performance.now();
////
////				// draw
////				curView.drawAllDrawings();
////
////				// populate the frame number and elapsed pseudo-time
////				this.showTimeNIteration();
////				this.iStats.endDraw = performance.now();
//			}
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
	now => {
		const s = this.state;

		// no matter how often animateHeartbeat() is called, it'll only iterate once in the iteratePeriod
		if (now >= this.timeForNextTic) {
			// no point in calling it continuously if it's not doing anything
			if (s.isTimeAdvancing)
				this.iterateOneIteration(true, true);
			//this.iterateOneIteration(s.isTimeAdvancing, false);

			// remember (now) is the one passed in, before iterateOneIteration(),
			// so periods are exactly timed (unless it's so slow that we get behind)
			this.timeForNextTic = now + s.iteratePeriod;
		}

		// this is in milliseconds
		const timeSince = now - this.lastAniIteration;
//		if (timeSince < 8) {
//			console.log(` skipping an ani frame cuz we got too much: ${timeSince} ms`)
//			return;  // we might have more than one cycle in here... this should fix it
//		}

		if (isNaN(timeSince)) debugger;
		//console.log(` maintaining the ReqAniFra cycle: ${timeSince.toFixed(1)} ms`)
		this.lastAniIteration = now;

		requestAnimationFrame(this.animateHeartbeat);
	}

	/* ******************************************************* runningOneCycle */

	// use for benchmarking with a circular wave.  Will start iteration, and stop after
	// the leftmost state is at its peak.  Then display stats.

	// button handler
	startRunningOneCycle =
	() => {
		if (!this.allowRunningOneCycle) return;
		this.runningOneCycle = true;
		this.runningCycleStartingTime = this.mainEAvatar.elapsedTime;
		this.runningCycleStartingSerial = this.mainEAvatar.iterateSerial;
		this.startIterating();
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
					// if we were going up, we've gone just 1 dt past the peak.  Good time to stop.
					this.runningOneCycle = false;

					this.stopIterating();

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
			<button onClick={this.startRunningOneCycle}>start running 1 cycle</button>
		</div>
	}

	/* ******************************************************* control panel settings */

	// set the frequency of iteration frames.  Does not control whether iterating or not.
	setIterateFrequency(newFreq) {
		this.setState({iteratePeriod:
			storeASetting('iterationParams', 'iteratePeriod', 1000. / +newFreq)
		});
	}

	startIterating() {
		if (this.state.isTimeAdvancing)
			return;

		storeASetting('iterationParams', 'isTimeAdvancing', true);
		this.setState({isTimeAdvancing: true});
	}

	stopIterating() {
		if (!this.state.isTimeAdvancing)
			return;

		storeASetting('iterationParams', 'isTimeAdvancing', false);
		this.setState({isTimeAdvancing: false});
	}

	startStop =
	() => {
		if (this.state.isTimeAdvancing)
			this.stopIterating();
		else
			this.startIterating();
	}

	singleIteration =
	() => {
		this.iterateOneIteration(true);
	}

	resetCounters =
	(ev) => {
		this.mainEAvatar.elapsedTime = 0;
		this.mainEAvatar.iterateSerial = 0;
		this.showTimeNIteration();
	}

	/* ******************************************************* user settings */

	setDt = dt => {
		this.setState({dt});
		this.mainEAvatar.dt = dt;
		//qe.Avatar_setDt(dt);
		//if (typeof storeSettings != 'undefined' && storeSettings.iterationParams)  // goddamned bug in importing works in constructor
		let ddtt = storeASetting('iterationParams', 'dt', dt);
		this.setState({dt: ddtt});
	}

	setStepsPerIteration =
	stepsPerIteration => {
		try {
			if (traceSetPanels) console.log(`js setStepsPerIteration(${stepsPerIteration})`);
			//if (typeof storeSettings != 'undefined' && storeSettings.iterationParams)  // goddamned bug in importing works in constructor
			storeASetting('iterationParams', 'stepsPerIteration', stepsPerIteration);
			this.setState({stepsPerIteration});
			this.mainEAvatar.stepsPerIteration = stepsPerIteration;
		} catch (ex) {
			let exc = interpretCppException(ex);
			console.error(`setStepsPerIteration error:`,
				exc.stack || exc.message || exc);
			////debugger;
		}
	}

	// sets the LPF in both SPanel state AND in the C++ area
	setLowPassFilter =
	lowPassFilter => {
		if (traceSetPanels) console.log(`js setLowPassFilter(${lowPassFilter})`)

		let lpf = storeASetting('iterationParams', 'lowPassFilter', lowPassFilter);
		this.setState({lowPassFilter: lpf});

		// here's where it converts from percent to the C++ style integer number of freqs
		this.mainEAvatar.lowPassFilter = Math.round(lpf / 200 * this.state.N);
		//qe.Avatar_setLowPassFilter(Math.round(lpf / 200 * this.state.N));
	}

	// obsolete
	// completely wipe out the 𝜓 wavefunction and replace it with one of our familiar waveforms.
	// (but do not change N or anything in the state)  Called upon setWave in wave tab
//	setWave =
//	waveParams => {
//// 		const wave = qe.Avatar_getWaveBuffer();
//		const mainEWave = this.state.space.mainEWave;
//		mainEWave.setFamiliarWave(waveParams);  // eSpace does this initially
//		//this.iterateOneIteration(true, true);  // ?? take  this out this was to kick to display it....
//		//this.iterateOneIteration(false, true);
//		//qe.qViewBuffer_getViewBuffer();
//		//qe.createQEWaveFromCBuf();
//		//qe.Avatar_resetCounters();
//		this.mainEAvatar.elapsedTime = 0;
//		this.mainEAvatar.iterateSerial = 0;
//
//		// this is wired into the GLView and its drawers
//		this.mainEAvatar.resetWave();
//		//const curView = this.effectiveView || this.state.effectiveView;
//		//curView.drawings.forEach(dr =>  dr.resetAvgHighest && dr.resetAvgHighest());
//
//		// don't have to set storeSettings cuz already done in CP
//	}

	// completely wipe out the quantum potential and replace it with one of our canned waveforms.
	// (but do not change N or anything in the state)  Called upon set potential in potential tab
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

	//static whyDidYouRender = true;
	render() {
		const p = this.props;
		const s = this.state;

		return (
			<div id={this.props.id} className="SquishPanel">
				{/*innerWindowWidth={s.innerWindowWidth}/>*/}
				<WaveView
					viewClassName={s.mainViewClassName}
					viewName='mainView'
					width={p.width}
					setUpdatePotentialArea={this.setUpdatePotentialArea}
				/>
				<ControlPanel
					openResolutionDialog={() => this.openResolutionDialog()}
					space={s.space}
					N={this.state.N}

					iterateAnimate={(shouldAnimate, freq) => this.iterateAnimate(shouldAnimate, freq)}
					isTimeAdvancing={s.isTimeAdvancing}
					startStop={this.startStop}
					singleIteration={this.singleIteration}
					resetCounters={this.resetCounters}

					setPotential={this.setPotential}

					iterateFrequency={1000 / s.iteratePeriod}
					setIterateFrequency={freq => this.setIterateFrequency(freq)}

					dt={s.dt}
					setDt={this.setDt}
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
	}
}

export default SquishPanel;

