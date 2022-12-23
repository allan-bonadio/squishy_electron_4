/*
** SetIntegrationTab -- tab for adjusting deltaT, stepsPerFrame, etc
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

import PropTypes from 'prop-types';
import LogSlider from '../widgets/LogSlider.js';
import TextNSlider from '../widgets/TextNSlider.js';
import {getASetting, alternateMinMaxs} from '../utils/storeSettings.js';

let traceSliderChanges = false;

// set prop types
function setPT() {
	SetIntegrationTab.propTypes = {
		deltaT: PropTypes.number.isRequired,
		setDeltaT: PropTypes.func.isRequired,
		stepsPerFrame: PropTypes.number.isRequired,
		setStepsPerFrame: PropTypes.func.isRequired,
		lowPassFilter: PropTypes.number.isRequired,
		setLowPassFilter: PropTypes.func.isRequired,
	};
}

function SetIntegrationTab(props) {
	// lowPassFilter, the number setting.  On the JS side, it's a percentage of N/2:
	// and can range from 200/N (nyquist only) to 75
	// so when N=16, user can set lowPass to 12.5 ... 75 percents = 1 to 6 freqs
	// when N=64, ranges from 3.1% to 75%

	// step between valid settings, and also the minimum setting, where you just
	// filter off Nyquist.  Think of this like 100 * ( 1 / (N/2))
	const N = getASetting('spaceParams', 'N');
	const lowPassStep = 200 / N;

	const nDigits = (N < 150) ? 0 : ((N < 600) ? 1 : 2);
	// ...Math.max(0, 1 -Math.ceil(Math.log10(lowPassStep)));

	// Unlike other tabs, all these are instant-update.

	return (<div className='SetIntegrationTab'>
		<div className='sliderBlock'>
			<h3>Integration Controls</h3>

			<LogSlider
				unique='deltaTSlider'
				className='deltaTSlider cpSlider'
				label='𝚫t each frame'
				minLabel='0.01'
				maxLabel='100.0'

				current={props.deltaT}
				sliderMin={alternateMinMaxs.frameSettings.deltaT.min}
				sliderMax={alternateMinMaxs.frameSettings.deltaT.max}
				stepsPerDecade={6}

				handleChange={(power, ix) => {
					if (traceSliderChanges)
						console.log(`🏃🏽 🏃🏽 ch 𝚫t   ix=${ix}  power=${power}`);
					props.setDeltaT(power);
				}}
			/>
			<LogSlider
				unique='stepsPerFrameSlider'
				className='stepsPerFrameSlider cpSlider'
				label='steps Per Frame'
				minLabel='faster'
				maxLabel='smoother'

				current={props.stepsPerFrame}
				sliderMin={alternateMinMaxs.frameSettings.stepsPerFrame.min}
				sliderMax={alternateMinMaxs.frameSettings.stepsPerFrame.max}
				stepsPerDecade={6}

				handleChange={(power, ix) => {
					if (traceSliderChanges)
						console.log(`🏃🏽 🏃🏽 ch stepsPerFrame::  ix=${ix}  power=${power}`);
					props.setStepsPerFrame(power);
				}}
			/>

			<TextNSlider className='lowPassFilterSlider '
				label='Percent of High Frequencies to Filter Out'
				value={props.lowPassFilter.toFixed(nDigits)}
				min={alternateMinMaxs.frameSettings.lowPassFilter.min}
				max={alternateMinMaxs.frameSettings.lowPassFilter.max}
				step={lowPassStep}
				style={{width: '80%'}}
				handleChange={newValue => {
						if (traceSliderChanges)
							console.log(`🏃🏽 🏃🏽 ch Low Pass Filter:: ${newValue}  `);
						props.setLowPassFilter(+newValue);
					}}
			/>

		</div>
		<div className='iStats'>
			<h3 style={{textAlign: 'left'}}>Integration Statistics</h3>
			<table><tbody>
				<tr><td>frame calc time:     </td><td><span  className='frameCalcTime'>-</span> ms</td></tr>
				<tr><td>reload view variables:     </td><td><span  className='reloadVarsNBuffer'>-</span> ms</td></tr>
				<tr><td>draw:                      </td><td><span  className='drawTime'>-</span> ms</td></tr>
				<tr><td>total for frame:  </td><td><span  className='totalForIntegration'>-</span> ms</td></tr>
				<tr><td>frame period:  </td><td><span  className='framePeriod'>-</span> ms</td></tr>
				<tr><td>frames per sec:  </td><td><span  className='framesPerSec'>-</span>/sec</td></tr>
			</tbody></table>
		</div>
	</div>);
}

// 				<tr><td>reload GL variables:     </td><td><span  className='reloadGlInputs'>-</span> ms</td></tr>

setPT();

export default SetIntegrationTab;

