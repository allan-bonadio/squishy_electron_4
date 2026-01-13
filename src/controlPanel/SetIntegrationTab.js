/*
** SetIntegrationTab -- tab for adjusting dtFactor, etc
** Copyright (C) 2022-2026 Tactile Interactive, all rights reserved
*/

import PropTypes from 'prop-types';
import LogSlider from '../widgets/LogSlider.js';
import TextNSlider from '../widgets/TextNSlider.js';
import {getASetting, alternateMinMaxs} from '../utils/storeSettings.js';
import InteStats from './InteStats.js';

let traceSliderChanges = false;

// set prop types
const propTypes = {
		// only present after eSpace promise
		space: PropTypes.shape({
			pointer: PropTypes.number,
			dimensions: PropTypes.arrayOf(PropTypes.object).isRequired,
		}),

		getQuickDtFactor: PropTypes.func.isRequired,
		setQuickDtFactor: PropTypes.func.isRequired,
		saveDtFactor: PropTypes.func.isRequired,
		//setDtFactor: PropTypes.func.isRequired,
		//stepsPerLap: PropTypes.number.isRequired,
		//setStepsPerLap: PropTypes.func.isRequired,
		//lowPassFilter: PropTypes.number.isRequired,
		//setLowPassFilter: PropTypes.func.isRequired,
	};



function SetIntegrationTab(props) {
	cfpt(propTypes, props);
	// lowPassFilter, the number setting.  On the JS side, it's a percentage of N/2:
	// and can range from 200/N (nyquist only) to 75
	// so when N=16, user can set lowPass to 12.5 ... 75 percents = 1 to 6 freqs
	// when N=64, ranges from 3.1% to 75%

	// step between valid settings, and also the minimum setting, where you just
	// filter off Nyquist.  Think of this like 100 * ( 1 / (N/2))
	const N = getASetting('spaceParams', 'N');
//	const lowPassStep = 200 / N;

	const nDigits = (N < 150) ? 0 : ((N < 600) ? 1 : 2);
	// ...Math.max(0, 1 -Math.ceil(Math.log10(lowPassStep)));

	// as user drags slider
	const handleChange = (power, ix) => {
		if (traceSliderChanges)
			console.log(`🏃🏽 🏃🏽 ch dtFactor ix=${ix}  power=${power}`);
		props.setQuickDtFactor(power);
	}

	// when user lifts up, they're done (for now) so save it
	const handlePointerUp = (ev) => {
		props.saveDtFactor();
	}

	// Unlike other tabs, all these are instant-update.

	let mini = alternateMinMaxs.lapSettings.dtFactor.min;
	let maxi = alternateMinMaxs.lapSettings.dtFactor.max;

	return (<div className='SetIntegrationTab controlPanelPanel'>
		<div className='sliderBlock'>
			<h3>Integration Controls</h3>

			<p className='discussion'>
			Schrodinger's equation can diverge (explode) into high frequencies,
			ruining a simulation.
			In order to guarantee convergence (not exploding),
			we must use a time increment, <i>∆t</i>, small enough, according to the
			von Neumann stability criteria.
			This might lead to very slow integration.
			You can speed this up a bit by bending the rules and
			stretching <i>∆t</i>, at the risk of diverging.
			</p>

			<LogSlider
				unique='dtFactorSlider'
				className='dtFactorSlider cpSlider'
				label='stretch factor for time increment'
				minLabel={mini}
				maxLabel={maxi}

				current={props.getQuickDtFactor()}
				sliderMin={mini}
				sliderMax={maxi}
				stepsPerDecade={6}

				handleChange={handleChange}

				handlePointerUp={handlePointerUp}
			/>

		</div>

		<InteStats />

	</div>);
}



// leftover scraps - delete this soon jun'25
//{
//	<InteStats />
//}

/*
			<LogSlider
				unique='stepsPerLapSlider'
				className='stepsPerLapSlider cpSlider'
				label='steps Per Frame'
				minLabel='faster'
				maxLabel='smoother'

				current={props.stepsPerLap}
				sliderMin={alternateMinMaxs.lapSettings.stepsPerLap.min}
				sliderMax={alternateMinMaxs.lapSettings.stepsPerLap.max}
				stepsPerDecade={6}

				// indices 2, 3 & 4 map to these numbers, next is [5]=8, [6]=10
				// then we skip to [7]=14 instead of 15
				substitutes={[ , , 2, 4, 6, , , 14]}

				handleChange={(power, ix) => {
					if (traceSliderChanges)
						console.log(`🏃🏽 🏃🏽 ch stepsPerLap::  ix=${ix}  power=${power}`);
					props.setStepsPerLap(power);
				}}
			/>

			<TextNSlider className='lowPassFilterSlider '
				label='Percent of High Frequencies to Filter Out'
				value={props.lowPassFilter.toFixed(nDigits)}
				min={alternateMinMaxs.lapSettings.lowPassFilter.min}
				max={alternateMinMaxs.lapSettings.lowPassFilter.max}
				step={lowPassStep}
				style={{width: '80%'}}
				handleChange={newValue => {
						if (traceSliderChanges)
							console.log(`🏃🏽 🏃🏽 ch Low Pass Filter:: ${newValue}  `);
						props.setLowPassFilter(+newValue);
					}}
			/>

*/


// 				<tr><td>reload GL variables:     </td><td><span  className='reloadGlInputs'>-</span> ms</td></tr>


export default SetIntegrationTab;

