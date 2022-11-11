/*
** SetIterationTab -- tab for adjusting deltaT, stepsPerIteration, etc
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

import PropTypes from 'prop-types';
import LogSlider from '../widgets/LogSlider';
import TextNSlider from '../widgets/TextNSlider';
import {alternateMinMaxs} from '../utils/storeSettings';

let traceSliderChanges = false;

// set prop types
function setPT() {
	SetIterationTab.propTypes = {
		deltaT: PropTypes.number.isRequired,
		setDeltaT: PropTypes.func.isRequired,
		stepsPerIteration: PropTypes.number.isRequired,
		setStepsPerIteration: PropTypes.func.isRequired,
		lowPassFilter: PropTypes.number.isRequired,
		setLowPassFilter: PropTypes.func.isRequired,

		// needed for filter
		N: PropTypes.number.isRequired,
	};
}

function SetIterationTab(props) {
	const p = props;
	if (!props)
		debugger;

	// lowPassFilter, the number setting.  On the JS side, it's a percentage of N/2:
	// and can range from 200/N (nyquist only) to 75
	// so when N=16, user can set lowPass to 12.5 ... 75 percents = 1 to 6 freqs
	// when N=64, ranges from 3.1% to 75%

	// step between valid settings, and also the minimum setting, where you just
	// filter off Nyquist.  Think of this like 100 * ( 1 / (N/2))
	const aStep = 200 / p.N;

	// should be 0 if N <= 150, 1 if N = 256...512, 2 above that
	const nDigits = Math.max(0, 1 -Math.ceil(Math.log10(aStep)));

	// Unlike other tabs, all these are instant-update.

	return (<div className='SetIterationTab'>
		<div className='sliderBlock'>
			<h3>Iteration Controls</h3>

			<LogSlider
				unique='deltaTSlider'
				className='deltaTSlider cpSlider'
				label='𝚫t each iteration'
				minLabel='0.01'
				maxLabel='100.0'

				current={props.deltaT}
				sliderMin={alternateMinMaxs.iterationParams.deltaT.min}
				sliderMax={alternateMinMaxs.iterationParams.deltaT.max}
				stepsPerDecade={6}

				handleChange={(power, ix) => {
					if (traceSliderChanges)
						console.log(`🏃🏽 🏃🏽 ch 𝚫t   ix=${ix}  power=${power}`);
					props.setDeltaT(power);
				}}
			/>
			<LogSlider
				unique='stepsPerIterationSlider'
				className='stepsPerIterationSlider cpSlider'
				label='steps Per Iteration'
				minLabel='faster'
				maxLabel='smoother'

				current={props.stepsPerIteration}
				sliderMin={alternateMinMaxs.iterationParams.stepsPerIteration.min}
				sliderMax={alternateMinMaxs.iterationParams.stepsPerIteration.max}
				stepsPerDecade={6}

				handleChange={(power, ix) => {
					if (traceSliderChanges)
						console.log(`🏃🏽 🏃🏽 ch stepsPerIteration::  ix=${ix}  power=${power}`);
					props.setStepsPerIteration(power);
				}}
			/>

			<TextNSlider className='lowPassFilterSlider '
				label='Percent of High Frequencies to Filter Out'
				value={props.lowPassFilter.toFixed(nDigits)}
				min={alternateMinMaxs.iterationParams.lowPassFilter.min}
				max={alternateMinMaxs.iterationParams.lowPassFilter.max}
				step={aStep}
				style={{width: '80%'}}
				handleChange={newValue => {
						if (traceSliderChanges)
							console.log(`🏃🏽 🏃🏽 ch Low Pass Filter:: ${newValue}  `);
						props.setLowPassFilter(+newValue);
					}}
			/>

		</div>
		<div className='iStats'>
			<h3 style={{textAlign: 'left'}}>Iteration Statistics</h3>
			<table><tbody>
				<tr><td>iteration calc time:     </td><td><span  className='iterationCalcTime'>-</span> ms</td></tr>
				<tr><td>reload view variables:     </td><td><span  className='reloadVarsNBuffer'>-</span> ms</td></tr>
				<tr><td>draw:                      </td><td><span  className='drawTime'>-</span> ms</td></tr>
				<tr><td>total for iteration:  </td><td><span  className='totalForIteration'>-</span> ms</td></tr>
				<tr><td>iteration period:  </td><td><span  className='iterationPeriod'>-</span> ms</td></tr>
				<tr><td>iterations per sec:  </td><td><span  className='iterationsPerSec'>-</span>/sec</td></tr>
			</tbody></table>
		</div>
	</div>);
}

// 				<tr><td>reload GL variables:     </td><td><span  className='reloadGlInputs'>-</span> ms</td></tr>

setPT();

export default SetIterationTab;
