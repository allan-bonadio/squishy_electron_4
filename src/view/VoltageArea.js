/*
** Voltage Area -- the white voltage line, and its tactile
**	      interactions when the user moves it.  for Squishy Electron
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

import {scaleLinear as d3_scaleLinear} from 'd3-scale';
import {select as d3_select} from 'd3-selection';
//import {line as d3_line} from 'd3-shape';
import {axisLeft as d3_axisLeft} from 'd3-axis';

import ReactFauxDOM from 'react-faux-dom';

import qe from '../engine/qe.js';
import eSpace from '../engine/eSpace.js';
//import {dumpVoltage, makeVoltagePathAttribute} from '../utils/voltDisplay.js';

// I dunno but the voltages I'm generating are too strong.
// So I reduced it by this factor, but still have to magnify it to make it visible.
//export const spongeFactor = 100;

let traceVoltageArea = false;
//let tracePathAttribute = false;

let traceRendering = false;
let traceDragging = false;


// ultimately, this is a <svg node with a <path inside it
export class VoltageArea extends React.Component {
	static propTypes = {
		// for first couple of renders, space and idunno are null
		space: PropTypes.instanceOf(eSpace),

		// this can be null if stuff isn't ready.  these are now determined by css.
		height: PropTypes.number,

		// includes scrollSetting, heightVolts, voltMin, voltMax, xScale, yScale
		vDisp: PropTypes.object,

		// this component is always rendered so it retains its state,
		// but won't draw anything if the checkbox is off
		showVoltage: PropTypes.bool.isRequired,

		canvasFacts: PropTypes.object,
		//gimmeVoltageArea: PropTypes.func.isRequired,
	};

	constructor(props) {
		super(props);
		this.state = {
			// should just use forceUpdate on our comp obj instead!
			// I guess I am.  The state for this is the voltDisp obj and the voltageBuffer,
			// which have internal changes but the obj ref never changes.
			changeSerial: 0,
		};
		if (traceVoltageArea) console.log(`👆 👆 the new VoltageArea:`, this);

		//props.gimmeVoltageArea(this);
		console.log(`👆 👆  VoltageArea constructor. izzer space? ${props.space}.  Is there  vDisp?  ${props.vDisp}`);

		if (traceVoltageArea) console.log(`👆 👆 VoltageArea  constructor done`);
	}

	/* ***************************************************  click & drag */

	// every time user changes one datapoint.  Also set points interpolated between.
	// returns false if it failed and needs to be done again.  True means it succeeded.
	changeVoltage(ev, title) {
		const p = this.props;
		const v = p.vDisp;
		//if (!p.canvasWidth)
		//return false;

		// shift key gives you steady voltage as you drag across, but if you do it on the first
		// click, we don't know where to start
		let newVoltage = this.latestVoltage;
		if (! ev.shiftKey || title == 'Down') {
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
				ix, v.voltageBuffer[ix], newVoltage);

		if (undefined == this.latestIx) {
			// the first time, all you can do is the one point
			v.voltageBuffer[ix] = newVoltage;
		}
		else {
			// other times, draw a straight linear line through.  d3_scaleLinear from d3
			// cuz sometimes mouse skips.
			let tweenScale = d3_scaleLinear([this.latestIx, ix], [this.latestVoltage, newVoltage]);

			// do it to each point in between
			let hi = Math.max(this.latestIx, ix);
			let lo = Math.min(this.latestIx, ix);
			for (let ixx = lo; ixx <= hi; ixx++) {
				if (traceDragging)
					console.log(`👆 👆 tweening: set point [${ixx}] to ${tweenScale(ixx).toFixed(4)}`)
				v.voltageBuffer[ixx] = tweenScale(ixx);
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
		ev.preventDefault();
		ev.stopPropagation();

		const v = this.props.vDisp;

		// a hit! otherwise we wouldn't be here.
		this.changeVoltage(ev, 'Down');
		this.dragging = true;

		// must also switch the svg to catch mouse events otherwise you can't drag far
		this.svgElement.style.pointerEvents = 'visible';  // auto all none

		// must figure out pointer offset; diff between mousedown pot and the neareest piece of line
		// remember that clientY is in pix units
		//const p = this.props;
		let chosenVoltage = v.yScale.invert(ev.clientY);
		this.mouseYOffset = chosenVoltage - this.latestVoltage;
		if (traceDragging) {
			console.log(`👆 👆 🎯  Y numbers: mouseYOffset(${this.mouseYOffset}) =
				chosenVoltage(${chosenVoltage}) - latestVoltage(${this.latestVoltage})
				from client X=${ev.clientX}    Y=${ev.clientY}`);
		}
	}

	// this one and mouseUp are attached to the whole SVG cuz user can drag all over
	mouseMove =
	(ev) => {
		ev.preventDefault();
		ev.stopPropagation();

		if (! this.dragging) return;

		if (ev.buttons) {
			this.changeVoltage(ev, 'DRAG');
			ev.preventDefault();
			ev.stopPropagation();
		}
		else {
			this.mouseUp(ev);
		}
	}

	// called upon mouseup or a move without mouse dow
	mouseUp =
	(ev) => {
		ev.preventDefault();
		ev.stopPropagation();

		const p = this.props;
		const v = p.vDisp;
		this.dragging = false;  // the ONLY place this can be set false

		// must also switch the svg to pass thru mouse events otherwise other stuff can't get clicks
		this.svgElement.style.pointerEvents = 'none';

		if (traceDragging) {
			console.log(`👆 👆 mouse UP on point (%f,%f) voltage @ ix=%d stopped at %f`,
				ev.clientX, ev.clientY,
				this.latestIx, v.voltageBuffer[this.latestIx]);
		}

		// remind everybody that this episode is over.  Tune in next week.  next mousedown.
		this.latestIx = this.latestVoltage = undefined;

		if (traceDragging)
			v.dumpVoltage(p.space, v.voltageBuffer, 8);
	}

	/* *************************************************** rendering */

	// tell the VoltageArea (that;s us) that something in the
	// space.voltageBuffer changed.  Sometimes called from above. This gets set
	// into the space, when it's available.
	updateVoltageArea =
	() => {
		console.log(`VoltageArea.updateVoltageArea`);
		//const space = this.props.space;
		this.props.vDisp.findVoltExtremes();
		this.forceUpdate();
	}

	componentDidUpdate() {
		// the constructor probably won't have space, but here it will.  should.
		const p = this.props;
		if (p.space)
			p.space.updateVoltageArea = this.updateVoltageArea;
		else
			console.log(`👆 👆  VoltageArea, no space! ${p.space}.  Is there also no vDisp?  ${p.vDisp}`);
	}


	// the main path is the voltage, but for WELL we also draw end blocks, and also...
	renderPaths() {
		const p = this.props;
		const v = p.vDisp;
		if (!p.space)
			return <></>;

		// collects ALL svg to be rendered
		let paths = [];

		// we want the bumpers on the end to show even if we're not showing 'voltage'
		switch (p.space.dimensions[0].continuum) {
			case qe.contWELL:
				// stone slabs on each end on the borders vaguely means 'quantum well'.
				paths.push(
					<rect className='left wellSlab' key='left'
						x={0} y={0}
						width={this.barWidth +'px'} height={p.canvasFacts.height +'px'}
					/>
				);
				paths.push(
					<rect className='right wellSlab' key='right'
						x={(p.canvasFacts.width - this.barWidth) +'px'} y={0}
						width={this.barWidth +'px'} height={p.canvasFacts.height +'px'}
					/>
				);
				console.info(`installed slabs: width=${p.canvasFacts.width} height=${p.canvasFacts.height}  this.barWidth=${this.barWidth}`);
				break;

			case qe.contENDLESS:
				break;

			default: throw new Error(`bad continuum ${p.space.dimensions.continuum}`);
		}

		// the lines themselves: exactly overlapping.  tactile wider than visible.
		if (p.showVoltage) {
			const pathAttribute = v.makeVoltagePathAttribute();
			//const pathAttribute = this.makePathAttribute(start, end);

			// this one actually draws the voltage line
			paths.push(
				<path className='visibleLine' key='visibleLine'
					d={pathAttribute}
				/>
			);

			// you click on this one
			paths.push(
				<path className='tactileLine' key='tactileLine'
					d={pathAttribute}
					onMouseDown={ev => this.mouseDown(ev)}
				/>
			);


			// axis for voltage.  Makes no sense if no axis there.
			//debugger;
			let axis = d3_axisLeft(v.yInverted);
			axis.ticks(2);

			let voltageAxis = ReactFauxDOM.createElement('g');
			//let voltageAxis = document.createElementNS('http://www.w3.org/2000/svg', 'g');
			let vAx = d3_select(voltageAxis);
			vAx.attr('class', 'voltageAxis');

			let txX = p.canvasFacts.width - this.barWidth;
			let txY = p.canvasFacts.height;
			vAx.attr('transform', `translate(${txX}, ${txY})`);
			vAx.call(axis);
			//debugger;
			paths.push(voltageAxis.toReact());
		}
		return paths
	}

	render() {
		if (traceRendering)
			console.log(`👆 👆 VoltageArea.render()`);
		const p = this.props;
		if (! p.space)
			return '';  // too early
		this.barWidth = p.canvasFacts.width / p.space.nPoints;

		let v = p.vDisp;
		v.setVoltScales(p.canvasFacts.width, p.canvasFacts.height, p.space.N);

		let vArea = (
			<svg className='VoltageArea'
				viewBox={`0 0 ${p.canvasFacts.width} ${p.canvasFacts.height}`}
					width={p.canvasFacts.width} height={p.canvasFacts.height}
					onMouseMove={this.mouseMove}
					onMouseUp={this.mouseUp}
					ref={el => this.svgElement = el}
			 	>

				{this.renderPaths()}
			</svg>
		);
		if (traceRendering)
			console.log(`👆 👆 VoltageArea render done`);

		return vArea;
	}


}

export default VoltageArea;

