/*
** SetWave tab -- render the Wave tab on the control panel
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

import {scaleLinear} from 'd3-scale';


//import MiniGraph from './MiniGraph';
import eSpace from '../engine/eSpace';
import GLView from '../view/GLView';

// import eWave from '../engine/eWave';
// import eCx from '../engine/eCx';
// import cxToRgb from '../view/cxToRgb';
import TextNSlider from '../widgets/TextNSlider';
import {storeASetting, alternateMinMaxs} from '../utils/storeSettings';

//let debugWaveTab = false;

function setPT() {
	// variables from on high, and the funcs needed to change them
	SetWaveTab.propTypes = {
		origSpace: PropTypes.instanceOf(eSpace),

		// actually sets the one in use by the algorithm
		setWaveHandler: PropTypes.func.isRequired,

		waveParams: PropTypes.shape({
			frequency: PropTypes.number,
			waveBreed: PropTypes.oneOf(['circular', 'standing', 'gaussian', 'chord', ]),
			// plus others, ignore for this check
		}).isRequired,

		// sets it only in the ControlPanel state for subsequent SetWave click
		setCPState: PropTypes.func,

		createdSpacePromise: PropTypes.instanceOf(Promise).isRequired,
	};
}

// a component that renders the Wave tab
class SetWaveTab extends React.Component {
	miniWidth = 200;
	miniHeight = 100;
	yScale = scaleLinear().range([0, this.miniHeight]);


	// use this in the minigraph.  sets waveRecipe.maxY and waveRecipe.elements as return values
	// Returns a <g element enclosing the juicy stuff
	recipe =
	(miniSpace, waveParams) => {
		// temporarily disabled
		return '';

		//const p = this.props;
// 		const {start, end, N, nPoints} = miniSpace.startEnd2;
//
// 		// keep these buffers around for reuse - a bit faster
// 		if (! this.qewave || this.elements.length != nPoints) {
// 			this.qewave = new eWave(miniSpace);
// 			this.elements = new Array(N);
// 			this.magns = new Float64Array(nPoints/2);
// 		}
//
// 		// generate the values
// 		this.qewave.setFamiliarWave(waveParams);
// 		const wave = this.qewave.wave;
//
// 		// find yMin and yMax
// 		let magn;
// 		let maxY = 4 / N;
// 		for (let ix = start; ix < end; ix += 2) {
// 			magn = this.magns[ix/2] = wave[ix] ** 2 + wave[ix+1] ** 2;
// 			maxY = Math.max(maxY, magn);
//
// 			if (debugWaveTab) console.log(
// 				`miniGraph magn${ix} = '${magn}' `);
// 		}
//
// 		// a bit tighter so we can fit in all the bar widths
// 		const barWidth = this.miniWidth / N;
// 		const halfWidth = barWidth / 2;
// 		const xScale = scaleLinear()
// 			.range([halfWidth, this.miniWidth - halfWidth])
// 			.domain([start/2, end/2-1]);
// 		this.yScale.domain([0, maxY]);  // upside down!
//
// 		//  generate the <path elements
// 		let start1 = start / 2;
// 		for (let ix = start; ix < end; ix += 2) {
// 			let ix1 = ix/2;
// 			let x = xScale(ix1);
// 			let color = cxToRgb(eCx(wave[ix], wave[ix+1]));
// 			magn = this.magns[ix1];
// 			magn = this.yScale(magn);
//
// 			if (debugWaveTab) console.log(
// 				`miniGraph point [${x}] = ${magn}   color = ${color}`);
//
// 			this.elements[ix1 - start1] = <path  d={`M${x},0V${magn}`}
// 				stroke={color} strokeWidth={barWidth} fill='none' key={ix}/>
// 		}
//
// 		return <g className='linePaths' >
// 				{this.elements}
// 			</g>;
	}

	setBreed = breed => {
		this.props.setCPState({waveBreed: storeASetting('waveParams', 'waveBreed', breed)});
	}
	setWaveFrequency = waveFrequency => {
		// set it first so it's limited
		this.props.setCPState({waveFrequency: storeASetting('waveParams', 'waveFrequency', waveFrequency)});
	}
	setPulseWidth = pulseWidth => {
		this.props.setCPState({pulseWidth: storeASetting('waveParams', 'pulseWidth', pulseWidth)});
	}
	setPulseOffset = pulseOffset => {
		this.props.setCPState({pulseOffset: storeASetting('waveParams', 'pulseOffset', pulseOffset)});
	}

	// just like in SsquishPanel
	returnGLFuncs =
	(doRepaint) => {
		this.doRepaint = doRepaint;
	}

	render() {
		const p = this.props;
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


		//debugger;
		return <div className='SetWaveTab'>

			<div className='waveTabCol'>
				<h3>Choose New Wave</h3>
				{sliders}
			</div>

			{radios}

			<div className='waveTabCol'>
				&nbsp;
				<div className='waveMiniGraph'>
					<GLView width={300} height={200}
						returnGLFuncs={this.returnGLFuncs}
						createdSpacePromise={p.createdSpacePromise}
						viewClassName='flatDrawingViewDef' viewName='waveExample' />


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

//	<MiniGraph recipe={this.recipe} width={this.miniWidth} height={this.miniHeight}
//		className='SetWaveGraph'
//		familiarParams={p.waveParams} origSpace={p.origSpace}/>
