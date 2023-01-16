/*
** Voltage Area -- the white voltage line, and its tactile
**	      interactions when the user moves it.  for Squishy Electron
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';
import {scaleLinear} from 'd3-scale';

import qe from '../engine/qe.js';
import eSpace from '../engine/eSpace.js';
//import {dumpVoltage, makeVoltagePathAttribute} from '../utils/voltDisplay.js';

// I dunno but the voltages I'm generating are too strong.
// So I reduced it by this factor, but still have to magnify it to make it visible.
export const spongeFactor = 100;

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
		gimmeVoltageArea: PropTypes.func.isRequired,
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

		props.gimmeVoltageArea(this);

		if (traceVoltageArea) console.log(`👆 👆 VoltageArea  constructor done`);
	}

	/* *************************************************** drawing */

	// tell the VoltageArea (that;s us) that something in the space.voltageBuffer changed.  Sometimes called from above.
	// sheesh this is passed up and down so much; should figure out who and where needs it and simplify stuff.
	updateVoltageArea =
	voltageParams => {
		//console.log(`VoltageArea.updateVoltageArea:`, voltageParams);
		//const space = this.props.space;
		this.props.vDisp?.findVoltExtremes();
		this.forceUpdate();
	}

	// the main path is the voltage, but for WELL we also draw end blocks, and also...
	renderPaths() {
		const p = this.props;
		const v = p.vDisp;
		if (!p.space) return <></>;
		//const wholeRect = p.wholeRect;

		//let {start, end, continuum} = p.space.startEnd;
		let paths = [];

		switch (p.space.dimensions[0].continuum) {
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
				// full width including boundaries?  can you drag the boundaries?!?!  no.  So no line thru boundaries.
				break;

			default: throw new Error(`bad continuum ${p.space.dimensions.continuum}`);
		}

		// the lines themselves: exactly overlapping.  tactile wider than visible.
		if (p.showVoltage) {
			const pathAttribute = v.makeVoltagePathAttribute();
			//const pathAttribute = this.makePathAttribute(start, end);

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
		const v = p.vDisp;
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
				ix, v.voltageBuffer[ix], newVoltage);

		if (undefined == this.latestIx) {
			// the first time, all you can do is the one point
			v.voltageBuffer[ix] = newVoltage;
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

}

export default VoltageArea;

