/*
** Log Slider -- just like an <input slider, but on a logarithmic scale
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';

import {stepsPerDecadeStepFactors, indexToPower, powerToIndex} from '../utils/powers.js';
import {thousands} from '../utils/formatNumber.js';

// set a particular 'unique' in this regex to trace its renders and stuff or use the second one to turn off
// does this work with the trace turned off?  (TODO)
let traceThisSlider = {test: () => false};
let traceTwoSided = true;

// twoSided results in a two-sided scale, going through positives,
// negatives, and zero.  It's symmetric so absolute highest is
// negative of absolute lowest.  So if the one-sided slider has 7
// indices, the twoSided slider has 15: 7 on the positive side, 7 on
// the negative side, and zero.  sliderMin and sliderMax describe the
// positive side; the negative side is the same in reverse order.

// list of settings that are more better - not that simple!  just one sided
function createGoodPowers(spd, mini, maxi, substitutes) {
	const minIx = powerToIndex(spd, mini, substitutes);
	const maxIx = powerToIndex(spd, maxi, substitutes);
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

		annotation: PropTypes.bool,  // false to get rid of these labels
		label: PropTypes.string,
		minLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		maxLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

		substitutes: PropTypes.array,

		// these are powers, not indices
		current: PropTypes.number.isRequired,
		original: PropTypes.number,
		sliderMin: PropTypes.number.isRequired,  // if twoSided, inner min closest to zero
		sliderMax: PropTypes.number.isRequired,  // if twoSided, absolute min is -max
		twoSided: PropTypes.bool,  // true to also handle negative numbers and zeros

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
		handlePointerUp: PropTypes.func,

		wholeStyle: PropTypes.object,   // whole  component, like to make it invisible
		inputStyle: PropTypes.object,  // just the input.range slider

		// a help msg, optional
		title: PropTypes.string,
	}

	constructor(props) {
		super(props);
		ccpt(this, props);
		if (!props)
			debugger;
		const p = props;

		if (traceThisSlider.test(p.unique)) console.log(`LogSlider props=`, JSON.stringify(props));
		this.wasOriginal = p.original ? <small>&nbsp; (was {thousands(p.original)})</small> : '';

		// these don't change dynamically.  Min/max for single sided positive pts
		this.minIndex = this.minSingleIndex = powerToIndex(p.stepsPerDecade, p.sliderMin, p.substitutes);
		this.maxIndex = this.maxSingleIndex = powerToIndex(p.stepsPerDecade, p.sliderMax, p.substitutes);

		if (p.twoSided) {
			// the renumbered indices go both directions from zero
			this.singleWidth = this.maxSingleIndex - this.minSingleIndex;
			let twoWidth = 2 * this.singleWidth + 1;
			this.minIndex = - this.singleWidth;
			this.maxIndex = this.singleWidth;
		}
	}



	pointerDown =
	ev => {
		const p = this.props;
		this.currentIx = +ev.currentTarget.value;
		if (traceThisSlider.test(p.unique)) console.log(`pointerDown down Ix=`, this.currentIx);
		ev.target.setPointerCapture(ev.pointerId);
	}

	pointerUp =
	ev => {
		const p = this.props;
		if (traceThisSlider.test(p.unique)) console.log(`pointerUp up Ix=`, this.currentIx);
		p.pointerUp?.(ev);
	}

	// are these line mouse move?
	handleSlide =
	ev => {
		const p = this.props;
		const spd = p.stepsPerDecade;
		//const stepFactors = stepsPerDecadeStepFactors[spd];

		if (traceThisSlider.test(p.unique)) console.log(`handleChange ev=`, ev);
		const ix = +ev.currentTarget.value;
		const power = indexToPower(p.willRoundPowers, spd, ix, p.substitutes);
		if (traceThisSlider.test(p.unique)) console.log(`handleChange  ix=${ix}  power=${power}`);
		p.handleChange?.(power, ix);
	}

	render () {
		const p = this.props;
		const spd = p.stepsPerDecade;
		const cur = p.current;

		// the actual css ID used for the datalist.  doesn't include class?
		const uniqueId = `LogSliderDataList-${p.unique.replace(/\W+/, '_')}`;

		// right on the edge of transition, it can vibrate!  average this out. so it slides gently
		let val = powerToIndex(spd, p.current, p.substitutes);

		if (traceThisSlider.test(p.unique)) console.log(
			`LogSlider render..  spd=${spd}, p.current=${p.current}   value=${val} props=`, p);

		// the default for this is annotation true, so undefined means true.
		const annotation = (p.annotation ?? true)
			?   <aside>
					<div className='left'>{p.minLabel ?? 'low'}</div>
					<div className='middle'>
						<b>{p.label ?? 'how much'}</b>: <big>{thousands(cur)}</big>
						{this.wasOriginal}
					</div>
					<div className='right'>{p.maxLabel ?? 'high'}</div>
				</aside>

			: undefined;

		try {
			return <div className={`${p.className ?? ''} LogSlider`} style={p.wholeStyle ?? {}}
				title={p.title}>

				{annotation}

				<input type="range"
					min={this.minIndex}
					max={this.maxIndex}
					value={val}
					list={uniqueId}
					onInput={this.handleSlide}
					onPointerDown={this.pointerDown}
					onPointerUp={this.pointerUp}
					style={p.inputStyle ?? {}}
				/>
				<datalist id={uniqueId} >{createGoodPowers(spd, p.sliderMin, p.sliderMax, p.substitutes)}</datalist>
			</div>;
		} catch (ex) {
			console.error(`LogSlider.render() Crash: `, ex.stack ?? ex.message ?? ex);
		}
	}
}

export default LogSlider;

