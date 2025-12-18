/*
** Voltage Area -- the off-white voltage line, and its tactile
**		    interactions when the user moves it.  for Squishy Electron
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import React, {useRef, useState, useReducer, useContext} from 'react';

import PropTypes from 'prop-types';

import {scaleLinear as d3_scaleLinear} from 'd3-scale';
import {select as d3_select} from 'd3-selection';
import {axisLeft as d3_axisLeft} from 'd3-axis';

import ReactFauxDOM from 'react-faux-dom';
import clickNDrag from '../widgets/clickNDrag.js';
import './volts.scss';
import SquishContext from '../sPanel/SquishContext.js';

let traceVoltageArea = false;

let traceRendering = false;
let traceProfileDragging = false;
let traceTweening = false;
let traceWheel = false;

let traceScrollStretch = false;

// how long it takes, in milliseconds, dragging outside of the main voltage area,
// to double the scroll or heightVolts
let DOUBLING_TIME = 2000;

const propTypes = {
	// includes scrollSetting, heightVolts, measuredMinVolts, measuredMaxVolts, xScale, yScale
	mainVDisp: PropTypes.object,

	//NOT NEEDED.  VoltOverlay shows and hides.  showVoltage: PropTypes.string.isRequired,

	// for first couple of renders, space and idunno are null
	space: PropTypes.object,

	// this can be null if stuff isn't ready.  these are now determined by css.
	// no use canvasInnerDims  height: PropTypes.number,

	drawingLeft: PropTypes.number.isRequired,
	drawingWidth: PropTypes.number.isRequired,
	canvasInnerHeight: PropTypes.number.isRequired,

	// changing a buffer point should only be done thru this func
	setAPoint: PropTypes.func,
};



// ultimately, this is a <svg node with a <path inside it
function VoltArea(props) {
	cfpt(propTypes, props);
	const p = props;
	const mVD = p.mainVDisp;
	if (traceVoltageArea)
		console.log(`⚡️ starting VoltArea`);
	const context = useContext(SquishContext);

	// svg element ref.
	const svgRef = useRef();
	let svgEl = svgRef.current;
	let svgRect = svgEl?.getBoundingClientRect();

	// <path refs
	const tactileRef = useRef();
	let tactileEl = tactileRef.current;
	const visibleRef = useRef();
	let visibleEl = visibleRef.current;
	//const dragCountRef = useRef(0);

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
			console.log(`⚡️ strayOutside down how close?  newVoltage=${newVoltage} mVD.bottomVolts=${mVD.bottomVolts} `);
		if (newVoltage < mVD.bottomVolts) {
			// dragging down
			let howMuch = (mVD.bottomVolts - newVoltage) / mVD.heightVolts * howLong;
			if (traceScrollStretch)
				console.log(`⚡️ strayOutside down howMuch=${howMuch} `);
			if (newVoltage < mVD.minBottom) {
				// stretch heightVolts
				mVD.heightVolts += mVD.heightVolts * howMuch;
			}
			// scroll in either case
			mVD.bottomVolts -= mVD.heightVolts * howMuch;
			if (mVD.bottomVolts < mVD.minBottom)
				mVD.bottomVolts = mVD.minBottom
			mVD.setMaxMax();
			if (traceScrollStretch)
				mVD.dumpVoltDisplay('   after stretching up');

			lastDragOutside = now;
		}
		else if (newVoltage > mVD.maxTop) {
			// dragging up
			let howMuch = (newVoltage - mVD.maxTop) / mVD.heightVolts * howLong;
			if (traceScrollStretch)
				console.log(`⚡️  strayOutside up  howMuch=${howMuch} `)
			if (newVoltage > mVD.maxTop) {
				// stretch heightVolts
				mVD.heightVolts += mVD.heightVolts * howMuch;
			}
			// scroll in either case
			mVD.bottomVolts += mVD.heightVolts * howMuch;
			if (mVD.bottomVolts > mVD.maxBottom)
				mVD.bottomVolts = mVD.maxBottom;
			mVD.setMaxMax();
			if (traceScrollStretch)
				mVD.dumpVoltDisplay('⚡️ after stretching up');

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
			newVoltage = mVD.yUpsideDown.invert(ev.clientY - svgRect.y);
		}

		let ix = Math.round(mVD.xScale.invert(ev.clientX - svgRect.x));
		ix = Math.max(Math.min(ix, mVD.end-1), mVD.start);  // dragging off the end

		if (ix == latestIx && Math.abs(newVoltage - latestVoltage) < mVD.heightVolts * .01)
			return;  // same old same old; these events come too fast

		if (traceProfileDragging) {
			console.log(`⚡⚡️ ${phase} on point (${ev.clientX.toFixed(1)}, ${ev.clientY.toFixed(1)}) `
				+` voltage @ ix=${ix} changing from ${mVD.voltageBuffer[ix].toFixed(0)} to `
				+`${newVoltage.toFixed(0)}`);
		}

		if (phase == 'pointerdown') {
			// the first time, all you can do is the one point
			p.setAPoint(ix, newVoltage);
			//mVD.voltageBuffer[ix] = newVoltage;
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
				//mVD.voltageBuffer[ixx] = tweenScale(ixx);
			}
			if (traceTweening) console.log(`⚡️ tweening done`)
		}

		latestIx = ix;
		latestVoltage = newVoltage;

		//strayOutside(newVoltage);

		// now show it. generate a new path attribute for both lines.  Same attr value.
		// Go around React for speed.
		let dAttr = mVD.makeVoltagePathAttribute(mVD.yScale);
		tactileEl.setAttribute('d', dAttr);
		visibleEl.setAttribute('d', dAttr);
	}

	// pointer down on the path.tactile element.  The VoltArea function is not
	// called during dragging; only at the end.
	const pointerDown =
	(ev) => {
		if (traceProfileDragging)
			console.log(`👈 👆  pointerDown on tactile Line`, this, ev);

		// only react if the LEFT button is down
		if (ev.buttons & 1) {
			// bring me all the events, even outside the svg
			// somehow this breaks drawing the voltage line  🤔
			//svgEl.setPointerCapture(ev.pointerId);

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

	const pointerLeave =
	(ev) => {
		if (dragging) {
			if (traceProfileDragging) {
				console.log(`⚡⚡️ pointer UP on point (${ev.clientX.toFixed(1)}, ${ev.clientY.toFixed(1)}) `
					+` voltage @ ix=${latestIx} changing from ${mVD.voltageBuffer[latestIx].toFixed(0)}`
					+` to ${latestVoltage.toFixed(0)}`);
			}

			// remind everybody that this episode is over.  Tune in next week.  next pointerdown.
			dragging = false;
			latestIx = latestVoltage = undefined;
			//setChangeCounter(changeCounter++);

			if (traceProfileDragging)
				mVD.dumpVoltage('pointer up', 8);
			ev.preventDefault();
			ev.stopPropagation();
		}
	}

	const pointerUp =
	(ev) => {
		if (dragging) {
			pointerLeave(ev);
		}
		else {
			// just a mouse release, not on anything else, can stop animation (but not start it again)
			if (context.shouldBeIntegrating)
				context.controlPanel.finishAnimating(ev);
		}
	}

	// we only do vertical.  right now.  Moves the voltage line (but not its voltage)
	// By default this is handled as a passive event, but we need active so we have to do it outselves.
	const wheelHandler =
	(ev) => {
		let deltaPixels;

		switch (ev.deltaMode) {
		case WheelEvent.DOM_DELTA_PIXEL:
			deltaPixels = ev.deltaY;
			break;

		case WheelEvent.DOM_DELTA_LINE:
			deltaPixels = ev.deltaY * Math.sqrt(mVD.canvasHeight);
			break;

		case WheelEvent.DOM_DELTA_PAGE:
			deltaPixels = ev.deltaY * mVD.canvasHeight;
			break;
		}

		// convert pixels delta to voltage delta to fraction delta fractiion of whole heightVolts
		let fracAmount = -deltaPixels / mVD.canvasHeight;
		//let fracAmount = mVD.yScale.invert(deltaPixels) / mVD.heightVolts;
		mVD.scrollVoltHandler(fracAmount);
		if (traceWheel) {
			console.log(`wheel event: deltaY=${ev.deltaY}  deltaMode=${ev.deltaMode} `
				+` scaled delta=${mVD.yScale.invert(deltaPixels)} fracAmount=${fracAmount}`,
				ev);
		}

		// we can't do the preventDefault() if this handler is passive.  Hence all the kicking and screaming.
		ev.preventDefault();
		ev.stopPropagation();
	}

	// set the wheel event handler, with passive OFF and with capture so we can
	// avoid passing it to anybody else.
	const wheelHandlerOptions = {passive: false, capture: true};

	// intercepted with a ref callback, we set the wheel event handler and
	// remove it when done, as we should.  React 19+ apparently wants you to
	// RETURN a cleanup function instead of calling svgRefCallback() with null.
	const svgRefCallback = (se) => {
		if (!se)  {
			// element went away.  (or this is the first render... in which case the remove is harmless.)
			// must be exactly same args as the add call
			svgEl.removeEventListener('wheel', wheelHandler, wheelHandlerOptions)
		}

		svgRef.current = svgEl = se;

		if (svgEl) {
			// all of this is to set passive here to false.   React gives us no way to do that.
			svgEl.addEventListener('wheel', wheelHandler, wheelHandlerOptions);
		}
	}

	/* *************************************************** rendering */

	// this one actually draws the voltage line, normally
	function renderVoltagePath() {
		// the lines themselves: exactly overlapping.  tactile wider than visible.
		const pathAttribute = mVD.makeVoltagePathAttribute(mVD.yScale);
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

	// all over squish, need a way to update the voltage line on the main display
	// Instead of handing the function around, just attach it to the space; everybody has a copy
	p.space.updateDrawnVoltagePath = function updateDrawnVoltagePath() {
		const pathAttribute = mVD.makeVoltagePathAttribute(mVD.yScale);
		visibleEl.setAttribute('d', pathAttribute);
		tactileEl.setAttribute('d', pathAttribute);
	}

	// axis for voltage.  Makes no sense if no axis there.
	function renderAxes() {
		let axis = d3_axisLeft(mVD.yUpsideDown);
		axis.ticks(3, 's');

		let voltageAxis = ReactFauxDOM.createElement('g');
		let vAx = d3_select(voltageAxis);
		vAx.attr('class', 'voltageAxis');

		let txX = p.drawingLeft + p.drawingWidth;
		let txY = p.canvasInnerHeight;
		vAx.attr('transform', `translate(${txX}, ${txY})`);
		vAx.call(axis);
		//debugger;
		return voltageAxis.toReact();
	}

	if (! p.space)
		return '';  // too early

	// width of each bar
	let barWidth = p.drawingWidth / p.space.nPoints;
	if (traceRendering) {
		console.log(`⚡️ VoltArea.render, drawing left:${p.drawingLeft}
			width=${p.drawingWidth}  height=${p.canvasInnerHeight}
			barWidth=${barWidth}`);
	}

	mVD.setVoltScales(p.drawingLeft, p.drawingWidth, p.canvasInnerHeight);

	// these elements show and hide
	// NO!  this is done in VoltOverlay  let vClass = p.showVoltage +'ShowVoltage';
	// so the whole assembly shows and hides incl sidebar

	let vArea = (
		<svg className='VoltArea'
			viewBox={`${p.drawingLeft} 0 ${p.drawingWidth} ${p.canvasInnerHeight}`}
			x={p.drawingLeft} width={p.drawingWidth} height={p.canvasInnerHeight}
			ref={svgRefCallback}
			onPointerMove={pointerMove}
			onPointerUp={pointerUp} onPointerLeave={pointerLeave}
		>
			<g>
				{renderAxes()}
				{renderVoltagePath()}
			</g>

		</svg>
	);

	if (traceRendering)
		console.log(`⚡️ VoltArea render done`);

	return vArea;
}

export default VoltArea;
