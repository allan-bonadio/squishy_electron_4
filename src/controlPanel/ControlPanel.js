/*
** Control Panel -- all the widgets below the displayed canvas
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';

import './ControlPanel.scss';
import CPToolbar from './CPToolbar.js';
import SetWaveTab from './SetWaveTab.js';
import SetVoltageTab from './SetVoltageTab.js';
import SetResolutionTab from './SetResolutionTab.js';
import SetIntegrationTab from './SetIntegrationTab.js';
import CxRainbowTab from './CxRainbowTab.js';
import {getASetting, storeASetting, getAGroup, storeAGroup} from '../utils/storeSettings.js';
import {eSpaceCreatedPromise} from '../engine/eEngine.js';
import qeFuncs from '../engine/qeFuncs.js';
import qeConsts from '../engine/qeConsts.js';
import {interpretCppException, wrapForExc} from '../utils/errors.js';
import SquishContext from '../sPanel/SquishContext.js';

let traceSetPanels = false;
let traceBeginFinish = false;
let traceContext = false;
let traceQuickDtFactor = false;

// integrations always need specific numbers of steps.  But there's always one
// more. maybe this should be defined in the grinder.  Hey, isn't this really
// 1/2 step?  cuz it's always dt/2
const N_EXTRA_STEPS = 0.5;

export class ControlPanel extends React.Component {
	static propTypes = {

		resetAndRepaintMainWave: PropTypes.func.isRequired,
		//rerenderWholeMainVoltage: PropTypes.func.isRequired,

		// the integration statistics shown in the Integration tab (there's several more fields)
		iStats: PropTypes.shape({
			startIntegrationTime: PropTypes.number.isRequired,
			totalDrawTime: PropTypes.number.isRequired,
		}),

		// sAnimator
		animator: PropTypes.object,

		setShouldBeIntegrating: PropTypes.func.isRequired,
	}

	constructor(props) {
		super(props);
		checkPropTypes(ControlPanel.propTypes, props, 'prop', this.constructor.name);
		//this.nFramesToGo = -1;

		// most of the state is kept here.  But, also, in the store settings for the next page reload.
		this.state = {
			// each of these params changes the state; here they are individually
			...getAGroup('waveParams'),
			...getAGroup('voltageParams'),
			...getAGroup('voltageSettings'),
			//...getAGroup('lapSettings'),

			// official dtFactor here in the state.  quick one on this.
			dtFactor: getASetting('lapSettings', 'dtFactor'),
			showingTab: getASetting('miscSettings', 'showingTab'),
		}

		this.quickDtFactor = this.state.dtFactor;

		// we can't init some stuff till we get the space.  But we also can't until
		// this constructor runs.
		eSpaceCreatedPromise.then(space => {
			this.handleSpacePromise(space);
		})
		.catch(rex => {
			let ex = interpretCppException(rex);
			console.error(ex.stack ?? ex.message ?? ex);
			debugger;
		});
	}

	setUpContext() {
		if (!this.context) {
			// not ready yet so try again
			setTimeout(this.setUpContext, 100);
			debugger;
			return;
		}
		let cp = this.context.controlPanel;
		if (cp && cp.beginAnimating)
			return;  // already done

		// new cp object
		cp = {
			beginAnimating: this.beginAnimating,
			finishAnimating: this.finishAnimating,
			startStop: this.startStop,
			startRunning: this.startRunning,
			stopRunning: this.stopRunning,
			//startSingleFrame: this.startSingleFrame,
		}

		this.props.setCPContext(cp);

		if (traceContext) {
			const ctx = this.context;
			console.log(`🎛️  ControlPanel setUpContext context: `,
				`  shouldBeIntegrating={ctx?.shouldBeIntegrating}  `,
				`  controlPanel=`, ctx?.controlPanel,
				`  waveView=`, ctx?.waveView);
		}
	}

	// we need a surprising amount of stuff from the space.  We can't draw much without it.
	// So this gets called when it's ready.
	handleSpacePromise(space) {
		this.space = space;
		this.N = space.N;
		//this.mainAvatar = space.mainAvatar;
		this.mainFlick = space.mainFlick;

		this.grinder = space.grinder;
		this.grinder.stretchedDt = this.state.dtFactor * this.space.refDt;


		this.setUpContext();

		// context is the RIGHT way to do it, but sometimes the context changes
		// take until the next cycle (?)
		if (this.context.shouldBeIntegrating)
			this.beginAnimating();

		this.setQuickDtFactor(this.state.dtFactor);

		if (traceBeginFinish) {
			// Note: the state won't kick in until next render
			console.log(`🎛️ ControlPanel constructor & context initialized with space, `
			+` ctx.shouldBeIntegrating=${this.context.shouldBeIntegrating}, `
			+` gr.shouldBeIntegrating=${this.grinder.shouldBeIntegrating}, `
			+` isIntegrating=${this.grinder.isIntegrating}   ctx.cp: `
			+ `dtFactor=${this.state.dtFactor} * refDt=${this.space.refDt} `,
			this.context.controlPanel);
		}
	}

	static contextType = SquishContext;



	/* ************************************************* shouldBeIntegrating */
	// sbi is kept in the context, AND in the grinder.  Not in this component's state.

	// the central authority as to whether we're animating/integrating
	// or not is SquishPanel.state.shouldBeIntegrating Change the status by
	// calling start/stop animating functions here. the C++ will copy it
	// to isIntegrating at the right  time
	// ev is optional and only for the trace msg
	beginAnimating =
	(ev) => {
		if (!this.space) return;  // too early.  mbbe should gray out the button?

		if (traceBeginFinish)
			console.log(`🎛️ beginAnimating starts, triggering iteration, `, ev);
		this.props.setShouldBeIntegrating(true);

		if (traceBeginFinish) {
			console.log(`🎛️ ControlPanel BeginAnimating,`
			+` ctx.shouldBeIntegrating=${this.context.shouldBeIntegrating}, `
			+` gr.shouldBeIntegrating=${this.grinder.shouldBeIntegrating}, `
			+`isIntegrating=${this.grinder.isIntegrating}   `);

			console.log(`🎛️  this.context=`, this.context, `  props.context=`, this.props.context, `  equal?`,
				this.context == this.props.context);
		}

	}

	// ev is optional and only for the trace msg
	finishAnimating =
	(ev) => {
		if (!this.space) return;  // too early.  mbbe should gray out the button?

		// set it false as you store it in store; then set state.  The threads will figure it out next iteration
		this.props.setShouldBeIntegrating(false);
		//this.props.animator.nFramesToGo = 0;
		if (traceBeginFinish) console.log(`🎛️ ControlPanel FINISH Animating, `
			+`ctx.shouldBeIntegrating=${this.context.shouldBeIntegrating}, `
			+` gr.shouldBeIntegrating=${this.grinder.shouldBeIntegrating}, `
			+`grinder.isIntegrating=${this.grinder.isIntegrating}   , `, ev);
	}

	// if shouldBeIntegrating is true (is integrating), turn it off
	// if false, turn it on.  Therefore, toggle it.  Note no argument.
	startStop =
	ev => {
		if (this.context.shouldBeIntegrating)
			this.finishAnimating();
		else
			this.beginAnimating();
	}

	// the |> button.
	startRunning =
	ev => {
		beginAnimating(ev);
	}

	stopRunning =
	ev => {
		finishAnimating(ev);
	}

	/* ************************************************* dtFactor */

	// the 'quick' dtFactor is only stored in our this.quickDtFactor,
	// for the user pushing on tortoise & hare buttons
	getQuickDtFactor = () => {
		if (traceQuickDtFactor) console.log(`getQuickDtFactor: `, this.quickDtFactor);
		return this.quickDtFactor;
	}

	// dtFactor we multiply on to get stretchedDt = effective dt, ready to use.
	// This function changes dtFactor quickly for interactive feedback, but doesn't store in the state or local storage
	setQuickDtFactor = (quickDtFactor) => {
		if (traceQuickDtFactor)
			console.log(`🎛️  setQuickDtFactor*k starts:   old: ${this.quickDtFactor * 1000} `
				+`  new: ${quickDtFactor * 1000}   stretchedDt=${quickDtFactor * this.space.refDt}`);
		if (this.quickDtFactor == quickDtFactor)
			return;
		this.quickDtFactor = quickDtFactor;
		this.grinder.stretchedDt = quickDtFactor * this.space.refDt;
		this.setState({dtFactor: quickDtFactor});  // do this so rerenders
		this.displayDtFactor(quickDtFactor);
		if (traceQuickDtFactor)
			console.log(`🎛️ setQuickDtFactor finishes: `
				+` refDt = ${this.space.refDt} `
				+`  quickDtFactor= ${quickDtFactor} `
				+` stretchedDt=${this.grinder.stretchedDt}`)
	}

	// called after the mouseUp event, to save the dtFactor permanently.
	// arrow function saveDFactor(dtFactor) dtfactor is the arg and quickDtFactor is def
	saveDtFactor = (dtFactor) => {
		// i'll get it one way or another
		if (!dtFactor) dtFactor = this?.quickDtFactor || _this?.quickDtFactor;
		if (!dtFactor) dtFactor = this?.getQuickDtFactor()  || _this?.quickDtFactor;

		this.quickDtFactor = dtFactor;
		this.grinder.stretchedDt = dtFactor * this.space.refDt;
		if (traceQuickDtFactor) {
			console.log(`saveDtFactor:   old: ${this.state.dtFactor} `
				+`  new: ${dtFactor} ± ${dtFactor - this.state.dtFactor}`,
				`stretchedDt=${this.grinder.stretchedDt}`);
			storeASetting('lapSettings', 'dtFactor', dtFactor);
			this.setState({dtFactor});
		}
	}

	// how dtFactor is displayed on the speed control.  returns string.
	formatDtFactor = () => {
		let vdt = (this.getQuickDtFactor() * 1e3).toFixed(0);
		if (traceQuickDtFactor)
			console.log(`dtFactor=${this.getQuickDtFactor()}  v:${vdt}`);
		return vdt;
	}

	// called when dtfactor changes interactively.  fails silently.
	displayDtFactor = () => {
		//dtFactor ??= this.state.dtFactor ?? this?.quickDtFactor;

		let displayNode = document.querySelector('.speedButtonDisplay');
		if (displayNode) {
			displayNode.innerHTML = this.formatDtFactor();
		}
	}

// props.getQuickDtFactor
// this.getQuickDtFactor


	/* ********************************************** misc */

	resetElapsedTime() {
		this.grinder.elapsedTime = 0;
		//this.grinder.frameSerial = 0;

		this.props.animator.showTime();
	}

	// generate an FFT of the wave.  In the JS console.
	// TODO: make a real GLCanvas out of the spectrum!
	clickOnFFT(space)
	{
		wrapForExc(() => {
			// space not there until space promise, but that should happen
			// before anybody clicks on this
			if (space) {
				if (this.grinder.isIntegrating)
					space.grinder.pleaseFFT = true;  // remind me after next iter
				else
					qeFuncs.grinder_askForFFT(space.grinder.pointer);  // do it now
			}
		});
	}

	/* ********************************************** set wave tab */

	// these are kept individually in the state so any of them triggers a render.
	//  Kindof inconvenient, so we have getters and setters.
	getWaveParams = () => {
		const s = this.state;
		return {
			waveBreed: s.waveBreed, waveFrequency: s.waveFrequency,
			pulseWidth: s.pulseWidth, pulseCenter: s.pulseCenter
		};
	}

	// SetWave panel, upon a change: pass an object with any or all of the wave
	// params you want to change in the control panel's state. non-wave params are ignored.
	// Will return a copy of updated waveparams (Just the wave params, not others)
	setWaveParams = (wp) => {
		const s = this.state;
		const newParams = {
			waveBreed: wp.waveBreed ?? s.waveBreed,
			waveFrequency: wp.waveFrequency ?? s.waveFrequency,
			pulseWidth: wp.pulseWidth ?? s.pulseWidth,
			pulseCenter: wp.pulseCenter ?? s.pulseCenter,
		};
		this.setState(newParams);
		return newParams;
	}

	// given these params, put it into effect and display it on the Main Wave scene
	// This is most of 'Reset Wave'  NOT for regular iteration
	setAndPaintMainFamiliarWave = waveParams => {
		if (!this.space)
			return;

		const mainFlick = this.space.mainFlick;

		mainFlick.setFamiliarWave(waveParams);  // eSpace does this initially

		//qeFuncs.grinder_copyFromAvatar(this.grinder.pointer, this.mainAvatar.pointer);
		this.props.resetAndRepaintMainWave();
	}

	// SetWave button in SetWaveTab: set it from passed in params, and save it
	// in storage and state. opposite of resetWaveHandler()
	saveMainWave = waveParams => {
		this.resetElapsedTime();

		this.setAndPaintMainFamiliarWave(waveParams);
		storeAGroup('waveParams', waveParams);
	}

	// toolbar: Start Over button.  Display it from wave params from store
	// opposite of saveMainWave()
	resetWaveHandler = () => {
		this.resetElapsedTime();

		let waveParams = getAGroup('waveParams');
		this.setAndPaintMainFamiliarWave(waveParams);
		this.grinder.hadException = false;
		this.finishAnimating()
	}

	// setMainWave() called when user clicks SetWave, fills the main wave
	// waveParams handed in are the defaults as stored in storeSettings
	renderWaveTab = () => <SetWaveTab
			saveMainWave={this.saveMainWave}
			waveParams={this.getWaveParams()}
			setWaveParams={this.setWaveParams}
			space={this.space}
		/>;

	/* ********************************************** volts */

	// these are kept individually in the state so any of them triggers a render.
	// Kindof inconvenient to grab the whole thing, so we have this.
	getVoltageParams = () => {
		const s = this.state;
		return { voltageBreed: s.voltageBreed, voltageCenter: s.voltageCenter,
			canyonPower: s.canyonPower, canyonScale: s.canyonScale,
			slotWidth: s.slotWidth, slotScale: s.slotScale };
	}

	// change the state for the voltage params.  Just this.state
	// pass an object with any or all of the params you want to change
	setVoltageParams = (vP) => {
		const s = this.state;
		this.setState({ voltageBreed: vP.voltageBreed ?? s.voltageBreed,
			voltageCenter: vP.voltageCenter ?? s.voltageCenter,
			canyonPower: vP.canyonPower ?? s.canyonPower,
			canyonScale: vP.canyonScale ?? s.canyonScale,
			slotWidth: vP.slotWidth ?? s.slotWidth,
			slotScale: vP.slotScale ?? s.slotScale }
		);
	}

	setAndRenderFamiliarVoltage(vP) {
		this.space.vDisp.setFamiliarVoltage(vP);
		this.space.updateDrawnVoltagePath();  // visible change on screen
	}

	// fills in the voltage buffer with familiar voltage most recently set for
	// stored voltageParams. called when user clicks reset voltage on cptoolbar
	resetVoltageHandler = (ev) => {
		const voltageParams = getAGroup('voltageParams');
		this.setVoltageParams(voltageParams);
		this.space.vDisp.setFamiliarVoltage(voltageParams);
		this.space.updateDrawnVoltagePath();
	}

	renderVoltageTab = () => {
		const p = this.props;
		const s = this.state;
		return <SetVoltageTab
			voltageParams={this.getVoltageParams()}
			setVoltageParams={this.setVoltageParams}
			showVoltage={s.showVoltage}
			changeShowVoltage={this.changeShowVoltage}
			saveMainVoltage={this.saveMainVoltage}
			space={this.space}
		/>;
	}

	changeShowVoltage = (ev) => {
		const sv = ev.target.value;
		this.setState({showVoltage: sv});
		this.space.updateShowVoltage(sv);  // on the screen
	}

	// the Set Voltage button on the Set Voltage tab - always a familiar voltage profile
	saveMainVoltage = (ev) => {
		let voltageParams = this.getVoltageParams()
		this.setVoltageParams(voltageParams);  // to display in volt tab
		this.setAndRenderFamiliarVoltage(voltageParams);  // for the space, and the WaveView
		storeAGroup('voltageParams', voltageParams);  // remember from now on
	}

	/* ********************************************** integration tab */

	renderIntegrationTab = () => {
		return <SetIntegrationTab
			getQuickDtFactor={this.getQuickDtFactor}
			setQuickDtFactor={this.setQuickDtFactor}
			saveDtFactor={this.saveDtFactor}
			dtFactor={this.state.dtFactor}
			setDtFactor={this.setDtFactor}
			N={this.N}
		/>;
	}

	/* ********************************************** rainbow tab */

	// Just a display.  No controls, no settings.
	renderRainbowTab = () => <CxRainbowTab />;

	/* ********************************************** tabs */

	// called when user clicks on a left tab
	setShowingTab =
	tabCode => {
		this.setState({showingTab: storeASetting('miscSettings', 'showingTab', tabCode)});
	}


	// whichever tab is showing right now.
	renderShowingTab() {
		const s = this.state;
//		const {waveBreed, waveFrequency, pulseWidth, pulseCenter} = s;
//		const {canyonPower, canyonScale, slotWidth, slotScale, voltageCenter} = s;

		switch (s.showingTab) {
		case 'wave':
			return this.renderWaveTab();

		case 'voltage':
			return this.renderVoltageTab();

		case 'space':
			return <SetResolutionTab grinder={this.grinder}  space={this.space} />;

		case 'integration':
			return this.renderIntegrationTab();

		case 'rainbow':
			return this.renderRainbowTab();

		default:
			return `Do not understand showingTab='${s.showingTab}'`;
		}
	}


	/* ********************************************** render pieces of control panel  */

	// creates CPToolbar as a member func
	renderToolbar() {

// 		return <div >
// 			why not big est xt s t ehereh
// 		</div>
// 		return;

		//debugger;
		let toolbarRendered =<CPToolbar
			getQuickDtFactor={this.getQuickDtFactor}
			setQuickDtFactor={this.setQuickDtFactor}
			saveDtFactor={this.saveDtFactor}
			formatDtFactor={this.formatDtFactor}

			setShowingTab={this.setShowingTab}

			shouldBeIntegrating={this.context.shouldBeIntegrating ?? false}

			// startOver buttons
			resetWaveHandler={this.resetWaveHandler}
			resetVoltageHandler={this.resetVoltageHandler}

			N={this.N}
			space={this.space}
			cPanel={this}
		/>;

		return toolbarRendered;
	}

	/* ********************************************** render */

	render() {
		const p = this.props;
		const s = this.state;

		// before the space exists
		// why?  this just shows panels and buttons
		if (!this.space) return '';

		let showingTabRender = this.renderShowingTab();
		if (traceQuickDtFactor)
			console.log(`Rendering CPToolbar, dtFactor = ${this.state.dtFactor}`);
		let toolbar = this.renderToolbar();

		return <div className='ControlPanel'>

			{toolbar}

			<div className='tabsArea'>
				<ul className='TabBar' >
					<li className={s.showingTab == 'wave' ? 'selected' : ''} key='wave'
						onClick={ev => this.setShowingTab('wave')}>Wave</li>
					<li  className={s.showingTab == 'voltage' ? 'selected' : ''} key='voltage'
						onClick={ev => this.setShowingTab('voltage')}>Voltage</li>
					<li  className={s.showingTab == 'space' ? 'selected' : ''} key='space'
						onClick={ev => this.setShowingTab('space')}>Space</li>
					<li  className={s.showingTab == 'integration' ? 'selected' : ''} key='integration'
						onClick={ev => this.setShowingTab('integration')}>Integration</li>
					<li  className={s.showingTab == 'rainbow' ? 'selected' : ''} key='rainbow'
						onClick={ev => this.setShowingTab('rainbow')}>Complex</li>
				</ul>
				<div className='tabFrame'>
					{showingTabRender}
				</div>

			</div>
		</div>;
	}

}

export default ControlPanel;
