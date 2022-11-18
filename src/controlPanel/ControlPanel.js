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
import {getASetting, storeASetting, getAGroup, storeAGroup} from '../utils/storeSettings';
//import {eSpaceCreatedPromise} from '../engine/eEngine';
// import qe from '../engine/qe';

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

		iterateFrequency: PropTypes.number.isRequired,  // frames per second
		setIterateFrequency: PropTypes.func.isRequired,

		// early on, there's no space.  Must have SquishPanel mounted first, and the eSpace promise resolved.
		space: PropTypes.instanceOf(eSpace),
		N: PropTypes.number.isRequired,

		redrawWholeMainWave: PropTypes.func.isRequired,

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
			//waveBreed: getASetting('waveParams', 'waveBreed'),
			//waveFrequency: getASetting('waveParams', 'waveFrequency'),  // an integer (but a well can have halfs?)
			//pulseWidth: getASetting('waveParams', 'pulseWidth'),  // a percentage
			//pulseOffset: getASetting('waveParams', 'pulseOffset'),  // also a percentage

			// state for potential resets - control panel only, setPotential()
			//potentialBreed: getASetting('potentialParams', 'potentialBreed'),
			valleyPower: getASetting('potentialParams', 'valleyPower'),
			valleyScale: getASetting('potentialParams', 'valleyScale'),
			valleyOffset: getASetting('potentialParams', 'valleyOffset'),

			showingTab: getASetting('miscParams', 'showingTab'),
		}

		// pour these directly into the initial state
		let waveParams = getAGroup('waveParams');
		let potentialParams = getAGroup('potentialParams');
		Object.assign(this.state, waveParams, potentialParams);
	}

	/* *********************************** params */

	// set rate, which is 1, 2, 4, 8, ... some float number of times per second you want frames.
	// can't combine this with 'isRunning' cuz want to remember rate even when stopped
	setIterateFrequency =
	freq => this.props.setIterateFrequency(freq);


	/* ********************************************** wave & pot */

	// used to set any familiarParam value, pass eg {pulseWidth: 40}
	// Sets state in control panel only, eg setWave panel settings
	// obsolete; get rid of this someday////
	setCPState =
	(obj) => {
		this.setState(obj);
	}

	// given these params, put it into effect and display it
	displayMainWave =
	waveParams => {
		const p = this.props;
		if (!p.space)
			return;

		const mainEWave = p.space.mainEWave;
		mainEWave.setFamiliarWave(waveParams);  // eSpace does this initially
		p.redrawWholeMainWave();
		//let mainEAvatar = p.space.mainEAvatar;
		//mainEAvatar.reStartDrawing();
		//mainEAvatar.elapsedTime = 0;
		//mainEAvatar.iterateSerial = 0;
		//mainEAvatar.doRepaint();  // only does the GL
	}

	// toolbar: reset wave button.  Display it from saved params
	resetMainWave =
	() => {
		let waveParams = getAGroup('waveParams');
		this.displayMainWave(waveParams);
	}

	// SetWave button in SetWaveTab: set it from passed in params, and save it
	saveMainWave =
	waveParams => {
		this.displayMainWave(waveParams);
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

	slideWave =
	ev => {
		console.info(`slide wave `, ev)
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
				saveMainWave={this.saveMainWave}
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
				toggleShowPotential={p.toggleShowPotential}
				showPotential={p.showPotential}
			/>;

		case 'space':
			return <SetResolutionTab />;

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
				iterateFrequency={p.iterateFrequency}
				setIterateFrequency={this.setIterateFrequency}

				resetMainWave={this.resetMainWave}
				setPotentialHandler={this.setPotentialHandler}
				toggleShowPotential={p.toggleShowPotential}
				showPotential={p.showPotential}
				slideWave={this.slideWave}

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
