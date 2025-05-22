/*
** WaveView -- a webgl image of the quantum wave (or whatever)
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

// WaveView has a 1:1 relationship with a C++ Avatar.
// Each wraps a canvas for display.  Via webgl.
// You can have many in a squishPanel, each subscribing to the same space.
// One is the main view, displaying current simulation.  Others are used in the
// control panel tabs to display proposed settings before effecting them.

import React, {useContext} from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';

import eSpace from '../engine/eSpace.js';
import {thousands, thousandsSpaces} from '../utils/formatNumber.js';
import qeConsts from '../engine/qeConsts.js';
import './WaveView.scss';
import {getASetting, storeASetting} from '../utils/storeSettings.js';

import VoltOverlay from '../volts/VoltOverlay.js';
import {WELL_BUMPER_WIDTH, SIZE_BOX_SIZE} from '../volts/voltConstants.js';
import GLScene from '../gl/GLScene.js';
import {eSpaceCreatedPromise} from '../engine/eEngine.js';
import SquishContext from './SquishContext.js';

let traceBumpers = false;
let traceDimensions = false;
let traceDragCanvasHeight = false;
let traceHover = false;

const CANVAS_BORDER_THICKNESS = 1;
const DOUBLE_THICKNESS = 2 * CANVAS_BORDER_THICKNESS;

const round = (n) => Math.round(n, 1);

export class WaveView extends React.Component {
	static propTypes = {
		// the title of the view
		sceneName: PropTypes.string,

		// no!  handed in by promise space: PropTypes.instanceOf(eSpace),

		// handed in, pixels.  Width of whole waveview, including sidebar,
		// bumpers and border.  Canvas is CANVAS_BORDER_THICKNESS pixel smaller
		// all around for border.
		outerWidth: PropTypes.number.isRequired,

		sPanel: PropTypes.object.isRequired,
	};

	constructor(props) {
		super(props);
		checkPropTypes(this.constructor.propTypes, props, 'prop', this.constructor.name);

		// is this a bad idea?
		this.sPanel = props.sPanel;
		this.sPanel.wView = this;

		this.state = {
			// height of just the canvas + DOUBLE_THICKNESSpx, as set by user with size box
			outerHeight: round(getASetting('miscSettings', 'waveViewHeight')),  // integer pixels

			// no!  handed in by promise space: null,  // set when promise comes in
		}

		this.updateInnerDims();  // after outerWidth done

		this.formerWidth = this.outerWidth;
		this.formerHeight = round(this.state.outerHeight);

		// make the proptypes shuddup about it being undefined
		this.mainVDisp = null;

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
			this.bumperWidth = (qeConsts.contWELL == space.continuum)
				? WELL_BUMPER_WIDTH
				: 0;

			this.mainVDisp = space.vDisp;

			// context.  Somehow this context is around by space promise.  Not so for control panel.
			let wv = this.context.waveView;
			debugger;
			wv.space = space;
			wv.grinder = space.grinder;
			wv.mainEAvatar = space.mainEAvatar;

			// make room for the bumpers for WELL continuum (both sides).  Note that
			// continuum can change only when page reloads.
			wv.bumperWidth = (qeConsts.contWELL == space.continuum)
				? WELL_BUMPER_WIDTH
				: 0;

			wv.mainVDisp = space.vDisp;
		})
		.catch(ex => {
			console.error(`eSpaceCreatedPromise failed:`, ex.stack ?? ex.message ?? ex);
			debugger;
		});
	}

	static contextType = SquishContext;

	// set this.canvasInnerDims from the right places
	updateInnerDims() {
		// on the off chance this is not yet an integer, keep our rounded version of the number
		this.outerWidth = round(this.props.outerWidth);

		this.canvasInnerWidth = round(this.outerWidth - DOUBLE_THICKNESS);
		this.canvasInnerHeight = round(this.state.outerHeight - DOUBLE_THICKNESS);
		if (traceDimensions)
			console.log(`🏄 canvas updateInner: w=${this.canvasInnerWidth} h=${this.canvasInnerHeight}`);
	}

	// we finally have a canvas; give me a reference so I can save it
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
		this.updateInnerDims();

		// only need this when the WaveView outer dims change, either a user
		// change height or window change width.  On that occasion, we have to adjust
		// a lot, including resizing the canvas.
		if (this.mainEAvatar && (this.formerWidth != this.outerWidth
					|| this.formerHeight != s.outerHeight) ) {

			//this.updateInnerDims();

			// Size of window & canvas changed!  (or, will change soon)
			if (traceDimensions) {
				console.log(`🏄 wv Resizing  👀 mainEAvatar=${this.mainEAvatar.label}
					formerWidth=${this.formerWidth} ≟➔ outerWidth=${this.outerWidth}
					formerHeight=${this.formerHeight} ≟➔ outerHeight=${s.outerHeight}
					btw props.outerWidth=${this.props.outerWidth}
					canvas: ${this.canvasNode.width}, ${this.canvasNode.height}`);
			}

			// trigger a render
			this.setState({outerHeight: s.outerHeight});

			// the formers are OUTER sizes.  All these should be integers by now.
			this.formerWidth = this.outerWidth;
			this.formerHeight = s.outerHeight;
			if (traceDimensions) {
				console.log(`🏄 WaveView canvasInner width is ${this.canvasInnerWidth};  `
					+ `now outer width = ${this.outerWidth}`);
			}
		}
	}

	/* ************************************************************************ resizing */

	// these are for resizing the WaveView ONLY with the size box
	resizePointerDown =
	ev => {
		this.resizing = true;
		this.yOffset = round(this.state.outerHeight - ev.pageY);
		if (traceDragCanvasHeight)
			console.info(`🏄 resizePointer down ${ev.pageX} ${ev.pageY} offset=${this.yOffset}`);
		ev.target.setPointerCapture(ev.pointerId);
		ev.preventDefault();
		ev.stopPropagation();
	}

	resizePointerMove =
	ev => {
		if (!this.resizing)
			return;

		const vHeight = round(ev.pageY + this.yOffset);
		if (this.state.outerHeight != vHeight)
			this.setState({outerHeight: vHeight});
		storeASetting('miscSettings', 'waveViewHeight', vHeight);
		if (traceDragCanvasHeight)
			console.info(`🏄 resizePointer drag ${ev.pageX} ${ev.pageY}  newheight=${ev.pageY + this.yOffset}`);

		ev.preventDefault();
		ev.stopPropagation();
	}

	// usually I send pointerLeave events here, but now with pointerCapture, maybe it doesn't matter.
	// I do get pointerLeave events, but only after pointerUp, if the pointer is out of the size box.
	resizePointerUp =
	ev => {
		if (traceDragCanvasHeight)
			console.info(`🏄 resizePointer up ${ev.pageX} ${ev.pageY}`);
		this.resizing = false;
		ev.preventDefault();
		ev.stopPropagation();
	}

	/* ********************************************************* hover */
	// I'm done trying to get the css :hover to do this right.  Enter and Leave events
	// now turn on/off the voltage display.

	hoverEnter = ev => {
		if (traceHover)
			console.log(`waveview hover enter`);
		if (this.waveViewEl)
			this.waveViewEl.classList.add('wvHovering')
	}

	hoverLeave = ev => {
		if (traceHover)
			console.log(`waveview hover Leave`);
		if (this.waveViewEl)
			this.waveViewEl.classList.remove('wvHovering')
	}

	grabWaveViewEl = el => this.waveViewEl = el;

	stopIntegration = ev => {

	};

	/* ********************************************************* render */
	setUpContext() {
		let wv = this.context?.waveView;
		if (!wv || wv.space)
			return;

		//debugger;
		wv.space = {};
		console.log(`🏄  WaveView set context context: `, this.context);
	}


	render() {
		const p = this.props;
		const s = this.state;

		// this is the earliest place the context shows up
		this.setUpContext();

		// if c++ isn't initialized yet, we can assume the time and frame serial
		let elapsedTime = '0';
		let frameSerial = '0';
		if (this.grinder) {
			// after qeConsts has been initialized
			elapsedTime = thousands(this.grinder.elapsedTime.toFixed(4));
			frameSerial = thousands(this.grinder.frameSerial);
		}

		if (traceDimensions) {
			console.log(`🏄 WaveView render, outerWidth=${this.outerWidth}`
				+` bumperWidth=${this.bumperWidth}, canvasInnerWidth=${this.canvasInnerWidth} `
				+`canvasInnerHeight=${this.canvasInnerHeight}`);
		}

		// can't make a real GLScene until we have the space!
		let glScene;
		if (this.space) {
			glScene = <GLScene
				space={s.space} avatar={s.space.mainEAvatar}
				sceneClassName='flatScene' sceneName='mainWave'
				canvasInnerWidth={this.canvasInnerWidth}
				canvasInnerHeight={this.canvasInnerHeight}
				setGlCanvas={this.setGlCanvas}
				specialInfo={{bumperWidth: this.bumperWidth}}
			/>;
		}
		else {
			// until then, show spinner, not actually a GLScene
			const spinner = this.space
				? ''
				: <img className='spinner' alt='spinner' src='/images/eclipseOnTransparent.gif' />;

			let glScene = <div className='spinnerBox'
						style={{width: this.outerWidth - CANVAS_BORDER_THICKNESS ,
							height: s.outerHeight - DOUBLE_THICKNESS}} >
				{spinner}
			</div>;
		}

		// if there's no vDisp yet (cuz no space yet), the voltOverlay gets all
		// mucked up.  So just avoid it.
		let voltOverlay = '';
		if (this.mainVDisp){
			voltOverlay = <VoltOverlay
				space={this.space}
				canvasInnerWidth={this.canvasInnerWidth}
				canvasInnerHeight={this.canvasInnerHeight}
				mainVDisp={this.mainVDisp}
				bumperWidth={this.bumperWidth}
			/>;
		}
		// now kept in VoltOverlay and Control Panel showVoltage={p.showVoltage}

		let betweenBumpers = this.canvasInnerWidth - 2 * this.bumperWidth;

		// the glScene is one layer.  Over that is the widget area  Bumpers are outside.
		return (
		<div className='WaveView' style={{height: `${s.outerHeight}px`}}
			onPointerEnter={this.hoverEnter} onPointerLeave={this.hoverLeave}
			onPointerUp={this.stopIntegration}
			ref={this.grabWaveViewEl}>

			{glScene}

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
					onPointerDown={this.resizePointerDown} onPointerUp={this.resizePointerUp}
					onPointerMove={this.resizePointerMove} onPointerLeave={this.resizePointerUp}
					style={{width: `${SIZE_BOX_SIZE}px`, height: `${SIZE_BOX_SIZE}px`}} />
			</div>
			<div className='bumper right' key='right'
				style={{flexBasis: this.bumperWidth +'px', height: this.canvasInnerHeight}} />

		</div>
		);
	}

}

export default WaveView;

