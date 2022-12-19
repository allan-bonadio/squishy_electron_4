/*
** Potential Area -- the white potential line, and its tactile
**	      interactions when the user moves it.  for Squishy Electron
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';
import {scaleLinear} from 'd3-scale';

import qe from '../engine/qe.js';
import eSpace from '../engine/eSpace.js';
import {dumpPotential} from '../utils/potentialUtils.js';

// I dunno but the potentials I'm generating are too strong.
// So I reduced it by this factor, but still have to magnify it to make it visible.
export const spongeFactor = 100;

let tracePotentialArea = false;
let tracePathAttribute = false;

let traceRendering = false;
let traceDragging = false;

// ultimately, this is a <svg node with a <path inside it
export class PotentialArea extends React.Component {
	static propTypes = {
		// for first couple of renders, space and wholeRect are null
		space: PropTypes.instanceOf(eSpace),

		// this can be null if stuff isn't ready
		wholeRect: PropTypes.object,

		setUpdatePotentialArea: PropTypes.func,

		// this component is always rendered so it retains its state,
		// but won't draw anything if the checkbox is off
		showPotential: PropTypes.bool.isRequired,
	};

	constructor(props) {
		super(props);
		this.state = {
			// should just use forceUpdate on our comp obj instead!
			changeSerial: 0,
		};
		if (tracePotentialArea) console.log(`👆 👆 the new PotentialArea:`, this);

		// should just use forceUpdate on our comp obj instead!
		if (props.setUpdatePotentialArea)
			props.setUpdatePotentialArea(this.updatePotentialArea);

		if (tracePotentialArea) console.log(`👆 👆 PotentialArea  constructor done`);
	}

	// scales to transform coords.  Call whenever the coord systems change
	// affecting the potential. Returns false if it failed cuz too early.  yScale
	// is function that transforms from sci units to pixels.  yScale.invert())
	// goes the other way.  Same for xScale.  Used for clicking and for display.
	setScales() {
		const p = this.props;
		const w = p.wholeRect;
		if (tracePotentialArea) console.log('👆 👆 PotentialArea.setScales(): on window= '
			+`(${window.innerWidth},${window.innerHeight}) the wholeRect:`,
			p.wholeRect);
		if (!p.wholeRect)
			return false;

		this.yScale = scaleLinear([-2, 8], [0, w.height]);
		// spongeFactor?

		this.nPoints = p.space.nPoints;
		this.xScale = scaleLinear([0, this.nPoints-1], [0, w.width]);

		if (tracePotentialArea) console.log(
			`👆 👆 PotentialArea.setScales():done, xScale(d&r) & yScale(d&r):`,
			this.xScale.domain(), this.xScale.range(), this.yScale.domain(), this.yScale.range(), );
		return true;
	}

	/* *************************************************** drawing */

	updatePotentialArea =
	() => {
		this.forceUpdate();
	}

	// make the sequence of coordinates the white line needs to draw
	// as compressed as possible.  Returns one long string.
	makePathAttribute(start, end) {
		const p = this.props;
		if (tracePathAttribute)
			console.log(`👆 👆 PotentialArea.makePathAttribute(${start}, ${end})`);

		// yawn too early
		if (! p.space) throw new Error(`makePathAttribute(): no functioning space`);
		if (! this.yScale) {
			// I still haven't figured out the best time to call setScales()
			if (!this.setScales())
				return `M0,0`;  // too early
		}

		const space = p.space;
		const potentialBuffer = this.potentialBuffer = space.potentialBuffer;

		// array to collect small snippets of text
		const points = new Array(this.nPoints);
		let y = this.yScale(potentialBuffer[start]);  //qe.get1DPotential(dim.start);
		let x = this.xScale(start);
		points[start] = `M${x},${y.toFixed(1)}L `;

		for (let ix = start+1; ix < end; ix++) {
			y = this.yScale(potentialBuffer[ix]);
			x = this.xScale(ix);
			points[ix] = `${x.toFixed(1)},${y.toFixed(1)} `;
		}

		// if this is a continuum, chop off the ends
		if (start) {
			points.pop();
			points.shift();
		}
		if (tracePathAttribute)
			console.log(`👆 👆 PotentialArea.makePathAttribute: done`, points.join(''));
		return points.join('');
	}

	renderPaths() {
		const p = this.props;
		if (!p.space) return <></>;
		const w = p.wholeRect;

		let {start, end, continuum} = p.space.startEnd;
		let paths = [];

		switch (continuum) {
			case qe.contWELL:
				// stone slabs on each end on the borders vaguely means 'quantum well'.
				paths.push(
					<rect className='left wellSlab' key='left'
						x={0} y={0} width={this.barWidth} height={w.height}
					/>
				);
				paths.push(
					<rect className='right wellSlab' key='right'
						x={w.width - this.barWidth} y={0} width={this.barWidth} height={w.height}
					/>
				);
				break;

			case qe.contENDLESS:
				// full width including boundaries?  can you drag the boundaries?!?!  no.
				break;

			default: throw new Error(`bad continuum ${p.space.dimensions.continuum}`);
		}

		// the lines themselves: exactly overlapping.  tactile wider than visible.
		if (p.showPotential) {
			const pathAttribute = this.makePathAttribute(start, end);

			// this one actually draws the white line
			paths.push(
				<path className='visibleLine' key='visible'
					d={pathAttribute}
					fill="transparent"
				/>
			);

			// you click on this one
			paths.push(
				<path className='tactileLine' key='tactile'
					d={pathAttribute}
					stroke='#fff4'
					fill="transparent"
					onMouseDown={ev => this.mouseDown(ev)}
				/>
			);
		}
		return paths
	}

	render() {
		if (traceRendering)
			console.log(`👆 👆 PotentialArea.render()`);

		// some of the math we do can be eliminated if we just do this
		this.setScales();

		const p = this.props;
		const w = p.wholeRect;
		if (! p.space)
			return '';  // too early
		this.barWidth = w.width / this.nPoints;

		let returnV = (
			<svg className='PotentialArea' viewBox={`0 0 ${w.width} ${w.height}`}
					width={w.width} height={w.height}
					onMouseMove={ev => this.mouseMove(ev)}
					onMouseUp={ev => this.mouseUp(ev)}
					ref={el => this.svgElement = el}
			 	>

				{this.renderPaths()}
			</svg>
		);
		if (traceRendering)
			console.log(`👆 👆 PotentialArea render done`);

		return returnV;
	}


	/* ***************************************************  click & drag */

	// every time user changes it.  Also set points interpolated between.
	// returns false if it failed and needs to be done again.  True means it succeeded.
	changePotential(ev, title) {
		const p = this.props;
		if (!p.wholeRect)
			return false;
		const w = p.wholeRect;

		// new situation given new position
		let newPotential = this.yScale.invert(w.height - ev.clientY + p.wholeRect.top);

		let ix = Math.round(this.xScale.invert(ev.clientX));

		if (ix == this.latestIx && newPotential == this.latestPotential)
			return;  // same old same old; these events come too fast

		if (traceDragging)
			console.log(`👆 👆 mouse %s on point (%f,%f) potential @ ix=%d changing from %f to %f`,
				title,
				ev.clientX, ev.clientY,
				ix, this.potentialBuffer[ix], newPotential);

		if (undefined == this.latestIx) {
			// the first time, all you can do is the one point
			this.potentialBuffer[ix] = newPotential;
		}
		else {
			// other times, draw a straight linear line through.  scaleLinear from d3
			// cuz sometimes mouse skips.
			let tweenScale = scaleLinear([this.latestIx, ix], [this.latestPotential, newPotential]);

			// do it to each point in between
			let hi = Math.max(this.latestIx, ix);
			let lo = Math.min(this.latestIx, ix);
			for (let ixx = lo; ixx <= hi; ixx++) {
				if (traceDragging)
					console.log(`👆 👆 tweening: set point [${ixx}] to ${tweenScale(ixx).toFixed(4)}`)
				this.potentialBuffer[ixx] = tweenScale(ixx);
			}
			if (traceDragging) console.log(`👆 👆 tweening done`)
		}

		this.latestIx = ix;
		this.latestPotential = newPotential;

		this.updatePotentialArea();
		return true;
	}

	mouseDown =
	(ev) => {
		// a hit! otherwise we wouldn't be calling the event handler.
		this.changePotential(ev, 'Mouse Down');
		this.dragging = true;

		// must also switch the svg to catch mouse events otherwise you can't drag far
		this.svgElement.style.pointerEvents = 'visible';  // auto all none

		// must figure out pointer offset; diff between mousedown pot and the neareest piece of line
		// remember that clientY is in pix units
		let potNow = this.latestPotential
		let chosenPotential = this.yScale.invert(ev.clientY);
		this.mouseYOffset = chosenPotential - potNow;
		if (traceDragging)
			console.log(`👆 👆 🎯  Y numbers: mouseYOffset(${this.mouseYOffset}) = chosenPotential(${chosenPotential}) - potNow(${potNow})`);

		ev.preventDefault();
		ev.stopPropagation();
	}

	// this one and mouseUp are attached to the whole SVG cuz user can drag all over
	mouseMove =
	(ev) => {
		if (! this.dragging) return;

		if (ev.buttons) {
			this.changePotential(ev, 'move DRAGGING');
			ev.preventDefault();
			ev.stopPropagation();
		}
		else {
			this.mouseUp(ev);
		}
		ev.preventDefault();
		ev.stopPropagation();
	}

	// called upon mouseup or a move without mouse dow
	mouseUp =
	(ev) => {
		const p = this.props;
		this.dragging = false;  // the ONLY place this can be set false

		// must also switch the svg to pass thru mouse events otherwise other stuff can't get clicks
		this.svgElement.style.pointerEvents = 'none';

		if (traceDragging) {
			console.log(`👆 👆 mouse UP on point (%f,%f) potential @ ix=%d stopped at %f`,
				ev.clientX, ev.clientY,
				this.latestIx, this.potentialBuffer[this.latestIx]);
		}

		// remind everybody that this episode is over.  Tune in next week.  next mousedown.
		this.latestIx = this.latestPotential = undefined;

		if (traceDragging)
			dumpPotential(p.space, this.potentialBuffer, 8);
		ev.preventDefault();
		ev.stopPropagation();
	}

}

export default PotentialArea;
