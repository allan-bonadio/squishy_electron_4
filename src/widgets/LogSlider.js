/*
** Log Slider -- just like an <input slider, but on a logarithmic scale
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import PropTypes from 'prop-types';
import React from 'react';
//import {scaleLinear} from 'd3-scale';
//import {path as d3path} from 'd3-path';

import {stepsPerDecadeStepFactors, indexToPower, powerToIndex} from '../utils/powers.js';
import {thousands} from '../utils/formatNumber.js';

// set a particular unique in this regex to trace its renders and stuff or use the second one to turn off
//let traceThisSlider = /stepsPerFrameSlider/;
let traceThisSlider = {test: () => false};

// save this for hwen i put ticks on the log slider
// give me an array of JUST the even powers of 10 between the min and max, inclusive
// The indices.  wait, this doesn't work... trana get where the tic marks are
// function createGoodPowersOf10(spd, iMin, iMax) {
// 	let po10 = [];
//		// no this is wrong it'll make stepFactors of 10 starting at the min; should start at a power of 10
// 	for (let p = iMin; p <= iMax; p += spd) {
// 		po10.push(<option key={p}>{p}</option>);
// //		po10.push(<option>{p + 3}</option>);
// //		po10.push(<option>{p + 7}</option>);
// 	}
// 	return po10;
// }


// list of settings that are more better - not that simple!
function createGoodPowers(spd, mini, maxi) {
	const minIx = powerToIndex(spd, mini);
	const maxIx = powerToIndex(spd, maxi);
	let valz = [];
	for (let ix = minIx; ix <= maxIx; ix++) {
		valz.push(<option key={ix} value={ix} >{ix}</option>);
	}
	return valz;
}



/* ****************************************************************** component */

// a class component so we have a This to average setting so it doesn't vibrate.
class LogSlider extends React.Component {
	static propTypes = {
		className: PropTypes.string,
		label: PropTypes.string.isRequired,
		minLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		maxLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),




		// these are powers, not indices
		current: PropTypes.number.isRequired,
		original: PropTypes.number,
		sliderMin: PropTypes.number.isRequired,
		sliderMax: PropTypes.number.isRequired,

		stepsPerDecade: PropTypes.number.isRequired,

		// because sometimes floating point arithmetic leaves roundoff error, as a convenience,
		// we can trim your power numbers.  The indexes are always integers; no need to round them.
		willRoundPowers: PropTypes.bool,

		// any unique value for this particular LogSlider, cuz we gotta generate a CSS ID.
		// just so that two LogSliders end up with different unique codes.
		// Prefer alphanumeric, punctuation we eliminate
		unique: PropTypes.string.isRequired,

		// handleChange(power, ix)
		handleChange: PropTypes.func,
	}

	static defaultProps = {
		unique: 'you should really choose a unique code for this logslider',
		className: '',
		label: 'how much',
		minLabel: 'low',
		maxLabel: 'high',

		willRoundPowers: false,

		handleChange: (power, ix) => {},
	}

	constructor(props) {
		super(props);
		if (!props)
			debugger;
		const p = props;
		if (traceThisSlider.test(p.unique)) console.info(`LogSlider props=`, JSON.stringify(props));
		this.wasOriginal = p.original ? <small>&nbsp; (was {thousands(p.original)})</small> : '';

		// these don't change dynamically i promise
		this.minIndex = powerToIndex(p.stepsPerDecade, p.sliderMin);
		this.maxIndex = powerToIndex(p.stepsPerDecade, p.sliderMax);
	}

	mouseDown =
	ev => {
		const p = this.props;
		if (traceThisSlider.test(p.unique)) console.info(`mouseDown avgValue=`, this.avgValue);
		this.avgValue = +ev.currentTarget.value;
	}

	handleSlide =
	ev => {
		const p = this.props;
		const spd = p.stepsPerDecade;
		const stepFactors = stepsPerDecadeStepFactors[spd];

		if (traceThisSlider.test(p.unique)) console.info(`handleChange ev=`, ev);
		const ix = +ev.currentTarget.value;
		const power = indexToPower(p.willRoundPowers, stepFactors, spd, ix);
		if (traceThisSlider.test(p.unique)) console.info(`handleChange  ix=${ix}  power=${power}`);
		p.handleChange(power, ix);
	}

	render () {
		const p = this.props;
		const spd = p.stepsPerDecade;
		const cur = p.current;

		// the actual css ID used for the datalist
		const uniqueId = `LogSliderDataList-${p.unique.replace(/\W+/, '_')}`;

		// right on the edge of transition, it can vibrate!  average this out. so it slides gently
		let val = powerToIndex(spd, p.current);

		if (traceThisSlider.test(p.unique)) console.info(
			`LogSlider render..  spd=${spd}, p.current=${p.current}   value=${val}`);

		try {
			return <div className={`${p.className} LogSlider`}>
				<aside>
					<div className='left'>{p.minLabel}</div>
					<div className='middle'>
						{p.label}: <big>{thousands(cur)}</big>
						{this.wasOriginal}
					</div>
					<div className='right'>{p.maxLabel}</div>

				</aside>

				<input type="range"
					min={this.minIndex}
					max={this.maxIndex}
					value={val}
					list={uniqueId}
					onInput={this.handleSlide}
					onMouseDown={this.mouseDown}
				/>
				<datalist id={uniqueId} >{createGoodPowers(spd, p.sliderMin, p.sliderMax)}</datalist>
			</div>;
		} catch (ex) {
			console.error(`LogSlider.render() Crash: `, ex.stack ?? ex.message ?? ex);
		}
	}
}

export default LogSlider;

