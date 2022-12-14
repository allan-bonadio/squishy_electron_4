/*
** control panel toolbar -- toolbar immediately below WaveView
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';
import qe from '../engine/qe.js';
import eSpace from '../engine/eSpace.js';
//import SquishPanel from '../SquishPanel.js';
import ControlPanel from './ControlPanel.js';
import {catchEx} from '../utils/errors.js';


//import eThread from '../engine/eThread.js';


function setPT() {
	CPToolbar.propTypes = {
		frameFrequency: PropTypes.number.isRequired,
		setFrameFrequency: PropTypes.func.isRequired,

		// these two might be undefined during startup, so get ready to punt
		N: PropTypes.number,
		space: PropTypes.instanceOf(eSpace),

		resetMainWave: PropTypes.func.isRequired,
		toggleShowVoltage: PropTypes.func.isRequired,
		showVoltage: PropTypes.bool.isRequired,

		isTimeAdvancing: PropTypes.bool.isRequired,  // make sure start/stop button updates
	};
}

function clickOnFFT(space)
{
	catchEx(() => {
		// space not there until space promise, but that should happen before anybody clicks on this
		if (space) {
			console.info(`ControlPanel.isTimeAdvancing=`, ControlPanel.isTimeAdvancing);
			if (ControlPanel.isTimeAdvancing)
				space.grinder.pleaseFFT = true;  // remind me after next iter
			else
				qe.grinder_askForFFT(space.grinder.pointer);  // do it now
		}
	});
}


function CPToolbar(props) {
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
			<select className='rateSelector' value={apparentFrequency}
					onChange={ev => setFrameFrequency(ev.currentTarget.value)}>
				{repRates}
			</select>
		</div>

		<span className='toolSpacer' style={{width: '.3em'}}></span>

		<button className={`startStopToggle startStopTool`}
			onClick={ControlPanel.startStop}>
			{ ControlPanel.isTimeAdvancing
				? <span><big>&nbsp;</big>?????? <big>&nbsp;</big></span>
				: <big>???</big> }
		</button>

		<button className={`stepButton startStopTool`}
			onClick={ControlPanel.singleFrame}>
			<big>???</big> ???
		</button>

		<span className='toolSpacer' style={{width: '.3em'}}></span>

		<div className='toolbarThing'>
			<div className='toolbarRow'>
				<div className='toolbarThing'>
					resolution {props.N ?? '...'} &nbsp;
				</div>

				<button className='round' onClick={props.resetMainWave}>Reset Wave</button>
				&nbsp;

				<button className='round' onClick={props.setVoltageHandler}>
					Reset Voltage
				</button>
				&nbsp;
			</div>

			<div className='toolbarRow'>
				<button className='round' onClick={ev => clickOnFFT(props.space)}>
					FFT
				</button>
				&nbsp;

				<label>
					<input type='checkbox' checked={props.showVoltage} onChange={props.toggleShowVoltage} />
					Show Voltage
				</label>
			</div>
		</div>
	</div>;
}

setPT();

export default CPToolbar;


//
// 		<div className='algorithmBox'>
// 			algorithm:
// 			<select className='algorithmSelector' value={algorithm}
// 					onChange={ev => setAlgorithm(ev.currentTarget.value)}>
// 				<option value={algRK2}>RK2</option>
// 				<option value={algRK4}>RK4</option>
// 				<option value={algVISSCHER}>Visscher</option>
// 			</select>
// 		</div>
