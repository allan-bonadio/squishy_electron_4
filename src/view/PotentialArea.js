/*
** Potential Area -- the white potential line, and its tactile
**	      interactions when the user moves it.  for Squishy Electron
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';
import {scaleLinear} from 'd3-scale';

import qe from '../engine/qe';
import eSpace from '../engine/eSpace';
import {dumpPotential} from '../utils/potentialUtils';

// I dunno but the potentials I'm generating are too strong.
// So I reduced it by this factor, but still have to magnify it to make it visible.
export const spongeFactor = 100;

// ultimately, this is a <svg node with a <path inside it
export class PotentialArea extends React.Component {
	static propTypes = {
		width: PropTypes.number.isRequired,
		height: PropTypes.number.isRequired,

		// for first couple of renders, space and wholeRect are null
		space: PropTypes.instanceOf(eSpace),

		// thiis can be null if stuff isn't ready
		wholeRect: PropTypes.object,

		setUpdatePotentialArea: PropTypes.func,
	};

	constructor(props) {
		super(props);
		this.state = {
			// should just use forceUpdate on our comp obj instead!
			changeSerial: 0,
		};
		console.info(` the new PotentialArea:`, this);

		// should just use forceUpdate on our comp obj instead!
		if (props.setUpdatePotentialArea)
			props.setUpdatePotentialArea(this.updatePotentialArea);

		this.setScales();  // usually too early, but later on it's no problems.
		//console.log(`PotentialArea  constructor done`);
	}

	// scales to transform coords.  Call whenever the coord systems change
	// affecting the potential. Returns false if it failed cuz too early.  yScale
	// is function that transforms from sci units to pixels.  yScale.invert())
	// goes the other way.  Same for xScale.  Used for clicking and for display.
	setScales() {
		const p = this.props;
		if (!p.wholeRect)
			return false;
		console.info(`the whole rect:`, p.wholeRect);

		const {x} = p.wholeRect;
		//const {x, y} = p.wholeRect;
		this.yScale = scaleLinear([-2, 8], [0, p.height]);
		//this.yScale = scaleLinear([-2, 8], [y, y + p.height]);
		//for (let j = -2; j <= 8; j += .5) console.info(`j=${j} -> ${this.yScale(j)}`)
		//this.yScale = scaleLinear([0, 3], [y + p.height, y]);
		// spongeFactor?

		// this'll probably be changed ...
		this.xScale = scaleLinear([0, 1], [x, x + this.barWidth]);
		return true;
	}

	/* ***************************************************  click & drag */

	mouseReveal(title, ev, x) {
		console.log(`mouse %s on point (%f,%f) potential[%d]=%f`,
			title,
			ev.clientX, ev.clientY,
			x, this.potentialBuffer[x]);
	}

	// every time user changes it.  Also set points interpolated betweeen.
	// returns false if it failed and needs to be done again.  True means it succeeded.
	changePotential(ev, title) {
		const p = this.props;
		if (!p.wholeRect)
			return false;

		// new situation given new position
		//let pixPotential = p.wholeRect.y + p.wholeRect.height - ev.clientY;
		let newPotential = this.yScale.invert(p.height - ev.clientY + p.wholeRect.top);
		//newPotential -= 5;  // dunno if this works better

		//let ix = Math.round((ev.clientX - p.wholeRect.x) / this.barWidth);
		let ix = Math.round(this.xScale.invert(ev.clientX));
		//if (Math.abs(ix - nuIx) > 1e-10)
		//	console.log(`🍓  ix and nuIx discrepancy!!  ix=${ix}   nuIx=${nuIx}   `);

		console.log(`mouse %s on point (%f,%f) potential[ix=%d] changing from %f to %f`,
			title,
			ev.clientX, ev.clientY,
			ix, this.potentialBuffer[ix], newPotential);
		//this.mouseReveal(title, ev, ix);

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
				console.info(`tweening: set point [${ixx}] to ${tweenScale(ixx).toFixed(4)}`)
				this.potentialBuffer[ixx] = tweenScale(ixx);
			}
			console.info(`tweening done`)
		}

		this.latestIx = ix;
		this.latestPotential = newPotential;

		//qe.set1DPotential(ix, p.height + p.y - newPotential);
		this.updatePotentialArea();
		return true;
	}

	mouseDown(ev) {
		// a hit! otherwise we wouldn't be calling the event handler.
		this.changePotential(ev, 'M down');
		this.dragging = true;
		//debugger;

		// must figure out pointer offset; diff between mousedown pot and the neareest piece of line
		// remember that clientY is in pix units
		let potNow = this.latestPotential
		let chosenPotential = this.yScale.invert(ev.clientY);
		this.mouseYOffset = chosenPotential - potNow;
		console.info(`🎯  Y numbers: mouseYOffset(${this.mouseYOffset}) = chosenPotential(${chosenPotential}) - potNow(${potNow})`);
	}

	mouseMove(ev) {
		if (ev.buttons && this.dragging) {
			//this.mouseReveal('move DRAGGING', ev, ix);
			this.changePotential(ev, 'move DRAGGING');
			this.dragging = true;
			//debugger;
		}
		else {
			this.mouseUp(ev);
			//this.mouseReveal('not dragging', ev, 0);
		}
	}

	mouseUp(ev) {
		const p = this.props;
		this.dragging = false;

		// remind everybody that this episode is over.  Tune in next week.
		this.latestIx = this.latestPotential = undefined;

		//this.changePotential(ev, 'mouse UP');
		//this.mouseReveal('mouse UP', ev, ix);

		//dumpPotential(p.space, this.potentialBuffer, 8);
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

		// yawn too early
		if (! p.space) throw new Error(`makePathAttribute(): no functioning space`);
		if (! this.yScale) {
			// I still haven't figured out the best time to call setScales()
			if (!this.setScales())
				return `M0,0`;  // too early
		}

		const space = p.space;
		//qe.qSpace_dumpPotential(`makePathAttribute(${start}, ${end})`);
		const potentialBuffer = this.potentialBuffer = space.potentialBuffer;
		// for (let i = 0; i < this.nPoints; i++)
		// 	console.log(`potentialBuffer[${i}] = ${potentialBuffer[i]}`);

		// array to collect small snippets of text
		const points = new Array(this.nPoints);
		let y = this.yScale(potentialBuffer[start]);  //qe.get1DPotential(dim.start);
		let x = 0;
		points[start] = `M${x},${y.toFixed(1)}L `;
		for (let ix = start+1; ix < end; ix++) {
			y = this.yScale(potentialBuffer[ix]);
			x = this.xScale(ix);
			points[ix] = `${x.toFixed(1)},${y.toFixed(1)} `;
		}
		if (start) {
			points.pop();
			points.shift();
		}
		return points.join('');
	}

	renderPaths() {
		const p = this.props;
		if (!p.space) return <></>;

		let {start, end, continuum} = p.space.startEnd;
		let paths = [];

		//switch (p.space.dimensions[0].continuum) {
		switch (continuum) {
			//case 	qe.contDISCRETE:
			case qe.contWELL:
				// stone slabs on each end on the borders vaguely means 'quantum well'.
				paths.push(
					<rect className='left wellSlab' key='left'
						x={0} y={0} width={this.barWidth} height={p.height}
					/>
				);
				paths.push(
					<rect className='right wellSlab' key='right'
						x={p.width - this.barWidth} y={0} width={this.barWidth} height={p.height}
					/>
				);
				break;

			case qe.contENDLESS:
				//full width including boundaries
				start = 0;
				end += 1;
				break;

			default: throw `bad continuum ${p.space.dimensions.continuum}`;
		}

		// the lines themselves: exactly overlapping.  tactile wider than visible.
		const pathAttribute = this.makePathAttribute(start, end);
		//console.info(`makePathAttribute(${start}, ${end}) returned:`, pathAttribute);

		// this one actually draws the white line
		paths.push(
			<path className='visibleLine' key='visible'
				d={pathAttribute}
				fill="transparent"
			/>
		);

		// you click on thisi one
		paths.push(
			<path className='tactileLine' key='tactile'
				d={pathAttribute}
				stroke='#fff4'
				fill="transparent"
				onMouseDown={ev => this.mouseDown(ev)}
			/>
		);
		return paths
	}

	//static whyDidYouRender = true;
	render() {
		//throw "holy smokes!"
		const p = this.props;
		if (! p.space)
			return '';  // too early
		this.nPoints = p.space.nPoints;
		this.barWidth = p.width / this.nPoints;
		//debugger;

		return (
			<svg className='PotentialArea' viewBox={`0 0 ${p.width} ${p.height}`}
					width={p.width} height={p.height}
					onMouseMove={ev => this.mouseMove(ev)}
					onMouseUp={ev => this.mouseUp(ev)}
					ref={el => this.svgElement = el}
			 	>

				{this.renderPaths()}
			</svg>
		);
	}
}

export default PotentialArea;

