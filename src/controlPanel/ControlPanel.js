/*
** Control Panel -- all the widgets below the displayed canvas
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

import './ControlPanel.scss';
import CPToolbar from './CPToolbar.js';
import SetWaveTab from './SetWaveTab.js';
import SetVoltageTab from './SetVoltageTab.js';
import SetResolutionTab from './SetResolutionTab.js';
import SetIntegrationTab from './SetIntegrationTab.js';
import {getASetting, storeASetting, getAGroup, storeAGroup} from '../utils/storeSettings.js';
import {eSpaceCreatedPromise} from '../engine/eEngine.js';
import qe from '../engine/qe.js';
import {interpretCppException, wrapForExc} from '../utils/errors.js';

let traceSetPanels = false;
let traceStartStop = false;

// integrations always need specific numbers of steps.  But there's always one
// more. maybe this should be defined in the grinder.  Hey, isn't this really
// 1/2 step?  cuz it's always dt/2
const N_EXTRA_STEPS = 0.5;

export class ControlPanel extends React.Component {
	static propTypes = {
		//frameAnimate: PropTypes.func.isRequired,

		// these are the actual functions that change the main qWave and ultimately
		// the WaveView on the screen
		// when user chooses 'set wave'
		//// this should move into controlPanel from squishPanel
		//populateFamiliarVoltage: PropTypes.func.isRequired,

		// the showVoltage bool is kept by the Squish Panel; probably should by the WaveView
		// oh wait the checkbox in the SetVoltage panel
		toggleShowVoltage: PropTypes.func.isRequired,
		showVoltage: PropTypes.bool.isRequired,

		redrawWholeMainWave: PropTypes.func.isRequired,

		// the integration statistics shown in the Integration tab
		iStats: PropTypes.shape({
			startIntegrationTime: PropTypes.number.isRequired,
			totalDrawTime: PropTypes.number.isRequired,
		}),

		animator: PropTypes.object,

		sPanel: PropTypes.object.isRequired,

		//tellMeWhenVoltsChanged: PropTypes.func.isRequired,
	}

	constructor(props) {
		super(props);
		//debugger;
		ControlPanel.me = this;  // TODO get rid of this
		this.sPanel = props.sPanel;
		this.sPanel.cPanel = this;

		// most of the state is kept here.  But, also, in the store settings for the next page reload.
		this.state = {
			framePeriod: getASetting('frameSettings', 'framePeriod'),

			// defaults for sliders
			dtStretch: getASetting('frameSettings', 'dtStretch'),
			//stepsPerFrame: getASetting('frameSettings', 'stepsPerFrame'),
			//lowPassFilter: getASetting('frameSettings', 'lowPassFilter'),

			showingTab: getASetting('miscSettings', 'showingTab'),

			// a copy of shouldBeIntegrating, to update this panel when it's changed
			shouldBeIntegrating: getASetting('frameSettings', 'shouldBeIntegrating'),
		}
		this.framePeriod = this.state.framePeriod;  // everybody uses this one

		// pour these directly into the initial state.  The control panel saves
		// these params in its state, but they're not saved in localStorage until a user clicks
		// SetWave or SetVoltage.
		let waveParams = getAGroup('waveParams');
		let voltageParams = getAGroup('voltageParams');
		Object.assign(this.state, waveParams, voltageParams);

		// we can't init some stuff till we get the space.  But we also can't until this constructor runs.
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

	// we need a surprising amount of stuff from the space.  So this gets called when it comes up.
	initWithSpace(space) {
		// not much happens without this info
		this.space = space;
		this.N = space.dimensions[0].N;
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
				+` shouldBeIntegrating=${this.grinder.shouldBeIntegrating}  `
				+` isIntegrating=${this.grinder.isIntegrating}`);
		}
	}

	/* ******************************************************* start/stop */

	setFramePeriod =
	(period) => {
		//this.framePeriod = period;
		if (this.animator)
			this.animator.framePeriod = period;
	}

	// set freq of frame, which is 1, 2, 4, 8, ... some float number of times per second you want frames.
	// freq is how the CPToolbar handles it, but we keep the period in the ControlPanel state,
	setFrameFrequency =
	freq =>{
		// set it in the settings, controlpanel state, and SquishPanel's state, too.
		this.framePeriod = 1000. / +freq;
		this.setState({framePeriod: storeASetting('frameSettings', 'framePeriod', this.framePeriod)});
		this.setFramePeriod(this.framePeriod);  // so squish panel can adjust the heartbeat
	}

	// need to keep grinder's variable and our state in sync for sbi.
	// maybe these help.  Oh yeah, the setting, too.
	get shouldBeIntegrating() {
		// before the space is created, this.grinder is undefined but the state should be set from storeSettings
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
		if (this.shouldBeIntegrating) return;  // already on.  how'd this happen?

		if (traceStartStop) console.info(`startAnimating starts, triggering iteration`);
		// set it true as you store it in store; then set state
		this.shouldBeIntegrating = true;
		//	= storeASetting('frameSettings', 'shouldBeIntegrating', true);
		//this.setState({shouldBeIntegrating: true});

		// must do this to start iteration loop going in the thread(s)
		this.grinder.triggerIteration();

		//console.log(`startAnimating done: shouldBeIntegrating =${space.grinder.shouldBeIntegrating}   `);
		if (traceStartStop) console.log(`🎛️ ControlPanel startAnimating, shouldBeIntegrating=${this.shouldBeIntegrating}, isIntegrating=${this.grinder.isIntegrating}   `);
	}

	stopAnimating =
	() => {
		if (!this.space) return;  // too early.  mbbe should gray out the button?
		if (!this.shouldBeIntegrating) return;  // already off.  how'd this happen?

		// set it false as you store it in store; then set state
		this.shouldBeIntegrating = false;
		if (traceStartStop) console.log(`🎛️ ControlPanel STOP Animating, shouldBeIntegrating=${this.shouldBeIntegrating}, isIntegrating=${this.grinder.isIntegrating}   `);
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
		//console.info(`singleFrame starts`);
		this.shouldBeIntegrating = true;

		this.grinder.justNFrames = 1;

		this.grinder.triggerIteration();

		// wait ... need to do this one tic later.  Well, close enough.
		setTimeout(() => this.shouldBeIntegrating = false, 100);
		//setTimeout(() => this.sPanel.animator.drawLatestFrame(), 100);

	}

	/* ********************************************** wave */

	// given these params, put it into effect and display it on the wave view
	// This is most of 'Reset Wave'  NOT for regular iteration
	setAndPaintMainWave =
	waveParams => {
		const p = this.props;
		if (!this.space)
			return;

		const mainEWave = this.space.mainEWave;
		this.grinder.elapsedTime = 0;
		this.grinder.frameSerial = 0;

		mainEWave.setFamiliarWave(waveParams);  // eSpace does this initially
		qe.grinder_copyFromAvatar(this.grinder.pointer, this.mainEAvatar.pointer);
		p.redrawWholeMainWave();
	}

	// toolbar: Start Over button.  Display it from wave params
	resetWave =
	() => {
		let waveParams = getAGroup('waveParams');
		this.setAndPaintMainWave(waveParams);
		this.grinder.hadException = false;
		this.stopAnimating()
	}

	// SetWave button in SetWaveTab: set it from passed in params, and save it
	saveMainWave =
	waveParams => {
		this.setAndPaintMainWave(waveParams);
		storeAGroup('waveParams', waveParams);
	}

	// generate an FFT of the wave.  In the JS console.  TODO: make a real GL view out of this
	clickOnFFT(space)
	{
		wrapForExc(() => {
			// space not there until space promise, but that should happen
			// before anybody clicks on this
			if (space) {
				if (this.grinder.isIntegrating)
					space.grinder.pleaseFFT = true;  // remind me after next iter
				else
					qe.grinder_askForFFT(space.grinder.pointer);  // do it now
			}
		});
	}

	/* ********************************************** volts & tab */

	// fills in the voltage buffer with values most recently set for voltageParams
	// called when user clicks reset voltage on cptoolbar
	resetVoltage =
	() => {
		this.space.vDisp.setFamiliarVoltage(getAGroup('voltageParams'));
		this.space.updateVoltageArea();
	}

	setShowingTab =
	tabCode => {
		this.setState({showingTab: storeASetting('miscSettings', 'showingTab', tabCode)});
	}


	/* ********************************************** frame */

	// dt is time per step, stretchedDt is stretched, ready to use
	setDtStretch = dtStretch => {
		dtStretch = storeASetting('frameSettings', 'dtStretch', dtStretch);
		this.setState({dtStretch});
		this.grinder.stretchedDt = dtStretch * this.space.dt;
		console.log(`🎛️ setDtStretch: dt = ${this.space.dt}   dtStretch= ${dtStretch} stretchedDt=${this.grinder.stretchedDt}`)
	}

	//setStepsPerFrame =
	//stepsPerFrame => {
	//	try {
	//		if (traceSetPanels) console.log(`js setStepsPerFrame(${stepsPerFrame})`);
	//		storeASetting('frameSettings', 'stepsPerFrame', stepsPerFrame);
	//		this.setState({stepsPerFrame});
	//		this.grinder.stepsPerFrame = stepsPerFrame;
	//
	//		// dt needs to be recalculated if either of these change
	//		this.grinder.dt = this.state.deltaT / (stepsPerFrame + N_EXTRA_STEPS);
	//		//console.log(`setStepsPerFrame: dt = ${this.grinder.dt} = deltaT ${this.state.deltaT} / spf+1=${ (stepsPerFrame + N_EXTRA_STEPS)}`)
	//	} catch (ex) {
	//		ex = interpretCppException(ex);
	//		console.error(`setStepsPerFrame error:`, ex.stack ?? ex.message ?? ex);
	//		////debugger;
	//	}
	//}
	//
	//// sets the LPF in both SPanel state AND in the C++ area
	//setLowPassFilter =
	//lowPassFilter => {
	//	if (traceSetPanels) console.log(`js setLowPassFilter(${lowPassFilter})`)
	//
	//	let lpf = storeASetting('frameSettings', 'lowPassFilter', lowPassFilter);
	//	this.setState({lowPassFilter: lpf});
	//
	//	// here's where it converts from percent to the C++ style integer number of freqs
	//	this.grinder.lowPassFilter = Math.round(lpf / 200 * this.state.N);
	//}



	/* ********************************************** render  pieces */

	// whichever tab is showing right now
	createShowingTab() {
		const p = this.props;
		const s = this.state;
		const {waveBreed, waveFrequency, pulseWidth, pulseOffset} = s;
		const {canyonPower, canyonScale, canyonOffset} = s;

		switch (s.showingTab) {
		case 'wave':
			// setMainWave() called when user clicks SetWave, fills the main wave
			// waveParams handed in are the defaults as stored in storeSettings
			return <SetWaveTab
				saveMainWave={this.saveMainWave}
				waveParams={{waveBreed, waveFrequency, pulseWidth, pulseOffset,}}
				setCPState={this.setCPState}
				space={this.space}
			/>;

		case 'voltage':
			// setVoltageHandler={this.setVoltageHandler}
			//setVoltageAndUpdate={this.setVoltageAndUpdate}
			return <SetVoltageTab
				voltageParams={{ canyonPower, canyonScale, canyonOffset,}}
				toggleShowVoltage={p.toggleShowVoltage}
				showVoltage={p.showVoltage}
			/>;

		case 'space':
			return <SetResolutionTab grinder={this.grinder}/>;

		case 'integration':
			return <SetIntegrationTab
				space={this.space}
				dtStretch={s.dtStretch}
				setDtStretch={this.setDtStretch}

				N={this.N}
				iStats={p.iStats}
			/>;

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
	render() {
		const p = this.props;
		const s = this.state;

		// before the mount event on SquishPanel
		// why?  this just shows panels and buttons if (!this.space) return '';

		let showingTabHtml = this.createShowingTab();

		//setVoltageHandler={this.setVoltageHandler}
		return <div className='ControlPanel'>
			<CPToolbar
				frameFrequency={1000. / s.framePeriod}
				setFrameFrequency={this.setFrameFrequency}

				shouldBeIntegrating={this.shouldBeIntegrating ?? false}

				resetWave={this.resetWave}
				resetVoltage={this.resetVoltage}
				toggleShowVoltage={p.toggleShowVoltage}
				showVoltage={p.showVoltage}

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
