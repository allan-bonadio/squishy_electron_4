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
//import {eSpaceCreatedPromise} from '../engine/eEngine';
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
		//setMainWave: PropTypes.func.isRequired,
		//// this should move into controlPanel from squishPanel
		setPotential: PropTypes.func.isRequired,

		isTimeAdvancing: PropTypes.bool.isRequired,  // ie is it running?

		iterateFrequency: PropTypes.number.isRequired,  // frames per second
		setIterateFrequency: PropTypes.func.isRequired,

		// early on, there's no space.  Must have SquishPanel mounted first, and the eSpace promise resolved.
		space: PropTypes.instanceOf(eSpace),
		N: PropTypes.number.isRequired,

		openResolutionDialog: PropTypes.func.isRequired,

		iStats: PropTypes.shape({
			startIteration: PropTypes.number.isRequired,
			endDraw: PropTypes.number.isRequired,
		}),
		refreshStats: PropTypes.func.isRequired,
	}

	constructor(props) {
		super(props);

		// most of the state is kept here.  But, also, in the store settings
		this.state = {
			// state for the wave resets - these are control-panel only.
			// waveParams - Only change if user clicks setWave

			// the wave params have to be analogous when the N changes
			waveBreed: getASetting('waveParams', 'waveBreed'),
			waveFrequency: getASetting('waveParams', 'waveFrequency'),  // an integer (but a well can have halfs?)
			pulseWidth: getASetting('waveParams', 'pulseWidth'),  // a percentage
			pulseOffset: getASetting('waveParams', 'pulseOffset'),  // also a percentage

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
	setMainWave =
	waveParams => {
		const {waveBreed, waveFrequency, pulseWidth, pulseOffset} = waveParams;

		// even if there's no space yet, let them store settings.  huh?
		if (this.props.space) {
			const mainEWave = this.props.space.mainEWave;
			mainEWave.setFamiliarWave(waveParams);  // eSpace does this initially
			let mainEAvatar = this.props.space.mainEAvatar;
			mainEAvatar.elapsedTime = 0;
			mainEAvatar.iterateSerial = 0;
			mainEAvatar.doRepaint();
		}

		// and now's the time to remember what the user set it at for next time
		storeASetting('waveParams', 'waveBreed', waveBreed);
		storeASetting('waveParams', 'waveFrequency', waveFrequency);
		storeASetting('waveParams', 'pulseWidth', pulseWidth);
		storeASetting('waveParams', 'pulseOffset', pulseOffset);
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
			// setMainWave() called when user clicks SetWave, fills the main wave
			// waveParams handed in are the defaults as stored in storeSettings
			return <SetWaveTab
				setMainWave={this.setMainWave}
				waveParams={{waveBreed, waveFrequency, pulseWidth, pulseOffset,}}
				setCPState={this.setCPState}
				space={p.space}
			/>;

		case 'potential':
			return <SetPotentialTab
				setPotentialHandler={this.setPotentialHandler}
				potentialParams={{ valleyPower, valleyScale, valleyOffset,}}
				setCPState={this.setCPState}
				space={p.space}
			/>;

		case 'space':
			return <SetResolutionTab openResolutionDialog={p.openResolutionDialog} />;

		case 'iteration':
			return <SetIterationTab
				deltaT={p.deltaT}
				setDeltaT={p.setDeltaT}
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
		// why?  this just shows panels and buttons if (!p.space) return '';

		let showingTabHtml = this.createShowingTab();

		return <div className='ControlPanel'>
			<CPToolbar
				isTimeAdvancing={p.isTimeAdvancing}
				startStop={p.startStop}
				singleIteration={p.singleIteration}
				resetCounters={p.resetCounters}

				iterateFrequency={p.iterateFrequency}
				setIterateFrequency={this.setIterateFrequency}Ï

				N={p.N}
				space={p.space}
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
