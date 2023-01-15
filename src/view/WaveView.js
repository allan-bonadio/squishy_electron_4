/*
** WaveView -- a webgl image of the quantum wave (or whatever)
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

// WaveView has a 1:1 relationship with a C++ Avatar.
// Each wraps a canvas for display.  Via webgl.
// You can have many in a squishPanel, each subscribing to the same space.
// One is the main view, displaying current simulation.  Others are used in the
// control panel tabs to display proposed settings before effecting them.

import React from 'react';
import PropTypes from 'prop-types';
//import {scaleLinear} from 'd3-scale';

import eSpace from '../engine/eSpace.js';
//import eAvatar from '../engine/eAvatar.js';
import {thousands} from '../utils/formatNumber.js';
import qe from '../engine/qe.js';
//import {interpretCppException} from '../utils/errors.js';
import './view.scss';
// import {abstractViewDef} from './abstractViewDef.js';
// import flatDrawingViewDef from './flatDrawingViewDef.js';
import {getAGroup, getASetting, storeASetting} from '../utils/storeSettings.js';

import voltInfo from '../utils/voltInfo.js';
import VoltageArea from './VoltageArea.js';
import VoltageSidebar from './VoltageSidebar.js';
import GLView from '../gl/GLView.js';
import {eSpaceCreatedPromise} from '../engine/eEngine.js';


let traceScaling = true;
let traceDragCanvasHeight = false;
//let traceVoltageArea = true;
let traceWidth = true;

// size of the size box at lower right of canvas; also width of the voltage sidebar
const sizeBoxSize = 24;
const voltageSidebarWidth = 32;  // passed down to VoltageSidebar.  Seems to want to be 32

// how much to zoom in/out each click (rounded if it's not an integer power)
//const zoomFactor = Math.sqrt(2);
//const logZoomFactor = Math.log(zoomFactor);


//const isOK = (c) => {
//	if (c == null || !isFinite(c)) {
//		console.error(`bad value`, c);
//		debugger;
//	}
//}
//

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

			// These are in
			vInfo: null,
		}
		// facts: directly measured Canvas dimensions
		this.canvasFacts = {width: 0, height: 0};  // temporary

		//this.canvasFacts = {width: props.width, // temporary
		//	height: this.state.height};

		this.formerWidth = props.width;
		this.formerHeight = this.state.height;
		this.formerShowVoltage = props.showVoltage;

		// make the proptypes shuddup about it being undefined
		this.vInfo = null;

		eSpaceCreatedPromise
		.then(space => {
			// this will kick off a render, now that the avatar is in place
			this.setState({space});

			// easy access
			this.space = space;
			this.grinder = space.grinder;
			this.mainEAvatar = space.mainEAvatar;

			this.vInfo = new voltInfo(space.start, space.end, space.voltageBuffer,
				getAGroup('voltageSettings'));
			this.setState({vInfo: this.vInfo});////
		})
		.catch(ex => {
			console.error(`eSpaceCreatedPromise failed`, ex);
			debugger;
		});

		//this.initVolts();
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
				console.log(`🏄 🏄 mainEAvatar=${this.mainEAvatar.label}`);
				console.log(`    formerShowVoltage=${this.formerShowVoltage}   showVoltage=${p.showVoltage} `);
				console.log(`    formerWidth=${this.formerWidth}   wv.clientWidth=${this.waveViewEl.clientWidth} `);
				console.log(`    formerHeight=${this.formerHeight}   height=${s.height}`);
			}
			this.formerWidth = p.width;
			this.formerHeight = s.height;
			this.formerShowVoltage = p.showVoltage;

			//this.adjustDimensions();
			this.vInfo.setVoltScales(this.canvasFacts.width, s.height, p.space.nPoints);
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

	scrollVoltHandler =
	bottomVolts => {
		this.setState({bottomVolts: bottomVolts});
		this.vInfo.setVoltScales(this.canvasFacts.width, this.state.height, this.props.space.nPoints);
	}

	// handles zoom in/out buttons    They pass +1 or -1.  heightVolts will usually be an integer power of zoomFactor.
	zoomVoltHandler =
	upDown => {
		const v = this.vInfo;
		v.changeZoom(upDown);
		this.setState({heightVolts: v.heightVolts});
		this.vInfo.setVoltScales(this.canvasFacts.width, this.state.height, this.props.space.nPoints);
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

		//findVoltExtremes={this.findVoltExtremes}
		//bottomVolts={this.vInfo.bottomVolts}
		//heightVolts={this.vInfo.heightVolts}
		//xScale={this.vInfo.xScale} yScale={this.vInfo.yScale}
		//bottomVolts={this.vInfo.bottomVolts}
		//scrollMin={this.vInfo.scrollMin} scrollMax={this.vInfo.scrollMax}

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
					height={s.height}
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
					showVoltage={p.showVoltage}
					vInfo={this.vInfo}
					canvasFacts={this.canvasFacts}
				/>
			</div>
			<VoltageSidebar width={voltageSidebarWidth} height={s.height}
				vInfo={this.vInfo}
				showVoltage={p.showVoltage}
				scrollVoltHandler={this.scrollVoltHandler}
				zoomVoltHandler={this.zoomVoltHandler}
			/>

		</div>
		);
	}

}

export default WaveView;

