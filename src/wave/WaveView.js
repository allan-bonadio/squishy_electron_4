/*
** WaveView -- a webgl 2d image of the quantum wave
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

// Each wraps a canvas for display.  Via webgl.  along with svg doohickeys and what not.
// You can have many in a squishPanel?, each subscribing to the same space.
// One is the main view, displaying current simulation in 2d.  Others communicate with
// control panel tabs to display proposed settings before effecting them.

import React, {useContext} from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';
//import * as d3 from "d3";

import eSpace from '../engine/eSpace.js';
import qeConsts from '../engine/qeConsts.js';
import '../wave/WaveView.scss';
import {getASetting, storeASetting} from '../utils/storeSettings.js';

import VoltOverlay from '../volts/VoltOverlay.js';
import {WELL_BUMPER_WIDTH} from '../volts/voltConstants.js';
import GLScene from '../gl/GLScene.js';
import Spinner from '../widgets/Spinner.js';
//import {eSpaceCreatedPromise} from '../engine/eEngine.js';
import SquishContext from '../sPanel/SquishContext.js';
import BeginFinishOverlay from './BeginFinishOverlay.js';
import resizeIcon from './waveViewIcons/resize.png';
//import {waitForSpaceCreatedPromise} from './waveContext.js';

import {waveAux} from './waveAux.js';

let traceBumpers = false;
let traceDimensions = true;
let traceDragCanvasHeight = false;
let traceHover = false;
let traceContext = true;

// const CANVAS_BORDER_THICKNESS = 1;
// const DOUBLE_THICKNESS = 2 * this.CANVAS_BORDER_THICKNESS;

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
		setWVContext: PropTypes.func,

		setShouldBeIntegrating: PropTypes.func.isRequired,
		sPanel: PropTypes.object.isRequired,

		show2D: PropTypes.bool.isRequired,

		// GL funcs
		setMainRepaint: PropTypes.func,
		setSpectRepaint: PropTypes.func,

		spaceCreatedProm: PropTypes.object.isRequired,
	};

	constructor(props) {
		super(props);
		ccpt(this, props);
		// checkPropTypes(this.constructor.propTypes, props, 'prop',
		// 		this.constructor.name);

		// extra methods handling screen geometry
		//debugger;
		Object.assign(this, waveAux);
		this.space = props.space;

		this.state = {
			// height of just the canvas + DOUBLE_THICKNESSpx, as set by user with size box
			// integer pixels
			outerHeight: round(getASetting('miscSettings', 'viewHeight')),
		}

		// whenever...
		// if (this.context) {
		// 	this.context.spaceCreatedProm(
		// 		space => this.space = this.context.space)}

		this.createInnerDims();

		// nothing draws until this.space is filled in
		props.spaceCreatedProm.then(space => this.space = space)
	}

	static contextType = SquishContext;


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

	/* ********************************************************* render */

	// pass along the vital repaint functions
	setMainRepaint = (mainRepaint) => {
		this.mainRepaint ??= mainRepaint;
		this.mainRepaint.sceneName = 'mainRepaint';  // for debugging

		this.props.setMainRepaint(mainRepaint);
		this.animator.mainRepaint ??= mainRepaint;
	};
	setSpectRepaint = (spectRepaint) => {
		this.spectRepaint ??= spectRepaint;
		this.props.setSpectRepaint(spectRepaint);
		this.animator.spectRepaint ??= spectRepaint;
	};

	grabWaveViewEl = el => this.waveViewEl = el;

	makeView() {
		// can't make a real GLScene until we have the space!
		const s = this.state;
		let view;

		if (this.space) {
			let sceneClassName = 'flatScene';
			let sceneName = 'mainWave2D';

			view = <GLScene
				space={this.space} animator={this.animator}
				sceneClassName={'flatScene'} sceneName={sceneName +'2d'}
				inputInfo={[this.space.mainFlick, this.bumperWidth, null, null]}
				canvasInnerWidth={this.canvasInnerWidth}
				canvasInnerHeight={this.canvasInnerHeight}
				setGLRepaint={this.setMainRepaint}
			/>;

		}
		else {
			view = <Spinner
				width={this.outerWidth - this.CANVAS_BORDER_THICKNESS}
				height={s.outerHeight - this.DOUBLE_THICKNESS} />
		}
		return view;
	}

	render() {
		const p = this.props;
		const s = this.state;

		if (traceContext && this.context) {
			console.log(`🏄 WaveView Render context:`, this.context);
		}

		// if c++ isn't initialized yet, we can assume the time
		let tnf = {elapsedTimeText: '0', };
		if (this.grinder)
			tnf = this.grinder.formatTime();

		// make room for the bumpers for WELL continuum (both sides).  Note that
		// continuum can change only when page reloads.
		this.bumperWidth = (qeConsts.contWELL == this.space?.continuum)
				? WELL_BUMPER_WIDTH
				: 0;

		if (traceDimensions) {
			console.log(`🏄 WaveView render, outerWidth=${this.outerWidth}`
				+` bumperWidth=${this.bumperWidth}, `
				+`canvasInnerWidth=${this.canvasInnerWidth} `
				+`canvasInnerHeight=${this.canvasInnerHeight}`);
		}

		let view = this.makeView();

		// if there's no vDisp yet (cuz no space yet), the voltOverlay gets all
		// mucked up.  So just avoid it.
		let voltOverlay = '';
		if (this.space){
			voltOverlay = <VoltOverlay
				space={this.space}
				canvasInnerWidth={this.canvasInnerWidth}
				canvasInnerHeight={this.canvasInnerHeight}
				mainVDisp={this.space.vDisp}
				bumperWidth={this.bumperWidth}
			/>;
		}
		// now kept in VoltOverlay and Control Panel showVoltage={p.showVoltage}

		let betweenBumpers = this.canvasInnerWidth - 2 * this.bumperWidth;

		// the glScene is one layer.  Over that is the widget area  Bumpers are outside.
		return (
		<div className='WaveView'
			style={{height: `${s.outerHeight}px`, display: (p.show2D ? 'flex' : 'none')}}
			onPointerEnter={this.hoverEnter} onPointerLeave={this.hoverLeave}
			onPointerUp={this.finishIntegration}
			onFocus={ev => console.log(`WaveView focus ON`)}
			ref={this.grabWaveViewEl}>

			<div className='bumper left' key='left'
				style={{flexBasis: this.bumperWidth +'px', height: this.canvasInnerHeight}} />

			{view}

			<div className='widgetArea' key='widgetArea'
						style={{flexBasis: betweenBumpers +'px',
								height: this.canvasInnerHeight+'px'}}>

				<section className='timeOverlay'
					style={{maxWidth: this.canvasInnerWidth +'px'}}>
					<div className='northWestWrapper'>
						<span className='voNorthWest'>{tnf.elapsedTimeText}</span> ps
					</div>

				</section>

				{voltOverlay}

				<BeginFinishOverlay />

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

// 					<div className='northEastWrapper'>
// 						frame <span className='voNorthEast'>{tnf.frameSerialText}</span>
// 					</div>
