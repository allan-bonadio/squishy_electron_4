/*
** Set Voltage tab -- user can set the voltage to something interesting
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

import {scaleLinear} from 'd3-scale';
//import {path as d3path} from 'd3-path';

// eslint-disable-next-line no-unused-vars
import {setFamiliarVoltage, dumpVoltage} from '../utils/voltageUtils.js';
import eSpace from '../engine/eSpace.js';
import TextNSlider from '../widgets/TextNSlider.js';
import {storeASetting, getASetting, alternateMinMaxs} from '../utils/storeSettings.js';

let miniWidth = 200;
let miniHeight = 100;
let miniDomain = 100;

// the tab that user sets voltage with
class SetVoltageTab extends React.Component {
	static propTypes = {
		space: PropTypes.instanceOf(eSpace),

		// actually sets the one in use by the algorithm
		//setVoltageHandler: PropTypes.func.isRequired,
		toggleShowVoltage: PropTypes.func.isRequired,
		showVoltage: PropTypes.bool.isRequired,

		//voltageParams: PropTypes.shape({
		//	potentialBreed: PropTypes.oneOf(['flat', 'valley', 'double']),
		//	valleyPower: PropTypes.number.isRequired,
		//	valleyScale: PropTypes.number.isRequired,  // NOT the same as voltageFactor; this is JS only
		//	valleyOffset: PropTypes.number.isRequired,  // centered at X
		//}).isRequired,
	};

	constructor(props) {
		super(props);

		// you can use the state as a voltageParams object
		this.state = {
			potentialBreed: getASetting('voltageParams', 'potentialBreed'),
			valleyPower: getASetting('voltageParams', 'valleyPower'),
			valleyScale: getASetting('voltageParams', 'valleyScale'),
			valleyOffset: getASetting('voltageParams', 'valleyOffset'),
		};

		this.voltProto = new Float64Array(miniDomain);
		// ?? this.setScales();
	}

	setScales(minVolts, maxVolts) {
		// x domain is always 0...100 here, regardless of how many data points
		this.xScale = scaleLinear().domain([0, miniDomain]).range([0, miniWidth]);

		// the domain has to be dynamic to autorange the current settings
		this.yScale = scaleLinear().domain([minVolts, maxVolts]).range([0, miniHeight]);
	}

	drawMiniGraph() {
		// someday...
		setFamiliarVoltage(this.space.start, this.space.end, this.voltProto, this.state);

		// yawn ... draw it.  I guess I should rip off some code from VoltageArea huh?
	}

	/* *************************************************************** short term setters */
	// the state keeps the settings before user clicks 'flat' or 'valley'
	setValleyPower =
	valleyPower => {
		this.setState({valleyPower});
		this.drawMiniGraph();
	}
	setValleyScale =
	valleyScale => {
		this.space({valleyScale});
		this.drawMiniGraph();
	}
	setValleyOffset =
	valleyOffset => {
		this.space({valleyOffset});
		this.drawMiniGraph();
	}

	setFlatVoltageHandler =
	(ev) => {
		this.setState({potentialBreed: 'flat'});

		// only NOW do we set it in the localStorage
		storeASetting('voltageParams', 'potentialBreed', 0);
		this.props.space.populateFamiliarVoltage();

		this.updateVoltageArea();
	};

	setValleyVoltageHandler =
	(ev) => {
		this.props.space.populateFamiliarVoltage();

		// only NOW do we set it in the localStorage
		storeASetting('voltageParams', 'potentialBreed', 0);
		storeASetting('voltageParams', 'valleyPower', 0);
		storeASetting('voltageParams', 'valleyScale', 0);
		storeASetting('voltageParams', 'valleyOffset', 50);

		this.updateVoltageArea();
	};

	setDoubleVoltageHandler =
	(ev) => {
		// not yet implemented
	};

	/* *************************************************************** rendering for the Tab */

	renderSliders() {
		const pp = this.props.voltageParams;
		return <>
			<TextNSlider className='powerSlider'  label='Power'
				value={+pp.valleyPower}
				min={alternateMinMaxs.voltageParams.valleyPower.min}
				max={alternateMinMaxs.voltageParams.valleyPower.max}
				step={.01}
				style={{width: '8em'}}
				handleChange={this.setValleyPower}
			/>

			<br/>
			<TextNSlider className='scaleSlider'  label='Scale'
				value={+pp.valleyScale}
				min={alternateMinMaxs.voltageParams.valleyScale.min}
				max={alternateMinMaxs.voltageParams.valleyScale.max}
				step={.01}
				style={{width: '8em'}}
				handleChange={this.setValleyScale}
			/>

			<br/>
			<TextNSlider className='offsetSlider'  label='Offset %'
				value={+pp.valleyOffset}
				min={alternateMinMaxs.voltageParams.valleyOffset.min}
				max={alternateMinMaxs.voltageParams.valleyOffset.max}
				step={.1}
				style={{width: '8em'}}
				handleChange={this.setValleyOffset}
			/>
			<br/>
		</>;
	}


	render() {
		const p = this.props;

		// remember that set*VoltageHandler is an event handler that gets the params from ControlPanel state
		return <div className='setVoltageTab'>
			<div className='voltageTitlePanel'>
				<h3>Set Voltage</h3>
				<button className='zeroVoltageButton round'
					onClick={this.setFlatVoltageHandler}>
						Reset Voltage
				</button>

			</div>
			<div className='divider' ></div>

			<div className='voltageValleyPanel'>
				{this.renderSliders()}

				<button className='valleyVoltageButton round'
					onClick={p.setValleyVoltageHandler} >
						Set to Valley Voltage
				</button>
			</div>
			<div className='MiniGraph' style={{marginLeft: '500px', color: 'yellow'}}>pot. mini graph goes here</div>
			<div style={{clear: 'left'}} />

			<label style={{float:'right'}}>
				<input type='checkbox' checked={p.showVoltage} onChange={p.toggleShowVoltage} />
				Show Voltage
			</label>

		</div>;
		}
}

export default SetVoltageTab;
