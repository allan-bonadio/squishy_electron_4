/*
** WaveVista -- a 3d webgl image of the quantum wave
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

// WaveVista also wraps a canvas, similar to WaveView.
// WaveVista is 3d and has completely different controls from WaveView which is 2d.  No voltage controls.  Just rotation. as of this writing

import React, {useContext} from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';
//import * as d3 from "d3";

import eSpace from '../engine/eSpace.js';
import qeConsts from '../engine/qeConsts.js';
import './WaveVista.scss';
import {getASetting, storeASetting} from '../utils/storeSettings.js';
//import {waitForSpaceCreatedPromise} from './waveContext.js';
import waveAux from './waveAux.js';

import PivotOverlay from './PivotOverlay.js';
import Orient3D from './Orient3D.js';
// import {WELL_BUMPER_WIDTH} from '../volts/voltConstants.js';
import GLScene from '../gl/GLScene.js';
import Spinner from '../widgets/Spinner.js';
//import {eSpaceCreatedPromise} from '../engine/eEngine.js';
import SquishContext from '../sPanel/SquishContext.js';
import BeginFinishOverlay from './BeginFinishOverlay.js';
import resizeIcon from './waveViewIcons/resize.png';


let traceDimensions = false;
// OLD 2d STUFF
let traceDragCanvasHeight = false;
//let traceHover = false;
let traceContext = false;

const round = (n) => Math.round(n, 1);

export class WaveVista extends React.Component {
	static propTypes = {
		// the title of the view
		sceneName: PropTypes.string,

		// no!  handed in by promise space: PropTypes.instanceOf(eSpace),

		// handed in, pixels.  Width of whole WaveVista, including sidebar,
		// bumpers and border.  Canvas is CANVAS_BORDER_THICKNESS pixel smaller
		// all around for border.
		outerWidth: PropTypes.number.isRequired,

		animator: PropTypes.object,


		setShouldBeIntegrating: PropTypes.func.isRequired,
		sPanel: PropTypes.object.isRequired,

		show3D: PropTypes.bool.isRequired,

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
			outerHeight: round(getASetting('miscSettings', 'vistaHeight')),
		}

		this.createInnerDims();

		// nothing draws until this.space is filled in
		props.spaceCreatedProm.then(space => this.space = space)
	}

	static contextType = SquishContext;

	setHeight(height) {
		this.setState({outerHeight: height});
	}


	/* ********************************************************* hover */
	// I'm done trying to get the css :hover to do this right.  Enter and Leave events
	// now turn on/off the voltage display.

	// wave view only, not wave vista

// 	hoverEnter = ev => {
// 		if (traceHover)
// 			console.log(`WaveVista hover enter`);
// 		if (this.WaveVistaEl)
// 			this.WaveVistaEl.classList.add('wvHovering')
// 	}
//
// 	hoverLeave = ev => {
// 		if (traceHover)
// 			console.log(`WaveVista hover Leave`);
// 		if (this.WaveVistaEl)
// 			this.WaveVistaEl.classList.remove('wvHovering')
// 	}

//			onPointerEnter={this.hoverEnter} onPointerLeave={this.hoverLeave}

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

	// not sure I need this in the vista
	grabWaveVistaEl = el => this.WaveVistaEl = el;

	makeVista() {
		// can't make a real GLScene until we have the space!
		let vista;
		const s = this.state;

		if (this.space) {
			let sceneClassName = 'garlandScene';
			let sceneName = 'mainWave3D';

			vista = <GLScene
				space={this.space} animator={this.animator}
				sceneClassName={'garlandScene'} sceneName={sceneName + '3d'}
				inputInfo={[this.space.mainFlick, null, null, null]}
				canvasInnerWidth={this.canvasInnerWidth}
				canvasInnerHeight={this.canvasInnerHeight}
				setGLRepaint={this.setMainRepaint}
			/>;
		}
		else {
			vista = <Spinner
				width={this.outerWidth - this.CANVAS_BORDER_THICKNESS}
				height={s.outerHeight - this.DOUBLE_THICKNESS} />
		}
		return vista;
	}

	render() {
		const p = this.props;
		const s = this.state;

		if (traceContext && this.context) {
			console.log(`🏄 WaveVista Render context:`, this.context);
		}

		// if c++ isn't initialized yet, we can assume the time
		let tnf = {elapsedTimeText: '0', };
		if (this.grinder)
			tnf = this.grinder.formatTime();

		if (traceDimensions) {
			console.log(`🏄 WaveVista render, outerWidth=${this.outerWidth}`
				+`canvasInnerWidth=${this.canvasInnerWidth} `
				+`canvasInnerHeight=${this.canvasInnerHeight}`);
		}

		let pOverlay;
		//pOverlay = <PivotOverlay />;  // production
		pOverlay = <Orient3D orientation={***}  setOrientation=/>;  // testing

		let vista = this.makeVista();

		// the glScene is one layer.  Over that is the widget area  Bumpers are outside.
		return (
		<div className='WaveVista'
			style={{height: `${s.outerHeight}px`, display: (p.show3D ? 'flex' : 'none')}}
			onPointerUp={this.finishIntegration}
			onFocus={ev => console.log(`focus ON`)}
			ref={this.grabWaveVistaEl}>

			{vista}

			<div className='widgetArea' key='widgetArea'
						style={{flexBasis: this.canvasInnerWidth +'px', height: this.canvasInnerHeight + 'px'}}>

				<section className='timeOverlay'
					style={{maxWidth: this.canvasInnerWidth +'px'}}>
					<div className='northWestWrapper'>
						<span className='voNorthWest'>{tnf.elapsedTimeText}</span> ps
					</div>

				</section>

				{pOverlay}

				<BeginFinishOverlay />

				<img className='sizeBox' src={resizeIcon} alt='size box'
					onPointerDown={this.resizePointerDown} onPointerUp={this.resizePointerUp}
					onPointerMove={this.resizePointerMove} onPointerLeave={this.resizePointerUp}
					title="To adjust the height, drag this up or down"
					style={{width: `2em`, height: `2em`}} />
			</div>

		</div>
		);
	}

}

//Object.assign(WaveVista.prototype, waveAux);

export default WaveVista;

