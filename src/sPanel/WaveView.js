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
import qeConsts from '../engine/qeConsts.js';
import './WaveView.scss';
import {getASetting, storeASetting} from '../utils/storeSettings.js';

import VoltOverlay from '../volts/VoltOverlay.js';
import {WELL_BUMPER_WIDTH} from '../volts/voltConstants.js';
import GLScene from '../gl/GLScene.js';
import {eSpaceCreatedPromise} from '../engine/eEngine.js';
import SquishContext from './SquishContext.js';
import StartStopOverlay from './StartStopOverlay.js';
import resizeIcon from './waveViewIcons/resize.png';

let traceBumpers = false;
let traceDimensions = true;
let traceDragCanvasHeight = false;
let traceHover = false;
let traceContext = false;

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

		// sAnimator
		animator: PropTypes.object,

		setShouldBeIntegrating: PropTypes.func.isRequired,
		sPanel: PropTypes.object.isRequired,
	};

	constructor(props) {
		super(props);
		ccpt(this, props);
		// checkPropTypes(this.constructor.propTypes, props, 'prop',
		// 		this.constructor.name);

		this.state = {
			// height of just the canvas + DOUBLE_THICKNESSpx, as set by user with size box
			// integer pixels
			outerHeight: round(getASetting('miscSettings', 'waveViewHeight')),
		}

		this.updateInnerDims();  // after outerWidth done

		this.formerWidth = this.outerWidth;
		this.formerHeight = round(this.state.outerHeight);

		// make the proptypes shuddup about it being undefined
		this.mainVDisp = null;

		eSpaceCreatedPromise.then(this.handleSpacePromise,
			// catch
			ex => {
				console.error(`eSpaceCreatedPromise failed:`, ex.stack ?? ex.message ?? ex);
				debugger;
			}
		);
	}

	static contextType = SquishContext;

	// set up 2/3 of the context: waveView and engine
	setUpContext() {
		// need BOTH context  and the space.  So this is called twice.
		const context = this.context;
		if (!context) {
			// not ready yet so try again
			setTimeout(this.setUpContext, 100);
			return;
		}

		let wv = context.waveView;
		if (wv)
			return;  // already done

		const space = this.space;
		wv = {
			space: space,
			grinder: space.grinder,
			//mainAvatar: space.mainAvatar,

			// make room for the bumpers for WELL continuum (both sides).  Note that
			// continuum can change only when page reloads.
			bumperWidth: (qeConsts.contWELL == space.continuum)
					? WELL_BUMPER_WIDTH
					: 0,

			mainVDisp: space.vDisp,
		};

			// make room for the bumpers for WELL continuum (both sides).  Note that
			// continuum can change only when page reloads.
		//wv.bumperWidth = (qeConsts.contWELL == space.continuum)
		//	? WELL_BUMPER_WIDTH
		//	: 0;

		//wv.mainVDisp = space.vDisp;

		if (traceContext) {
			console.log(`🏄 WaveView setUpContext context:`,
				context.setShouldBeIntegrating,
				context.controlPanel,
				context.waveView,
			);
		}
		this.props.setWVContext(wv);
		return;  // done
	}

	// set up 2/3 of the context: waveView and engine
	handleSpacePromise = (space) => {
		// this will kick off a render, now that the avatar is in place
		this.setState({space});
		this.space = space;  // for immediate access

		this.grinder = space.grinder;
		this.mainAvatar = space.mainAvatar;

		// make room for the bumpers for WELL continuum (both sides).  Note that
		// continuum can change only when page reloads.
		this.bumperWidth = (qeConsts.contWELL == space.continuum)
			? WELL_BUMPER_WIDTH
			: 0;

		this.mainVDisp = space.vDisp;

		this.setUpContext();
	}

	// set this.canvasInnerDims from the right places
	updateInnerDims() {
		// on the off chance this is not yet an integer, keep our rounded version of the number
		this.outerWidth = round(this.props.outerWidth);

		this.canvasInnerWidth = round(this.outerWidth - DOUBLE_THICKNESS);
		this.canvasInnerHeight = round(this.state.outerHeight - DOUBLE_THICKNESS);
		if (traceDimensions)
			console.log(`🏄 canvas updateInner: w=${this.canvasInnerWidth} h=${this.canvasInnerHeight}`);
	}

// 	// we finally have a canvas; give me a reference so I can save it.
// 	// (this is repeatedly called right after each render.)
// 	static setGlCanvas = (gl, canvas) => {
// 		if (!gl)
// 			throw `no gl value`;
// 		if (!this.gl) {
// 			this.gl = gl;
// 			this.canvasNode = canvas;
// 		}
// 		else if (this.gl !== gl)
// 			throw `this.gl ≠ gl !`;
//
// 		// might be available a few renders later
// 		if (this.canvasNode && this.canvasNode.glRepaint) {
// 			const glRepaint = this.canvasNode.glRepaint;
// 			this.glRepaint = glRepaint;
// 			if (this.props.animator)
// 				this.props.animator.glRepaint = glRepaint;
// 			else
// 				throw `no glRepaint() on animator`;
// 		}
// 	}

	componentDidMount() {
		let wv = this.context?.waveView;
		if (!wv || wv.space)
			return;

		//this.setUpContext();
		//wv.space = {};
		console.log(`🏄  WaveView componentDidMount context: `, this.context);
	}

	componentDidUpdate() {
		const p = this.props;
		const s = this.state;
		this.updateInnerDims();

		// only need this when the WaveView outer dims change, either a user
		// change height or window change width.  On that occasion, we have to adjust
		// a lot, including resizing the canvas.
		if (this.mainAvatar && (this.formerWidth != this.outerWidth
					|| this.formerHeight != s.outerHeight) ) {

			//this.updateInnerDims();

			// Size of window & canvas changed!  (or, will change soon)
			if (traceDimensions) {
				console.log(`🏄 wv Resizing  👀 mainAvatar=${this.mainAvatar.label}
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

	/* ******************************************************** resizing */

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

	/* ********************************************************* render */


	render() {
		const p = this.props;
		const s = this.state;

		// can't figure out when else to do it
		if (this.props.animator)
			this.props.animator.context = this.context;

		if (traceContext && this.context) {
			console.log(`🏄 WaveView Render context:`, this.context);
		}

		// if c++ isn't initialized yet, we can assume the time and frame serial
		let tnf = {elapsedTimeText: '0', frameSerialText: '0'};
		if (this.grinder)
			tnf = this.grinder.formatTimeNFrame();

		if (traceDimensions) {
			console.log(`🏄 WaveView render, outerWidth=${this.outerWidth}`
				+` bumperWidth=${this.bumperWidth}, canvasInnerWidth=${this.canvasInnerWidth} `
				+`canvasInnerHeight=${this.canvasInnerHeight}`);
		}

		// can't make a real GLScene until we have the space!
		let glScene;
		if (this.space) {
			let sceneClassName = 'flatScene';
			let sceneName = 'mainWave';

			glScene = <GLScene
				space={s.space} animator={this.props.animator}
				sceneClassName={sceneClassName} sceneName={sceneName}
				canvasInnerWidth={this.canvasInnerWidth}
				canvasInnerHeight={this.canvasInnerHeight}
				specialInfo={{bumperWidth: this.bumperWidth}}
			/>;
		}
		else {
			// until then, show spinner, not actually a GLScene
			const spinner = this.space
				? ''
				: <img className='spinner' alt='spinner'
					src='/images/eclipseOnTransparent.gif' />
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
						<span className='voNorthWest'>{tnf.elapsedTimeText}</span> ps
					</div>
					<div className='northEastWrapper'>
						frame <span className='voNorthEast'>{tnf.frameSerialText}</span>
					</div>

				</section>

				{voltOverlay}

				<StartStopOverlay />

				<img className='sizeBox' src={resizeIcon} alt='size box'
					onPointerDown={this.resizePointerDown} onPointerUp={this.resizePointerUp}
					onPointerMove={this.resizePointerMove} onPointerLeave={this.resizePointerUp}
					title="To adjust the height, drag this up or down"
					style={{width: `2em`, height: `2em`}} />
			</div>
			<div className='bumper right' key='right'
				style={{flexBasis: this.bumperWidth +'px', height: this.canvasInnerHeight}} />

		</div>
		);
	}

}

export default WaveView;

