/*
** Set Potential tab -- user can set the potential to something interesting
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

import {scaleLinear} from 'd3-scale';
//import {path as d3path} from 'd3-path';

// eslint-disable-next-line no-unused-vars
import {setFamiliarPotential, dumpPotential} from '../utils/potentialUtils';
import eSpace from '../engine/eSpace';
import TextNSlider from '../widgets/TextNSlider';
import {storeASetting, alternateMinMaxs} from '../utils/storeSettings';

// some typical potential value, so we can get an idea of how to scale in the graph
//let SOME_POTENTIAL = 0.01;

// set prop types
function setPT() {
	SetPotentialTab.propTypes = {
		space: PropTypes.instanceOf(eSpace),

		// actually sets the one in use by the algorithm
		//setFlatPotentialHandler: PropTypes.func.isRequired,
		setPotentialHandler: PropTypes.func.isRequired,

		potentialParams: PropTypes.shape({
			//potentialBreed: PropTypes.oneOf(['flat', 'valley',]),
			valleyPower: PropTypes.number.isRequired,
			valleyScale: PropTypes.number.isRequired,  // NOT the same as potentialFactor; this is JS only
			valleyOffset: PropTypes.number.isRequired,
		}).isRequired,
	};
}

// the tab that user sets potential with
class SetPotentialTab extends React.Component {
	miniWidth = 200;
	miniHeight = 100;
	xScale = scaleLinear().range([0, this.miniWidth]);
	yScale = scaleLinear().range([0, this.miniHeight]);

	// rendering for the elements of the minitab
	// Returns a <g element enclosing the juicy stuff
	// NOT the main display space, but the minigraph space
//	recipe =
//	(miniSpace, potentialParams) => {
//		//const p = this.props;
//		//const {start, end, N, nPoints} = miniSpace.startEnd;
//
//		// temporarily disabled
//		return '';

		// keep these buffers around for reuse - a bit faster
		// if (! this.potentialArray || this.potentialArray.length != nPoints)
		// 	this.potentialArray = new Float64Array(nPoints);
		// let potentialArray = this.potentialArray;
		//
		// // generate the values
		// setFamiliarPotential(miniSpace, potentialArray, potentialParams);
		//
		// // calc domain
		// let maxY = 0;
		// let minY = 0;  // in case all the other values are zero, which is the default
		// for (let ix = start; ix < end; ix++) {
		// 	minY = Math.min(minY, potentialArray[ix]);
		// 	maxY = Math.max(maxY, potentialArray[ix]);
		// }
		//
		// // make some room in case it's small or zero
		// minY -= SOME_POTENTIAL;
		// maxY += SOME_POTENTIAL;
		//
		// this.xScale.domain([1, N]);
		// this.yScale.domain([maxY, minY]);
		//
		// // generate the points for the <path
		// let pathObj = d3path();
		// //console.info(`point 1 = (${this.xScale(start)}, ${ this.yScale(potentialArray[start])})`)
		// pathObj.moveTo(this.xScale(start),  this.yScale(potentialArray[start]).toFixed(2));
		// for (let ix = start+1; ix < end; ix++) {
		// 	pathObj.lineTo(this.xScale(ix), this.yScale(potentialArray[ix]).toFixed(2));
		// }
		// const d = pathObj.toString();
		// //console.info(`d = ${d}`)
		// //dumpPotential(miniSpace, potentialArray);
		//
		// return <g className='linePaths' >
		// 	<path d={d} stroke='#fff' fill='none'  key='only' strokeWidth={3} />
		// </g>;
//	}

	/* *************************************************************** short term setters */
	// they keep the settings before user clicks 'flat' or 'valley'
	setValleyPower =
	valleyPower => {
		this.props.setCPState({valleyPower});
		storeASetting('potentialParams', 'valleyPower', valleyPower);
	}
	setValleyScale =
	valleyScale => {
		this.props.setCPState({valleyScale});
		storeASetting('potentialParams', 'valleyScale', valleyScale);
	}
	setValleyOffset =
	valleyOffset => {
		this.props.setCPState({valleyOffset});
		storeASetting('potentialParams', 'valleyOffset', valleyOffset);
	}

	setFlatPotentialHandler =
	(ev) => {
		this.setValleyPower(0);
		this.setValleyScale(0);
		this.setValleyOffset(50);
		storeASetting('potentialParams', 'valleyPower', 0);
		storeASetting('potentialParams', 'valleyScale', 0);
		storeASetting('potentialParams', 'valleyOffset', 50);
		this.props.setPotentialHandler();
	};

	/* *************************************************************** rendering for the Tab */

	renderSliders() {
		const pp = this.props.potentialParams;
		return <>
			<TextNSlider className='powerSlider'  label='Power'
				value={+pp.valleyPower}
				min={alternateMinMaxs.potentialParams.valleyPower.min}
				max={alternateMinMaxs.potentialParams.valleyPower.max}
				step={.01}
				style={{width: '8em'}}
				handleChange={this.setValleyPower}
			/>

			<br/>
			<TextNSlider className='scaleSlider'  label='Scale'
				value={+pp.valleyScale}
				min={alternateMinMaxs.potentialParams.valleyScale.min}
				max={alternateMinMaxs.potentialParams.valleyScale.max}
				step={.01}
				style={{width: '8em'}}
				handleChange={this.setValleyScale}
			/>

			<br/>
			<TextNSlider className='offsetSlider'  label='Offset %'
				value={+pp.valleyOffset}
				min={alternateMinMaxs.potentialParams.valleyOffset.min}
				max={alternateMinMaxs.potentialParams.valleyOffset.max}
				step={.1}
				style={{width: '8em'}}
				handleChange={this.setValleyOffset}
			/>
			<br/>
		</>;
	}


	render() {
		const p = this.props;
		//const pp = p.potentialParams;

		// remember that set*PotentialHandler is an event handler that gets the params from ControlPanel state
		return <div className='setPotentialTab'>
			<div className='potentialTitlePanel'>
				<h3>Set Potential</h3>
				<button className='zeroVoltageButton round'
					onClick={this.setFlatPotentialHandler}>
						Reset Potential
				</button>

			</div>
			<div className='divider' ></div>

			<div className='potentialValleyPanel'>
				{this.renderSliders()}

				<button className='valleyVoltageButton round'
					onClick={p.setPotentialHandler} >
						Set to Valley Potential
				</button>
			</div>
			<div className='MiniGraph' style={{marginLeft: '500px', color: 'yellow'}}>pot. mini graph goes here</div>
			<div style={{clear: 'left'}} />
		</div>;
		}
}
setPT();

export default SetPotentialTab;
