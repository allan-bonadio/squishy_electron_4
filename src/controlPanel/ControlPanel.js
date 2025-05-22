/*
** Control Panel -- all the widgets below the displayed canvas
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import React, {useContext} from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';

import './ControlPanel.scss';
import CPToolbar from './CPToolbar.js';
import SetWaveTab from './SetWaveTab.js';
import SetVoltageTab from './SetVoltageTab.js';
import SetResolutionTab from './SetResolutionTab.js';
import SetIntegrationTab from './SetIntegrationTab.js';
import {getASetting, storeASetting, getAGroup, storeAGroup} from '../utils/storeSettings.js';
import {eSpaceCreatedPromise} from '../engine/eEngine.js';
import qeFuncs from '../engine/qeFuncs.js';
import qeConsts from '../engine/qeConsts.js';
import {interpretCppException, wrapForExc} from '../utils/errors.js';
import SquishContext from '../sPanel/SquishContext.js';


let traceSetPanels = false;
let traceStartStop = false;



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

		// WHy isn't React handing me the context?  Not ever.  Just an empty
		// object that's frozen.  do it myself.
		context: PropTypes.object,
	}

	constructor(props) {
		super(props);
		checkPropTypes(this.constructor.propTypes, props, 'prop', this.constructor.name);

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

		// can't get this to work for now, startup is always stopped.
		this.state.shouldBeIntegrating = false;

		// we can't init some stuff till we get the space.  But we also can't until
		// this constructor runs.
		eSpaceCreatedPromise.then(space => {
			this.initWithSpace(space);

			if (this.state.shouldBeIntegrating) {
				space.grinder.triggerIteration();
			}
		})
		.catch(rex => {
			let ex = interpretCppException(rex);
			console.error(ex.stack ?? ex.message ?? ex);
			debugger;
		});
	}

	// we need a surprising amount of stuff from the space.  We can't draw much without it.
	// So this gets called when it's ready.
	initWithSpace(space) {
		// not much happens without this info
		this.space = space;
		this.N = space.N;
		this.mainEAvatar = space.mainEAvatar;
		this.mainEWave = space.mainEWave;

		this.grinder = space.grinder;
		this.grinder.stretchedDt = this.state.dtStretch * this.space.dt;

		// if somebody tried to set this before the space and grinder
		// were here, it's saved in the state.
		this.grinder.shouldBeIntegrating = this.state.shouldBeIntegrating;
		if (this.grinder.shouldBeIntegrating)
			this.startAnimating();



		if (traceStartStop) {
			console.log(`🎛️ ControlPanel constructor initialized with space, ${this.grinder.pointer.toString(16)} `
				+` shouldBeIntegrating=${this.grinder.shouldBeIntegrating} `
				+` isIntegrating=${this.grinder.isIntegrating}`);
		}
	}

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

	// need to keep grinder's variable and our state in sync for sbi.
	// maybe these help.  Oh yeah, the setting, too.
	get shouldBeIntegrating() {
		// before the space is created, this.grinder is undefined but the state
		// should be set from storeSettings
		const sbi = this.grinder?.shouldBeIntegrating ?? this.state.shouldBeIntegrating;

		// NO this could be in a render method
		//if (this.state.shouldBeIntegrating != sbi)
		//	this.setState({shouldBeIntegrating: sbi});  // oops!

		return sbi;
	}
	set shouldBeIntegrating(sbi) {
		if (this.grinder)
			this.grinder.shouldBeIntegrating = sbi;
		this.setState({shouldBeIntegrating: sbi});
		storeASetting('frameSettings', 'shouldBeIntegrating', sbi);
	}

	// the central authority as to whether we're animating/integrating
	// or not is grinder.shouldBeIntegrating Change the status by
	// calling start/stop animating functions here the C++ will copy it
	// to isIntegrating at the right  time
	startAnimating =
	() => {
		if (!this.space) return;  // too early.  mbbe should gray out the button?

		if (traceStartStop) console.info(`🎛️ startAnimating starts, triggering iteration`);
		this.shouldBeIntegrating = true;

		// must do this to start each iteration going in the thread(s)
		this.grinder.triggerIteration();

		if (traceStartStop) console.log(`🎛️ ControlPanel startAnimating,`
			+` shouldBeIntegrating=${this.shouldBeIntegrating}, `
			+`isIntegrating=${this.grinder.isIntegrating}   `);
	}

	stopAnimating =
	() => {
		if (!this.space) return;  // too early.  mbbe should gray out the button?

		// set it false as you store it in store; then set state.  The threads will figure it out next iteration
		this.shouldBeIntegrating = false;
		if (traceStartStop) console.log(`🎛️ ControlPanel STOP Animating, `
			+`shouldBeIntegrating=${this.shouldBeIntegrating}, isIntegrating=${this.grinder.isIntegrating}   `);
	}

	startStop =
	ev => {
		if (this.shouldBeIntegrating)
			this.stopAnimating();
		else
			this.startAnimating();
	}

	// needs work
	singleFrame =
	(ev) => {
		//console.info(`🎛️ singleFrame starts`);
		this.shouldBeIntegrating = true;

		this.grinder.justNFrames = 1;

		this.grinder.triggerIteration();

		// wait ... need to do this one tic later.  Well, close enough.
		setTimeout(() => this.shouldBeIntegrating = false, 100);
		//setTimeout(() => this.sPanel.animator.drawLatestFrame(), 100);

	}

	/* ********************************************** misc */

	resetElapsedTime() {
		this.grinder.elapsedTime = 0;
		this.grinder.frameSerial = 0;

		this.props.animator.showTimeNFrame();
	}

	// generate an FFT of the wave.  In the JS console.
	// TODO: make a real GLScene out of the spectrum!
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

		const mainEWave = this.space.mainEWave;

		mainEWave.setFamiliarWave(waveParams);  // eSpace does this initially

		qeFuncs.grinder_copyFromAvatar(this.grinder.pointer, this.mainEAvatar.pointer);
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
		debugger;
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
			iStats={this.props.iStats}
		/>;
	}

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

			/*
				lowPassFilter={s.lowPassFilter}
				setLowPassFilter={this.setLowPassFilter}
							stepsPerFrame={s.stepsPerFrame}
				setStepsPerFrame={this.setStepsPerFrame}
			*/
		default:
			return `Do not understand showingTab='${s.showingTab}'`;
		}
	}


	/* ********************************************** render */

	setUpContext() {
		// react never sets our context.  dunno why.  remove this if/when you fix that.
		// boy it doesn't even remember it when you set it.  Pfft.
		if (!this.context?.controlPanel)
			this.context = this.props.context;
		//debugger;

		let cp = this.context?.controlPanel;
		// if there's no context yet, or no space promise yet, don't do this yet.
		// or, if it's already done, we don't have to do it again.
		if (!cp || !this.space || cp.N)
			return;


		// stuff available immediately
		cp.startAnimating = this.startAnimating;
		cp.stopAnimating = this.stopAnimating;
		cp.startStop = this.startStop;
		cp.singleFrame = this.singleFrame;

		// stuff available after space promise
		cp.space = this.space;
		cp.N = this.space.N;
		cp.mainEAvatar = this.space.mainEAvatar;
		cp.mainEWave = this.space.mainEWave;

		cp.grinder = this.space.grinder;
		cp.grinder.stretchedDt = this.state.dtStretch * this.space.dt;

		// if somebody tried to set this before the space and grinder
		// were here, it's saved in the state.
		cp.grinder.shouldBeIntegrating = this.state.shouldBeIntegrating;
		if (cp.grinder.shouldBeIntegrating)
			cp.startAnimating();

		console.log(`🎛️  ControlPanel setUpContext context: `, this.context);
	}

	render() {
		const p = this.props;
		const s = this.state;

		// this is the earliest place the context shows up (if ever)
		this.setUpContext();

		// before the space exists
		// why?  this just shows panels and buttons
		if (!this.space) return '';

		let showingTabHtml = this.createShowingTab();

		return <div className='ControlPanel'>
			<CPToolbar
				chosenRate={1000. / s.chosenFP}
				setChosenRate={this.setChosenRate}

				shouldBeIntegrating={this.shouldBeIntegrating ?? false}

				startOverHandler={this.startOverHandler}
				resetVoltageHandler={this.resetVoltageHandler}

				N={this.N}
				space={this.space}
				cPanel={this}
			/>
			<div className='cpSecondRow'>
				<ul className='TabBar' >
					<li className={s.showingTab == 'wave' ? 'selected' : ''} key='wave'
						onClick={ev => this.setShowingTab('wave')}>Wave</li>
					<li  className={s.showingTab == 'voltage' ? 'selected' : ''} key='voltage'
						onClick={ev => this.setShowingTab('voltage')}>Voltage</li>
					<li  className={s.showingTab == 'space' ? 'selected' : ''} key='space'
						onClick={ev => this.setShowingTab('space')}>Space</li>
					<li  className={s.showingTab == 'integration' ? 'selected' : ''} key='integration'
						onClick={ev => this.setShowingTab('integration')}>Integration</li>
				</ul>
				<div className='tabFrame'>
					{showingTabHtml}
				</div>
			</div>
		</div>;
	}

	componentDidUpdate() {
		// these should be EQUAL!  but single step turns it off without
		// updating our state.  Make sure it's ok here.
		if (this.state.shouldBeIntegrating != this.grinder.shouldBeIntegrating)
			this.setState({shouldBeIntegrating: this.grinder.shouldBeIntegrating});
	}
}

export default ControlPanel;
