/*
** SetWave tab -- render the Wave tab on the control panel
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';
import {scaleLinear} from 'd3-scale';


import GLScene from '../gl/GLScene.js';
import TextNSlider from '../widgets/TextNSlider.js';
import {} from '../utils/storeSettings.js';
import {getAGroup, alternateMinMaxs} from '../utils/storeSettings.js';

import {eSpaceCreatedPromise} from '../engine/eEngine.js';
import {interpretCppException} from '../utils/errors.js';

// fixed size GLScene at start
const MINI_WIDTH = 300;
const MINI_HEIGHT = 150;


let traceRegenerate = true;


function setPT() {
	// variables from on high, and the funcs needed to change them
	SetWaveTab.propTypes = {
		// actually sets the one in use by the main wave
		saveMainWave: PropTypes.func.isRequired,

		waveParams: PropTypes.shape({
			// defaults handed in
			waveBreed: PropTypes.oneOf(['circular', 'standing', 'gaussian', 'chord', ]),
			waveFrequency: PropTypes.number,
			pulseWidth: PropTypes.number,
			pulseCenter: PropTypes.number,
		}).isRequired,
		setWaveParams: PropTypes.func,

		// no big deal if it's not constructed yet; we fake it
		space: PropTypes.object,
	};
}

// a component that renders the Wave tab, to set a new wave
function SetWaveTab(props) {
	checkPropTypes(SetWaveTab.propTypes, props, 'prop', 'SetWaveTab');
	let {saveMainWave, waveParams, setWaveParams, space} = props;

	// set the captive minGraph wave to the new settings, after user changed one.
	// this will do a GL draw.
	function regenerateMiniGraphWave() {
		if (traceRegenerate)
			console.log(`Regenerating WaveTab minigraph.  params: `, waveParams);
		space.miniGraphAvatar.ewave.setFamiliarWave(waveParams);
		space.miniGraphAvatar.smoothHighest = 0;
		space.miniGraphAvatar.doRepaint?.();
	}

	// set any combination of the wave params, in the Control Panel state.
	function setAndRegenerate(wp) {
		setWaveParams(wp);

		// set it in our local copy so it draws the latest
		waveParams = {...waveParams, ...wp};
		regenerateMiniGraphWave()
	}

	// the local state is just the temporary settings before user clicks Set Wave
	const setBreed = waveBreed => {
		setAndRegenerate({waveBreed});
	}
	const setWaveFrequency = waveFrequency => {
		setAndRegenerate({waveFrequency});
	}
	const setPulseWidth = pulseWidth => {
		setAndRegenerate({pulseWidth});
	}
	const setPulseCenter = pulseCenter => {
		setAndRegenerate({pulseCenter});
	}

	// some sliders disappear for some breeds
	const breed = waveParams.waveBreed;
	const needPulseWidth = breed == 'gaussian' || breed == 'chord';
	const needOffset = (breed == 'gaussian' || breed == 'chord');

	// don't let them set a freq to Nyquist or beyond
	let highestFrequency = space.nStates / 2 - 1;
	highestFrequency = Math.min(
		alternateMinMaxs.waveParams.waveFrequency.max, highestFrequency);

	// sliders for each param besides breed
	const waveParamSliders = <>
		<TextNSlider className='waveFrequency' label='frequency'
			value={+waveParams.waveFrequency}
			min={-highestFrequency}
			max={highestFrequency}
			step={'standing' == breed ? .5 : 1}
			handleChange={setWaveFrequency}
			title="how many times your wave wraps around the rainbow"
		/>

		<TextNSlider className='pulseWidth' label='pulse width, %'
			style={{display: needPulseWidth ? 'block' :  'none'}}
			value={+waveParams.pulseWidth}
			min={alternateMinMaxs.waveParams.pulseWidth.min}
			max={alternateMinMaxs.waveParams.pulseWidth.max}
			step={.1}
			handleChange={setPulseWidth}
			title="how fat your  wave packet is"
		/>

		<TextNSlider className='offset' label='offset, %'
			style={{display: needOffset ? 'block' :  'none'}}
			value={+waveParams.pulseCenter}
			min={alternateMinMaxs.waveParams.pulseCenter.min}
			max={alternateMinMaxs.waveParams.pulseCenter.max}
			step={2}
			handleChange={setPulseCenter}
			title="where do you want the hump to be"
		/>
	</>;

	// the minigraph
	const glScene = <GLScene
		space={space} avatar={space.miniGraphAvatar}
		sceneClassName='flatScene' sceneName='setWaveMiniGraph'
		canvasInnerWidth={MINI_WIDTH}
		canvasInnerHeight={MINI_HEIGHT}
		specialInfo={{bumperWidth: 0}}
		title="preview of what your wave will look like after clicking Set Wave"
	/>;

	// radio buttons
	const breedSelector = <div className='breedSelector'>
		<label title='a spiral wave, same magnitude everywhere'>
			circular
			<input type='radio' checked={'circular' == breed} name='circular'
				onChange={ev => setBreed('circular')} />
		</label>

		<label title='two identical waves traveling in opposite directions'>
			standing
			<input type='radio'  checked={'standing' == breed} name='standing'
				onChange={ev => setBreed('standing')} />
		</label>

		<label title='a typical wave packet'>
			gauss pulse
			<input type='radio'  checked={'gaussian' == breed} name='gaussian'
				onChange={ev => setBreed('gaussian')} />
		</label>

		{/* sorry don't have time to fix this now     <label>
			chord pulse
			<input type='radio'  checked={'chord' == breed}
				onChange={ev => setBreed('chord')} />
		</label>*/}
	</div>;

	return <div className='SetWaveTab  controlPanelPanel'
			title="This tab will set the main wave, and save it for next time.">
		<h3>Design a new Wave</h3>
		<div className='waveTabCol '>
			{breedSelector}
			<button className='setWaveButton' onClick={ev => saveMainWave(waveParams)}
					title='start using it' >
				Set Wave
			</button>
		</div>

		<div className='waveTabCol'>
			<div className='waveMiniGraph'>
				{glScene}
			</div>
		</div>

		<div className='waveTabCol waveParamSliders'>
			{waveParamSliders}
		</div>
	</div>;
}
setPT();

export default SetWaveTab;
