/*
** Voltage Area -- the white voltage line, and its tactile
**	      interactions when the user moves it.  for Squishy Electron
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

import React, {useRef, useState, useReducer} from 'react';

import PropTypes from 'prop-types';

import {scaleLinear as d3_scaleLinear} from 'd3-scale';
import {select as d3_select} from 'd3-selection';
import {axisLeft as d3_axisLeft} from 'd3-axis';

import ReactFauxDOM from 'react-faux-dom';

import qe from '../engine/qe.js';

import clickNDrag from '../widgets/clickNDrag.js';
import './volts.scss';

// I dunno but the voltages I'm generating are too strong.
// So I reduced it by this factor, but still have to magnify it to make it visible.
//export const spongeFactor = 100;

let traceVoltageArea = false;

let traceRendering = true;
let traceDragging = false;
let traceTweening = false;
let tracedWheel = false;

let traceScrollStretch = false;

// how long it takes, in milliseconds, dragging outside of the main voltage area,
// to double the scroll or heightVolts
let DOUBLING_TIME = 2000;


function setPT() {
	VoltArea.propTypes = {
		// includes scrollSetting, heightVolts, measuredMinVolts, measuredMaxVolts, xScale, yScale
		vDisp: PropTypes.object,

		// this component is always rendered so it retains its state,
		// but won't draw anything if the checkbox is off
		showVoltage: PropTypes.string.isRequired,

		// for first couple of renders, space and idunno are null
		space: PropTypes.object,

		// this can be null if stuff isn't ready.  these are now determined by css.
		height: PropTypes.number,

		canvasInnerDims: PropTypes.object,
	};
}


// ultimately, this is a <svg node with a <path inside it
function VoltArea(props) {
	const p = props;
	const v = p.vDisp;
	if (traceVoltageArea)
		console.log(`⚡️ the new VoltArea:`, this);

	/* ***************************************************  click & drag */

	// has the user dragged beyond the top/bottom?
	function strayOutside(newVoltage) {

		// dragged outside? scroll, or stretch.  The amount per mouseMove is
		// supposed to be cpu-speed-independent, on whole.  If you just make it
		// 'feel' right, it goes way too fast in 5 or 10 years.
		let now = performance.now();
		let howLong = (now - lastDragOutside) / DOUBLING_TIME;
		if (traceScrollStretch)
			console.log(`⚡️ strayOutside down how close?  newVoltage=${newVoltage} v.bottomVolts=${v.bottomVolts} `);
		if (newVoltage < v.bottomVolts) {
			// dragging down
			let howMuch = (v.bottomVolts - newVoltage) / v.heightVolts * howLong;
			if (traceScrollStretch)
				console.log(`⚡️ strayOutside down howMuch=${howMuch} `);
			if (newVoltage < v.minBottom) {
				// stretch heightVolts
				v.heightVolts += v.heightVolts * howMuch;
			}
			// scroll in either case
			v.bottomVolts -= v.heightVolts * howMuch;
			if (v.bottomVolts < v.minBottom)
				v.bottomVolts = v.minBottom
			v.setMaxMax();
			if (traceScrollStretch)
				v.dumpVoltDisplay('   after stretching up');

			lastDragOutside = now;
		}
		else if (newVoltage > v.maxTop) {
			// dragging up
			let howMuch = (newVoltage - v.maxTop) / v.heightVolts * howLong;
			if (traceScrollStretch)
				console.log(`⚡️  strayOutside up  howMuch=${howMuch} `)
			if (newVoltage > v.maxTop) {
				// stretch heightVolts
				v.heightVolts += v.heightVolts * howMuch;
			}
			// scroll in either case
			v.bottomVolts += v.heightVolts * howMuch;
			if (v.bottomVolts > v.maxBottom)
				v.bottomVolts = v.maxBottom;
			v.setMaxMax();
			if (traceScrollStretch)
				v.dumpVoltDisplay('⚡️ after stretching up');

			lastDragOutside = now;
		}
		else
			lastDragOutside = null;
	}

	const mouseDown =
	(cnDrag, ev) => {
	}

	// every time user changes one datapoint.  Also set points interpolated between.
	// returns false if it failed and needs to be done again.  True means it succeeded.
	const onEvent =
	(cnDrag, ev) => {
		let phase = ev.type;

		// shift key gives you steady voltage as you drag across, but if you do it on the down
		// click, we don't know where to start
		let newVoltage = latestVoltage;
		if (! ev.shiftKey || phase == 'mousedown') {
			newVoltage = v.yUpsideDown.invert(cnDrag.yArena);
		}

		let ix = Math.round(v.xScale.invert(ev.clientX));

		if (ix == latestIx && Math.abs(newVoltage - latestVoltage) < v.heightVolts * .01)
			return;  // same old same old; these events come too fast

		if (traceDragging) {
			console.log(`⚡️ mouse %s on point (%f,%f) voltage @ ix=%d changing from %f to %f`,
				phase,
				cnDrag.xArena, cnDrag.yArena,
				ix, v.voltageBuffer[ix], newVoltage);
		}

		if (phase == 'mousedown') {
			// the first time, all you can do is the one point
			v.voltageBuffer[ix] = newVoltage;
		}
		else {
			// other times, draw a straight linear line through.  d3_scaleLinear from d3
			// cuz sometimes mouse skips.
			let tweenScale = d3_scaleLinear([latestIx, ix], [latestVoltage, newVoltage]);

			// tween to each point in between
			let hi = Math.max(latestIx, ix);
			let lo = Math.min(latestIx, ix);
			for (let ixx = lo; ixx <= hi; ixx++) {
				if (traceTweening)
					console.log(`⚡️ tweening: set point [${ixx}] to ${tweenScale(ixx).toFixed(4)}`)
				v.voltageBuffer[ixx] = tweenScale(ixx);
			}
			if (traceTweening) console.log(`⚡️ tweening done`)
		}

		latestIx = ix;
		latestVoltage = newVoltage;

		strayOutside(newVoltage);

		updateVoltageArea();
		return true;
	}

	// called upon mouseup or a move without mouse down
	const mouseUp =
	(cnDrag, ev) => {
		// must also switch the svg to pass thru mouse events otherwise other stuff can't get clicks
		// no gotta catch wheel events  cnDrag.arenaEl.style.pointerEvents = 'none';

		if (traceDragging) {
			console.log(`⚡️ mouse UP on point (%f,%f) voltage @ ix=%d stopped at %f`,
				cnDrag.xArena, cnDrag.yArena,
				latestIx, v.voltageBuffer[latestIx]);
		}

		// remind everybody that this episode is over.  Tune in next week.  next mousedown.
		latestIx = latestVoltage = undefined;

		if (traceDragging)
			v.dumpVoltage(p.space, v.voltageBuffer, 8);
	}

	// the click n drag object manages dragging voltage segmments
	const cnDrag = useRef(new clickNDrag(mouseDown, onEvent, mouseUp));

	const wheelHandler =
	(ev) => {
		let deltaAmount;

		// the scrollHeight changes at any time so calculate it on the fly
		switch (ev.deltaMode) {
		case WheelEvent.DOM_DELTA_PIXEL:
			deltaAmount = ev.deltaY;
			break;

		case WheelEvent.DOM_DELTA_LINE:
			deltaAmount = ev.deltaY * Math.sqrt(v.scrollHeight);
			break;

		case WheelEvent.DOM_DELTA_PAGE:
			deltaAmount = ev.deltaY * v.scrollHeight;
			break;
		}

		// convert pixels delta to voltage delta to fraction delta
		let fracAmount = v.yScale.invert(deltaAmount) / v.heightVolts;
		v.userScroll(fracAmount);
		if (tracedWheel)
			console.log(`wheel event: deltaY=${ev.deltaY}  deltaMode=${ev.deltaMode} scaled delta=${v.yScale.invert(deltaAmount)} fracAmount=${fracAmount}`, ev);
		// i gotta get rid of this frac shit, it should scroll in volts like you would expect!
		// meanwhile, the yScale is an absolute converter; I need a relative converter.
		// try converting delta + bottom in pixels into volts and subtract bottom volts

		// can't cuz it's passive ev.preventDefault();
		ev.stopPropagation();
	}


	/* *************************************************** rendering */

	// this is bogus: an integer incrementing as a surrogate instead of a more complex state array
// 	let [renderCtr, setRenderCtr] = useState(1);
// 	if (traceVoltageArea)
// 		console.log(`⚡️ VoltArea  constructor done`);
//
// 	function updateVoltageArea() {
// 		setRenderCtr(renderCtr + 1);  // cause a rerender
// 	}

	// tell the VoltArea (that;s us) that something in the
	// space.voltageBuffer changed.  Sometimes called from above. This gets set
	// into the space, when it's available.
	// 	const updateVoltageArea =
	// 	() => {
	// 		if (traceRendering)
	// 			console.log(`⚡️ VoltArea.updateVoltageArea`);
	// 		forceUpdate();
	// 	}

	// 	componentDidUpdate() {
	// 		// the constructor probably won't have space, but here it will.  should.
	// 		const p = this.props;
	// 		if (p.space && p.vDisp) {
	// 			p.vDisp.updateVoltageArea = this.updateVoltageArea;
	// 			p.space.updateVoltageArea = this.updateVoltageArea;}
	// 		else
	// 			console.warn(`⚡️  VoltArea, no space! ${p.space}.  Is there also no vDisp?  ${p.vDisp}`);
	// 	}

	// this one actually draws the voltage line
	function renderVoltagePath() {
		// the lines themselves: exactly overlapping.  tactile wider than visible.
		// 		if (traceRendering)
		// 			console.log(`⚡️      pathAttribute: showVoltage=${p.showVoltage}   isHovering=${isHovering}`);
		// 		if ('always' == p.showVoltage || ('hover' == p.showVoltage && isHovering)) {
		const pathAttribute = v.makeVoltagePathAttribute(v.yScale);
		if (traceRendering)
			console.log(`⚡️ VoltArea.pathAttribute: `, pathAttribute);

		return <>
			<path className='visibleLine' key='visibleLine'
				d={pathAttribute} />
			<path className='tactileLine' key='tactileLine'
				d={pathAttribute}
				ref={cnDrag.refTarget} />

		</>;
	}

	// axis for voltage.  Makes no sense if no axis there.
	function renderAxes() {
		let axis = d3_axisLeft(v.yUpsideDown);
		axis.ticks(3);

		let voltageAxis = ReactFauxDOM.createElement('g');
		//let voltageAxis = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		let vAx = d3_select(voltageAxis);
		vAx.attr('class', 'voltageAxis');

		let txX = p.canvasInnerDims.width - barWidth;
		let txY = p.canvasInnerDims.height;
		vAx.attr('transform', `translate(${txX}, ${txY})`);
		vAx.call(axis);
		//debugger;
		return voltageAxis.toReact();
	}

	if (! p.space)
		return '';  // too early
	let barWidth = p.canvasInnerDims.width / p.space.nPoints;
	if (traceRendering)
		console.log(`⚡️ VArea.render, barWidth:${barWidth}  cFacts:`,
			p.canvasInnerDims);

	if (traceRendering) {
		console.info(`canvasInnerDims: width=${p.canvasInnerDims.width} `
			+`height=${p.canvasInnerDims.height}  barWidth=${barWidth}`);
	}

	v.setVoltScales(p.canvasInnerDims.width, p.canvasInnerDims.height, p.space.N);

	// these elements show and hide
	let vClass = p.showVoltage +'ShowVoltage';

	let vArea = (
		<svg className='VoltArea'
			viewBox={`0 0 ${p.canvasInnerDims.width} ${p.canvasInnerDims.height}`}
			width={p.canvasInnerDims.width} height={p.canvasInnerDims.height}
			ref={cnDrag.refArena}
			onWheel={wheelHandler}
		>
			<g className={'optionalVoltage ' + vClass}>
				{/* for showVoltage on hover, need this to  hover over */}
				<rect className='hoverBox' key='hoverBox'
					x={0} y={0} width={p.canvasInnerDims.width} height={p.canvasInnerDims.height}
					/>

				{renderVoltagePath()}
				{renderAxes()}
			</g>

		</svg>
	);

	if (traceRendering)
		console.log(`⚡️ VoltArea render done`);

	return vArea;
}

export default VoltArea;
