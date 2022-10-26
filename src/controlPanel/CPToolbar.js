/*
** control panel toolbar -- toolbar immediately below WaveView
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import PropTypes from 'prop-types';
//import qe from '../engine/qe';
import eSpace from '../engine/eSpace';

function setPT() {
	CPToolbar.propTypes = {
		// clicks on start/stop/single buttons
		startStop: PropTypes.func.isRequired,
		singleIteration: PropTypes.func.isRequired,

		// tells if simulation is iterating
		isTimeAdvancing: PropTypes.bool.isRequired,
		resetCounters: PropTypes.func.isRequired,

		iterateFrequency: PropTypes.number.isRequired,
		setIterateFrequency: PropTypes.func.isRequired,
		N: PropTypes.number.isRequired,
		space: PropTypes.instanceOf(eSpace),
	};
}

function clickOnFFT(space)
{
	// space not there until space promise, but that should happen before anybody clicks on this
	if (space)
		space.mainEAvatar.askForFFT();
		//qe.avatar_askForFFT(space.mainEAvatar);
}

function CPToolbar(props) {
	const {iterateFrequency, setIterateFrequency,
		isTimeAdvancing} = props;

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
	const apparentFrequency = (iterateFrequency >= 1)
		? Math.round(iterateFrequency)
		: (1 / Math.round(1 / iterateFrequency)).toFixed(3);

	return <div className='CPToolbar'>
		<div className='frameRateBox'>
			frame rate:<br />
			<select className='rateSelector' value={apparentFrequency}
					onChange={ev => setIterateFrequency(ev.currentTarget.value)}>
				{repRates}
			</select>
		</div>


		<button className={`startStopToggle toolbarButton toolbarGradient`}
			onClick={props.startStop}>
			{ isTimeAdvancing
				? <span><big>&nbsp;</big>▐▐ <big>&nbsp;</big></span>
				: <big>►</big> }
		</button>



		<button className={`stepButton toolbarButton toolbarGradient `}
			onClick={props.singleIteration}>
			<big>►</big> ▌
		</button>

		<div className='toolbarThing'>
			{props.N} states &nbsp;
		</div>

		<button onClick={ev => clickOnFFT(props.space)}>
			FFT
		</button>
		<button onClick={props.resetCounters}>Reset Counters</button>

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
