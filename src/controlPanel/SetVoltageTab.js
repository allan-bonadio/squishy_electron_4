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
import {storeASetting, alternateMinMaxs} from '../utils/storeSettings.js';

// some typical voltage value, so we can get an idea of how to scale in the graph
//let SOME_POTENTIAL = 0.01;

// set prop types
function setPT() {
	SetVoltageTab.propTypes = {
		space: PropTypes.instanceOf(eSpace),

		// actually sets the one in use by the algorithm
		setVoltageHandler: PropTypes.func.isRequired,
		toggleShowVoltage: PropTypes.func.isRequired,
		showVoltage: PropTypes.bool.isRequired,

		voltageParams: PropTypes.shape({
			//voltageBreed: PropTypes.oneOf(['flat', 'valley',]),
			valleyPower: PropTypes.number.isRequired,
			valleyScale: PropTypes.number.isRequired,  // NOT the same as voltageFactor; this is JS only
			valleyOffset: PropTypes.number.isRequired,
		}).isRequired,
	};
}

// the tab that user sets voltage with
class SetVoltageTab extends React.Component {
	miniWidth = 200;
	miniHeight = 100;
	xScale = scaleLinear().range([0, this.miniWidth]);
	yScale = scaleLinear().range([0, this.miniHeight]);

	/* *************************************************************** short term setters */
	// they keep the settings before user clicks 'flat' or 'valley'
	setValleyPower =
	valleyPower => {
		this.props.setCPState({valleyPower});
		storeASetting('voltageParams', 'valleyPower', valleyPower);
	}
	setValleyScale =
	valleyScale => {
		this.props.setCPState({valleyScale});
		storeASetting('voltageParams', 'valleyScale', valleyScale);
	}
	setValleyOffset =
	valleyOffset => {
		this.props.setCPState({valleyOffset});
		storeASetting('voltageParams', 'valleyOffset', valleyOffset);
	}

	setFlatVoltageHandler =
	(ev) => {
		this.setValleyPower(0);
		this.setValleyScale(0);
		this.setValleyOffset(50);
		storeASetting('voltageParams', 'valleyPower', 0);
		storeASetting('voltageParams', 'valleyScale', 0);
		storeASetting('voltageParams', 'valleyOffset', 50);
		this.props.setVoltageHandler();
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
					onClick={p.setVoltageHandler} >
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
setPT();

export default SetVoltageTab;
