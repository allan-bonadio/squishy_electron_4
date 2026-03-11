/*
** Log Slider -- just like an <input slider, but on a logarithmic scale
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';

import {indexToPower, powerToIndex, twoSidedInfo} from '../utils/powers.js';
import {thousands} from '../utils/formatNumber.js';

// set a particular 'unique' in this regex to trace its renders and stuff or use the second one to turn off
// does this work with the trace turned off?  (TODO)
//let traceThisSlider = {test: () => false};
let traceThisSlider = {test: (uniq) => 'slotScale' == uniq};


let traceTwoSided = true;

// twoSided results in a two-sided scale, going through positives,
// negatives, and zero.  It's symmetric so absolute highest is
// negative of absolute lowest.  So if the one-sided slider has 7
// indices, the twoSided slider has 15: 7 on the positive side, 7 on
// the negative side, and zero.  sliderPowerMin and sliderPowerMax describe the
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
// but it uses no state - should it be a func component that saves the average?
// see TODO below
class LogSlider extends React.Component {
	static propTypes = {
		className: PropTypes.string,
		annotation: PropTypes.bool,  // false to get rid of these labels

		// add hocus pocus to make it run vertically (3 different changes)
		vertical: PropTypes.bool,

		label: PropTypes.string,
		minLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		maxLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

		substitutes: PropTypes.array,

		// these are powers, not indices
		currentPower: PropTypes.number.isRequired,
		originalPower: PropTypes.number,

		// if twoSided, sliderPowerMin is inner min closest to zero, and absolute min is -max
		sliderPowerMin: PropTypes.number.isRequired,
		sliderPowerMax: PropTypes.number.isRequired,  // if twoSided,
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
		this.wasOriginal = p.originalPower ? <small>&nbsp; (was {thousands(p.originalPower)})</small> : '';

		// these limits don't change dynamically.  Min/max for single sided positive pts
		if (!p.twoSided) {
			this.minIndex = this.minSingleIndex =
				powerToIndex(p.stepsPerDecade, p.sliderPowerMin, p.substitutes);
			this.maxIndex = this.maxSingleIndex =
				powerToIndex(p.stepsPerDecade, p.sliderPowerMax, p.substitutes);
		}
		else {
			// the renumbered indices go both directions from zero.
			// Shouldn't i use powerToTwoIndex?
			this.info = new twoSidedInfo(p.stepsPerDecade, p.sliderPowerMin, p.sliderPowerMax);
			this.minIndex = this.minSingleIndex =
				powerToIndex(p.stepsPerDecade, p.sliderPowerMin, p.substitutes);
			this.maxIndex = this.maxSingleIndex =
				powerToIndex(p.stepsPerDecade, p.sliderPowerMax, p.substitutes);
			this.singleIndexWidth = this.maxSingleIndex - this.minSingleIndex;
			let twoWidth = 2 * this.singleIndexWidth + 1;
			this.minIndex = - this.singleIndexWidth;
			this.maxIndex = this.singleIndexWidth;
		}

		this.inputStyle = p.inputStyle;
		if (p.vertical) {
			// vertical styles you need; new and old, the other is ignored dep on browser
			this.inputStyle = {...p.inputStyle,
				...{
					//'@supports (writingMode: vertical-lr)': {
						writingMode: 'vertical-lr',
						direction: 'rtl',
					//},
					'@supports not (writingMode: verticalLr)': {
						webkitAppearance: 'slider-vertical',
					},
				}
			};
		}
	}

	pointerDown =
	ev => {
		const p = this.props;
		this.currentIx = +ev.currentTarget.value;
		if (traceThisSlider.test(p.unique))
			console.log(`pointerDown down Ix=`, this.currentIx);
		ev.target.setPointerCapture(ev.pointerId);
	}

	pointerUp =
	ev => {
		const p = this.props;
		if (traceThisSlider.test(p.unique))
			console.log(`pointerUp up Ix=`, this.currentIx);
		p.pointerUp?.(ev);
	}

	// like mouse move
	handleSlide =
	ev => {
		const p = this.props;
		const spd = p.stepsPerDecade;

		if (traceThisSlider.test(p.unique)) console.log(`handleChange ev=`, ev);
		const ix = +ev.currentTarget.value;
		let power;
		if (!p.twoSided) {
			power = indexToPower(p.willRoundPowers, spd, ix, p.substitutes);
		}
		else {
			power = this.info.twoIndexToPower(ix);
		}
		if (traceThisSlider.test(p.unique)) console.log(`handleChange  ix=${ix}  power=${power}`);
		p.handleChange?.(power, ix);
	}

	render () {
		const p = this.props;
		const spd = p.stepsPerDecade;
		const cur = p.currentPower;
		if (undefined == cur) debugger;

		// the actual css ID used for the datalist.  doesn't include class?
		const uniqueId = `LogSliderDataList-${p.unique.replace(/\W+/, '_')}`;

		// right on the edge of transition, it can vibrate!  average this out. so it slides gently
		// huh?!?! doesn't do this anymore?  maybe the setPointerCapture() cleared it out.  TODO
		let twoIx;
		if (!p.twoSided)
			twoIx = powerToIndex(spd, cur, p.substitutes);
		else
			twoIx =this.info.powerToTwoIndex(cur);
		if (undefined == twoIx) debugger;

		if (traceThisSlider.test(p.unique)) console.log(
			`LogSlider render..  spd=${spd}, cur=${cur}   twoIx=${twoIx} props=`, p);

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
					value={twoIx}
					list={uniqueId}
					onInput={this.handleSlide}
					onPointerDown={this.pointerDown}
					onPointerUp={this.pointerUp}
					style={this.inputStyle ?? {}}
					orient={p.vertical ? 'vertical' : 'horizontal'}
				/>
				<datalist id={uniqueId} >{createGoodPowers(spd, p.sliderPowerMin, p.sliderPowerMax, p.substitutes)}</datalist>
			</div>;
		} catch (ex) {
			console.error(`LogSlider.render() Crash: `, ex.stack ?? ex.message ?? ex);
			debugger;
		}
	}
}

export default LogSlider;

