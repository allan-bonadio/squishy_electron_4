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


function setPT() {
	// variables from on high, and the funcs needed to change them
	SetWaveTab.propTypes = {
		// actually sets the one in use by the algorithm
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
class SetWaveTab extends React.Component {
	constructor(props) {
		super(props);
		checkPropTypes(this.constructor.propTypes, props, 'prop', this.constructor.name);
		this.state = {
			space: null,
			// also wave params
		};

		// pour these directly into the initial state
		let waveParams = getAGroup('waveParams');
		Object.assign(this.state, waveParams);

		// nobody will set the wave before the space is created!!
		eSpaceCreatedPromise
		.then(space => {
			// if the space has been created, so has all the stuff hanging off it
			this.miniGraphAvatar = space.miniGraphAvatar;
			this.miniGraphEWave = this.miniGraphAvatar.ewave;

			// space in the state will allow the GLScene to start showing, therefore initializing
			this.setState({space});
		})
		.catch(rex => {
			let ex = interpretCppException(rex);
			console.error(ex.stack ?? ex.message ?? ex);
			debugger;
		});
	}
	yScale = scaleLinear().range([0, MINI_HEIGHT]);

	// set the captive minGraph wave to the new settings, after user changed one.
	// Since the state was also changed, we'll do a render.  but this will do a GL draw.
	regenerateMiniGraphWave() {
		if (!this.state.space) return;  // too soon
		this.miniGraphEWave.setFamiliarWave(this.state);
		this.miniGraphAvatar.smoothHighest = 0;
		this.miniGraphAvatar.doRepaint?.();
	}

	// the local state is just the temporary settings before user clicks Set Wave
	setBreed = waveBreed => {
		this.setState({waveBreed}, () => this.regenerateMiniGraphWave());
	}
	setWaveFrequency = waveFrequency => {
		this.setState({waveFrequency}, () => this.regenerateMiniGraphWave());
	}
	setPulseWidth = pulseWidth => {
		this.setState({pulseWidth}, () => this.regenerateMiniGraphWave());
	}
	setPulseCenter = pulseCenter => {
		this.setState({pulseCenter}, () => this.regenerateMiniGraphWave());
	}

	saveMainWave =
	() => {
		const s = this.state;

		// take other stuff out of the state.  just want the wave params.
		const {waveBreed, waveFrequency, pulseWidth, pulseCenter} = s;
		this.props.saveMainWave({waveBreed, waveFrequency, pulseWidth, pulseCenter});
	}

	render() {
		const p = this.props;
		const s = this.state;

		// some sliders disappear for some breeds
		const breed = s.waveBreed;
		const needPulseWidth = breed == 'gaussian' || breed == 'chord';
		const needOffset = (breed == 'gaussian' || breed == 'chord');

		// don't let them set a freq to Nyquist or beyond
		let highestFrequency = p.space ? p.space.nStates / 2 - 1 : Infinity;
		highestFrequency = Math.min(
			alternateMinMaxs.waveParams.waveFrequency.max, highestFrequency);

		const waveParamSliders = <>
			<TextNSlider className='waveFrequency' label='frequency'
				value={+s.waveFrequency}
				min={-highestFrequency}
				max={highestFrequency}
				step={'standing' == breed ? .5 : 1}
				handleChange={this.setWaveFrequency}
			/>

			<TextNSlider className='pulseWidth' label='pulse width, %'
				style={{display: needPulseWidth ? 'block' :  'none'}}
				value={+s.pulseWidth}
				min={alternateMinMaxs.waveParams.pulseWidth.min}
				max={alternateMinMaxs.waveParams.pulseWidth.max}
				step={.1}
				handleChange={this.setPulseWidth}
			/>

			<TextNSlider className='offset' label='offset, %'
				style={{display: needOffset ? 'block' :  'none'}}
				value={+s.pulseCenter}
				min={alternateMinMaxs.waveParams.pulseCenter.min}
				max={alternateMinMaxs.waveParams.pulseCenter.max}
				step={2}
				handleChange={this.setPulseCenter}
			/>

		</>;

		let glScene = '';
		if (s.space) {
			// warning: this +2 is a defined constant in WaveView
			glScene = <GLScene
						space={s.space} avatar={this.miniGraphAvatar}
						sceneClassName='flatScene' sceneName='setWaveMiniGraph'
						canvasInnerWidth={MINI_WIDTH}
						canvasInnerHeight={MINI_HEIGHT}
						specialInfo={{bumperWidth: 0}}
					/>
		}

		const breedSelector = <div className='breedSelector'>
			<label>
				circular
				<input type='radio' checked={'circular' == breed} name='circular'
					onChange={ev => this.setBreed('circular')} />
			</label>

			<label>
				standing
				<input type='radio'  checked={'standing' == breed} name='standing'
					onChange={ev => this.setBreed('standing')} />
			</label>

			<label>
				gauss pulse
				<input type='radio'  checked={'gaussian' == breed} name='gaussian'
					onChange={ev => this.setBreed('gaussian')} />
			</label>

			{/* sorry don't have time to fix this now     <label>
				chord pulse
				<input type='radio'  checked={'chord' == breed}
					onChange={ev => this.setBreed('chord')} />
			</label>*/}
		</div>;

		return <div className='SetWaveTab'>
			<div className='waveTabCol '>
				<h3>Design a<br/>new Wave</h3>
				{breedSelector}
				<button className='setWaveButton' onClick={ev => this.saveMainWave(this.state)}>
						Set Wave
				</button>
			</div>

			<div className='waveTabCol'>
				&nbsp;
				<div className='waveMiniGraph'>
					{glScene}
				</div>

			</div>

			<div className='waveTabCol waveParamSliders'>
				{waveParamSliders}
			</div>
		</div>;
	}
}
setPT();

export default SetWaveTab;
