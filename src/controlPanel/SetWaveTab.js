/*
** SetWave tab -- render the Wave tab on the control panel
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';
import {scaleLinear} from 'd3-scale';


//import MiniGraph from './MiniGraph.js';
//import eSpace from '../engine/eSpace.js';
import GLView from '../gl/GLView.js';

// import eWave from '../engine/eWave.js';
// import eCx from '../engine/eCx.js';
// import cxToRgb from '../view/cxToRgb.js';
//import cx2rgb from '../gl/cx2rgb/cx2rgb.txlated.js';
import TextNSlider from '../widgets/TextNSlider.js';
import {} from '../utils/storeSettings.js';
//import {getASetting, storeASetting, getAGroup, storeAGroup, alternateMinMaxs} from '../utils/storeSettings.js';
import {getAGroup, alternateMinMaxs} from '../utils/storeSettings.js';
//import {storeASetting, alternateMinMaxs} from '../utils/storeSettings.js';

import {eSpaceCreatedPromise} from '../engine/eEngine.js';
import {interpretCppException} from '../utils/errors.js';


//let debugWaveTab = false;

// fixed size GLView
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
			pulseOffset: PropTypes.number,
		}).isRequired,

		// sets it only in the ControlPanel state for subsequent SetWave click
		setCPState: PropTypes.func,

		// no big deal if it's not constructed yet; we fake it
		space: PropTypes.object,
	};
}

// a component that renders the Wave tab, to set a new wave
class SetWaveTab extends React.Component {
	constructor(props) {
		super(props);
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

			// space in the state will allow the GLView to start showing, therefore initializing
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
	setPulseOffset = pulseOffset => {
		this.setState({pulseOffset}, () => this.regenerateMiniGraphWave());
	}

	// canvasFacts is for the big view the the user resizes; the setWave GLView is fixed size
	setCanvasFacts = () => {}

	saveMainWave =
	() => {
		const s = this.state;

		// take other stuff out of the state.  just want the wave params.
		const {waveBreed, waveFrequency, pulseWidth, pulseOffset} = s;
		this.props.saveMainWave({waveBreed, waveFrequency, pulseWidth, pulseOffset});
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

		const sliders = <>
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
				value={+s.pulseOffset}
				min={alternateMinMaxs.waveParams.pulseOffset.min}
				max={alternateMinMaxs.waveParams.pulseOffset.max}
				step={2}
				handleChange={this.setPulseOffset}
			/>

		</>;

		let glView = '';
		if (s.space) {
			glView = <GLView width={MINI_WIDTH} height={MINI_HEIGHT}
						space={s.space} avatar={this.miniGraphAvatar}
						viewClassName='flatViewDef' viewName='setWaveMiniGraph'
						canvasFacts={{width: MINI_WIDTH, height: MINI_HEIGHT}}
						setCanvasFacts={this.setCanvasFacts}
					/>
		}

		const radios = <div className='waveTabCol middle'>
			<label>
				circular
				<input type='radio' checked={'circular' == breed}
					onChange={ev => this.setBreed('circular')} />
			</label>

			<label>
				standing
				<input type='radio'  checked={'standing' == breed}
					onChange={ev => this.setBreed('standing')} />
			</label>

			<label>
				gauss pulse
				<input type='radio'  checked={'gaussian' == breed}
					onChange={ev => this.setBreed('gaussian')} />
			</label>

			{/* sorry don't have time to fix this now     <label>
				chord pulse
				<input type='radio'  checked={'chord' == breed}
					onChange={ev => this.setBreed('chord')} />
			</label>*/}
		</div>;

		return <div className='SetWaveTab'>
			<div className='waveTabCol'>
				<h3>Design a new Wave</h3>
				{sliders}
			</div>

			{radios}

			<div className='waveTabCol'>
				&nbsp;
				<div className='waveMiniGraph'>
					{glView}
				</div>

				<button className='setWaveButton' onClick={ev => this.saveMainWave(this.state)}>
						Set Wave
				</button>

			</div>
		</div>;
	}
}
setPT();

export default SetWaveTab;
