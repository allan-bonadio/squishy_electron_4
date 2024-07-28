/*
** WaveView -- a webgl image of the quantum wave (or whatever)
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

// WaveView has a 1:1 relationship with a C++ Avatar.
// Each wraps a canvas for display.  Via webgl.
// You can have many in a squishPanel, each subscribing to the same space.
// One is the main view, displaying current simulation.  Others are used in the
// control panel tabs to display proposed settings before effecting them.

import React from 'react';
import PropTypes from 'prop-types';

import eSpace from '../engine/eSpace.js';
import {thousands, thousandsSpaces} from '../utils/formatNumber.js';
import qeConsts from '../engine/qeConsts.js';
import './WaveView.scss';
import {getASetting, storeASetting} from '../utils/storeSettings.js';

import VoltOverlay from '../volts/VoltOverlay.js';
import GLView from '../gl/GLView.js';
import {eSpaceCreatedPromise} from '../engine/eEngine.js';

let traceBumpers = false;

let traceScaling = false;
let traceDragCanvasHeight = false;
let traceWidth = false;

// size of the size box at lower right of canvas.  If you change this, also change $sizeBoxSize in the .scss
const SIZE_BOX_SIZE = 24;
const BUMPER_WIDTH = 16;


export class WaveView extends React.Component {
	static propTypes = {
		// the title of the view
		viewName: PropTypes.string,

		// no!  handed in by promise space: PropTypes.instanceOf(eSpace),

		// handed in, pixels.  Width of whole waveview,
		// including sidebar.  Canvas is 1 pixel smaller all around.
		outerWidth: PropTypes.number.isRequired,

		showVoltage: PropTypes.string.isRequired,

		sPanel: PropTypes.object.isRequired,
	};

	constructor(props) {
		super(props);
		this.sPanel = props.sPanel;
		this.sPanel.wView = this;

		this.state = {
			outerHeight: getASetting('miscSettings', 'waveViewHeight'),  // pixels

			// no!  handed in by promise space: null,  // set when promise comes in

			// This is from the space
			vDisp: null,
		}
		// directly measured Canvas innr width & height and maybe more set by
		// the lower levels with setCanvasInnerDims() and passed to the
		// lower levels. correctly initialized in setCanvasInnerDims()
		this.canvasInnerDims = {width: props.outerWidth - 2, height: this.state.outerHeight - 2};

		this.formerWidth = props.outerWidth;
		this.formerHeight = this.state.outerHeight;
		this.formerShowVoltage = props.showVoltage;

		// make the proptypes shuddup about it being undefined
		this.vDisp = null;

		eSpaceCreatedPromise
		.then(space => {
			// this will kick off a render, now that the avatar is in place
			this.setState({space});

			// easy access
			this.space = space;
			this.grinder = space.grinder;
			this.mainEAvatar = space.mainEAvatar;

			this.vDisp = space.vDisp;
			this.setState({vDisp: this.vDisp});  // not needed if it's in the context?
		})
		.catch(ex => {
			console.error(`eSpaceCreatedPromise failed`);
			debugger;
		});
	}

	// we finally have a canvas; give me a copy so I can save it
	setGl =
	gl => {
		if (!gl)
			throw `no gl value`;
		if (!this.gl)
			this.gl = gl;
		else if (this.gl !== gl)
			throw `this.gl ≠ gl !`;
	}

	// GLView finally has a canvas; rush its dimensions up here.  Early in
	// startup, either or both might be undefined, ignores those
	setCanvasInnerDims =
	(innerWidth, height) => {
		if (innerWidth)
			this.canvasInnerDims.width = innerWidth;
		if (height) {
			this.canvasInnerDims.height = height;

			// height is kept in WaveView state; width comes from props from win width
			// canvas has 1px border between inner and outer
			if (height + 2 != this.state.outerHeight)
				this.setState({outerHeight: height + 2});
		}
		if (traceWidth)
			console.log(`🏄 WaveView canvasInnerDims, width=${innerWidth}   height: ${height}  `);
	}

	componentDidUpdate() {
		const p = this.props;
		const s = this.state;

		// only need this when the WaveView outer dims change, either a user
		// resize or show/hide the voltage.  On that occasion, we have to adjust
		// a lot, including resizing the canvas.
		if (this.mainEAvatar && (this.formerShowVoltage != p.showVoltage
					|| this.formerWidth != this.waveViewEl.clientWidth
					|| this.formerHeight != s.outerHeight) ) {
			if (traceScaling) {
				console.log(`🏄 mainEAvatar=${this.mainEAvatar.label}
				formerShowVoltage=${this.formerShowVoltage}   showVoltage=${p.showVoltage}
				formerWidth=${this.formerWidth}   wv.clientWidth=${this.waveViewEl.clientWidth}
				formerHeight=${this.formerHeight}   height=${s.outerHeight}`);
			}
			// thee formers are OUTER sizes
			this.formerWidth = p.outerWidth;
			this.formerHeight = s.outerHeight;
			this.formerShowVoltage = p.showVoltage;
			console.log(`canvasInnerDims was ${this.canvasInnerDims.width}W ; WV is now `
				+ `${p.outerWidth}W`);

			this.vDisp.setVoltScales(this.canvasInnerDims.width, s.outerHeight - 2, this.space.nPoints);
		}
	}

	/* ************************************************************************ resizing */

	// these are for resizing the WaveView ONLY with the size box
	mouseDown =
	ev => {
		this.resizing = true;
		this.yOffset = this.state.outerHeight - ev.pageY;
		if (traceDragCanvasHeight)
			console.info(`🏄 mouse down ${ev.pageX} ${ev.pageY} offset=${this.yOffset}`);
		const b = document.body;
		b.addEventListener('mousemove', this.mouseMove);
		b.addEventListener('mouseup', this.mouseUp);
		b.addEventListener('mouseleave', this.mouseUp);

		ev.preventDefault();
		ev.stopPropagation();
	}

	mouseMove =
	ev => {
		const vHeight = ev.pageY + this.yOffset;
		if (this.state.outerHeight != vHeight)
			this.setState({height: vHeight});
		storeASetting('miscSettings', 'waveViewHeight', vHeight);
		if (traceDragCanvasHeight)
			console.info(`🏄 mouse drag ${ev.pageX} ${ev.pageY}  newheight=${ev.pageY + this.yOffset}`);

		ev.preventDefault();
		ev.stopPropagation();
	}

	mouseUp =
	ev => {
		if (traceDragCanvasHeight)
			console.info(`🏄 mouse up ${ev.pageX} ${ev.pageY}`);
		this.resizing = false;

		const b = document.body;
		b.removeEventListener('mousemove', this.mouseMove);
		b.removeEventListener('mouseup', this.mouseUp);
		b.removeEventListener('mouseleave', this.mouseUp);

		ev.preventDefault();
		ev.stopPropagation();
	}

	/* ************************************************************************ render */

	render() {
		const p = this.props;
		const s = this.state;

		// if c++ isn't initialized yet, we can assume the time and frame serial
		let elapsedTime = '0';
		let frameSerial = '0';
		if (this.grinder) {
			// after qeConsts has been initialized
			elapsedTime = thousands(this.grinder.elapsedTime.toFixed(4));
			frameSerial = thousands(this.grinder.frameSerial);
		}

		const spinner = this.space ? ''
			: <img className='spinner' alt='spinner' src='/images/eclipseOnTransparent.gif' />;

		// make room for the bumpers for WELL continuum
		let bumperWidth = (qeConsts.contWELL == this.space?.dimensions[0].continuum)
			? BUMPER_WIDTH
			: 0;

		// sometimes a fraction of a pixel causes the horiz scroll bar
		// to kick in.  avoid that without messing up everything.
		let innerWidthForCanvas = p.outerWidth - 1 - 2 * bumperWidth;

		if (traceWidth) {
			console.log(`🏄 WaveView render, outerWidth=${this.waveViewEl?.clientWidth}`
				+ `  parent.clientWidth: ${this.waveViewEl?.parentNode.clientWidth}   `
				+` innerWidthForCanvas=${innerWidthForCanvas}`);
		}

		// can't make a real GLView until we have the space!  until then, show spinner
		let glView;
		if (this.space) {
			glView = <GLView innerWidth={innerWidthForCanvas} innerHeight={s.outerHeight - 2} left={bumperWidth}
				space={this.space} avatar={this.space.mainEAvatar}
				viewClassName='flatScene' viewName='mainView'
				setGl={this.setGl}
				canvasInnerDims={this.canvasInnerDims}  setCanvasInnerDims={this.setCanvasInnerDims}
			/>
		}
		else {
			let glView = <div className='spinnerBox'
						style={{width: innerWidthForCanvas , height: s.outerHeight - 2}} >
				{spinner}
			</div>;
		}

		// if there's no vDisp yet (cuz no space yet), the voltOverlay gets all mucked up.  So just avoid it.
		let voltOverlay;
		if (s.vDisp){
			voltOverlay = <VoltOverlay
				space={this.space}
				height={s.outerHeight - 2}
				width={innerWidthForCanvas}
				left={bumperWidth}
				showVoltage={s.showVoltage}
				vDisp={this.vDisp}
				canvasInnerDims={this.canvasInnerDims}
			/>
		}

		return (
		<div className='WaveView'  ref={el => this.waveViewEl = el}
					style={{height: `${s.outerHeight}px`}}>

			<div className='bumper left' key='left' style={{width: bumperWidth +'px'}} />
			<div className='viewArea' key='viewArea'
						style={{maxWidth: (innerWidthForCanvas + 2) +'px', left: bumperWidth +'px'}}>
				{glView}

				<section className='timeOverlay'
						style={{maxWidth: innerWidthForCanvas +'px'}}>
					<div className='northWestWrapper'>
						<span className='voNorthWest'>{elapsedTime}</span> ps
					</div>
					<div className='northEastWrapper'>
						frame <span className='voNorthEast'>{thousandsSpaces(frameSerial)}</span>
					</div>

					<img className='sizeBox' src='/images/sizeBox4.png' alt='size box'
						onMouseDown={this.mouseDown}
						style={{width: `${SIZE_BOX_SIZE}px`, height: `${SIZE_BOX_SIZE}px`}} />

				</section>


				{voltOverlay}
			</div>
			<div className='bumper right' key='right' style={{width: bumperWidth +'px'} } />

		</div>
		);
	}

}

export default WaveView;

