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
import clickNDrag from '../widgets/clickNDrag.js';
import './volts.scss';

// I dunno but the voltages I'm generating are too strong.
// So I reduced it by this factor, but still have to magnify it to make it visible.
//export const spongeFactor = 100;

let traceVoltageArea = false;

let traceRendering = false;
let traceDragging = false;
let traceTweening = false;
let traceWheel = false;

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

		// changing a buffer point should only be done thru this func
		setAPoint: PropTypes.func,
	};
}


// ultimately, this is a <svg node with a <path inside it
function VoltArea(props) {
	const p = props;
	const v = p.vDisp;
	if (traceVoltageArea)
		console.log(`⚡️ starting VoltArea`);

	// element refs
	const svgRef = useRef();
	let svgEl = svgRef.current;
	let svgRect = svgEl?.getBoundingClientRect();
	const tactileRef = useRef();
	let tactileEl = tactileRef.current;
	const visibleRef = useRef();
	let visibleEl = visibleRef.current;

	// phony state variable that changes when buffer changes.  I tried using the whole buffer for this; no.
 	//let [changeCounter, setChangeCounter] = useState(0);

	// variables while dragging
	let dragging = false;
	let latestVoltage;
	let latestIx;

	/* ***************************************************  click & drag */

	// has the user dragged beyond the top/bottom?
	function strayOutside(newVoltage) {

		// dragged outside? scroll, or stretch.  The amount per pointerMove is
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

	// every time user changes one datapoint.  Also set points interpolated between.
	// returns false if it failed and needs to be done again.  True means it succeeded.
	const onePoint =
	(ev) => {
		let phase = ev.type;
		if (!svgRect)
			return;  // can't drag voltage till after first render

		// shift key gives you steady voltage as you drag across, but if you do it on the down
		// click, we don't know where to start
		let newVoltage = latestVoltage;
		if (! ev.shiftKey || phase == 'pointerdown') {
			newVoltage = v.yUpsideDown.invert(ev.clientY - svgRect.y);
		}

		let ix = Math.round(v.xScale.invert(ev.clientX - svgRect.x));
		ix = Math.max(Math.min(ix, v.end-1), v.start);  // dragging off the end

		if (ix == latestIx && Math.abs(newVoltage - latestVoltage) < v.heightVolts * .01)
			return;  // same old same old; these events come too fast

		if (traceDragging) {
			console.log(`⚡⚡️ ${phase} on point (${ev.clientX.toFixed(1)}, ${ev.clientY.toFixed(1)}) `
				+` voltage @ ix=${ix} changing from ${v.voltageBuffer[ix].toFixed(0)} to ${newVoltage.toFixed(0)}`);
		}

		if (phase == 'pointerdown') {
			// the first time, all you can do is the one point
			p.setAPoint(ix, newVoltage);
			//v.voltageBuffer[ix] = newVoltage;
		}
		else {
			// other times, tween a straight linear line from last.  d3_scaleLinear from d3
			// cuz sometimes pointer skips.
			let tweenScale = d3_scaleLinear([latestIx, ix], [latestVoltage, newVoltage]);

			// tween to each point in between
			let hi = Math.max(latestIx, ix);
			let lo = Math.min(latestIx, ix);
			for (let ixx = lo; ixx <= hi; ixx++) {
				if (traceTweening)
					console.log(`⚡️ tweening: set point [${ixx}] to ${tweenScale(ixx).toFixed(4)}`);

				p.setAPoint(ixx, tweenScale(ixx));
				//v.voltageBuffer[ixx] = tweenScale(ixx);
			}
			if (traceTweening) console.log(`⚡️ tweening done`)
		}

		latestIx = ix;
		latestVoltage = newVoltage;

		//strayOutside(newVoltage);

		// now show it. generate a new path attribute for both lines.  Same attr value.
		// Go around React for speed.
		let dAttr = v.makeVoltagePathAttribute(v.yScale);
		tactileEl.setAttribute('d', dAttr);
		visibleEl.setAttribute('d', dAttr);
	}

	// pointer down on the path.tactile element.  The VoltArea function is not called during dragging; only at the end.
	const pointerDown =
	(ev) => {
		if (traceDragging)
			console.log(`👈 👆  pointerDown on tactile Line`, this, ev);

		// only react if the LEFT button is down
		if (ev.buttons & 1) {
			// bring me all the events, even outside the svg
			svgEl.setPointerCapture(ev.pointerId);

			dragging = true;
			onePoint(ev);
			ev.preventDefault();
			ev.stopPropagation();
		}
	}

	// for a move, do mostly what the other events do
	const pointerMove =
	(ev) => {
		// only react if it was properly started on a pointerDown in the VoltArea, and still down
		if ((ev.buttons & 1) && dragging) {
			onePoint(ev);
			ev.preventDefault();
			ev.stopPropagation();
		}
	}

	// called upon pointerup
	const pointerUp =
	(ev) => {
		// ev.buttons is zero here, this is called after button(s) released
		if (dragging) {
			if (traceDragging) {
				console.log(`⚡⚡️ pointer UP on point (${ev.clientX.toFixed(1)}, ${ev.clientY.toFixed(1)}) `
					+` voltage @ ix=${latestIx} changing from ${v.voltageBuffer[latestIx].toFixed(0)}`
					+` to ${latestVoltage.toFixed(0)}`);
			}

			// remind everybody that this episode is over.  Tune in next week.  next pointerdown.
			dragging = false;
			latestIx = latestVoltage = undefined;
			//setChangeCounter(changeCounter++);

			if (traceDragging)
				v.dumpVoltage('pointer up', 8);
			ev.preventDefault();
			ev.stopPropagation();
		}
	}

// we only do vertical.  right now.  Moves the voltage line (but not its voltage)
	const wheelHandler =
	(ev) => {
		let deltaPixels;

		switch (ev.deltaMode) {
		case WheelEvent.DOM_DELTA_PIXEL:
			deltaPixels = ev.deltaY;
			break;

		case WheelEvent.DOM_DELTA_LINE:
			deltaPixels = ev.deltaY * Math.sqrt(v.canvasHeight);
			break;

		case WheelEvent.DOM_DELTA_PAGE:
			deltaPixels = ev.deltaY * v.canvasHeight;
			break;
		}

		// convert pixels delta to voltage delta to fraction delta fractiion of whole heightVolts
		let fracAmount = -deltaPixels / v.canvasHeight;
		//let fracAmount = v.yScale.invert(deltaPixels) / v.heightVolts;
		v.scrollVoltHandler(fracAmount);
		if (traceWheel) {
			console.log(`wheel event: deltaY=${ev.deltaY}  deltaMode=${ev.deltaMode} `
				+` scaled delta=${v.yScale.invert(deltaPixels)} fracAmount=${fracAmount}`,
				ev);
		}

		// can't cuz it's passive ev.preventDefault();
		ev.stopPropagation();
	}


	/* *************************************************** rendering */

	// tell the VoltArea (that;s us) that something in the (space or
	// vDisp).voltageBuffer changed.  Or the bottom or height.  Sometimes called
	// from above. This gets set into the space, when it's available.
//	const updateVoltageArea =
//	() => {
//		if (traceRendering)
//			console.log(`⚡️ VoltArea.updateVoltageArea`);
//
//		// so update everybody who keeps this
//		//setChangeCounter(changeCounter++);  // so react rerenders
//	}
//	// these places need this function too
//	v.updateVoltageArea = updateVoltageArea;
//	p.space.updateVoltageArea = updateVoltageArea;

	// this one actually draws the voltage line
	function renderVoltagePath() {
		// the lines themselves: exactly overlapping.  tactile wider than visible.
		const pathAttribute = v.makeVoltagePathAttribute(v.yScale);
		if (traceRendering)
			console.log(`⚡️ VoltArea.pathAttribute: `, pathAttribute);

		return <>
			<path className='visibleLine' key='visibleLine' ref={visibleRef}
				d={pathAttribute} />
			<path className='tactileLine' key='tactileLine' ref={tactileRef}
				d={pathAttribute}
				onPointerDown={pointerDown} />
		</>;
	}

	// axis for voltage.  Makes no sense if no axis there.
	function renderAxes() {
		let axis = d3_axisLeft(v.yUpsideDown);
		axis.ticks(6);

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
	if (traceRendering) {
		console.log(`⚡️ VArea.render, barWidth:${barWidth} canvasInnerDims: `
			+`width=${p.canvasInnerDims.width}  height=${p.canvasInnerDims.height} `
			+` barWidth=${barWidth}`);
	}

	v.setVoltScales(p.canvasInnerDims.width, p.canvasInnerDims.height, p.space.N);

	// these elements show and hide
	let vClass = p.showVoltage +'ShowVoltage';

	let vArea = (
		<svg className='VoltArea'
			viewBox={`0 0 ${p.canvasInnerDims.width} ${p.canvasInnerDims.height}`}
			width={p.canvasInnerDims.width} height={p.canvasInnerDims.height}
			ref={svgRef}
			onWheel={wheelHandler} onPointerMove={pointerMove} onPointerUp={pointerUp}
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
