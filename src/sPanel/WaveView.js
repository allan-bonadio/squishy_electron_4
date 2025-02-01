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

// size of the size box at lower right of canvas.  If you change this, also
// change $sizeBoxSize in  _common.scss
const SIZE_BOX_SIZE = 24;
const BUMPER_WIDTH = 16;

const CANVAS_BORDER_THICKNESS = 1;
const DOUBLE_THICKNESS = 2 * CANVAS_BORDER_THICKNESS;


export class WaveView extends React.Component {
	static propTypes = {
		// the title of the view
		sceneName: PropTypes.string,

		// no!  handed in by promise space: PropTypes.instanceOf(eSpace),

		// handed in, pixels.  Width of whole waveview, including sidebar,
		// bumpers and border.  Canvas is CANVAS_BORDER_THICKNESS pixel smaller
		// all around for border.
		outerWidth: PropTypes.number.isRequired,

		showVoltage: PropTypes.string.isRequired,

		sPanel: PropTypes.object.isRequired,
	};

	constructor(props) {
		super(props);
		PropTypes.checkPropTypes(WaveView.propTypes, props, 'prop', 'GLView');

		// is this a bad idea?
		this.sPanel = props.sPanel;
		this.sPanel.wView = this;

		this.state = {
			// height of just the canvas + DOUBLE_THICKNESSpx, as set by user with size box
			outerHeight: getASetting('miscSettings', 'waveViewHeight'),  // pixels

			// no!  handed in by promise space: null,  // set when promise comes in
		}

		this.updateInnerDims();

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

			// make room for the bumpers for WELL continuum (both sides).  Note that
			// continuum can change only when page reloads.
			this.bumperWidth = (qeConsts.contWELL == space.dimensions[0].continuum)
				? BUMPER_WIDTH
				: 0;

			this.vDisp = space.vDisp;
		})
		.catch(ex => {
			console.error(`eSpaceCreatedPromise failed`);
			debugger;
		});
	}

	updateInnerDims() {
		this.canvasInnerWidth = this.props.outerWidth - DOUBLE_THICKNESS;
		this.canvasInnerHeight = this.state.outerHeight - DOUBLE_THICKNESS;
	}

	// we finally have a canvas; give me a copy so I can save it
	setGlCanvas =
	gl => {
		if (!gl)
			throw `no gl value`;
		if (!this.gl) {
			this.gl = gl;
			this.canvasNode = gl.canvas;
		}
		else if (this.gl !== gl)
			throw `this.gl ≠ gl !`;
	}

	componentDidUpdate() {
		const p = this.props;
		const s = this.state;

		// only need this when the WaveView outer dims change, either a user
		// change height or window change width.  On that occasion, we have to adjust
		// a lot, including resizing the canvas.
		if (this.mainEAvatar && (this.formerShowVoltage != p.showVoltage
					|| this.formerWidth != p.outerWidth
					|| this.formerHeight != s.outerHeight) ) {

			// Size of window & canvas changed!  (or, will change soon)
			if (traceScaling) {
				console.log(`🏄 Resizing  👀 mainEAvatar=${this.mainEAvatar.label}
				formerShowVoltage=${this.formerShowVoltage} ≟➔ showVoltage=${p.showVoltage}
				formerWidth=${this.formerWidth} ≟➔ outerWidth=${p.outerWidth}
				formerHeight=${this.formerHeight} ≟➔ outerHeight=${s.outerHeight}`);
			}

			this.updateInnerDims();

			// trigger a render
			this.setState({height: s.outerHeight});

			// the formers are OUTER sizes
			this.formerWidth = p.outerWidth;
			this.formerHeight = s.outerHeight;
			this.formerShowVoltage = p.showVoltage;
			if (traceWidth) {
				console.log(`🏄 WaveView canvasInner width is ${this.canvasInnerWidth};  `
					+ `now outer width = ${p.outerWidth}`);
			}
		}
	}

	/* ************************************************************************ resizing */

	// these are for resizing the WaveView ONLY with the size box
	pointerDown =
	ev => {
		this.resizing = true;
		this.yOffset = this.state.outerHeight - ev.pageY;
		if (traceDragCanvasHeight)
			console.info(`🏄 pointer down ${ev.pageX} ${ev.pageY} offset=${this.yOffset}`);
		ev.target.setPointerCapture(ev.pointerId);

		// I'll bet, with pointerCapture, TODO: you can make all these listeners perpetual.
		const b = document.body;
		b.addEventListener('pointermove', this.pointerMove);
		b.addEventListener('pointerup', this.pointerUp);
		b.addEventListener('pointerleave', this.pointerUp);

		ev.preventDefault();
		ev.stopPropagation();
	}

	pointerMove =
	ev => {
		const vHeight = ev.pageY + this.yOffset;
		if (this.state.outerHeight != vHeight)
			this.setState({outerHeight: vHeight});
		storeASetting('miscSettings', 'waveViewHeight', vHeight);
		if (traceDragCanvasHeight)
			console.info(`🏄 pointer drag ${ev.pageX} ${ev.pageY}  newheight=${ev.pageY + this.yOffset}`);

		ev.preventDefault();
		ev.stopPropagation();
	}

	pointerUp =
	ev => {
		if (traceDragCanvasHeight)
			console.info(`🏄 pointer up ${ev.pageX} ${ev.pageY}`);
		this.resizing = false;

		const b = document.body;
		b.removeEventListener('pointermove', this.pointerMove);
		b.removeEventListener('pointerup', this.pointerUp);
		b.removeEventListener('pointerleave', this.pointerUp);

		ev.preventDefault();
		ev.stopPropagation();
	}

	/* ********************************************************* render */

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

		if (traceWidth) {
			console.log(`🏄 WaveView render, outerWidth=${p.outerWidth}`
				+` bumperWidth=${this.bumperWidth}`);
		}

		// can't make a real GLView until we have the space!
		let glView;
		if (this.space) {
			glView = <GLView
				space={s.space} avatar={s.space.mainEAvatar}
				viewClassName='flatScene' sceneName='mainWave'
				canvasInnerWidth={this.canvasInnerWidth}
				canvasInnerHeight={this.canvasInnerHeight}
				setGlCanvas={this.setGlCanvas}
				specialInfo={{bumperWidth: this.bumperWidth}}
			/>;
		}
		else {
			// until then, show spinner, not actually a GLView
			const spinner = this.space
				? ''
				: <img className='spinner' alt='spinner' src='/images/eclipseOnTransparent.gif' />;

			let glView = <div className='spinnerBox'
						style={{width: p.outerWidth - CANVAS_BORDER_THICKNESS ,
							height: s.outerHeight - DOUBLE_THICKNESS}} >
				{spinner}
			</div>;
		}

		// if there's no vDisp yet (cuz no space yet), the voltOverlay gets all
		// mucked up.  So just avoid it.
		let voltOverlay = '';
		if (this.vDisp){
			voltOverlay = <VoltOverlay
				space={this.space}
				showVoltage={s.showVoltage} vDisp={this.vDisp}
				canvasInnerWidth={this.canvasInnerWidth} canvasInnerHeight={this.canvasInnerHeight}
				bumperWidth={this.bumperWidth}
			/>;
		}

		let betweenBumpers = this.canvasInnerWidth - 2 * this.bumperWidth;

		// the glView is one layer.  Over that is the bumpers and widget area betweeen them.
		return (
		<div className='WaveView' style={{height: `${s.outerHeight}px`}}>

			{glView}

			<div className='bumper left' key='left'
				style={{flexBasis: this.bumperWidth +'px', height: this.canvasInnerHeight}} />
			<div className='widgetArea' key='widgetArea'
						style={{flexBasis: betweenBumpers +'px', height: this.canvasInnerHeight}}>

				<section className='timeOverlay'
						style={{maxWidth: this.canvasInnerWidth +'px'}}>
					<div className='northWestWrapper'>
						<span className='voNorthWest'>{elapsedTime}</span> ps
					</div>
					<div className='northEastWrapper'>
						frame <span className='voNorthEast'>{thousandsSpaces(frameSerial)}</span>
					</div>

				</section>


				{voltOverlay}

				<img className='sizeBox' src='/images/sizeBox4.png' alt='size box'
					onPointerDown={this.pointerDown}
					style={{width: `${SIZE_BOX_SIZE}px`, height: `${SIZE_BOX_SIZE}px`}} />
			</div>
			<div className='bumper right' key='right'
				style={{flexBasis: this.bumperWidth +'px', height: this.canvasInnerHeight}} />

		</div>
		);
	}

}

export default WaveView;

