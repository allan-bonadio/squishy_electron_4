/*
** Voltage Area -- the white voltage line, and its tactile
**	      interactions when the user moves it.  for Squishy Electron
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

import React, {createRef} from 'react';

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

let traceSlabs = false;
let traceScrollStretch = false;

// how long it takes, in milliseconds, dragging outside of the main voltage area,
// to double the scroll or heightVolts
let DOUBLING_TIME = 2000;

// ultimately, this is a <svg node with a <path inside it
export class VoltageArea extends React.Component {
	static propTypes = {
		// for first couple of renders, space and idunno are null
		space: PropTypes.object,

		// this can be null if stuff isn't ready.  these are now determined by css.
		height: PropTypes.number,

		// includes scrollSetting, heightVolts, measuredMinVolts, measuredMaxVolts, xScale, yScale
		vDisp: PropTypes.object,

		// this component is always rendered so it retains its state,
		// but won't draw anything if the checkbox is off
		showVoltage: PropTypes.string.isRequired,

		canvasFacts: PropTypes.object,
	};

	constructor(props) {
		super(props);
		//debugger;
		// should be a functional component
		// this.state = {
		// 	// should just use forceUpdate on our comp obj instead!
		// 	// I guess I am.  The state for this is the voltDisp obj and the voltageBuffer,
		// 	// which have internal changes but the obj ref never changes.
		// 	changeSerial: 0,
		// };

		if (traceVoltageArea)
			console.log(`⚡️ the new VoltageArea:`, this);

		this.cnDrag = new clickNDrag(this.mouseDown, this.onEvent, this.mouseUp);

		// GET RID OF THIS breaking change: ref attrs no longer get passed node refs, gotta use this
		//this.voltageAreaRef = createRef();

		if (traceVoltageArea)
			console.log(`⚡️ VoltageArea  constructor done`);
	}

	componentWillUnmount() {
		this.cnDrag.liquidate();
	}

	/* ***************************************************  click & drag */

	// has the user dragged beyond the top/bottom?
	strayOutside(newVoltage) {
		const p = this.props;
		const v = p.vDisp;

		// dragged outside? scroll, or stretch.  The amount per mouseMove is
		// supposed to be cpu-speed-independent, on whole.  If you just make it
		// 'feel' right, it goes way too fast in 5 or 10 years.
		let now = performance.now();
		let howLong = (now - this.lastDragOutside) / DOUBLING_TIME;
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

			this.lastDragOutside = now;
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

			this.lastDragOutside = now;
		}
		else
			this.lastDragOutside = null;
	}

	mouseDown =
	(cnDrag, ev) => {
		// set svg area to accept mouse events
		// no gotta catch wheel events cnDrag.arenaEl.style.pointerEvents = 'visible';  // auto all none
	}

	// every time user changes one datapoint.  Also set points interpolated between.
	// returns false if it failed and needs to be done again.  True means it succeeded.
	onEvent =
	(cnDrag, ev) => {
		const p = this.props;
		const v = p.vDisp;
		let phase = ev.type;

		// shift key gives you steady voltage as you drag across, but if you do it on the down
		// click, we don't know where to start
		let newVoltage = this.latestVoltage;
		if (! ev.shiftKey || phase == 'mousedown') {
			newVoltage = v.yUpsideDown.invert(cnDrag.yArena);
		}

		let ix = Math.round(v.xScale.invert(ev.clientX));

		if (ix == this.latestIx && Math.abs(newVoltage - this.latestVoltage) < v.heightVolts * .01)
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
			let tweenScale = d3_scaleLinear([this.latestIx, ix], [this.latestVoltage, newVoltage]);

			// tween to each point in between
			let hi = Math.max(this.latestIx, ix);
			let lo = Math.min(this.latestIx, ix);
			for (let ixx = lo; ixx <= hi; ixx++) {
				if (traceTweening)
					console.log(`⚡️ tweening: set point [${ixx}] to ${tweenScale(ixx).toFixed(4)}`)
				v.voltageBuffer[ixx] = tweenScale(ixx);
			}
			if (traceTweening) console.log(`⚡️ tweening done`)
		}

		this.latestIx = ix;
		this.latestVoltage = newVoltage;

		this.strayOutside(newVoltage);

		this.updateVoltageArea();
		return true;
	}

	// called upon mouseup or a move without mouse down
	mouseUp =
	(cnDrag, ev) => {
		const p = this.props;
		const v = p.vDisp;

		// must also switch the svg to pass thru mouse events otherwise other stuff can't get clicks
		// no gotta catch wheel events  cnDrag.arenaEl.style.pointerEvents = 'none';

		if (traceDragging) {
			console.log(`⚡️ mouse UP on point (%f,%f) voltage @ ix=%d stopped at %f`,
				cnDrag.xArena, cnDrag.yArena,
				this.latestIx, v.voltageBuffer[this.latestIx]);
		}

		// remind everybody that this episode is over.  Tune in next week.  next mousedown.
		this.latestIx = this.latestVoltage = undefined;

		if (traceDragging)
			v.dumpVoltage(p.space, v.voltageBuffer, 8);
	}

	wheelHandler =
	(ev) => {
		let v = this.props.vDisp;
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

	// tell the VoltageArea (that;s us) that something in the
	// space.voltageBuffer changed.  Sometimes called from above. This gets set
	// into the space, when it's available.
	updateVoltageArea =
	() => {
		if (traceRendering)
			console.log(`⚡️ VoltageArea.updateVoltageArea`);
		//this.props.vDisp.findVoltExtremes();
		this.forceUpdate();
	}

	componentDidUpdate() {
		// the constructor probably won't have space, but here it will.  should.
		const p = this.props;
		if (p.space && p.vDisp) {
			p.vDisp.updateVoltageArea = this.updateVoltageArea;
			p.space.updateVoltageArea = this.updateVoltageArea;}
		else
			console.warn(`⚡️  VoltageArea, no space! ${p.space}.  Is there also no vDisp?  ${p.vDisp}`);
	}


	// the main path is the voltage, but for continuum WELL we also draw end blocks, and also...
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
				if (traceSlabs)
					console.info(`installed slabs: width=${p.canvasFacts.width} `
						+`height=${p.canvasFacts.height}  this.barWidth=${this.barWidth}`);
				break;

			case qe.contENDLESS:
				break;

			default: throw new Error(`bad continuum ${p.space.dimensions.continuum}`);
		}

		// the lines themselves: exactly overlapping.  tactile wider than visible.
// 		if (traceRendering)
// 			console.log(`⚡️      pathAttribute: showVoltage=${p.showVoltage}   isHovering=${this.isHovering}`);
// 		if ('always' == p.showVoltage || ('hover' == p.showVoltage && this.isHovering)) {
			const pathAttribute = v.makeVoltagePathAttribute(v.yScale);
			if (traceRendering)
				console.log(`⚡️ VoltageArea.pathAttribute: `, pathAttribute);

			// for showVoltage on hover, need this to  hover over
			paths.push(
				<rect className='hoverBox' key='hoverBox'
					x={0} y={0} width={p.canvasFacts.width} height={p.canvasFacts.height}
					/>
			);

			// this one actually draws the voltage line
			paths.push(
				<path className='visibleLine' key='visibleLine'
					d={pathAttribute} />
			);

			// you click on this one
			//onMouseDown={ev => this.mouseDown(ev)}
			paths.push(
				<path className='tactileLine' key='tactileLine'
					d={pathAttribute}
					ref={this.cnDrag.refTarget} />
			);


			// axis for voltage.  Makes no sense if no axis there.
			// but the way d3 draws on GL is different - should use svg  instead
			let axis = d3_axisLeft(v.yUpsideDown);
			axis.ticks(3);

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
// 		}
		return paths
	}

	render() {
		const p = this.props;
		if (! p.space)
			return '';  // too early
		this.barWidth = p.canvasFacts.width / p.space.nPoints;
		if (traceRendering)
			console.log(`⚡️ VArea.render, barWidth:${this.barWidth}  cFacts:`,
				p.canvasFacts);

		if (traceRendering) {
			console.info(`canvasFacts: width=${p.canvasFacts.width} `
				+`height=${p.canvasFacts.height}  barWidth=${this.barWidth}`);
		}

		let v = p.vDisp;
		v.setVoltScales(p.canvasFacts.width, p.canvasFacts.height, p.space.N);

		let vClass = p.showVoltage +'ShowVoltage';
		let vArea = (
			<svg className={'VoltageArea ' + vClass}
				viewBox={`0 0 ${p.canvasFacts.width} ${p.canvasFacts.height}`}
				width={p.canvasFacts.width} height={p.canvasFacts.height}
				ref={this.cnDrag.refArena}
				onWheel={this.wheelHandler}
			>

				{this.renderPaths()}
			</svg>
		);

		if (traceRendering)
			console.log(`⚡️ VoltageArea render done`);

		return vArea;
	}

}

export default VoltageArea;
