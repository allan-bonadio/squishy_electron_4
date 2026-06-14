/*
** WaveVista -- a 3d webgl image of the quantum wave
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

// WaveVista also wraps a canvas, similar to WaveView. WaveVista is 3d and has
// completely different controls from WaveView which is 2d.  No voltage
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
import matrixGen from './matrixGen.js';
import resizeIcon from './waveViewIcons/resize.png';
import {dump4x4} from '../gl/helpers3D.js';


let traceDimensions = false;
let traceContext = false;
let traceOrientation= false;
let traceOrient = false;

let traceProjMatrix = false;
let traceOffMatrix = false;
let traceRotMatrix = false;


const round = (n) => Math.round(n, 1);

// the numerical angles are -360...+360, whether useful or not.
const d2r = Math.PI / 180;



export class WaveVista extends React.Component {
	static propTypes = {
		// the title of the view
		sceneName: PropTypes.string,

		// no!	handed in by promise space: PropTypes.instanceOf(eSpace),

		// handed in, pixels.  Width of whole WaveVista, including sidebar,
		// bumpers and border. Canvas is CANVAS_BORDER_THICKNESS pixel smaller
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
		// no!	see promise then() below  this.space = props.space;

		this.state = {
			// height of just the canvas + DOUBLE_THICKNESSpx, as set by
			// user with size box integer pixels
			outerHeight: round(getASetting('miscSettings', 'vistaHeight')),
		}

		// not in state cuz changes trigger repaint not render
		//debugger;
		this.orient = getAGroup('orientSettings');
		this.mGen = new matrixGen(this.orient)

		this.createInnerDims();	 // screen dimensions of canvas, in waveAux

		// nothing draws until this.space is filled in
		props.spaceCreatedProm.then(space => {
			this.space = space;
			this.setState({space});	 // please render cuz nothing renders without space

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


	/* ******************************************* orientation	*/

	// called when user tries to rotate it, whether pivot or orient
	// coord = x y z strings or 'multi'	  newVal is new angle around that axis or orient obj
	// pass an object, with one, two or all three


	// after angles have changed, call this to ripple it thru and
	// repaint JUST the rotation angles.  Save a microsecond :-) of cpu by
	// avoiding matrix mults.
	orientNRepaint = () => {
		this.paintingNeeds.unifiedMatrix = this.mGen.unifyMatrices();
		// wait this isn't right needs to just do orientation TODO
		if (this.mainVistaRepaint)
			this.mainVistaRepaint(this.paintingNeeds);
	}.

	// repaint, rebuilding all matrices, effecting all changes.  Do
	// this when canvas areas need to repaint & resize or other
	// Orient3D settings besides just the angles
	buildNRepaint = () => {
		this.paintingNeeds.unifiedMatrix = this.mGen.unifyMatrices();
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
			let sceneClassName = 'rgbVaneScene';
			// let sceneClassName = 'garlandScene';
			let sceneName = 'mainVista';

			if (traceRotMatrix)
				dump4x4('vista unifiedMatrix being passed to <GLScene:',
					this.paintingNeeds.unifiedMatrix);
			vista = <GLScene
				space={this.space} animator={this.animator}
				sceneName={sceneName}
				paintingNeeds={this.paintingNeeds}
				canvasInnerWidth={this.canvasInnerWidth}
				canvasInnerHeight={this.canvasInnerHeight}
				setGLRepaint={this.setMainVistaRepaint}
				sceneClassName={sceneClassName}
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
		if (this.mainVistaRepaint) {
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

