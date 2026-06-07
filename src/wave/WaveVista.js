/*
** WaveVista -- a 3d webgl image of the quantum wave
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

// WaveVista also wraps a canvas, similar to WaveView. WaveVista is 3d and has
// completely different controls from WaveView which is 2d.	 No voltage
// controls.  Just rotation. as of this writing

import React, {useContext} from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';
//import * as d3 from "d3";

import {mat4} from 'gl-matrix';

import eSpace from '../engine/eSpace.js';
import qeConsts from '../engine/qeConsts.js';
import './wave.scss';
//import './WaveVista.scss';
import {getASetting, storeASetting, getAGroup, storeAGroup} from '../utils/storeSettings.js';
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
import {dump4x4} from '../gl/helpers3D.js';


let traceDimensions = false;
let traceContext = false;
let traceOrientation= true;
let traceOrient = false;

let traceProjMatrix = true;
let traceOffMatrix = true;
let traceRotMatrix = true;


const round = (n) => Math.round(n, 1);

// the numerical angles are -360...+360, whether useful or not.
let d2r = Math.PI / 180;



export class WaveVista extends React.Component {
	static propTypes = {
		// the title of the view
		sceneName: PropTypes.string,

		// no!	handed in by promise space: PropTypes.instanceOf(eSpace),

		// handed in, pixels.  Width of whole WaveVista, including sidebar,
		// bumpers and border.	Canvas is CANVAS_BORDER_THICKNESS pixel smaller
		// all around for border.
		outerWidth: PropTypes.number.isRequired,

		animator: PropTypes.object,


		setShouldBeIntegrating: PropTypes.func.isRequired,
		sPanel: PropTypes.object.isRequired,

		show3D: PropTypes.bool.isRequired,

		setMainVistaRepaint: PropTypes.func,

		spaceCreatedProm: PropTypes.object.isRequired,
	};

	constructor(props) {
		super(props);
		ccpt(this, props);

		//debugger;
		Object.assign(this, waveAux);
		// no!  see promise then() below  this.space = props.space;

		this.state = {
			// height of just the canvas + DOUBLE_THICKNESSpx, as set by
			// user with size box integer pixels
			outerHeight: round(getASetting('miscSettings', 'vistaHeight')),
		}

		// not in state cuz changes trigger repaint not render
		//debugger;
		this.orient = getAGroup('orientSettings');

		this.createInnerDims();	 // screen dimensions of canvas, in waveAux

		// nothing draws until this.space is filled in
		props.spaceCreatedProm.then(space => {
			this.space = space;
			this.setState({space});  // please render cuz nothing renders without space

			// this will be reused	with new rotMatrixes plugged in
			this.paintingNeeds = {
				cavity: this.space.mainFlick,
				unifiedMatrix: this.unifiedMatrix,
				fudge: this.orient.fudge,
			};

			this.buildNRepaint()
		});
	}

	static contextType = SquishContext;

	setHeight = (height) => {
		this.setState({outerHeight: height});
		storeASetting('miscSettings', 'vistaHeight', height);

		// why don't i have to do this in 2d?!?
	}


	/* ******************************************* orientation matrix	*/

// from glmatrix sources:
/* Generates a perspective projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */
// export function perspectiveNO(out, fovy, aspect, near, far) {
//   const f = 1.0 / Math.tan(fovy / 2);
//   out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
// 	out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
// 	out[8] = 0; out[9] = 0;				out[11] = -1;
// 	out[12] = 0; out[13] = 0;			out[15] = 0;
// 	if (far != null && far !== Infinity) {
// 		const nf = 1 / (near - far);
// 		out[10] = (far + near) * nf;
// 		out[14] = 2 * far * near * nf;
// 	} else {
// 		out[10] = -1;
// 		out[14] = -2 * near;
// 	}
//   return out;
// }


	// recalculate the perspective matrix, given changed canvas
	// geometry/numbers. Must have canvasInnerWidth/Height from
	// updateInnerDims() already calculated. offsetMatrix() next
	// makes the offMatrix - the starting point for different
	// rotations. Must be done before first repaint.
	projectMatrix = () => {
        // make the projection matrix.. never changes.  Well, if you change
        // the FOV, you have to recalculate this.  Oh and if the window or the
        // vista height changes.  Or ... if ...
		const aspect = this.canvasInnerWidth / this.canvasInnerHeight;

		// hfov = horizontal field of view; default for glMatrix is vertical
		const horizontalFieldOfView = d2r * this.orient.hfoView; // in radians

		// these need to be, REALLY, the closest stuff, and the farthest stuff.
		// Approximately.  Maps to the depth buffer.
		const zNear = 1;
		const zFar = this.space.nPoints;

		let matrix = mat4.create();

		// multiply by aspect?  I would think it should divide by aspect?  TODO
		mat4.perspectiveNO(matrix, horizontalFieldOfView * aspect,
					aspect, zNear, zFar);
		if (traceProjMatrix) {
			dblog(`️🏔️ projection: aspect=${aspect} `
				+`  hFOV=${horizontalFieldOfView*180/3.14159} `
				+` zNear=${zNear}   zFar=${zFar}  `);
			dump4x4('vista projMatrix', matrix);
		}
      if (!isFinite(matrix[0])) debugger;
      this.matrix = this.projMatrix = matrix;
	}

	// set up offMatrix only when wave vista created, or reshaped
	// the original matrix that rotations get appended onto.
	// (most of the mat4 functions have the dest as the first argument.)
	offsetMatrix = () => {
		let matrix = mat4.clone(this.matrix);
		// const matrix = mat4.create();

		mat4.translate(matrix, matrix,
				[this.orient.xPos, this.orient.yPos, this.orient.zPos]);
		if (traceOrientation) {
			let o = this.orient;
			dblog(`️🏔️ offfsets xyz: ${o.xPos}  ${o.yPos}  ${o.zPos}  `);
		}

		// probably call rotateMatrix() after this
		if (traceOffMatrix)
			dump4x4('vista matrix:', matrix);
		if (!isFinite(matrix[0])) debugger;
		this.matrix = this.offMatrix = matrix;
	}

    // Take the matrix , and add on the rotations along z y x.
    // called when user rotates image to get a new matrix for the new rotation
	// uses this.orient.* for the angles to rotate, so make sure they're in place
	rotateMatrix = () => {
		let matrix = mat4.clone(this.matrix);

		mat4.rotateZ(matrix, matrix, d2r * this.orient.zAng);

		mat4.rotateY(matrix, matrix, d2r * this.orient.yAng);

		mat4.rotateX(matrix, matrix, d2r * this.orient.xAng);

		if (traceOrientation) {
			dblog(`️🏔️ rotating z y x rotation: z${this.orient.zAng}° y${this.orient.yAng}° `
				+` x${this.orient.xAng}°`);
			dump4x4('end of rotateMatrix()', matrix);
		}

		this.rotatedMatrix = this.matrix = matrix;
		if (traceRotMatrix)
			dump4x4('vista unifiedMatrix:', this.unifiedMatrix);
		if (!isFinite(matrix[0])) debugger;
		//return matrix;
	}

	unifyMatrices() {
		this.projectMatrix()
		this.offsetMatrix();
		this.rotateMatrix();
		this.unifiedMatrix = this.matrix;
	}

	/* ******************************************* orientation 	*/

	// called when user tries to rotate it, whether pivot or orient
	// coord = x y z strings or 'multi'	  newVal is new angle around that axis or orient obj
	// pass an object, with one, two or all three


	// after angles have changed, call this to ripple it thru and
	// repaint JUST the rotation angles.  Save a microsecond :-) of cpu by
	// avoiding matrix mults.
	orientNRepaint = () => {
		this.unifyMatrices();
		this.paintingNeeds.unifiedMatrix = this.matrix;
		if (this.mainVistaRepaint)
			this.mainVistaRepaint(this.paintingNeeds);
	}

	// repaint, rebuilding all matrices, effecting all changes.  Do
	// this when canvas areas need to repaint & resize or other
	// Orient3D settings besides just the angles
	buildNRepaint = () => {
		this.unifyMatrices();
		this.paintingNeeds.unifiedMatrix = this.matrix;
		if (this.mainVistaRepaint)
			this.mainVistaRepaint(this.paintingNeeds);
	}

	// do most of setting any of them
	setOne(varName, newVal) {
		if (traceOrient) dblog(`️🏔️ set one(${varName}, `, newVal, `) `);
		this.orient[varName] = newVal;
		storeASetting('orientSettings', varName, newVal);
	}

	// set a rotation ANGLE: xAng, yAng or zAng
	setAngSetting = (coord, newVal) => {
		this.setOne(coord, newVal);

		//this.orientNRepaint();
		this.buildNRepaint();
	}

	// set Any of the Orient settings, angle or not
	setOneSetting = (varName, newVal) => {
		this.setOne(varName, newVal);
		this.buildNRepaint();
	}

	// set all of them.  newVal is an obj with... most or all of them.
	// Missing ones won't be set.  this is for reset on Orient3D
	setOrientAll = (newSettings) => {
		if (traceOrient) dblog(`️🏔️ setOrientAll(${coord}, `, newSettings, `) `);
		Object.assign(this.orient, newSettings);
		storeAGroup('orientSettings', this.orient);
		this.buildNRepaint();
	}


	/* ********************************************************* render*/
	// once the repaint function is created by GLScene, call this here so everybody can find it.
	// pass along the vital repaint function
	setMainVistaRepaint = (mainVistaRepaint) => {
		this.mainVistaRepaint ??= mainVistaRepaint;
		this.mainVistaRepaint.sceneName = 'mainVistaRepaint';  // for debugging

		this.props.setMainVistaRepaint(mainVistaRepaint);
		this.animator.mainVistaRepaint ??= mainVistaRepaint;
	};

	// not sure I need this in the vista.  No, I don't think I need it TODO
	grabWaveVistaEl = el => this.WaveVistaEl = el;

	makeVista() {
		// can't make a real GLScene until we have the space!
		let vista;
		const s = this.state;

		if (this.space) {
			let sceneClassName = 'garlandScene';
			let sceneName = 'mainVista';

			if (traceRotMatrix)
				dump4x4('vista unifiedMatrix being passed to <GLScene:',
					this.paintingNeeds.unifiedMatrix);
			vista = <GLScene
				space={this.space} animator={this.animator}
				sceneClassName={'garlandScene'} sceneName={sceneName}
				paintingNeeds={this.paintingNeeds}
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
			console.log(`️🏔️ WaveVista Render context:`, this.context);
		}

		// if c++ isn't initialized yet, we can assume the time
		let tnf = {elapsedTimeText: '0'};
		if (this.grinder)
			tnf = this.grinder.formatTime();

		if (traceDimensions) {
			console.log(`🏔️ WaveVista render, outerWidth=${this.outerWidth}`
				+`canvasInnerWidth=${this.canvasInnerWidth} `
				+`canvasInnerHeight=${this.canvasInnerHeight}`);
		}

		if (traceOrientation) {
			dblog(`️🏔️ about to render Orient3D orient.x=${this.orient.x} `
				+` orient.y=${this.orient.y} orient.z=${this.orient.z}`);
		}

		let pOverlay = 'no O';
		if (this.rotateMatrix && this.mainVistaRepaint) {
			pOverlay = <Orient3D
					orient={this.orient}

					setAngSetting={this.setAngSetting}
					setOneSetting={this.setOneSetting}
					setOrientAll={this.setOrientAll}
				/>;
		}

		let vista = this.makeVista();

		// the glScene is one layer.  Over that is the widget area
		// TODO: the main components of these waves, the canvas enclosure, the
		// view/vista, etc should be sections and articles and whatever else
		// shows up, instead of bland divs.
		return (
		<div className='WaveVista'
			style={{height: `${s.outerHeight}px`,
				display: (p.show3D ? 'flex' : 'none')}}
			onPointerUp={this.finishIntegration}
			onFocus={ev => console.log(`️🏔️ focus ON`)}
			ref={this.grabWaveVistaEl}>

			{vista}

			<div className='widgetArea' key='widgetArea'
						style={{flexBasis: this.canvasInnerWidth +'px',
							height: this.canvasInnerHeight + 'px'}}>

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

			</div>

		</div>
		);
	}
// />
}


export default WaveVista;

