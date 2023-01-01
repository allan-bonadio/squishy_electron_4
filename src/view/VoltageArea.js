/*
** Voltage Area -- the white voltage line, and its tactile
**	      interactions when the user moves it.  for Squishy Electron
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';
import {scaleLinear} from 'd3-scale';

import qe from '../engine/qe.js';
import eSpace from '../engine/eSpace.js';
import {dumpVoltage} from '../utils/voltageUtils.js';

// I dunno but the voltages I'm generating are too strong.
// So I reduced it by this factor, but still have to magnify it to make it visible.
export const spongeFactor = 100;

let traceVoltageArea = false;
let tracePathAttribute = false;

let traceRendering = false;
let traceDragging = true;

// ultimately, this is a <svg node with a <path inside it
export class VoltageArea extends React.Component {
	static propTypes = {
		// for first couple of renders, space and idunno are null
		space: PropTypes.instanceOf(eSpace),

		// this can be null if stuff isn't ready
		// these are now determined by css
		//canvasWidth: PropTypes.object,////
		height: PropTypes.number,

		// includes scrollSetting, heightVolts, voltMin, voltMax, xScale, yScale
		volts: PropTypes.object,
		//scrollSetting: PropTypes.number.isRequired,
		//heightVolts: PropTypes.number.isRequired,
		//xScale: PropTypes.func,
		//yScale: PropTypes.func,

		// this component is always rendered so it retains its state,
		// but won't draw anything if the checkbox is off
		showVoltage: PropTypes.bool.isRequired,

		canvasFacts: PropTypes.object,
	};

	constructor(props) {
		super(props);
		this.state = {
			// should just use forceUpdate on our comp obj instead!
			changeSerial: 0,
		};
		if (traceVoltageArea) console.log(`👆 👆 the new VoltageArea:`, this);

		// should just use forceUpdate on our comp obj instead!
		//if (props.setUpdateVoltageArea)
		//	props.setUpdateVoltageArea(this.updateVoltageArea);

		if (traceVoltageArea) console.log(`👆 👆 VoltageArea  constructor done`);
	}

	/* *************************************************** drawing */

	// tell the VoltageArea (that;s us) that something in the space.voltageBuffer changed.  Sometimes called from above.
	// sheesh this is passed up and down so much; should figure out who and where needs it and simplify stuff.
	updateVoltageArea =
	() => {
		const p = this.props;

		// btw, everybody needs to know the min and max voltage in use, so we can always show it
//		let v = this.props.volts;
//		let space = this.props.space;
//		let voltageBuffer = space.voltageBuffer;
//		let {start, end} = space.startEnd;

		p.findVoltExtremes();

		this.forceUpdate();
	}

	// make the sequence of coordinates the white line needs to draw
	// as compressed as possible.  Returns one long string.
	makePathAttribute(start, end) {
		const p = this.props;
		let v = p.volts;
		if (tracePathAttribute)
			console.log(`👆 👆 VoltageArea.makePathAttribute(${start}, ${end})`);

		// yawn too early
		if (! p.space) throw new Error(`makePathAttribute(): no functioning space`);
		if (! p.yScale) {
			// I still haven't figured out the best time to call setVoltScales()
			//if (!this.setVoltScales())
				return `M0,0`;  // too early
		}

		const space = p.space;
		const voltageBuffer = this.voltageBuffer = space.voltageBuffer;

		// array to collect small snippets of text
		const points = new Array(this.nPoints);
		let y = v.yScale(voltageBuffer[start]);  //qe.get1DVoltage(dim.start);
		let x = v.xScale(start);
		points[start] = `M${x},${y.toFixed(1)}L `;

		for (let ix = start+1; ix < end; ix++) {
			y = v.yScale(voltageBuffer[ix]);
			x = v.xScale(ix);
			if ((x==null) || !isFinite(x) || (y==null) || !isFinite(y) || Math.abs(y) > 10_000)
				debugger;
			points[ix] = `${x.toFixed(1)},${y.toFixed(1)} `;
		}

		// if this is a continuum, chop off the ends
		if (start) {
			points.pop();
			points.shift();
		}
		if (tracePathAttribute) {
			console.log(`👆 👆 VoltageArea.makePathAttribute: done`, points.join(''));
			console.log(`     from:`, points);
		}
		return points.join('');
	}

	renderPaths() {
		const p = this.props;
		if (!p.space) return <></>;
		//const wholeRect = p.wholeRect;

		let {start, end, continuum} = p.space.startEnd;
		let paths = [];

		switch (continuum) {
			case qe.contWELL:
				// stone slabs on each end on the borders vaguely means 'quantum well'.
				paths.push(
					<rect className='left wellSlab' key='left'
						x={0} y={0} width={this.barWidth} height={p.height}
					/>
				);
				paths.push(
					<rect className='right wellSlab' key='right'
						x={p.canvasFacts.width - this.barWidth} y={0} width={this.barWidth} height={p.height}
					/>
				);
				break;

			case qe.contENDLESS:
				// full width including boundaries?  can you drag the boundaries?!?!  no.
				break;

			default: throw new Error(`bad continuum ${p.space.dimensions.continuum}`);
		}

		// the lines themselves: exactly overlapping.  tactile wider than visible.
		if (p.showVoltage) {
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
			console.log(`👆 👆 VoltageArea.render()`);

		// some of the math we do can be eliminated if we just do this
		//this.setVoltScales();

		const p = this.props;
		if (! p.space)
			return '';  // too early
		this.barWidth = p.canvasFacts.width / this.nPoints;

		let returnV = (
			<svg className='VoltageArea'
				viewBox={`0 0 ${p.canvasFacts.width} ${p.canvasFacts.height}`}
					width={p.canvasFacts.width} height={p.canvasFacts.height}
					onMouseMove={ev => this.mouseMove(ev)}
					onMouseUp={ev => this.mouseUp(ev)}
					ref={el => this.svgElement = el}
			 	>

				{this.renderPaths()}
			</svg>
		);
		if (traceRendering)
			console.log(`👆 👆 VoltageArea render done`);

		return returnV;
	}


	/* ***************************************************  click & drag */

	// every time user changes one datapoint.  Also set points interpolated between.
	// returns false if it failed and needs to be done again.  True means it succeeded.
	changeVoltage(ev, title) {
		const p = this.props;
		const v = this.props.volts;
		//if (!p.canvasWidth)
		//return false;

		// shift key gives you steady voltage as you drag across
		let newVoltage = this.latestVoltage;
		if (! ev.shiftKey) {
			let top = this.svgElement.getBoundingClientRect().top;
			newVoltage = v.yScale.invert(p.height - ev.clientY + top);
		}

		let ix = Math.round(v.xScale.invert(ev.clientX));

		if (ix == this.latestIx && newVoltage == this.latestVoltage)
			return;  // same old same old; these events come too fast

		if (traceDragging)
			console.log(`👆 👆 mouse %s on point (%f,%f) voltage @ ix=%d changing from %f to %f`,
				title,
				ev.clientX, ev.clientY,
				ix, this.voltageBuffer[ix], newVoltage);

		if (undefined == this.latestIx) {
			// the first time, all you can do is the one point
			this.voltageBuffer[ix] = newVoltage;
		}
		else {
			// other times, draw a straight linear line through.  scaleLinear from d3
			// cuz sometimes mouse skips.
			let tweenScale = scaleLinear([this.latestIx, ix], [this.latestVoltage, newVoltage]);

			// do it to each point in between
			let hi = Math.max(this.latestIx, ix);
			let lo = Math.min(this.latestIx, ix);
			for (let ixx = lo; ixx <= hi; ixx++) {
				if (traceDragging)
					console.log(`👆 👆 tweening: set point [${ixx}] to ${tweenScale(ixx).toFixed(4)}`)
				this.voltageBuffer[ixx] = tweenScale(ixx);
			}
			if (traceDragging) console.log(`👆 👆 tweening done`)
		}

		this.latestIx = ix;
		this.latestVoltage = newVoltage;

		this.updateVoltageArea();
		return true;
	}

	mouseDown =
	(ev) => {
		// a hit! otherwise we wouldn't be calling the event handler.
		this.changeVoltage(ev, 'Down');
		this.dragging = true;

		// must also switch the svg to catch mouse events otherwise you can't drag far
		this.svgElement.style.pointerEvents = 'visible';  // auto all none

		// must figure out pointer offset; diff between mousedown pot and the neareest piece of line
		// remember that clientY is in pix units
		const p = this.props;
		let chosenVoltage = p.yScale.invert(ev.clientY);
		this.mouseYOffset = chosenVoltage - this.latestVoltage;
		if (traceDragging) {
			console.log(`👆 👆 🎯  Y numbers: mouseYOffset(${this.mouseYOffset}) =
				chosenVoltage(${chosenVoltage}) - latestVoltage(${this.latestVoltage})
				from client X=${ev.clientX}    Y=${ev.clientY}`);
		}

		ev.preventDefault();
		ev.stopPropagation();
	}

	// this one and mouseUp are attached to the whole SVG cuz user can drag all over
	mouseMove =
	(ev) => {
		if (! this.dragging) return;

		if (ev.buttons) {
			this.changeVoltage(ev, 'DRAG');
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
			console.log(`👆 👆 mouse UP on point (%f,%f) voltage @ ix=%d stopped at %f`,
				ev.clientX, ev.clientY,
				this.latestIx, this.voltageBuffer[this.latestIx]);
		}

		// remind everybody that this episode is over.  Tune in next week.  next mousedown.
		this.latestIx = this.latestVoltage = undefined;

		if (traceDragging)
			dumpVoltage(p.space, this.voltageBuffer, 8);
		ev.preventDefault();
		ev.stopPropagation();
	}

}

export default VoltageArea;
