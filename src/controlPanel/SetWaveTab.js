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
		setWaveHandler: PropTypes.func.isRequired,

		waveParams: PropTypes.shape({
			frequency: PropTypes.number,
			waveBreed: PropTypes.oneOf(['circular', 'standing', 'gaussian', 'chord', ]),
			// plus others, ignore for this check
		}).isRequired,

		// sets it only in the ControlPanel state for subsequent SetWave click
		setCPState: PropTypes.func,
	};
}

// a component that renders the Wave tab, to set a new wave
class SetWaveTab extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			space: null,
		};

		// nobody will set the wave before the space is created!!
		eSpaceCreatedPromise
		.then(space => {
			// if the space has been created, so has all the stuff hanging off it
			this.setState({space});
			this.space = space;  // need it now
			this.miniGraphAvatar = space.miniGraphAvatar;
			this.miniGraphWaveBuffer = this.miniGraphAvatar.ewave;
			//this.miniGraphVBuffer = this.miniGraphAvatar.vBuffer;
		})
		.catch(ex => {
			ex = interpretCppException(ex);
			console.error(ex.stack || ex.message || ex);
			debugger;
		});
	}
	miniWidth = 300;
	miniHeight = 150;
	yScale = scaleLinear().range([0, this.miniHeight]);

	// set the captive minGraph wave to the new settings, after user changed one
	setMiniGraphWave() {
		this.miniGraphWaveBuffer.setFamiliarWave(this.props.waveParams);
	}

	// the CP state is just the temporary settings before user clicks Set Wave
	setBreed = waveBreed => {
		this.props.setCPState({waveBreed});
		this.setMiniGraphWave();
	}
	setWaveFrequency = waveFrequency => {
		// set it first so it's limited
		this.props.setCPState({waveFrequency});
		this.setMiniGraphWave();
	}
	setPulseWidth = pulseWidth => {
		this.props.setCPState({pulseWidth});
		this.setMiniGraphWave();
	}
	setPulseOffset = pulseOffset => {
		this.props.setCPState({pulseOffset});
		this.setMiniGraphWave();
	}

	// Get these from the avatar
	//returnGLFuncs =
	//(doRepaint, resetWave, setGeometry) => {
	//	this.doRepaint = doRepaint;
	//	this.resetWave = resetWave;
	//	this.setGeometry = setGeometry;
	//}

	// don't think we need this - when the canvas is created, GLView will rerender
	//setCanvasCreatedPromise =  // unused I guess
	//canvasCreatedPromise => this.canvasCreatedPromise = canvasCreatedPromise;

	render() {
		const p = this.props;
		//const s = this.state;

		// some sliders disappear for some breeds
		const breed = p.waveParams.waveBreed;
		const needPulseWidth = breed == 'gaussian' || breed == 'chord';
		const needOffset = (breed == 'gaussian' || breed == 'chord');

		const sliders = <>
			<TextNSlider className='frequency' label='frequency'
				value={+p.waveParams.waveFrequency}
				min={alternateMinMaxs.waveParams.waveFrequency.min}
				max={alternateMinMaxs.waveParams.waveFrequency.max}
				step={'standing' == breed ? .5 : 1}
				handleChange={this.setWaveFrequency}
			/>

			<TextNSlider className='pulseWidth' label='pulse width, %'
				style={{display: needPulseWidth ? 'block' :  'none'}}
				value={+p.waveParams.pulseWidth}
				min={alternateMinMaxs.waveParams.pulseWidth.min}
				max={alternateMinMaxs.waveParams.pulseWidth.max}
				step={.1}
				handleChange={this.setPulseWidth}
			/>

			<TextNSlider className='offset' label='offset, %'
				style={{display: needOffset ? 'block' :  'none'}}
				value={+p.waveParams.pulseOffset}
				min={alternateMinMaxs.waveParams.pulseOffset.min}
				max={alternateMinMaxs.waveParams.pulseOffset.max}
				step={2}
				handleChange={this.setPulseOffset}
			/>

		</>;


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

		// unlike the main wave, this gets repainted along with the render
		////if (this.miniGraphAvatar && this.miniGraphAvatar.doRepaint)
			this.miniGraphAvatar?.doRepaint?.();

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
					<GLView width={this.miniWidth} height={this.miniHeight}
						space={this.space} avatar={this.miniGraphAvatar}
						viewClassName='flatDrawingViewDef' viewName='waveMiniGraph'
					/>
				</div>

				<button className='setWaveButton round'
					onClick={p.setWaveHandler}>
						Set Wave
				</button>

			</div>
		</div>;
	}

}
setPT();

export default SetWaveTab;

