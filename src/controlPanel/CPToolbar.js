/*
** control panel toolbar -- toolbar immediately below WaveView
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';
import eSpace from '../engine/eSpace.js';

let traceCPToolbar = false;


function setPT() {
	CPToolbar.propTypes = {
		frameFrequency: PropTypes.number.isRequired,
		setFrameFrequency: PropTypes.func.isRequired,

		shouldBeIntegrating: PropTypes.bool.isRequired,

		// these two might be undefined during startup, so get ready to punt
		N: PropTypes.number,
		space: PropTypes.instanceOf(eSpace),

		resetWave: PropTypes.func.isRequired,
		resetVoltage: PropTypes.func.isRequired,
		toggleShowVoltage: PropTypes.func.isRequired,
		showVoltage: PropTypes.bool.isRequired,
	};
}

function CPToolbar(props) {
	if (traceCPToolbar)
		console.info(`CPToolbar(props)  props=`, props);
	const {frameFrequency, setFrameFrequency} = props;

	const repRates = <>
		<option key='60' value='60'>60 per sec</option>
		<option key='30' value='30'>30 per sec</option>
		<option key='20' value='20'>20 per sec</option>
		<option key='10' value='10'>10 per sec</option>
		<option key='8' value='8'>8 per sec</option>
		<option key='6' value='6'>6 per sec</option>
		<option key='4' value='4'>4 per sec</option>
		<option key='3' value='3'>3 per sec</option>
		<option key='2' value='2'>2 per sec</option>
		<option key='1' value='1'>1 per sec</option>
		<option key='.5' value='0.500'>every 2 sec</option>
		<option key='.2' value='0.200'>every 5 sec</option>
		<option key='.1' value='0.100'>every 10 sec</option>
		<option key='.05' value='0.050'>every 20 sec</option>
		<option key='.0166666666' value='0.0166666666'>every minute</option>
	</>;

	// nail this down so roundoff error doesn't spoil everything.
	// It's always of the form n or 1/n where n is an integer
	const apparentFrequency = (frameFrequency >= 1)
		? Math.round(frameFrequency)
		: (1 / Math.round(1 / frameFrequency)).toFixed(3);

	return <div className='CPToolbar'>
		<div className='frameRateBox'>
			frame rate:<br />
			<select className='rateSelector' name='rateSelector' value={apparentFrequency}
					onChange={ev => setFrameFrequency(ev.currentTarget.value)}>
				{repRates}
			</select>
		</div>

		<span className='toolSpacer' style={{width: '.3em'}}></span>

		<button className={`startStopToggle startStopTool`}
			onClick={ev => {
				if (traceCPToolbar)
					console.info(`CPToolbar props.cPanel.startStop -> (props)  props=`, props);
				props.cPanel.startStop(ev)
			}}>
			{ props.space?.grinder.shouldBeIntegrating
				? <span><big>&nbsp;</big>▐▐ <big>&nbsp;</big></span>
				: <big>►</big> }
		</button>

		<button className={`stepButton startStopTool`}
			onClick={ev=>{
				if (traceCPToolbar)
					console.info(`CPToolbar props.cPanel.singleFrame -> (props)  props=`, props);
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
				<button onClick={ev => this.cPanel.clickOnFFT(props.space)}>
					FFT
				</button>
				&nbsp;

				<label>
					<input type='checkbox' checked={props.showVoltage} name='showVoltage'
						onChange={props.toggleShowVoltage} />
					Show Voltage
				</label>
			</div>
		</div>
	</div>;
}

setPT();

export default CPToolbar;

