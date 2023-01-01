/*
** WaveView -- a webgl image of the quantum wave (or whatever)
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

// WaveView has a 1:1 relationship with a C++ Avatar.
// Each wraps a canvas for display.  Via webgl.
// You can have many in a squishPanel, each subscribing to the same space.
// One is the main view, displaying current simulation.  Others are used in the
// control panel tabs to display proposed settings before effecting them.

import React from 'react';
import PropTypes from 'prop-types';
import {scaleLinear} from 'd3-scale';

import eSpace from '../engine/eSpace.js';
//import eAvatar from '../engine/eAvatar.js';
import {thousands} from '../utils/formatNumber.js';
import qe from '../engine/qe.js';
//import {interpretCppException} from '../utils/errors.js';
import './view.scss';
// import {abstractViewDef} from './abstractViewDef.js';
// import flatDrawingViewDef from './flatDrawingViewDef.js';
import {getASetting, storeASetting} from '../utils/storeSettings.js';
import VoltageArea from './VoltageArea.js';
import VoltageSidebar from './VoltageSidebar.js';
import GLView from '../gl/GLView.js';
import {eSpaceCreatedPromise} from '../engine/eEngine.js';


//import {listOfViewClasses} from './listOfViewClasses.js';

//import {dumpJsStack} from '../utils/errors.js';

let traceScaling = true;
let traceDragCanvasHeight = false;
let traceVoltageArea = true;
let traceWidth = true;

// size of the size box at lower right of canvas; also width of the voltage sidebar
const sizeBoxSize = 24;
const voltageSidebarWidth = 32;  // passed down to VoltageSidebar.  Seems to want to be 32

// how much to zoom in/out each click (rounded if it's not an integer power)
const zoomFactor = Math.sqrt(2);
const logZoomFactor = Math.log(zoomFactor);


const isOK = (c) => {
	if (c == null || !isFinite(c)) {
		console.error(`bad value`, c);
		debugger;
	}
}


export class WaveView extends React.Component {
	static propTypes = {
		// the title of the view
		viewName: PropTypes.string,

		space: PropTypes.instanceOf(eSpace),

		width: PropTypes.number,  // handed in, pixels, depends on window width

		//setUpdateVoltageArea: PropTypes.func,

		showVoltage: PropTypes.bool.isRequired,
	};

	constructor(props) {
		super(props);

		this.state = {
			height: getASetting('miscSettings', 'waveViewHeight'),  // pixels
			space: null,  // set when promise comes in

			// No!  dom and he row flex decides canvasWidth: props.width - (props.showVoltage * voltageSidebarWidth),

			//voltageScroll:
			//voltageZoom: getASetting('voltageSettings', 'voltageZoom'),
		}
		// facts: directly measured Canvas dimensions
		this.canvasFacts = {width: 0, // temporary
			height: 0};
		//this.canvasFacts = {width: props.width, // temporary
		//	height: this.state.height};

		this.formerWidth = props.width;
		this.formerHeight = this.state.height;
		this.formerShowVoltage = props.showVoltage;

		//this.adjustDimensions();

		eSpaceCreatedPromise
		.then(space => {
			// this will kick off a render, now that the avatar is in place
			this.setState({space});

			// easy access
			this.space = space;
			this.grinder = space.grinder;
			this.mainEAvatar = space.mainEAvatar;
		})
		.catch(ex => {
			console.error(`eSpaceCreatedPromise failed`, ex);
			debugger;
		});

		this.initVolts();
	}

	// call this when the width or height of the canvas has changed either by window sizebox or showVoltage
	//adjustDimensions() {
	//	const p = this.props;
	//	const s = this.state;
	//	this.canvasWidth = p.width - 16;
	//	if (p.showVoltage)
	//		this.canvasWidth -= voltageSidebarWidth;
	//
	//	if (this.waveViewEl)
	//		this.top = this.waveViewEl.getBoundingClientRect().top;
	//
	//	// the canvas and all other apparatus needs to be updated, if it's not too early
	//	if (this.gl && this.canvas) {
	//		this.canvas.width = this.canvasWidth;
	//		this.canvas.height = s.height;
	//		this.gl.viewport(0, 0, this.canvasWidth, s.height);
	//	}
	//	// makes no diff this.setState({canvasWidth: this.canvasWidth});
	//	if (traceScaling) {
	//		console.log(`🏄 🏄  WaveView.adjustDimensions(): canvasWidth=${this.canvasWidth}
	//			wv height=${s.height}  wv width=${p.width}  sidebarWid=${voltageSidebarWidth}
	//			on window (${window.innerWidth} wide, ${window.innerHeight}) tall`);
	//	}
	//
	//	this.formerWidth = p.width;
	//	this.formerHeight = s.height;
	//	this.formerShowVoltage = p.showVoltage;
	//}

	componentDidMount() {
		//this.adjustDimensions();
	}

	componentDidUpdate() {
		const p = this.props;
		const s = this.state;

		// only need this when the WaveView outer dims change, either a user resize
		// or show/hide the voltage.  On that occasion, we have to adjust a lot, including resizing the canvas.
		if (this.mainEAvatar && (this.formerShowVoltage != p.showVoltage
					|| this.formerWidth != this.waveViewEl.clientWidth
					|| this.formerHeight != s.height) ) {
			if (traceScaling) {
				console.log(``);
				console.log(`🏄 🏄 mainEAvatar=${this.mainEAvatar.label}`);
				console.log(`    formerShowVoltage=${this.formerShowVoltage}   showVoltage=${p.showVoltage} `);
				console.log(`    formerWidth=${this.formerWidth}   wv.clientWidth=${this.waveViewEl.clientWidth} `);
				console.log(`    formerHeight=${this.formerHeight}   height=${s.height}`);
			}
			this.formerWidth = p.width;
			this.formerHeight = s.height;
			this.formerShowVoltage = p.showVoltage;

			//this.adjustDimensions();
			this.setVoltScales();
		}
	}

	/* ************************************************************************ resizing */

	// these are for resizing the WaveView ONLY.
	mouseDown =
	ev => {
		this.resizing = true;
		this.yOffset = this.state.height - ev.pageY;
		if (traceDragCanvasHeight)
			console.info(`🏄 🏄 mouse down ${ev.pageX} ${ev.pageY} offset=${this.yOffset}`);
		const b = document.body;
		b.addEventListener('mousemove', this.mouseMove);
		b.addEventListener('mouseup', this.mouseUp);
		b.addEventListener('mouseleave', this.mouseUp);

		//this.sizeBoxEl.style.borderColor = '#aaa';
		ev.preventDefault();
		ev.stopPropagation();
	}

	mouseMove =
	ev => {
		const vHeight = ev.pageY + this.yOffset;
		if (this.state.height != vHeight)
			this.setState({height: vHeight});
		storeASetting('miscSettings', 'waveViewHeight', vHeight);
		if (traceDragCanvasHeight)
			console.info(`🏄 🏄 mouse drag ${ev.pageX} ${ev.pageY}  newheight=${ev.pageY + this.yOffset}`);

		ev.preventDefault();
		ev.stopPropagation();
	}

	mouseUp =
	ev => {
		if (traceDragCanvasHeight)
			console.info(`🏄 🏄 mouse up ${ev.pageX} ${ev.pageY}`);
		this.resizing = false;

		const b = document.body;
		b.removeEventListener('mousemove', this.mouseMove);
		b.removeEventListener('mouseup', this.mouseUp);
		b.removeEventListener('mouseleave', this.mouseUp);

		//this.sizeBoxEl.style.borderColor = '';

		ev.preventDefault();
		ev.stopPropagation();
	}

	/* ************************************************************************ volts */

	// actually measure the voltage signal, get min & max
	findVoltExtremes =
	() => {
		// if there's no space, there's no voltageBuffer or any of this other stuff
		if (!this.space) return;

		const v = this.volts;
		let voltageBuffer = this.space.voltageBuffer;
		let {start, end} = this.space.startEnd;
		let mini = Infinity, maxi = -Infinity;
		for (let ix = start; ix < end; ix++) {
			mini = Math.min(voltageBuffer[ix], mini);
			maxi = Math.max(voltageBuffer[ix], maxi)
		}
		v.voltMin = mini;
		v.voltMax = maxi;
	}

	initVolts() {
		// keeps many variables affecting voltage area and voltage sidebar, passed in as props
		this.volts = {
			// actual voltage buffer, min & max
			//voltMin: 0, voltMax: 0,

			// the scroll position of the voltage area, in volts, is where the bottom edge of the Volt Area is.
			scrollSetting: +getASetting('voltageSettings', 'scrollSetting'),

			// how many volts higher the top edge of the view is.  Zoom increases/decreases this.
			heightVolts: +getASetting('voltageSettings', 'heightVolts'),

			// the range over which the user can slide the scrollSetting up and down.
			// These change values when the user does a zoom.
			scrollMin: +getASetting('voltageSettings', 'scrollMin'),
			scrollMax: +getASetting('voltageSettings', 'scrollMax'),

			xScale: () => 0,  // see setVoltScales
			yScale: () => 0,  // see setVoltScales
		};
		this.findVoltExtremes();
	}

	// scales to transform coords.  Call after user scrolls it up ordown, or
	// user changes height or width of ccanvas.
	// yScale is function that transforms from volts to pixels.
	// yScale.invert()) goes the other way.  xScale transforms from ix to
	// pixels.  Used for clicking and for display.
	setVoltScales() {
		const p = this.props;
		const s = this.state;
		const v = this.volts;
		if (!p.width || !s.height || !s.space) {
			debugger;
			return false; // early on, avoid dividing by zero (?)
		}
		isOK(v.scrollSetting); isOK(v.heightVolts); isOK(s.height); isOK(this.canvasFacts.width);

		v.yScale = scaleLinear([v.scrollSetting, v.scrollSetting + v.heightVolts], [0, s.height]);
		v.xScale = scaleLinear([0, s.space.nPoints-1], [0, this.canvasFacts.width]);

		if (traceVoltageArea) {
			console.log(
				`🏄 🏄  volt.setVoltScales():done, scrollSetting=${v.scrollSetting}
				heightVolts=${v.heightVolts} type ${typeof v.heightVolts}`);
			console.log(
				`    voltagearea.setVoltScales():done, domains: x&y:`,
				v.xScale.domain(), v.yScale.domain());
			console.log(`                   ranges: x&y:`, v.xScale.range(), v.yScale.range());
		}
		return true;
	}

	// after user has done something to change the scrollMin/Max or zoom
	// recalculate everything so setVoltScales() can work right.  Then setVoltScales().
	//adjustVoltLimits() {
	//	// voltage zoom is sortof the height the user asked for, but if the
	//	// actual range of voltage is beyond, widen it so user can see
	//	const s = this.state;
	//	const v = this.volts;
	//	v.heightVolts = s.voltageZoom + (v.max - v.min);
	//
	//	// then put the voltage line in the middle somewhere
	//	this.scrollTop = (v.max + v.min + voltageScrollHeight) / 2;
	//	this.scrollSetting = (v.max + v.min - voltageScrollHeight) / 2;
	//
	//	setVoltScales();
	//}

	scrollHandler =
	ev => {
		let target = ev.currentTarget;
		let scrollSetting = this.volts.scrollSetting = target.valueAsNumber;
		this.setState({voltScrollSetting: scrollSetting});
		storeASetting('voltageSettings', 'scrollSetting', scrollSetting);

		this.setVoltScales();
	}

	// handles zoom in/out buttons    They pass +1 or -1.  heightVolts will usually be an integer power of zoomFactor.
	zoomHandler =
	upDown => {
		//debugger;
		//const p = this.props;
		const v = this.volts;
		let newLogZoom = Math.log(v.heightVolts) / logZoomFactor;
		newLogZoom = Math.round(newLogZoom - upDown);  // round off to integer power of zoom Factor
		v.heightVolts = zoomFactor ** newLogZoom;
		this.setState({heightVolts: v.heightVolts});

		// got to set the scrolling top and bottom voltages.  When someone zooms, in or out,
		// center the voltage line (middle).  By scrolling, user can see 3x heightVolts overall.
		// That means scrollMin and scrollMax are separated by 2x heightVolts.
		// scrollSetting is at the BOTTOM of heightVolts, remember.
		let middleVolts = (v.voltMin + v.voltMax) / 2;
		v.scrollSetting = middleVolts - .5 * v.heightVolts;
		v.scrollMin = middleVolts - 1.5 * v.heightVolts;
		v.scrollMax = middleVolts + .5 * v.heightVolts;

		storeASetting('voltageSettings', 'scrollSetting', v.scrollSetting);
		storeASetting('voltageSettings', 'heightVolts', +v.heightVolts);
		storeASetting('voltageSettings', 'scrollMin', v.scrollMin);
		storeASetting('voltageSettings', 'scrollMax', v.scrollMax);

		this.setVoltScales();
	}

	/* ************************************************************************ render */

	gimmeGlCanvas =
	(gl, canvas) => {
		this.gl = gl;
		this.canvas = canvas;
	}

	render() {
		const p = this.props;
		const s = this.state;

		//this.setVoltScales();

		// if c++ isn't initialized yet, we can assume the time and frame serial
		let elapsedTime = '0';
		let frameSerial = '0';
		if (this.grinder) {
			// after qe has been initialized
			elapsedTime = thousands(this.grinder.elapsedTime.toFixed(4));
			frameSerial = thousands(this.grinder.frameSerial);
		}

		// does this ever show?
		const spinner = qe.cppLoaded ? ''
			: <img className='spinner' alt='spinner' src='images/eclipseOnTransparent.gif' />;

		// make room for voltage sidebar
		//this.canvasWidth = p.width;
		//if (p.showVoltage) {
		//	this.canvasWidth -= voltageSidebarWidth;
		//	if (p.width && s.height)
		//		wholeRect -= voltageSidebarWidth;
		//}
		//	<div className='viewArea' style={{width: `${this.canvasWidth}px`}}>
			//	style={{width: `${p.width}px`, height: `${s.height}px`}}>
			// style={{width: `${this.canvasWidth}px`}}
			//					style={{width: `${this.canvasWidth}px`, height: `${s.height}px`}}>
				//style={{width: `${p.width}px`, height: `${s.height}px`}}>


		// voNorthWest/East are populated during frame
		// Always generate the VoltageArea so it keeps its state, but it won't always draw

		// sometimes a fraction of a pixel causes the horiz scroll bar to kick in.  avoid that without messing up everything.
		let widthToUse = p.width - .5;
		if (p.showVoltage)
			widthToUse -= voltageSidebarWidth + .5;

		if (traceWidth) {
			console.log(`🏄 🏄WaveView render, width=${this.waveViewEl?.clientWidth}`+
			`  parent.clientWidth: ${this.waveViewEl?.parentNode.clientWidth}   widthToUse=${widthToUse}`);
		}

		return (
		<div className='WaveView'  ref={el => this.waveViewEl = el}
				style={{height: `${s.height}px`}}>
			<div className='viewArea' >
				<GLView
					space={this.space} avatar={this.mainEAvatar}
					gimmeGlCanvas={this.gimmeGlCanvas}
					viewClassName='flatDrawingViewDef' viewName='mainView'
					canvasFacts={this.canvasFacts}
					width={widthToUse}
				/>

				<section className='viewOverlay' >
					<div className='northWestWrapper'>
						<span className='voNorthWest'>{elapsedTime}</span> ps
					</div>
					<div className='northEastWrapper'>
						frame <span className='voNorthEast'>{frameSerial}</span>
					</div>

					<img className='sizeBox' src='images/sizeBox4.png' alt='size box'
						onMouseDown={this.mouseDown}
						style={{width: `${sizeBoxSize}px`, height: `${sizeBoxSize}px`}} />

					{spinner}
				</section>

				<VoltageArea
					space={s.space} canvas={this.canvas}
					height={s.height}
					findVoltExtremes={this.findVoltExtremes}
					showVoltage={p.showVoltage}
					scrollSetting={this.volts.scrollSetting}
					heightVolts={this.volts.heightVolts}
					xScale={this.volts.xScale} yScale={this.volts.yScale}
					volts={this.volts}
					canvasFacts={this.canvasFacts}
				/>
			</div>
			<VoltageSidebar width={voltageSidebarWidth} height={s.height}
				showVoltage={p.showVoltage}
				scrollSetting={this.volts.scrollSetting}
				scrollMin={this.volts.scrollMin} scrollMax={this.volts.scrollMax}
				scrollHandler={this.scrollHandler}
				zoomHandler={this.zoomHandler}
			/>

		</div>
		);
	}

}

export default WaveView;
