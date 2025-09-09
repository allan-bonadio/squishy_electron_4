/*
** SetIntegrationTab -- tab for adjusting dtStretch, etc
** Copyright (C) 2022-2025 Tactile Interactive, all rights reserved
*/

//import inteStats from '../controlPanel/inteStats.js';
//import statGlobals from './statGlobals.js';
import PropTypes from 'prop-types';
import LogSlider from '../widgets/LogSlider.js';
import TextNSlider from '../widgets/TextNSlider.js';
import {getASetting, alternateMinMaxs} from '../utils/storeSettings.js';

let traceSliderChanges = false;

// set prop types
function setPT() {
	SetIntegrationTab.propTypes = {
		// only present after eSpace promise
		space: PropTypes.shape({
			pointer: PropTypes.number,
			dimensions: PropTypes.arrayOf(PropTypes.object).isRequired,
		}),

		dtStretch: PropTypes.number.isRequired,
		setDtStretch: PropTypes.func.isRequired,
		//stepsPerFrame: PropTypes.number.isRequired,
		//setStepsPerFrame: PropTypes.func.isRequired,
		//lowPassFilter: PropTypes.number.isRequired,
		//setLowPassFilter: PropTypes.func.isRequired,
	};
}


function SetIntegrationTab(props) {
	cfpt(SetIntegrationTab, props);
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

	// Unlike other tabs, all these are instant-update.

	let mini = alternateMinMaxs.frameSettings.dtStretch.min;
	let maxi = alternateMinMaxs.frameSettings.dtStretch.max;

	return (<div className='SetIntegrationTab controlPanelPanel'>
		<div className='sliderBlock'>
			<h3>Integration Controls</h3>

			<p className='discussion'>
			Schrodinger's equation can diverge (explode) into high frequencies,
			ruining a simulation.
			In order to guarantee convergence (not exploding),
			we must use a time increment, <i>∆t</i>, small enough, according to the
			von Neumann stability criteria.
			This might lead to a very slow integration experience.
			You can speed this up a bit by bending the rules and
			stretching <i>∆t</i>, at the risk of diverging.
			</p>

			<LogSlider
				unique='dtStretchSlider'
				className='dtStretchSlider cpSlider'
				label='stretch factor for ∆t'
				minLabel={mini}
				maxLabel={maxi}

				current={props.dtStretch}
				sliderMin={mini}
				sliderMax={maxi}
				stepsPerDecade={6}

				handleChange={(power, ix) => {
					if (traceSliderChanges)
						console.log(`🏃🏽 🏃🏽 ch dtStretch ix=${ix}  power=${power}`);
					props.setDtStretch(power);
				}}
			/>

		</div>
		{
			props.space?.sInteStats.renderAllStats()
			// why doesn't this show up!??!?!
			//typeof statGlobals != 'undefined' && statGlobals.renderIStats()
		}

	</div>);
}


/*
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

				// indices 2, 3 & 4 map to these numbers, next is [5]=8, [6]=10
				// then we skip to [7]=14 instead of 15
				substitutes={[ , , 2, 4, 6, , , 14]}

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

*/


// 				<tr><td>reload GL variables:     </td><td><span  className='reloadGlInputs'>-</span> ms</td></tr>

setPT();

export default SetIntegrationTab;

