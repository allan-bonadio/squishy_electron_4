/*
** Control Panel -- all the widgets below the displayed canvas
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

import './ControlPanel.scss';
import CPToolbar from './CPToolbar';
import SetWaveTab from './SetWaveTab';
import SetPotentialTab from './SetPotentialTab';
import SetResolutionTab from './SetResolutionTab';
import SetIterationTab from './SetIterationTab';
import eSpace from '../engine/eSpace';
import {storeASetting} from '../utils/storeSettings';
// import {qeStartPromise} from '../engine/eEngine';
// import qe from '../engine/qe';

import {getASetting} from '../utils/storeSettings';


export class ControlPanel extends React.Component {
	static propTypes = {
		iterateAnimate: PropTypes.func.isRequired,
		startStop: PropTypes.func.isRequired,
		singleIteration: PropTypes.func.isRequired,
		resetCounters: PropTypes.func.isRequired,

		// these are the actual functions that change the main qWave and ultimately
		// the WaveView on the screen
		// when user chooses 'set wave'
		setWave: PropTypes.func.isRequired,
		setPotential: PropTypes.func.isRequired,

		isTimeAdvancing: PropTypes.bool.isRequired,  // ie is it running?

		iterateFrequency: PropTypes.number.isRequired,  // frames per second
		setIterateFrequency: PropTypes.func.isRequired,

		// early on, there's no space.  Must have SquishPanel mounted first.
		space: PropTypes.instanceOf(eSpace),
		N: PropTypes.number.isRequired,

		// waveParams: PropTypes.shape({
		// 	waveBreed: PropTypes.string.isRequired,
		// 	waveFrequency: PropTypes.number.isRequired,
		// 	pulseWidth: PropTypes.number.isRequired,
		// 	pulseOffset: PropTypes.number.isRequired,
		// }).isRequired,
		//
		// potentialParams: PropTypes.shape({
		// 	potentialBreed: PropTypes.string.isRequired,
		// 	valleyPower: PropTypes.number.isRequired,
		// 	valleyScale: PropTypes.number.isRequired,
		// 	valleyOffset: PropTypes.number.isRequired,
		// }),

		openResolutionDialog: PropTypes.func.isRequired,

		iStats: PropTypes.shape({
			startIteration: PropTypes.number.isRequired,
			endDraw: PropTypes.number.isRequired,
		}),
		refreshStats: PropTypes.func.isRequired,
	}

	constructor(props) {
		super(props);

// 		const controls0 = storeSettings.retrieveSettings('controls0');

// 		const rat = storeSettings.retrieveRatify;
// 		const wp = controls0.waveParams || {};
// 		const pp = controls0.potentialParams || {};

		// most of the state is kept here.  But, also, in the store settings
		this.state = {
			// state for the wave resets - these are control-panel only.
			// waveParams - Only goes into effect if we call setWave()

			waveBreed: getASetting('waveParams', 'waveBreed'),

			// an integer (but a well can have halfs?)
			waveFrequency: getASetting('waveParams', 'waveFrequency'),

			// a percentage
			pulseWidth: getASetting('waveParams', 'pulseWidth'),

			// also a percentage
			pulseOffset: getASetting('waveParams', 'pulseOffset'),

			// state for potential resets - control panel only, setPotential()
			//potentialBreed: getASetting('potentialParams', 'potentialBreed'),
			valleyPower: getASetting('potentialParams', 'valleyPower'),
			valleyScale: getASetting('potentialParams', 'valleyScale'),
			valleyOffset: getASetting('potentialParams', 'valleyOffset'),

			showingTab: getASetting('miscParams', 'showingTab'),
		}
	}

	/* *********************************** params */

	// set rate, which is 1, 2, 4, 8, ... some float number of times per second you want frames.
	// can't combine this with 'isRunning' cuz want to remember rate even when stopped
	setIterateFrequency =
	freq => this.props.setIterateFrequency(freq);


	/* ********************************************** wave & pot */

	// used to set any familiarParam value, pass eg {pulseWidth: 40}
	// Sets state in control panel only, eg setWave panel settings
	setCPState =
	(obj) => {
		this.setState(obj);
	}

	// SetWave button
	// this one is an event handler in the wave tab for the SetWave button
	// but squishpanel hands us a more refined function.
	// do not confuse with setCPState or the storeSettings settings
	setWaveHandler =
	ev => {
		const {waveBreed, waveFrequency, pulseWidth, pulseOffset} = this.state;
		this.props.setWave({waveBreed, waveFrequency, pulseWidth, pulseOffset});
	}

	// fills in the potential buffer with values according to the potentialParams
	// called when user clicks Valley potential or Flat potential
	setPotentialHandler =
	() => {
		const {valleyPower, valleyScale, valleyOffset} = this.state;
// 		this.setCPState({
// 			potentialBreed: storeASetting('potentialParams', 'potentialBreed', 'valley')
// 		});

		// actually sets buffer
		this.props.setPotential({valleyPower, valleyScale, valleyOffset});

		// only NOW do we set it in the localStorage
		storeASetting('potentialParams', 'valleyPower', valleyPower);
		storeASetting('potentialParams', 'valleyScale', valleyScale);
		storeASetting('potentialParams', 'valleyOffset', valleyOffset);
	}

	setShowingTab =
	tabCode => {
		this.setState({showingTab: storeASetting('miscParams', 'showingTab', tabCode)});
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
			// setWave we're passed in takes an object with args.  We pass down a
			// function with no args that'll call theother one
			return <SetWaveTab
				setWaveHandler={this.setWaveHandler}
				waveParams={{waveBreed, waveFrequency, pulseWidth, pulseOffset,}}
				setCPState={this.setCPState}
				origSpace={p.space}
			/>;

		case 'potential':
			return <SetPotentialTab
				setPotentialHandler={this.setPotentialHandler}
				potentialParams={{ valleyPower, valleyScale, valleyOffset,}}
				setCPState={this.setCPState}
				origSpace={p.space}
			/>;

		case 'space':
			return <SetResolutionTab openResolutionDialog={p.openResolutionDialog} />;

		case 'iteration':
			return <SetIterationTab
				dt={p.dt}
				setDt={p.setDt}
				stepsPerIteration={p.stepsPerIteration}
				setStepsPerIteration={p.setStepsPerIteration}
				lowPassFilter={p.lowPassFilter}
				setLowPassFilter={p.setLowPassFilter}

				N={p.N}
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
		if (!p.space) return '';

		let showingTabHtml = this.createShowingTab();

		return <div className='ControlPanel'>
			<CPToolbar
				isTimeAdvancing={p.isTimeAdvancing}
				startStop={p.startStop}
				singleIteration={p.singleIteration}
				resetCounters={p.resetCounters}

				iterateFrequency={p.iterateFrequency}
				setIterateFrequency={this.setIterateFrequency}

				N={this.props.N}
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
