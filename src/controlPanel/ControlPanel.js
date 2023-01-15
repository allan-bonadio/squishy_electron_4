/*
** Control Panel -- all the widgets below the displayed canvas
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

import './ControlPanel.scss';
import CPToolbar from './CPToolbar.js';
import SetWaveTab from './SetWaveTab.js';
import SetVoltageTab from './SetVoltageTab.js';
import SetResolutionTab from './SetResolutionTab.js';
import SetIntegrationTab from './SetIntegrationTab.js';
//import eSpace from '../engine/eSpace.js';
import SquishPanel from '../SquishPanel.js';
import {getASetting, storeASetting, getAGroup, storeAGroup} from '../utils/storeSettings.js';
import {eSpaceCreatedPromise} from '../engine/eEngine.js';
import qe from '../engine/qe.js';
import {interpretCppException} from '../utils/errors.js';


let traceSetPanels = false;


// integrations always need specific numbers of steps.  But there's always one more.
// maybe this should be defined in the grinder.  Hey, isn't this really 1/2 step?  cuz it's always dt/2
const N_EXTRA_STEPS = 0.5;


export class ControlPanel extends React.Component {
	static propTypes = {
		frameAnimate: PropTypes.func.isRequired,

		// these are the actual functions that change the main qWave and ultimately
		// the WaveView on the screen
		// when user chooses 'set wave'
		//// this should move into controlPanel from squishPanel
		//populateFamiliarVoltage: PropTypes.func.isRequired,
		toggleShowVoltage: PropTypes.func.isRequired,
		showVoltage: PropTypes.bool.isRequired,

		redrawWholeMainWave: PropTypes.func.isRequired,

		iStats: PropTypes.shape({
			startIntegration: PropTypes.number.isRequired,
			endDraw: PropTypes.number.isRequired,
		}),
		refreshStats: PropTypes.func.isRequired,

		tellMeWhenVoltsChanged: PropTypes.func.isRequired,
	}

	constructor(props) {
		super(props);
		ControlPanel.me = this;

		// most of the state is kept here.  But, also, in the store settings
		this.state = {
			framePeriod: getASetting('frameSettings', 'framePeriod'),

			// defaults for sliders for deltaT & spi
			deltaT: getASetting('frameSettings', 'deltaT'),
			stepsPerFrame: getASetting('frameSettings', 'stepsPerFrame'),
			lowPassFilter: getASetting('frameSettings', 'lowPassFilter'),

			// state for voltage resets - control panel only, populateFamiliarVoltage()  see below;...
			//voltageBreed: getASetting('voltageParams', 'voltageBreed'),
			//canyonPower: getASetting('voltageParams', 'canyonPower'),
			//canyonScale: getASetting('voltageParams', 'canyonScale'),
			//canyonOffset: getASetting('voltageParams', 'canyonOffset'),

			showingTab: getASetting('miscSettings', 'showingTab'),

			// waveParams & voltage params - see below
		}

		// pour these directly into the initial state.  The control panel saves
		// these params in its state, but they're not saved in localStorage until a user clicks
		// SetWave or SetVoltage.
		let waveParams = getAGroup('waveParams');
		let voltageParams = getAGroup('voltageParams');
		Object.assign(this.state, waveParams, voltageParams);

		eSpaceCreatedPromise.then(space => {
			// not much happens without this info
			this.space = space;
			this.N = space.dimensions[0].N;
			this.grinder = space.grinder;
			this.mainEAvatar = space.mainEAvatar;
			this.mainEWave = space.mainEWave;
		})
		.catch(rex => {
			let ex = interpretCppException(rex);
			console.error(ex.stack ?? ex.message ?? ex);
			debugger;
		});

		// the static declaration down below fills its variable before an actual
		// instance is created, so the storeSettings hasn't been initiated yet.
		// This constructor, on the other hand, can only happen after the
		// spacePromise has resolved.
		ControlPanel.isTimeAdvancing = getASetting('frameSettings', 'isTimeAdvancing');
	}

	/* ******************************************************* start/stop */

	// set freq of frame, which is 1, 2, 4, 8, ... some float number of times per second you want frames.
	// freq is how the CPToolbar handles it, but we keep the period in the ControlPanel state,
	// also in frameSettings:framePeriod
	setFrameFrequency =
	freq =>{
		// set it in the settings, controlpanel state, and SquishPanel's state, too.
		let period = 1000. / +freq;
		this.setState({framePeriod: storeASetting('frameSettings', 'framePeriod', period)});
		this.props.setFramePeriod(period);  // so squish panel can adjust the heartbeat
		// NO!  the grinder doesn't use this; squishpanel does.  this.grinder.framePeriod = period;
	}

	// the first time, we get it from the settings.  in the constructor.
	static isTimeAdvancing = false;

	static startAnimating() {
		ControlPanel.isTimeAdvancing = storeASetting('frameSettings', 'isTimeAdvancing', true);;
		ControlPanel.me.setState({isTimeAdvancing: true});
	}

	static stopAnimating() {
		ControlPanel.isTimeAdvancing = storeASetting('frameSettings', 'isTimeAdvancing', false);
		ControlPanel.me.setState({isTimeAdvancing: false});
	}

	static startStop() {
		if (ControlPanel.isTimeAdvancing)
			ControlPanel.stopAnimating();
		else
			ControlPanel.startAnimating();
	}

	static singleFrame() {
		SquishPanel.me.integrateOneFrame(true);
		ControlPanel.stopAnimating();
	}

	/* ********************************************** wave & pot */

	// used to set any familiarParam value, pass eg {pulseWidth: 40}
	// Sets state in control panel only, eg setWave panel settings
	// obsolete; get rid of this someday////
	setCPState =
	(obj) => {
		this.setState(obj);
	}

	// given these params, put it into effect and display it
	setAndPaintMainWave =
	waveParams => {
		const p = this.props;
		if (!this.space)
			return;

		const mainEWave = this.space.mainEWave;
		mainEWave.setFamiliarWave(waveParams);  // eSpace does this initially
		qe.grinder_copyFromAvatar(this.grinder.pointer, this.mainEAvatar.pointer);
		p.redrawWholeMainWave();
	}

	// toolbar: reset wave button.  Display it from saved params
	resetMainWave =
	() => {
		let waveParams = getAGroup('waveParams');
		this.setAndPaintMainWave(waveParams);
	}

	// SetWave button in SetWaveTab: set it from passed in params, and save it
	saveMainWave =
	waveParams => {
		this.setAndPaintMainWave(waveParams);
		storeAGroup('waveParams', waveParams);
	}


	// fills in the voltage buffer with values according to the voltageParams
	// called when user clicks Canyon voltage or Flat voltage
	//setVoltageHandler =
	//() => {
	//	const {canyonPower, canyonScale, canyonOffset} = this.state;
	//
	//	// actually sets buffer
	//	this.props.populateFamiliarVoltage({canyonPower, canyonScale, canyonOffset});
	//
	//}

	setShowingTab =
	tabCode => {
		this.setState({showingTab: storeASetting('miscSettings', 'showingTab', tabCode)});
	}


	/* ********************************************** frame */

	// dt is time per step, for the algorithm; deltaT is time per frame, the user/UI control)
	setDeltaT = deltaT => {
		deltaT = storeASetting('frameSettings', 'deltaT', deltaT);
		this.setState({deltaT});
		this.grinder.dt = deltaT / (this.state.stepsPerFrame + N_EXTRA_STEPS);  // always one more!
	}

	setStepsPerFrame =
	stepsPerFrame => {
		try {
			if (traceSetPanels) console.log(`js setStepsPerFrame(${stepsPerFrame})`);
			storeASetting('frameSettings', 'stepsPerFrame', stepsPerFrame);
			this.setState({stepsPerFrame});
			this.grinder.stepsPerFrame = stepsPerFrame;
		} catch (ex) {
			// eslint-disable-next-line no-ex-assign
			ex = interpretCppException(ex);
			console.error(`setStepsPerFrame error:`,
				ex.stack ?? ex.message ?? ex);
			////debugger;
		}
	}

	// sets the LPF in both SPanel state AND in the C++ area
	setLowPassFilter =
	lowPassFilter => {
		if (traceSetPanels) console.log(`js setLowPassFilter(${lowPassFilter})`)

		let lpf = storeASetting('frameSettings', 'lowPassFilter', lowPassFilter);
		this.setState({lowPassFilter: lpf});

		// here's where it converts from percent to the C++ style integer number of freqs
		this.grinder.lowPassFilter = Math.round(lpf / 200 * this.state.N);
	}



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
			return <SetVoltageTab
				voltageParams={{ canyonPower, canyonScale, canyonOffset,}}
				setCPState={this.setCPState}
				toggleShowVoltage={p.toggleShowVoltage}
				showVoltage={p.showVoltage}
				tellMeWhenVoltsChanged={p.tellMeWhenVoltsChanged}
			/>;

		case 'space':
			return <SetResolutionTab />;

		case 'integrate':
			return <SetIntegrationTab
				deltaT={s.deltaT}
				setDeltaT={this.setDeltaT}
				stepsPerFrame={s.stepsPerFrame}
				setStepsPerFrame={this.setStepsPerFrame}
				lowPassFilter={s.lowPassFilter}
				setLowPassFilter={this.setLowPassFilter}

				N={this.N}
				iStats={p.iStats}
			/>;

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

				isTimeAdvancing={ControlPanel.isTimeAdvancing}

				resetMainWave={this.resetMainWave}
				toggleShowVoltage={p.toggleShowVoltage}
				showVoltage={p.showVoltage}

				N={this.N}
				space={this.space}
			/>
			<div className='cpSecondRow'>
				<ul className='TabBar' >
					<li className={s.showingTab == 'wave' ? 'selected' : ''} key='wave'
						onClick={ev => this.setShowingTab('wave')}>Wave</li>
					<li  className={s.showingTab == 'voltage' ? 'selected' : ''} key='voltage'
						onClick={ev => this.setShowingTab('voltage')}>Voltage</li>
					<li  className={s.showingTab == 'space' ? 'selected' : ''} key='space'
						onClick={ev => this.setShowingTab('space')}>Space</li>
					<li  className={s.showingTab == 'integrate' ? 'selected' : ''} key='integrate'
						onClick={ev => this.setShowingTab('integrate')}>Integration</li>
				</ul>
				<div className='tabFrame'>
					{showingTabHtml}
				</div>
			</div>
		</div>;
	}
}

export default ControlPanel;
