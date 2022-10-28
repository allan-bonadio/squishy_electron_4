/*
** SetWave tab -- render the Wave tab on the control panel
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';
import {scaleLinear} from 'd3-scale';


//import MiniGraph from './MiniGraph';
//import eSpace from '../engine/eSpace';
import GLView from '../view/GLView';

// import eWave from '../engine/eWave';
// import eCx from '../engine/eCx';
// import cxToRgb from '../view/cxToRgb';
import TextNSlider from '../widgets/TextNSlider';
import {alternateMinMaxs} from '../utils/storeSettings';
//import {storeASetting, alternateMinMaxs} from '../utils/storeSettings';

//import salientPointersFactory from './salientPointersFactory';
import {eSpaceCreatedPromise} from '../engine/eEngine';
import {interpretCppException} from '../utils/errors';


//let debugWaveTab = false;

function setPT() {
	// variables from on high, and the funcs needed to change them
	SetWaveTab.propTypes = {
		// actually sets the one in use by the algorithm
		setMainWave: PropTypes.func.isRequired,

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

		// these change  as user changes stuff, so often differs from props
		Object.assign(this.state, props.waveParams);

		// nobody will set the wave before the space is created!!
		eSpaceCreatedPromise
		.then(space => {
			// if the space has been created, so has all the stuff hanging off it
			this.miniGraphAvatar = space.miniGraphAvatar;
			this.miniGraphEWave = this.miniGraphAvatar.ewave;
			//this.miniGraphVBuffer = this.miniGraphAvatar.vBuffer;

			// space in the state will allow the GLView to start showing, therefore initializing
			this.setState({space});
		})
		.catch(ex => {
			ex = interpretCppException(ex);
			console.error(ex.stack || ex.message || ex);
			//debugger;
		});
	}
	miniWidth = 300;
	miniHeight = 150;
	yScale = scaleLinear().range([0, this.miniHeight]);

	// set the captive minGraph wave to the new settings, after user changed one.
	// Since the state was also changed, we'll do a render.  but this will do a GL draw.
	regenerateMiniGraphWave() {
		if (!this.state.space) return;  // too soon
		this.miniGraphEWave.setFamiliarWave(this.state);
		this.miniGraphAvatar.reStartDrawing();
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
			glView = <GLView width={this.miniWidth} height={this.miniHeight}
						space={s.space} avatar={this.miniGraphAvatar}
						viewClassName='flatDrawingViewDef' viewName='waveMiniGraph'
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

			<label>
				chord pulse
				<input type='radio'  checked={'chord' == breed}
					onChange={ev => this.setBreed('chord')} />
			</label>
		</div>;

		//debugger;
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

				<button className='setWaveButton round' onClick={ev => p.setMainWave(this.state)}>
						Set Wave
				</button>

			</div>
		</div>;
	}

}
setPT();

export default SetWaveTab;

