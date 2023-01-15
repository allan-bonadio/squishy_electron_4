/*
** Set Voltage tab -- user can set the voltage to something interesting
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

//import {scaleLinear} from 'd3-scale';
//import {path as d3path} from 'd3-path';

// eslint-disable-next-line no-unused-vars
import voltDisplay from '../utils/voltDisplay.js';
//import eSpace from '../engine/eSpace.js';
//import TextNSlider from '../widgets/TextNSlider.js';
import {storeASetting, getAGroup, storeAGroup, alternateMinMaxs} from '../utils/storeSettings.js';
import {eSpaceCreatedPromise} from '../engine/eEngine.js';

let miniWidth = 400;
let miniHeight = 200;


// the tab that user sets voltage with
class SetVoltageTab extends React.Component {
	static propTypes = {
		//space: PropTypes.instanceOf(eSpace),

		// actually sets the one in use by the algorithm
		//setVoltageHandler: PropTypes.func.isRequired,
		toggleShowVoltage: PropTypes.func.isRequired,
		showVoltage: PropTypes.bool.isRequired,

		//voltageParams: PropTypes.shape({
		//	voltageBreed: PropTypes.oneOf(['flat', 'valley', 'double']),
		//	valleyPower: PropTypes.number.isRequired,
		//	valleyScale: PropTypes.number.isRequired,  // NOT the same as voltageFactor; this is JS only
		//	valleyOffset: PropTypes.number.isRequired,  // centered at X
		//}).isRequired,
	};

	constructor(props) {
		super(props);

		// This is exactly the voltageParams object.  THEREFORE,
		// don't stick some other stuff into the state!
		this.state = {
		};

		// be prepared.  If this isn't an object, punt
		this.miniVolts = null;
		eSpaceCreatedPromise.then(space => {
debugger;
			this.space = space;

			// used for depicting what the user's selected.  Copy from live one.
			this.exampleBuffer = new Float64Array(space.nPoints);
			voltDisplay.copyVolts(this.exampleBuffer, space.voltageBuffer);
			this.miniVolts = new voltDisplay(space.start, space.end,
				this.exampleBuffer, getAGroup('voltageSettings'));

			// only now set the state, when we're prepared to render
			this.setState(getAGroup('voltageParams'));
		})
	}

	// Set Voltage button
	setVoltage=
	(ev) => {
		if (!this.vInfo)
			return;
debugger;
		voltDisplay.copyVolts(this.space.voltageBuffer, this.exampleBuffer);
		this.vInfo.populateFamiliarVoltage({...this.state});

		// only NOW do we set it in the localStorage
		storeAGroup('voltageParams', this.state);
		this.updateVoltageArea();
	};

	/* *************************************************************** rendering for the Tab */

	renderBreedSelector() {
		const s = this.state;
		const breed = s.voltageBreed ?? 'flat';
		return <div className='breedSelector'>
			<label>
				<input type='radio' className='flatBreed' checked={'flat' == breed}
					onChange={ev => this.setState({voltageBreed: 'flat'}) }/>
				Flat - zero everywhere
			</label>
			<br />
			<label>
				<input type='radio' className='valleyBreed' checked={'valley' == breed}
					onChange={ev => this.setState({voltageBreed: 'valley'})}/>
				Valley - |<var>x</var>|<sup><var>n</var></sup>
			</label>
		</div>;
	}

	renderMiniGraph() {
		// even if you can't draw it, at least reserve the space
		if (!this.miniVolts)
			return <svg width={miniWidth} height={miniHeight} />;
		const s = this.state;
		const v = this.miniVolts;
		//debugger;

		// grab the latest params to fill the buffer
		v.setFamiliarVoltage(this.state);

		// You see, if I did an autorange, the scale will seem to have no effect.  So do this crude version.
		v.heightVolts = 10;
		if (s.valleyScale < 0)
			v.bottomVolts = -10;
		else if (s.valleyScale > 0)
			v.bottomVolts = 0;
		else {
			v.bottomVolts = -5;
		}
		if (s.valleyPower < 0) {
			v.heightVolts /= 100;
			v.bottomVolts /= 100;
		}

		v.setVoltScales(miniWidth, miniHeight, this.space.nPoints);
		let path = v.makeVoltagePathAttribute();

		return <svg className='miniGraph' width={miniWidth} height={miniHeight}  >
			<rect x={0} y={0} width={miniWidth} height={miniHeight} fill='#000' />
			<path d={path} />
		</svg>;

	}

	// wrap the minigraph with sliders on 3 sides
	renderMiniGraphPanel() {
		const p = this.props;
		const s = this.state;
		let vMinsMaxes = alternateMinMaxs.voltageParams;
		let disabled= 'flat' == s.voltageBreed;

		// vertical sliders have zero on the top
		let scaleDisplayN = -(s.valleyScale ?? 0);
		let scaleDisplay = scaleDisplayN.toFixed(3);
		if (scaleDisplayN < 0) scaleDisplay = `(${scaleDisplay})`;

        // for vertical sliders, firefox requires orient=vertical; chrome/safari appearance:slider-vertical.
        // each ignore the other
		return <div className='miniGraphPanel'>
			{/* this is a grid.  first row. */}
			<input type='range' className='valleyPower' orient='vertical' disabled={disabled}
				value={s.valleyPower ?? 0}
				min={vMinsMaxes.valleyPower.min} max={vMinsMaxes.valleyPower.max}
				step={.5}
				onChange={ev => this.setState({valleyPower: ev.target.valueAsNumber})}
			/>

			{this.renderMiniGraph()}

			<input type='range' className='valleyScale' orient='vertical' disabled={disabled}
				value={-(s.valleyScale ?? 0)}
				min={vMinsMaxes.valleyScale.min}
				max={vMinsMaxes.valleyScale.max}
				step='.01'
				onChange={ev => this.setState({valleyScale: -ev.target.valueAsNumber})}
			/>

			{/* second row. */}
			<div className='powerDisplay'>
				<var>x</var><sup> {(s.valleyPower ?? 0).toFixed(1)}</sup>
			</div>

			<input type='range' className='valleyOffset' disabled={disabled}
				value={s.valleyOffset ?? 0}
				min={vMinsMaxes.valleyOffset.min}
				max={vMinsMaxes.valleyOffset.max}
				step={.1}
				onChange={ev => this.setState({valleyOffset: ev.target.valueAsNumber})}
			/>

			<div className='scaleDisplay'>
				×{scaleDisplay}  {/* that's a multiply symbol, not letter x */}
			</div>

		</div>;
	}


	render() {
		const p = this.props;

		// remember that set*VoltageHandler is an event handler that gets the params from ControlPanel state
		return <div className='setVoltageTab'>
			<div className='voltageTitlePanel'>
				<h3>Set Voltage</h3>
				{this.renderBreedSelector()}
				<button onClick={this.setVoltage} >Set Voltage</button>
			</div>

			<div className='divider' ></div>

			{this.renderMiniGraphPanel()}

			<label style={{float:'right'}}>
				<input type='checkbox' checked={p.showVoltage} onChange={p.toggleShowVoltage} />
				Show Voltage
			</label>

		</div>;
		}
}

export default SetVoltageTab;
