/*
** control panel toolbar -- toolbar immediately below WaveView
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';
import eSpace from '../engine/eSpace.js';
import {ShowVoltageControl} from './SetVoltageTab.js';
import qeConsts from '../engine/qeConsts.js';

let traceCPToolbar = false;

window.dbLog = console.log;

// frequencies are per second numbers.  We want nice labels.
function optionForFreq(rate) {
	if (qeConsts.FASTEST == rate) {
		return <option value={qeConsts.FASTEST} key={qeConsts.FASTEST}>Fastest</option>;
	}
	else if (rate > 1) {
		// 1 per sec or more - phrase it this way
		return <option value={rate} key={rate}>{rate} per sec</option>;
	}
	else if (rate == 1) {
		// 1 per sec or more - phrase it this way
		return <option value={rate} key={rate}>once per sec</option>;
	}
	else {
		return <option value={rate} key={rate}>every {1 / rate} sec</option>;
	}
}

function setPT() {
	CPToolbar.propTypes = {
		chosenRate: PropTypes.number.isRequired,
		setChosenRate: PropTypes.func.isRequired,
		frameRateMenuFreqs: PropTypes.array,

		shouldBeIntegrating: PropTypes.bool.isRequired,

		// these two might be undefined during startup, so get ready to punt
		N: PropTypes.number,
		space: PropTypes.instanceOf(eSpace),

		resetWave: PropTypes.func.isRequired,
		resetVoltage: PropTypes.func.isRequired,
		changeShowVoltage: PropTypes.func.isRequired,
		showVoltage: PropTypes.string.isRequired,
	};
}

function CPToolbar(props) {
	if (traceCPToolbar)
		dbLog(`🧰 CPToolbar(props=`, props, `) `);
	let {chosenRate, setChosenRate, frameRateMenuFreqs} = props;

	// early on, the animator isn't there, nor this variable, so supply a lame but effective default
	frameRateMenuFreqs ??= [60, 8, 1, 1/60];

	// these are just startup defaults; see sAnimator.js for how it's actually set based on scan rate
	const rateOptions = frameRateMenuFreqs.map(freq => optionForFreq(freq));

	let runningClass = props.shouldBeIntegrating ? 'running' : '';
	return <div className='CPToolbar'>
		<div className='frameRateBox'>
			frame rate:<br />
			<select className='rateSelector' name='rateSelector' value={chosenRate}
					onChange={ev => setChosenRate(ev.currentTarget.value)} >
				{rateOptions}
			</select>
		</div>

		<span className='toolSpacer' style={{width: '.3em'}}></span>

		<button className={`startStopToggle startStopTool ${runningClass}`}
			onClick={ev => {
				if (traceCPToolbar)
					dbLog(`🧰 CPToolbar props.cPanel.startStop -> (props)  props=`, props);
				props.cPanel.startStop(ev)
			}}>
			{ props.shouldBeIntegrating
				? <span><big>&nbsp;</big>▐▐ <big>&nbsp;</big></span>
				: <big>►</big> }
		</button>

		<button className={`stepButton startStopTool`}
			onClick={ev=>{
				if (traceCPToolbar)
					dbLog(`🧰 CPToolbar props.cPanel.singleFrame -> (props)  props=`, props);
				props.cPanel.singleFrame(ev);
			}}>
			<big>►</big> ▌
		</button>

		<span className='toolSpacer' style={{width: '.3em'}}></span>

		<div className='toolbarThing'>
			<div className='toolbarRow'>
				<div className='toolbarThing'>
					resolution {props.N ?? '...'} &nbsp;
				</div>

				<button onClick={props.resetWave}>Start Over</button>
				&nbsp;

				<button onClick={props.resetVoltage}>
					Reset Voltage
				</button>
				&nbsp;
			</div>

			<div className='toolbarRow'>
				&nbsp;

			</div>
		</div>
	</div>;
}

// stuff that I removed and I'm too chicken to delete
// 				<ShowVoltageControl showVoltage={props.showVoltage}
// 					changeShowVoltage={props.changeShowVoltage} />

// 				<button onClick={ev => this.cPanel.clickOnFFT(props.space)}>
// 					FFT
// 				</button>


setPT();

export default CPToolbar;

