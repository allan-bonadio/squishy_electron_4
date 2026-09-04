/*
** SetIntegrationTab -- tab for adjusting dtFactor, etc
** Copyright (C) 2022-2026 Tactile Interactive, all rights reserved
*/

import PropTypes from 'prop-types';
import LogSlider from '../widgets/LogSlider.js';
import TextNSlider from '../widgets/TextNSlider.js';
import {getASetting} from '../utils/storeSettings.js';
import sSettings from '../utils/sSettings.js';
import InteStats from './InteStats.js';

let traceSliderChanges = true;

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

		nyquistWeight: PropTypes.number.isRequired,
		setNyquistWeight: PropTypes.func.isRequired,
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
	const handleDtChange = (power, ix) => {
		if (traceSliderChanges)
			console.log(`🏃🏽 🏃🏽 ch dtFactor ix=${ix}  power=${power}`);
		props.setQuickDtFactor(power / 1000);
	}

	// when user lifts up, they're done (for now) so save it
	const handleDtPointerUp = (ev) => {
		props.saveDtFactor();
	}

	const handleNyChange = (power, ix) => {
		if (traceSliderChanges)
			console.log(`🏃🏽 🏃🏽 ch ny ix=${ix}  power=${power}`);
		props.setNyquistWeight(power);
	}

	// when user lifts up, they're done (for now) so save it
	const handleNyPointerUp = (ev) => {}

	// Unlike other tabs, all these are instant-update.

	let dtMini = sSettings.minMaxes.lapSettings.dtFactor.min * 1000;
	let dtMaxi = sSettings.minMaxes.lapSettings.dtFactor.max * 1000;

	let nyMini = sSettings.minMaxes.lapSettings.nyquistWeight.min;
	let nyMaxi = sSettings.minMaxes.lapSettings.nyquistWeight.max;

	return (<div className='SetIntegrationTab controlPanelPanel'>
		<div className='sliderBlock'>
			<h3>Integration Controls</h3>

			<p className='discussion genDesc'>
			Schrodinger's equation can diverge (explode) into high frequencies,
			ruining a simulation.  Here are some ways you can deal with it.
			</p>

			<h4>∆t</h4>
			<p className='discussion'>
			The time increment, <i>∆t</i>, is crucial.
			In order to guarantee convergence (not exploding),
			it must be small enough for a smooth progression of virtual time.
			But, this might lead to a very slow integration.
			</p>

			<LogSlider
				unique='dtFactorSlider'
				className='dtFactorSlider cpSlider'
				label='∆t'
				minLabel={dtMini}
				maxLabel={dtMaxi}

				currentPower={props.getQuickDtFactor() * 1000}
				nDecimals='0'
				sliderPowerMin={dtMini}
				sliderPowerMax={dtMaxi}
				stepsPerDecade={6}

				handleChange={handleDtChange}

				handlePointerUp={handleDtPointerUp}
			/>


			<h4>Nyquist Filter</h4>
			<p className='discussion nyquistDesc'>
			When a run starts diverging, the first frequency affected is
			the Nyquist frequency, in this case {N/2}.
			This is a notch filter that reduces that frequency.

			</p>

			<LogSlider
				unique='nyquistSlider'
				className='nyquistSlider cpSlider'
				label='filtering out Nyquist'
				minLabel={nyMini}
				maxLabel={nyMaxi}

				currentPower={props.nyquistWeight}
				nDecimals='6'
				sliderPowerMin={nyMini}
				sliderPowerMax={nyMaxi}
				stepsPerDecade={6}

				handleChange={handleNyChange}

				handlePointerUp={handleNyPointerUp}
			/>

		</div>

		<InteStats />

	</div>);
}

export default SetIntegrationTab;

