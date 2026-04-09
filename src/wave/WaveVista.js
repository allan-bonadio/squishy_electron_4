/*
** WaveVista -- a 3d webgl image of the quantum wave
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

// WaveVista also wraps a canvas, similar to WaveView.
// WaveVista is 3d and has completely different controls from WaveView which is 2d.  No voltage controls.  Just rotation. as of this writing

import React, {useContext} from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';
//import * as d3 from "d3";

import {mat4} from 'gl-matrix';

import eSpace from '../engine/eSpace.js';
import qeConsts from '../engine/qeConsts.js';
import './wave.scss';
//import './WaveVista.scss';
import {getASetting, storeASetting, getAGroup} from '../utils/storeSettings.js';
//import {waitForSpaceCreatedPromise} from './waveContext.js';
import waveAux from './waveAux.js';
import SizeBox from './SizeBox.js';

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
let traceContext = false;
let traceOrientation= false;

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

		setMainVistaRepaint: PropTypes.func,
		setSpectRepaint: PropTypes.func,

		spaceCreatedProm: PropTypes.object.isRequired,
	};

	constructor(props) {
		super(props);
		ccpt(this, props);
		// checkPropTypes(this.constructor.propTypes, props, 'prop',
		// 		this.constructor.name);

		//debugger;
		Object.assign(this, waveAux);
		this.space = props.space;

		this.state = {
			// height of just the canvas + DOUBLE_THICKNESSpx, as set by user with size box
			// integer pixels
			outerHeight: round(getASetting('miscSettings', 'vistaHeight')),
		}

		// not in state cuz changes trigger repaint not render
		//debugger;
		this.orient = getAGroup('orientSettings');

		this.createInnerDims();  // screen dimensions of canvas

		// nothing draws until this.space is filled in
		props.spaceCreatedProm.then(space => {
			this.space = space;
			this.initOrigMatrix();
			this.rotateMatrix();
		});
	}

	static contextType = SquishContext;

	setHeight = (height) => {
		this.setState({outerHeight: height});
		storeASetting('miscSettings', 'vistaHeight', height);
	}


	/* ******************************************* orient & matrix  */

	// recalculate the perspective matrix, given changed canvas geometry.
	// Must have canvasInnerWidth/Height from updateInnerDims() already calculated.
	// Must be done before first repaint.
	canvasResized() {
 		// make the projection matrix.. never changes
		const fieldOfView = (45 * Math.PI) / 180; // in radians
		const aspect = this.canvasInnerWidth / this.canvasInnerHeight;
		const zNear = 0.1;
		const zFar = this.space.nPoints * 3;
		this.projMatrix = mat4.create();
		mat4.perspective(this.projMatrix, fieldOfView, aspect, zNear, zFar);

	}

	// all the mat4 functions have the dest as the first argument.
	// set up the matrices once when wave vista created
	// the original matrix that rotations get appended onto.
	initOrigMatrix() {
		this.canvasResized();
		let origMatrix = mat4.clone(this.projMatrix)
		// const origMatrix = mat4.create();
		mat4.translate(origMatrix, origMatrix, [0.0, 0.0, -this.space.nPoints * 5]);
		this.origMatrix = this.matrix = origMatrix;
	}

	rotateMatrix() {
		let matrix = mat4.clone(this.origMatrix);

		// only for testing.  The numbers were found empirically
		//const rand = (min, max) => (max-min) * Math.random() + min;

		// the numerical angles are -360...+360, whether useful or not.
		const deg2rad = (deg) => deg / 180 * Math.PI;

		//let zRotation = rand(5.19, 5.30);
		let zRotation = deg2rad(this.orient.z);
		mat4.rotate(matrix, matrix, zRotation, [0, 0, 1]);

		//let yRotation = rand(4.33, 5.20);
		let yRotation = deg2rad(this.orient.y);
		mat4.rotate(matrix, matrix, yRotation, [0, 1, 0]);

		//let zRotation = rand(5.19, 5.30);
		let xRotation = deg2rad(this.orient.x);
		mat4.rotate(matrix, matrix, xRotation, [1, 0, 0]);

		this.matrix = matrix;
	}

	// called when user tries to rotate it, whether pivot or orient
	// coord = x y z strings   newVal is new angle around that axis
	// pass an object, with one, two or all three
	setOrient = (coord, newVal) => {
		let oldO = {...this.orient};
		this.orient[coord] = newVal;
		storeASetting('orientSettings', coord, newVal);

		// this is the only way I can get the bargraphs to render  TODO remove this
		this.setState({fuckinRender: Math.random()});

		//dblog(`setOrient(${coord}, ${newVal})  new orient=`, this.orient,
		//	`  old orient=`, oldO, `  local store=`, localStorage.orientSettings);
		this.rotateMatrix();
	}


	/* ********************************************************* render*/

	// pass along the vital repaint functions
	setMainVistaRepaint = (mainVistaRepaint) => {
		this.mainVistaRepaint ??= mainVistaRepaint;
		this.mainVistaRepaint.sceneName = 'mainVistaRepaint';  // for debugging

		this.props.setMainVistaRepaint(mainVistaRepaint);
		this.animator.mainVistaRepaint ??= mainVistaRepaint;
	};
	setSpectRepaint = (spectRepaint) => {
		this.spectRepaint ??= spectRepaint;
		this.props.setSpectRepaint(spectRepaint);
		this.animator.spectRepaint ??= spectRepaint;
	};

	// not sure I need this in the vista.  No, I don't think I need it TODO
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
				inputInfo={[this.space.mainFlick, this.matrix, null, null]}
				canvasInnerWidth={this.canvasInnerWidth}
				canvasInnerHeight={this.canvasInnerHeight}
				setGLRepaint={this.setMainVistaRepaint}
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

		if (traceOrientation)
			dblog(`orientX=${this.orient.x} orientY=${this.orient.y} orientZ=${this.orient.z}`);
		let pOverlay = <Orient3D   setOrient={this.setOrient}
			orientX={this.orient.x} orientY={this.orient.y} orientZ={this.orient.z} />;

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

			<SizeBox which='vista' setHeight={this.setHeight}
					initialHeight={s.outerHeight} />
 />
			</div>

		</div>
		);
	}

}

//Object.assign(WaveVista.prototype, waveAux);

export default WaveVista;

			// 	<img className='sizeBox' src={resizeIcon} alt='size box'
// 					onPointerDown={this.resizePointerDown} onPointerUp={this.resizePointerUp}
// 					onPointerMove={this.resizePointerMove} onPointerLeave={this.resizePointerUp}
// 					title="To adjust the height, drag this up or down"
// 					style={{width: `2em`, height: `2em`}} />
