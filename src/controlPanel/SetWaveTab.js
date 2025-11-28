/*
** SetWave tab -- render the Wave tab on the control panel
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import React, {useRef, useEffect} from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';
import {scaleLinear} from 'd3-scale';


import GLScene from '../gl/GLScene.js';
import TextNSlider from '../widgets/TextNSlider.js';
import {getAGroup, alternateMinMaxs} from '../utils/storeSettings.js';

import {eSpaceCreatedPromise} from '../engine/eEngine.js';
import {interpretCppException} from '../utils/errors.js';

// fixed size GLScene at start
const MINI_WIDTH = 300;
const MINI_HEIGHT = 150;

let traceRegenerate = false;

function setPT() {
	// variables from on high, and the funcs needed to change them
	SetWaveTab.propTypes = {
		// actually sets the one in use by the main wave
		saveMainWave: PropTypes.func.isRequired,

		// pararams/settings handed in, as stored in control panel's state
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

// a component that renders the Set Wave tab, to set a new wave
function SetWaveTab(props) {
	cfpt(SetWaveTab, props);
	let {saveMainWave, waveParams, setWaveParams, space} = props;

	// must remember our own temp wave for minigraph
	const minigraphWaveRef = useRef(null);
	if (!minigraphWaveRef.current)
		minigraphWaveRef.current = new eCavity(props.space, 'minigraphWave');
	let minigraphWave = minigraphWaveRef.current;

	// must remember our repaint func
	const minigraphRepaintRef = useRef(null);
	let minigraphRepaint = minigraphRepaintRef.current;

	// GLScene ultimately calls this to hand us the minigraph repaint function
	function setMinigraphRepaint(repaint) {
		minigraphRepaintRef.current = minigraphRepaint = repaint;
		minigraphRepaint.sceneName = 'mgRepaint';  // for debugging
	}


	// set the captive miniGraph wave to the new settings,
	// after user changed one. this will do a GL draw.
	function regenerateMiniGraphWave() {
		// set the minigraphWave even if you can't draw it.  Redundant AGAIN!?!?
		minigraphWave.setFamiliarWave(waveParams);

		if (traceRegenerate)
			console.log(`Regenerating WaveTab minigraph.  params: `, waveParams);

		if (minigraphRepaint) {
			minigraphRepaint();
			if (traceRegenerate)
				console.log(`the minigraph wave after setFamiliarWave() & repaint`, minigraphWave);
		}
		else {
			if (traceRegenerate)
				console.log(` minigraph not painted because no minigraphRepaint()`, minigraphWave);
		}
	}

	// set any combination of the wave params, in the Control Panel state.
	// then repaint the minigraph
	function setAndRegenerate(wp) {
		setWaveParams(wp);

		// set it in our local copy so it draws the latest.  isn't this redundant with setWaveParams?
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
	const alongThe = (breed == 'gaussian')
		? 'pulse width'
		: "whole cavity length"

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
			title={`how many cycles your wave should have, along the ${alongThe}`}
		/>

		<TextNSlider className='pulseWidth' label='pulse width, %'
			style={{display: needPulseWidth ? 'block' :  'none'}}
			value={+waveParams.pulseWidth}
			min={alternateMinMaxs.waveParams.pulseWidth.min}
			max={alternateMinMaxs.waveParams.pulseWidth.max}
			step={.1}
			handleChange={setPulseWidth}
			title="how fat your  wave packet should be, percent of whole cavity length"
		/>

		<TextNSlider className='offset' label='offset, %'
			style={{display: needOffset ? 'block' :  'none'}}
			value={+waveParams.pulseCenter}
			min={alternateMinMaxs.waveParams.pulseCenter.min}
			max={alternateMinMaxs.waveParams.pulseCenter.max}
			step={2}
			handleChange={setPulseCenter}
			title="where do you want the center of the hump to be, from left side"
		/>
	</>;

	// the minigraph
	const glScene = <GLScene
		space={space}
		sceneClassName='flatScene' sceneName='swMiniGraph'
		inputInfo={[minigraphWave]}
		canvasInnerWidth={MINI_WIDTH}
		canvasInnerHeight={MINI_HEIGHT}
		setGLRepaint={setMinigraphRepaint}
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

		<label title='two identical waves traveling in opposite directions, superimposed'>
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

	// this will happen after the render
	useEffect(() => {
		regenerateMiniGraphWave();
		return () => {};
	});

	return <div className='SetWaveTab  controlPanelPanel'
			title="Use this tab to set the main wave, and save these parameters for next time.">
		<h3>Design a new Wave</h3>
		<div className='waveTabCol '>
			{breedSelector}
			<button className='setWaveButton'
					onClick={ev => saveMainWave(waveParams)}
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
