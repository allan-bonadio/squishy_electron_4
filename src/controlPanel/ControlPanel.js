/*
** Control Panel -- all the widgets below the displayed canvas
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

import './ControlPanel.scss';
import CPToolbar from './CPToolbar.js';
import SetWaveTab from './SetWaveTab.js';
import SetPotentialTab from './SetPotentialTab.js';
import SetResolutionTab from './SetResolutionTab.js';
import SetIterationTab from './SetIterationTab.js';
//import eSpace from '../engine/eSpace.js';
import SquishPanel from '../SquishPanel.js';
import {getASetting, storeASetting, getAGroup, storeAGroup} from '../utils/storeSettings.js';
import {eSpaceCreatedPromise} from '../engine/eEngine.js';
import qe from '../engine/qe.js';
import {interpretCppException} from '../utils/errors.js';


let traceSetPanels = false;


// iterations always need specific numbers of steps.  But there's always one more.
// maybe this should be defined in the grinder.  Hey, isn't this really 1/2 step?  cuz it's always dt/2
const N_EXTRA_STEPS = 0.5;


export class ControlPanel extends React.Component {
	static propTypes = {
		iterateAnimate: PropTypes.func.isRequired,

		// these are the actual functions that change the main qWave and ultimately
		// the WaveView on the screen
		// when user chooses 'set wave'
		//// this should move into controlPanel from squishPanel
		setPotential: PropTypes.func.isRequired,
		toggleShowPotential: PropTypes.func.isRequired,
		showPotential: PropTypes.bool.isRequired,

		redrawWholeMainWave: PropTypes.func.isRequired,

		iStats: PropTypes.shape({
			startIteration: PropTypes.number.isRequired,
			endDraw: PropTypes.number.isRequired,
		}),
		refreshStats: PropTypes.func.isRequired,
	}

	constructor(props) {
		super(props);
		ControlPanel.me = this;

		// most of the state is kept here.  But, also, in the store settings
		this.state = {
			iterationPeriod: getASetting('iterationSettings', 'iterationPeriod'),

			// defaults for sliders for deltaT & spi
			deltaT: getASetting('iterationSettings', 'deltaT'),
			stepsPerIteration: getASetting('iterationSettings', 'stepsPerIteration'),
			lowPassFilter: getASetting('iterationSettings', 'lowPassFilter'),

			// state for potential resets - control panel only, setPotential()  see below;...
			//potentialBreed: getASetting('potentialParams', 'potentialBreed'),
			//valleyPower: getASetting('potentialParams', 'valleyPower'),
			//valleyScale: getASetting('potentialParams', 'valleyScale'),
			//valleyOffset: getASetting('potentialParams', 'valleyOffset'),

			showingTab: getASetting('miscSettings', 'showingTab'),

			// waveParams & potential params - see below
		}

		// pour these directly into the initial state.  The control panel saves
		// these params in its state, but they're not saved in localStorage until a user clicks
		// SetWave or SetPotential.
		let waveParams = getAGroup('waveParams');
		let potentialParams = getAGroup('potentialParams');
		Object.assign(this.state, waveParams, potentialParams);

		eSpaceCreatedPromise.then(space => {
			// not much happens without this info
			this.space = space;
			this.N = space.dimensions[0].N;
			this.grinder = space.grinder;
			this.mainEWave = space.mainEWave;

		});

		// the static declaration down below fills its variable before an actual
		// instance is created, so the storeSettings hasn't been initiated yet.
		// This constructor, on the other hand, can only happen after the
		// spacePromise has resolved.
		ControlPanel.isTimeAdvancing = getASetting('iterationSettings', 'isTimeAdvancing');
	}

	/* ******************************************************* start/stop */

	// set freq of iteration, which is 1, 2, 4, 8, ... some float number of times per second you want frames.
	// freq is how the CPToolbar handles it, but we keep the period in the ControlPanel state,
	// also in iterationSettings:iterationPeriod
	setIterateFrequency =
	freq =>{
		// set it in the settings, controlpanel state, and SquishPanel's state, too.
		let period = 1000. / +freq;
		this.setState({iterationPeriod: storeASetting('iterationSettings', 'iterationPeriod', period)});
		this.props.setIterationPeriod(period);  // so squish panel can adjust the heartbeat
		// NO!  the grinder doesn't use this; squishpanel does.  this.grinder.iterationPeriod = period;
	}

	// the first time, we get it from the settings.  in the constructor.
	static isTimeAdvancing = false;

	static startIterating() {
		ControlPanel.isTimeAdvancing = storeASetting('iterationSettings', 'isTimeAdvancing', true);;
		ControlPanel.me.setState({isTimeAdvancing: true});
	}

	static stopIterating() {
		ControlPanel.isTimeAdvancing = storeASetting('iterationSettings', 'isTimeAdvancing', false);
		ControlPanel.me.setState({isTimeAdvancing: false});
	}

	static startStop() {
		if (ControlPanel.isTimeAdvancing)
			ControlPanel.stopIterating();
		else
			ControlPanel.startIterating();
	}

	static singleIteration() {
		SquishPanel.me.iterateOneIteration(true);
		ControlPanel.stopIterating();
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
	paintMainWave =
	waveParams => {
		const p = this.props;
		if (!this.space)
			return;

		const mainEWave = this.space.mainEWave;
		mainEWave.setFamiliarWave(waveParams);  // eSpace does this initially
		qe.grinder_copyFromAvatar(this.grinder.pointer, this.mainEWave.pointer);
		p.redrawWholeMainWave();
	}

	// toolbar: reset wave button.  Display it from saved params
	resetMainWave =
	() => {
		let waveParams = getAGroup('waveParams');
		this.paintMainWave(waveParams);
	}

	// SetWave button in SetWaveTab: set it from passed in params, and save it
	saveMainWave =
	waveParams => {
		this.paintMainWave(waveParams);
		storeAGroup('waveParams', waveParams);
	}


	// fills in the potential buffer with values according to the potentialParams
	// called when user clicks Valley potential or Flat potential
	setPotentialHandler =
	() => {
		const {valleyPower, valleyScale, valleyOffset} = this.state;

		// actually sets buffer
		this.props.setPotential({valleyPower, valleyScale, valleyOffset});

		// only NOW do we set it in the localStorage
		storeASetting('potentialParams', 'valleyPower', valleyPower);
		storeASetting('potentialParams', 'valleyScale', valleyScale);
		storeASetting('potentialParams', 'valleyOffset', valleyOffset);
	}

	setShowingTab =
	tabCode => {
		this.setState({showingTab: storeASetting('miscSettings', 'showingTab', tabCode)});
	}


	/* ********************************************** iteration */

	// dt is time per step, for the algorithm; deltaT is time per iteration, the user/UI control)
	setDeltaT = deltaT => {
		deltaT = storeASetting('iterationSettings', 'deltaT', deltaT);
		this.setState({deltaT});
		this.grinder.dt = deltaT / (this.state.stepsPerIteration + N_EXTRA_STEPS);  // always one more!
	}

	setStepsPerIteration =
	stepsPerIteration => {
		try {
			if (traceSetPanels) console.log(`js setStepsPerIteration(${stepsPerIteration})`);
			storeASetting('iterationSettings', 'stepsPerIteration', stepsPerIteration);
			this.setState({stepsPerIteration});
			this.grinder.stepsPerIteration = stepsPerIteration;
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
		this.grinder.lowPassFilter = Math.round(lpf / 200 * this.state.N);
	}



	/* ********************************************** render  pieces */

	// whichever tab is showing right now
	createShowingTab() {
		const p = this.props;
		const s = this.state;
		const {waveBreed, waveFrequency, pulseWidth, pulseOffset} = s;
		const {valleyPower, valleyScale, valleyOffset} = s;

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

		case 'potential':
			return <SetPotentialTab
				setPotentialHandler={this.setPotentialHandler}
				potentialParams={{ valleyPower, valleyScale, valleyOffset,}}
				setCPState={this.setCPState}
				space={this.space}
				toggleShowPotential={p.toggleShowPotential}
				showPotential={p.showPotential}
			/>;

		case 'space':
			return <SetResolutionTab />;

		case 'iteration':
			return <SetIterationTab
				deltaT={s.deltaT}
				setDeltaT={this.setDeltaT}
				stepsPerIteration={s.stepsPerIteration}
				setStepsPerIteration={this.setStepsPerIteration}
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

		return <div className='ControlPanel'>
			<CPToolbar
				iterateFrequency={1000. / s.iterationPeriod}
				setIterateFrequency={this.setIterateFrequency}

				isTimeAdvancing={ControlPanel.isTimeAdvancing}

				resetMainWave={this.resetMainWave}
				setPotentialHandler={this.setPotentialHandler}
				toggleShowPotential={p.toggleShowPotential}
				showPotential={p.showPotential}

				N={this.N}
				space={this.space}
			/>
			<div className='cpSecondRow'>
				<ul className='TabBar' >
					<li className={s.showingTab == 'wave' ? 'selected' : ''} key='wave'
						onClick={ev => this.setShowingTab('wave')}>Wave</li>
					<li  className={s.showingTab == 'potential' ? 'selected' : ''} key='potential'
						onClick={ev => this.setShowingTab('potential')}>Potential</li>
					<li  className={s.showingTab == 'space' ? 'selected' : ''} key='space'
						onClick={ev => this.setShowingTab('space')}>Space</li>
					<li  className={s.showingTab == 'iteration' ? 'selected' : ''} key='iteration'
						onClick={ev => this.setShowingTab('iteration')}>Iteration</li>
				</ul>
				<div className='tabFrame'>
					{showingTabHtml}
				</div>
			</div>
		</div>;
	}
}

export default ControlPanel;
