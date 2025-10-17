/*
** Control Panel -- all the widgets below the displayed canvas
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
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
let traceStartStop = false;
let traceContext = false;

// integrations always need specific numbers of steps.  But there's always one
// more. maybe this should be defined in the grinder.  Hey, isn't this really
// 1/2 step?  cuz it's always dt/2
const N_EXTRA_STEPS = 0.5;

export class ControlPanel extends React.Component {
	static propTypes = {

		repaintWholeMainWave: PropTypes.func.isRequired,
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
		checkPropTypes(this.constructor.propTypes, props, 'prop', this.constructor.name);
		//this.nFramesToGo = -1;

		// most of the state is kept here.  But, also, in the store settings for the next page reload.
		this.state = {
			// each of these params changes the state; here they are individually
			...getAGroup('waveParams'),
			...getAGroup('voltageParams'),
			...getAGroup('voltageSettings'),
			...getAGroup('frameSettings'),

			showingTab: getASetting('miscSettings', 'showingTab'),
		}
		this.chosenFP = this.state.chosenFP;

		// we can't init some stuff till we get the space.  But we also can't until
		// this constructor runs.
		eSpaceCreatedPromise.then(space => {
			this.initWithSpace(space);
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
		if (cp)
			return;  // already done

		// new cp object
		cp = {
			startAnimating: this.startAnimating,
			stopAnimating: this.stopAnimating,
			startStop: this.startStop,
			singleFrame: this.singleFrame,
		}

		this.props.setCPContext(cp);

		if (traceContext) {
			const ctx = this.context;
			console.log(`🎛️  ControlPanel setUpContext context: sbi, ctx.cp, ctx.wv:`,
				ctx?.shouldBeIntegrating,
				ctx?.controlPanel,
				ctx?.waveView);
		}
	}

	// we need a surprising amount of stuff from the space.  We can't draw much without it.
	// So this gets called when it's ready.
	initWithSpace(space) {
		// not much happens without this info
		this.space = space;
		this.N = space.N;
		this.mainAvatar = space.mainAvatar;
		this.mainFlick = space.mainFlick;

		this.grinder = space.grinder;
		this.grinder.stretchedDt = this.state.dtStretch * this.space.dt;

		this.setUpContext();

		// context is the RIGHT way to do it, but sometimes the context changes
		// take until the next cycle (?)
		if (this.context.shouldBeIntegrating)
			this.startAnimating();

		if (traceStartStop) {
			console.log(`🎛️ ControlPanel constructor & context initialized with space, `
			+` ctx.shouldBeIntegrating=${this.context.shouldBeIntegrating}, `
			+` gr.shouldBeIntegrating=${this.grinder.shouldBeIntegrating}, `
			+` isIntegrating=${this.grinder.isIntegrating}   ctx.cp:`,
			this.context.controlPanel);
		}
	}

	static contextType = SquishContext;

//	componentDidMount() {
//		this.setUpContext();
//	}


	/* *********************************************************** frame period/ frequencyu */
	// set frame period chosen by the user: set it JUST for the animator and grinder
	setChosenFP =
	(period) => {
		const an = this.props.animator;
		if (an) {
			an.chosenFP = period;
			an.frameProgress = 0;
		}

		// now tell the grinder.  Next chosenFP, it'll go into effect
		if (this.grinder)
			this.grinder.chosenFP = period;
	}

	// set freq of frame, which is 1, 2, 4, 8, ... some float number of times per
	// second you want frames. freq is how the CPToolbar UI, handles it, but we
	// keep the period in the ControlPanel state,
	setChosenRate =
	freq =>{
		// set it in the settings, controlpanel state, and SquishPanel's state, too.
		this.chosenFP = 1000. / +freq;
		if (qeConsts.FASTEST == freq)
			this.chosenFP = qeConsts.FASTEST;

		// now set it in all 4 places this variable is duplicated... (sorry)
		this.setState({chosenFP: storeASetting('frameSettings', 'chosenFP', this.chosenFP)});
		this.setChosenFP(this.chosenFP);  // so squish panel can adjust the heartbeat
	}

	/* ************************************************* shouldBeIntegrating */
	// sbi is kept in the context, AND in the grinder.  Not in this component's state.

	// the central authority as to whether we're animating/integrating
	// or not is SquishPanel.state.shouldBeIntegrating Change the status by
	// calling start/stop animating functions here. the C++ will copy it
	// to isIntegrating at the right  time
	// ev is optional and only for the trace msg
	startAnimating =
	(ev) => {
		if (!this.space) return;  // too early.  mbbe should gray out the button?

		if (traceStartStop) console.info(`🎛️ startAnimating starts, triggering iteration, `, ev);
		this.props.setShouldBeIntegrating(true);

		// must do this to start each iteration going in the thread(s)
		this.grinder.triggerIteration();

		if (traceStartStop) {
			console.log(`🎛️ ControlPanel startAnimating,`
			+` ctx.shouldBeIntegrating=${this.context.shouldBeIntegrating}, `
			+` gr.shouldBeIntegrating=${this.grinder.shouldBeIntegrating}, `
			+`isIntegrating=${this.grinder.isIntegrating}   `);

			console.log(`🎛️  this.context == props.context? `, this.context == this.props.context);
		}

	}

	// ev is optional and only for the trace msg
	stopAnimating =
	(ev) => {
		if (!this.space) return;  // too early.  mbbe should gray out the button?

		// set it false as you store it in store; then set state.  The threads will figure it out next iteration
		this.props.setShouldBeIntegrating(false);
		if (traceStartStop) console.log(`🎛️ ControlPanel STOP Animating, `
			+`shouldBeIntegrating=${this.context.shouldBeIntegrating}, `
			+`grinder.isIntegrating=${this.grinder.isIntegrating}   , `, ev);
	}

	// if shouldBeIntegrating is true (is integrating), turn it off
	// if false, turn it on.  Therefore, toggle it.  Note no argument.
	startStop =
	ev => {
		if (this.context.shouldBeIntegrating)
			this.stopAnimating();
		else
			this.startAnimating();
	}

	// the |> button. ev is optional and only for the trace msg
	singleFrame =
	(ev) => {
		console.log(`🎛️ singleFrame starts, `, ev);

		let nFrames = 1;
		// multipleby holding down modifiers.  Alt=bad on Windows, ctrl=bad on Mac
		if (ev.ctrlKey || ev.altKey) nFrames *= 10;
		if (ev.shiftKey) nFrames *= 100;

		this.props.animator.singleFrame(nFrames);

		if (traceStartStop) console.log(`🎛️ ControlPanel singleFrame,`
			+` nFrames=${nFrames}, `
			+` ctx.shouldBeIntegrating=${this.context.shouldBeIntegrating}, `
			+` gr.shouldBeIntegrating=${this.grinder.shouldBeIntegrating}, `
			+`isIntegrating=${this.grinder.isIntegrating}   `);
	}

	/* ********************************************** misc */

	resetElapsedTime() {
		this.grinder.elapsedTime = 0;
		this.grinder.frameSerial = 0;

		this.props.animator.showTimeNFrame();
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

	/* ********************************************** wave tab */

	// these are kept individually in the state so any of them triggers a render.
	//  Kindof inconvenient, so we have getters and setters.
	getWaveParams = () => {
		const s = this.state;
		return {
			waveBreed: s.waveBreed, waveFrequency: s.waveFrequency,
			pulseWidth: s.pulseWidth, pulseCenter: s.pulseCenter
		};
	}

	// pass an object with any or all of the params you want to change.
	// non-wave params are ignored
	setWaveParams = (wp) => {
		const s = this.state;
		this.setState({
			waveBreed: wp.waveBreed ?? s.waveBreed,
			waveFrequency: wp.waveFrequency ?? s.waveFrequency,
			pulseWidth: wp.pulseWidth ?? s.pulseWidth,
			pulseCenter: wp.pulseCenter ?? s.pulseCenter,
		});
	}

	// given these params, put it into effect and display it on the wave scene
	// This is most of 'Reset Wave'  NOT for regular iteration
	setAndPaintFamiliarWave = waveParams => {
		if (!this.space)
			return;

		const mainFlick = this.space.mainFlick;

		mainFlick.setFamiliarWave(waveParams);  // eSpace does this initially

		qeFuncs.grinder_copyFromAvatar(this.grinder.pointer, this.mainAvatar.pointer);
		this.props.repaintWholeMainWave();
	}

	// SetWave button in SetWaveTab: set it from passed in params, and save it
	// in storage and state. opposite of startOverHandler()
	saveMainWave = waveParams => {
		this.resetElapsedTime();

		this.setAndPaintFamiliarWave(waveParams);
		storeAGroup('waveParams', waveParams);
	}

	// toolbar: Start Over button.  Display it from wave params from store
	// opposite of saveMainWave()
	startOverHandler = () => {
		this.resetElapsedTime();

		let waveParams = getAGroup('waveParams');
		this.setAndPaintFamiliarWave(waveParams);
		this.grinder.hadException = false;
		this.stopAnimating()
	}

	// setMainWave() called when user clicks SetWave, fills the main wave
	// waveParams handed in are the defaults as stored in storeSettings
	makeWaveTab = () => <SetWaveTab
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

	// the Set Voltage button on the Set Voltage tab - always a familiar voltage profile
	// TODO: move this to the end of this section
	saveMainVoltage = (ev) => {
		let voltageParams = this.getVoltageParams()
		this.setVoltageParams(voltageParams);  // to display in volt tab
		this.setAndRenderFamiliarVoltage(voltageParams);  // for the space, and the WaveView
		storeAGroup('voltageParams', voltageParams);  // remember from now on
	}

	// fills in the voltage buffer with familiar voltage most recently set for
	// stored voltageParams. called when user clicks reset voltage on cptoolbar
	resetVoltageHandler = (ev) => {
		const voltageParams = getAGroup('voltageParams');
		this.setVoltageParams(voltageParams);
		this.space.vDisp.setFamiliarVoltage(voltageParams);
		this.space.updateDrawnVoltagePath();
	}

	makeVoltageTab = () => {
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

	/* ********************************************** integration tab */

	// dt is time per step, stretchedDt is stretched, ready to use
	setDtStretch = dtStretch => {
		dtStretch = storeASetting('frameSettings', 'dtStretch', dtStretch);
		this.setState({dtStretch});
		this.grinder.stretchedDt = dtStretch * this.space.dt;
		console.log(`🎛️ setDtStretch: dt = ${this.space.dt}   dtStretch= ${dtStretch} stretchedDt=${this.grinder.stretchedDt}`)
	}

	makeIntegrationTab = () => {
		return <SetIntegrationTab
			dtStretch={this.state.dtStretch}
			setDtStretch={this.setDtStretch}

			N={this.N}
		/>;
	}

	/* ********************************************** rainbow tab */

	// Just a display.  No controls, no settings.
	makeRainbowTab = () => <CxRainbowTab />;

	/* ********************************************** tabs */

	// called when user clicks on a left tab
	setShowingTab =
	tabCode => {
		this.setState({showingTab: storeASetting('miscSettings', 'showingTab', tabCode)});
	}


	// whichever tab is showing right now
	createShowingTab() {
		const s = this.state;
//		const {waveBreed, waveFrequency, pulseWidth, pulseCenter} = s;
//		const {canyonPower, canyonScale, slotWidth, slotScale, voltageCenter} = s;

		switch (s.showingTab) {
		case 'wave':
			return this.makeWaveTab();

		case 'voltage':
			return this.makeVoltageTab();

		case 'space':
			return <SetResolutionTab grinder={this.grinder}  space={this.space} />;

		case 'integration':
			return this.makeIntegrationTab();

		case 'rainbow':
			return this.makeRainbowTab();

		default:
			return `Do not understand showingTab='${s.showingTab}'`;
		}
	}


	/* ********************************************** render */


	render() {
		const p = this.props;
		const s = this.state;


		// before the space exists
		// why?  this just shows panels and buttons
		if (!this.space) return '';

		let showingTabHtml = this.createShowingTab();

		return <div className='ControlPanel'>
			<CPToolbar
				chosenRate={1000. / s.chosenFP}
				setChosenRate={this.setChosenRate}

				shouldBeIntegrating={this.context.shouldBeIntegrating ?? false}

				startOverHandler={this.startOverHandler}
				resetVoltageHandler={this.resetVoltageHandler}

				N={this.N}
				space={this.space}
				cPanel={this}
			/>
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
					{showingTabHtml}
				</div>
			</div>
		</div>;
	}

}

export default ControlPanel;
