/*
** GLView -- a webgl image
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

// GLView  wraps a canvas for display.  Via webgl.
// And the Drawing and ViewDef machinery mgmt

import React from 'react';
import PropTypes from 'prop-types';

//import qe from '../engine/qe';
//import {abstractViewDef} from './abstractViewDef';
//import flatDrawingViewDef from './flatDrawingViewDef';
//import {getASetting, storeASetting} from '../utils/storeSettings';

import eAvatar from '../engine/eAvatar';
import {listOfViewClasses} from './listOfViewClasses';
//import {eSpaceCreatedPromise} from '../engine/eEngine';

let traceSetup = false;
let tracePainting = false;

// true to try v2 before v1; either or both might fail.  never tried.
let tryWebGL2 = false;
let trySRGB = false;


const tooOldMessage = `<p>
		try these, 2013 or 2014 or later:

		<p>Probably the best solution: you can get a more recent copy of
			<a href=https://www.mozilla.org/en-US/firefox/new/>Firefox</a>,
			<a href=https://www.google.com/chrome/dr/download>Google Chrome</a>,
			<a href=https://support.apple.com/downloads/safari>Safari</a>, or
			<a href=https://www.microsoft.com/en-us/edge>MS Edge</a>.

		<p>Or if you can't, you can try (desktop):

		<p>Enable WebGL in Firefox by setting the about:config preference
		webgl.enable-prototype-webgl2 to true

		<p>Enable WebGL  in Chrome by passing the "--enable-unsafe-es3-apis"
		flag when starting the browser through the command line
		OR: chrome://flags/#enable-webgl-draft-extensions in Chromium based browsers (Chrome, Opera).

		<p>Enable WebGL Safari in the "Experimental Features" developer menu
`;

function tooOldTerminate(prelim) {
	document.body.innerHTML = prelim + tooOldMessage;
	document.body.style.padding = '4em' ;
	document.body.style.fontSize = '1.5em' ;
	document.body.style.backgroundColor = '#c00' ;
	throw `So long, and thanks for all the fish!`;
}

// For each GLViiew, there's one:
// - canvas, and one gl context
// - one viewdef that encloses one or more drawings
class GLView extends React.Component {
	static propTypes = {
		viewClassName: PropTypes.string.isRequired,
		viewName: PropTypes.string,
		//returnGLFuncs: PropTypes.func.isRequired,

		width: PropTypes.number.isRequired,
		height: PropTypes.number.isRequired,

		avatar: PropTypes.instanceOf(eAvatar),  // undefined early on
		space: PropTypes.object,
	}
	static defaultProps = {
		viewName: 'gl view',
	}

	constructor(props) {
		super(props);
		this.state = {canvas: null};

		if (traceSetup) console.log(`🖼 🖼 GLView:${props.viewName}: constructor done`);
	}

	// try to set up GL1, return falsy if it can't.  Also shim the vao methods
	setupGL1() {
		let gl = this.canvas.getContext("webgl");  // gl.VERSION: 7938
		if (! gl)
			gl = this.canvas.getContext("experimental-webgl");  // really old
		if (!gl)
			return null;
		this.gl = gl;

		let vaoExt = this.vaoExt = gl.getExtension("OES_vertex_array_object");
		if (!vaoExt)
			return null;
		if (trySRGB) {
			this.srgbExt = this.srgbExt = gl.getExtension("EXT_sRGB");  // make colors brighter?
			//if (!srgbExt)
			//	return null;
		}

		// backfill these methods for consistent usage
		gl.createVertexArray = vaoExt.createVertexArrayOES.bind(vaoExt);
		gl.deleteVertexArray = vaoExt.deleteVertexArrayOES.bind(vaoExt);
		gl.bindVertexArray = vaoExt.bindVertexArrayOES.bind(vaoExt);
		return gl;
	}

	// try to set up GL2, return falsy if it can't
	setupGL2() {
		const gl = this.canvas.getContext("webgl2");
		if (!gl)
			return null;
		this.gl = gl;
		return gl;
	}

	// When you know <canvas element, pass it here.
	// Called every time canvas is created (or recreated) in a render
	setGLCanvas =
	(canvas) => {
		if (!canvas) return;  // i have no idea why this happens but we can't use the canvas

		const p = this.props;
		//const s = this.state;
		if (this.canvas === canvas)
			return;  // already done

		this.setState({canvas}, () => traceSetup &&
			console.log(`🖼 🖼 GLView ${p.viewName}: setGLCanvas set state completed`));
		this.canvas = canvas;  // immediately available

		// get the gl, figuring out which versions of GL we have, preferrinig 1 or 2
		if (tryWebGL2)
			this.setupGL2();
		if (!this.gl)
			this.setupGL1();
		if (!tryWebGL2 && !this.gl)
			this.setupGL2();
		if (!this.gl)
			tooOldTerminate(`Sorry, your browser's WebGL is kinidof old.`);

		//console.info(`gl.getSupportedExtensions: `, this.gl.getSupportedExtensions());

		//this.vao = this.gl.createVertexArray();
		canvas.glview = this;
		canvas.viewName = p.viewName;

		if (traceSetup) console.log(`🖼 🖼 GLView ${p.viewName}: setGLCanvas done`);
	}

	// must do this after the canvas AND the space exist.
	initViewClass =
	() => {
		const p = this.props;
		//const s = this.state;

		//let vClass = listOfViewClasses['abstractViewDef'];
		let vClass = listOfViewClasses[p.viewClassName];

		// MUST use the props.avatar!  we can't get it from the space, cuz which one?
		this.effectiveView = new vClass(p.viewName, this, p.space, p.avatar);
		this.effectiveView.completeView();

		// Make sure you call the new view's domSetup method.
		// i think this is redundant - completeView() also does this...
		//this.effectiveView.domSetupForAllDrawings(this.canvas);

		// now that there's an avatar, we can set these functions so everybody can use them.
		p.avatar.doRepaint = this.doRepaint;
		// intrinsic to avatar p.avatar.reStartDrawing = this.reStartDrawing;
		p.avatar.setGeometry = this.setGeometry;
		if (traceSetup) console.log(`🖼 🖼 GLView ${p.viewName} ${p.avatar.label}: done with initViewClass`);

		// BTW, since there hasn't been a doRepaint() func, I betcha it needs to be done right now.
		// never helps this.doRepaint();

	}

	// Tell the GLView & its view(s) that the wave contents have changed dramatically;
	// essentiially refilled with different numbers.  In practice, just resets
	// the avgHighest.  Passed up to a higher Component.
	//reStartDrawing =  !!! now done in eAvatar.smoothHighest
	//() => {
	//	if (this.effectiveView) {
	//		//this.effectiveView.reStartDrawing();
	//		//const curView = this.effectiveView || this.state.effectiveView;
	//		this.effectiveView.drawings.forEach(dr => dr.reStartDrawing());
	//		if (tracePainting) console.log(`🖼 🖼 GLView:${this.props.viewName} ${this.props.avatar.label}: did reStartDrawing`);
	//	}
	//}

	// repaint whole GL image.  This is not 'render' as in React;
	// this is repainting a canvas with GL.   returns an object with perf stats.
	// Returns null if it couldn't do it (eSpace promise hasn't resolved)
	setGeometry =
	() => {
		if (this.effectiveView) {
			this.effectiveView.setGeometry();
			if (tracePainting) console.log(`🖼 🖼 GLView:${this.props.viewName}  ${this.props.avatar.label} did setGeometry`);
		}
	}

	// repaint whole GL image.  This is not 'render' as in React;
	// this is repainting a canvas with GL.   returns an object with perf stats.
	// Returns null if it couldn't do it (eSpace promise hasn't resolved)
	doRepaint =
	() => {
		let p = this.props;
		if (tracePainting)
			console.log(`🖼 🖼 GLView ${p.viewName} ${p.avatar.label}: starting doRepaint`);
		if (! this.effectiveView)
			return null;  // too early

		if (tracePainting)
			p.avatar.ewave.dump(`🖼 🖼 GLView ${p.viewName}: got the ewave buffer straight`);

		// copy from latest wave to view buffer (c++) & pick up highest
		p.avatar.loadViewBuffer()
		if (tracePainting)
			p.avatar.ewave.dump(`🖼 🖼 GLView ${p.viewName}: loaded ViewBuffer`);

		this.effectiveView.reloadAllVariables();
		let endReloadVarsNBuffer = performance.now();
		if (tracePainting)
			p.avatar.dumpViewBuffer(`🖼 🖼 GLView ${p.viewName}: reloaded AllVariables`);

		// draw
		this.effectiveView.drawAllDrawings();
		let endDraw = performance.now();
		if (tracePainting)
			console.log(`🖼 🖼 GLView ${p.viewName} ${p.avatar.label}: doRepaint done drawing`);

		return {endReloadVarsNBuffer, endDraw};
		//return {endReloadVarsNBuffer, endReloadInputs, endDraw};
	}

	// this just creates the canvas
	render() {
		const p = this.props;
		//const s = this.state;
		//if (traceGLView) console.log(`🖼 🖼 GLView ${p.viewName}  ${p.avatar?.label}: about to render`);

		return (
			<canvas className='GLView'
				width={p.width} height={p.height}
				ref={ canvas => this.setGLCanvas(canvas) }
				style={{width: `${p.width}px`, height: `${p.height}px`}}
			/>
		)
	}

	componentDidMount() {
		this.componentDidUpdate();
	}

	componentDidUpdate() {
		const p = this.props;
		//const s = this.state;

		// a one-time initialization.  but upon page load, neither the avatar,
		// space or canvas are there yet.  Don't worry, when the space comes in,
		// we'll all initViewClass.
		if (traceSetup && !this.effectiveView)
			console.log(`🖼 🖼 GLView:${p.viewName}: time to init?  avatar=${p.avatar}  `+
				`space=${p.space}  canvas=${this.canvas}  effectiveView=${this.effectiveView}`);
		if (p.avatar && p.space && this.canvas && !this.effectiveView) {
			this.initViewClass();
		}
	}
}

export default GLView;

