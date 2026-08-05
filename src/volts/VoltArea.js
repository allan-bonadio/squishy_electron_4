/*
** Voltage Area -- the off-white voltage line, and its tactile
**	  interactions when the user moves it.  for Squishy Electron
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

import React, {useRef, useState, useReducer, useContext, useEffect} from 'react';

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
let traceWheel = true;

let traceScrollStretch = false;
let traceViewBox = false;

// how long it takes, in milliseconds, dragging outside of the main voltage area,
// to double the scroll or heightVolts
let DOUBLING_TIME = 2000;

const propTypes = {
	// includes scrollSetting, heightVolts, measuredMinVolts, measuredMaxVolts, xScale, yScale
	mainVDisp: PropTypes.object,

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
		dblog(`⚡️⚡️ starting VoltArea`);
	const context = useContext(SquishContext);

	// must render when wheel changes these
	let [vBottom, setVBottom] = useState(mVD.bottomVolts);
	let[ vHeight, setVHeight] = useState(mVD.heightVolts);

	// <path refs
	const tactileRef = useRef();
	let tactileEl = tactileRef.current;
	const visibleRef = useRef();
	let visibleEl = visibleRef.current;

	const svgRef = useRef();
	let svgEl   ;//TODO = svgRef.current;
	let svgRect   ;//jTODO = svgEl?.getBoundingClientRect();
	function setSvgEl() {
		if (!svgRef.current) {
			dblog(`⚡️⚡️ svgRef.current not set`)
			return;
		}
		svgEl = svgRef.current;
		svgRect = svgEl?.getBoundingClientRect();
	}
	setSvgEl();  // might be already set
	useEffect(setSvgEl);  // otherwise this will set it
	//const dragCountRef = useRef(0);

	// variables while dragging
	const draggingRef = useRef();
	let dragging = draggingRef.current;
	//let dragging = false;
	let latestVoltage;
	let latestIx;

	let waveElementRef = useRef();
	let waveElement = waveElementRef.current;

	/* ***************************************************  click & drag */

	// NOT IN USE
	// has the user dragged beyond the top/bottom?
	function strayOutside(newVoltage) {
		// dragged outside? scroll, or stretch.  The amount per pointerMoveOnTactile is
		// supposed to be cpu-speed-independent, on whole.  If you just make it
		// 'feel' right, it goes way too fast in 5 or 10 years.
		let now = performance.now();
		let howLong = (now - lastDragOutside) / DOUBLING_TIME;
		if (traceScrollStretch)
			dblog(`⚡️⚡️ strayOutside down how close?  newVoltage=${newVoltage} mVD.bottomVolts=${mVD.bottomVolts} `);
		if (newVoltage < mVD.bottomVolts) {
			// dragging down
			let howMuch = (mVD.bottomVolts - newVoltage) / mVD.heightVolts * howLong;
			if (traceScrollStretch)
				dblog(`⚡️⚡️ strayOutside down howMuch=${howMuch} `);
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
				dblog(`⚡️  strayOutside up  howMuch=${howMuch} `)
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
			dblog(`⚡⚡️ ${phase} on point (${ev.clientX.toFixed(1)}, ${ev.clientY.toFixed(1)}) `
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
					dblog(`⚡️ tweening: set point [${ixx}] to ${tweenScale(ixx).toFixed(4)}`);

				p.setAPoint(ixx, tweenScale(ixx));
				//mVD.voltageBuffer[ixx] = tweenScale(ixx);
			}
			if (traceTweening) dblog(`⚡️ tweening done`)
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

	// pointer down on the path.tactile element, NOT on the VoltArea
	const pointerDownOnTactile =
	(ev) => {
		if (traceProfileDragging)
			dblog(`👈 👆  pointerDownOnTactile on tactile Line`, this, ev);

		// only react if the LEFT button is down
		if (ev.buttons & 1) {
			// bring me all the events, even outside the svg
			// somehow this breaks drawing the voltage line  🤔
			//svgEl.setPointerCapture(ev.pointerId);

			// try fixing the wave

			waveElement = ev.target;
			while (waveElement && waveElement.className != 'WaveView')
				waveElement = waveElement.parentElement;
			waveElementRef.current = waveElement;
			if (waveElement)
				waveElement.style.position = 'fixed';


			draggingRef.current = dragging = true;
			onePoint(ev);
			ev.target.setPointerCapture(ev.pointerId);  // so we even get drags OUTSIDE
			ev.preventDefault();
			ev.stopPropagation();
		}
	}

	// for a move, do mostly what the other events do
	const pointerMoveOnTactile =
	(ev) => {
		// only react if it was properly started on a pointerDownOnTactile in the VoltArea, and still down
		if ((ev.buttons & 1) && dragging) {
			onePoint(ev);
			ev.preventDefault();
			ev.stopPropagation();
		}
	}

	const pointerLeaveTactile =
	(ev) => {
		if (dragging) {
			if (traceProfileDragging) {
				dblog(`⚡⚡️ pointer LEAVE on point (${ev.clientX.toFixed(1)}, ${ev.clientY.toFixed(1)}) `
					+` voltage @ ix=${latestIx} changing from ${mVD.voltageBuffer[latestIx].toFixed(0)}`
					+` to ${latestVoltage.toFixed(0)}`);
			}

			// ignore it!

			// remind everybody that this episode is over.  Tune in next week.  next pointerdown.
			//dragging = false;
// 			latestIx = latestVoltage = undefined;
// 			//setChangeCounter(changeCounter++);
//
// 			if (traceProfileDragging)
// 				mVD.dumpVoltage('pointer Leave', 8);
// 			ev.preventDefault();
// 			ev.stopPropagation();
		}
	}

	const pointerUpFromTactile =
	(ev) => {
		if (dragging) {
			pointerLeaveTactile(ev);
		}
		else {
			// just a mouse release, not on anything else, can stop animation (but not start it again)
			if (context.shouldBeIntegrating)
				context.controlPanel.finishAnimating(ev);
				// this starts up upom frontclicks; very annoying
				// else
				// 	context.controlPanel.beginAnimating(ev);
		}
		// only if pointer up, not for leave, so user can drag as far as they want
		draggingRef.current = dragging = false;
		dragging = false;

		// playing with fire
		if (waveElement)
			waveElement.style.position = 'relative';

	}

	/* ************************************************* mouse Wheel */
	// Used to scroll & zoom the voltage line we only do vertical.
	// right now.  Moves the voltage line (but not its voltage) By
	// default this is handled as a passive event, but we need active
	// so we have to do it outselves.
	const wheelHandler =
	(ev) => {
		if (traceWheel) dblog(`⚡️⚡️ wheelHandler st: deltaMode=${ev.deltaMode} `
			+` deltaX=${ev.deltaX} deltaY=${ev.deltaY} `
			+`  shift=${ev.shiftKey}, alt=${ev.altKey}`, ev);
		if (!ev.shiftKey && !ev.altKey) return;

		// if you hold down Shift, that means, wheel scrolls left and right.
		// they do it for you.
		let deltaXY = ev.deltaY;
		if (ev.shiftKey) deltaXY = ev.deltaX + ev.deltaY;

		let deltaPixels;
		const canvasHeight = mVD.viewCanvasHeight;

		switch (ev.deltaMode) {
		case WheelEvent.DOM_DELTA_PIXEL:  // zero
			deltaPixels = deltaXY;
			break;

		case WheelEvent.DOM_DELTA_LINE:  // one
			// √canvasHeight is about 1 em
			deltaPixels = deltaXY * Math.sqrt(canvasHeight);
			break;

		case WheelEvent.DOM_DELTA_PAGE:  // two
			deltaPixels = deltaXY * canvasHeight;
			break;
		}

		// convert pixels delta to voltage delta to fraction delta
		// fractiion of whole heightVolts
		let fracAmount = -deltaPixels / canvasHeight;
		// ?? let fracAmount = mVD.yScale.invert(deltaPixels) / mVD.heightVolts;

		if (traceWheel) {
			//debugger;
			dblog(`⚡️⚡️ fracAmount=${fracAmount}  deltaPixels=${deltaPixels} `);
			//dblog(` yScale.invert=`, mVD.yScale.invert?.domain(), mVD.yScale.invert?.range());
			dblog(`⚡️⚡️ heightVolts=${mVD.heightVolts}  `);
		}
		// so this is the rule.  shift=scrolls volt profile.  opt=zoom.  (IF
		// both are held down, it does both! res for future...)
		if (ev.shiftKey)
			mVD.scrollVoltHandler(fracAmount);
		if (ev.altKey)
			mVD.zoomVoltHandler(fracAmount);
		setVHeight(mVD.heightVolts);
		setVBottom(mVD.bottomVolts);

		if (traceWheel) {
			dblog(`⚡️⚡️ wheelHandler en: deltaMode=${ev.deltaMode}   `
			+` deltaX=${ev.deltaX} deltaY=${ev.deltaY} deltaXY=${deltaXY}`
			+`  shift=${ev.shiftKey}, alt=${ev.altKey}`, ev);
		}

		// we can't do the preventDefault() if this handler is passive.
		// Hence all the kicking and screaming.
//  		ev.preventDefault();
//  		ev.stopPropagation();
	}

	// set the wheel event handler, with passive OFF and with capture so we can
	// avoid passing it to anybody else.
	const wheelHandlerOptions = {passive: false, capture: true};

	// intercepted with a ref= react callback, we set the wheel event handler and
	// remove it when done, as we should.  React 19+ apparently wants you to
	// RETURN a cleanup function instead of calling svgRefCallback() with null.
// 	const svgRefCallback = (se) => {
// 		// not in use
// 		//return;
//  		if (!se)  {
// 			// element went away.  (or this is the first render... in
// 			// which case the remove is harmless.) must be exactly
// 			// same args as the add call
//  			svgEl.removeEventListener('wheel', wheelHandler, wheelHandlerOptions)
//  		}
//
//  		svgRef.current = svgEl = se;
//
//  		if (svgEl) {
//  			// all of this is to set passive here to false.   React gives us no way to do that.
//  			svgEl.addEventListener('wheel', wheelHandler, wheelHandlerOptions);
//  			svgEl.addEventListener('scroll', wheelHandler, wheelHandlerOptions);
//  		}
// 	}

	/* *************************************************** rendering */

	// this one actually draws the voltage line, normally
	function renderVoltagePath() {
		// this is goofy ... shouldn't this already be set into mVD!?!?!  TODO
		//mVD.drawDesc2D.addScales(mVD);
		if (!mVD.xScale || !mVD.yScale)
			throw `⚡️⚡️ no xScale ${mVD.xScale} or yScale ${mVD.yScale} `;

		// the lines themselves: exactly overlapping.  tactile wider than visible.
		const pathAttribute = mVD.makeVoltagePathAttribute(mVD.yScale);
		if (traceRendering)
			dblog(`⚡️⚡️ VoltArea.pathAttribute: `, pathAttribute);

		return <>
			<path className='visibleLine' key='visibleLine' ref={visibleRef}
				d={pathAttribute} />
			<path className='tactileLine' key='tactileLine' ref={tactileRef}
				d={pathAttribute}
				onPointerDown={pointerDownOnTactile} />
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
		axis.ticks(4, 's');

		let voltageAxis = ReactFauxDOM.createElement('g');
		let vAx = d3_select(voltageAxis);
		vAx.attr('class', 'voltageAxis');

		let txX = p.drawingLeft + p.drawingWidth;
		let txY = p.canvasInnerHeight;
		vAx.attr('transform', `translate(${txX}, ${txY})`);
		vAx.call(axis, mVD.yUpsideDown);
		//debugger;
		return voltageAxis.toReact();
	}

	if (! p.space)
		return '';  // too early

	// superfluous?  no.
	mVD.setVoltScales(p.drawingLeft, p.drawingWidth, p.canvasInnerHeight);

	let viewBoxStr = `${p.drawingLeft} 0 ${p.drawingWidth} ${p.canvasInnerHeight}`;
	if (traceViewBox) {
       dblog(`⚡️⚡️  svg viewBox ${viewBoxStr}`);
	}
	let vArea = (
		<svg className='VoltArea'
			viewBox={viewBoxStr}
			x={p.drawingLeft} width={p.drawingWidth} height={p.canvasInnerHeight}
			onPointerMove={pointerMoveOnTactile}
			onPointerUp={pointerUpFromTactile} onPointerLeave={pointerLeaveTactile}
			onWheel={wheelHandler}
			ref={svgRef}
		>
			<g >
				{renderAxes()}
				{renderVoltagePath()}
			</g>

		</svg>
	);

	if (traceRendering)
		dblog(`⚡️⚡️ VoltArea render done`);

	return vArea;
}

export default VoltArea;

//
// 			rffffffef={svgRef}
// 			 onWheel={ev => dblog(`a wheelevent`, ev)}
