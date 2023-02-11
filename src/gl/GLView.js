/*
** GLView -- a webgl image
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

// GLView  wraps a canvas for display.  Via webgl.
// And the Drawing and ViewDef machinery mgmt

import React from 'react';
import PropTypes from 'prop-types';

// is this how you do it?
import 'webgl-lint';

import {listOfViewClasses} from './listOfViewClasses.js';
//import {eSpaceCreatedPromise} from '../engine/eEngine.js';
import {tooOldTerminate} from '../utils/errors.js';

let traceSetup = false;
let tracePainting = false;
let traceGeometry = false;

// true to try v2 before v1; false for v1 before v2
// either or both might fail.
let tryWebGL2 = true;

// For each GLView, there's one:
// - canvas, and one gl context
// - one viewdef that encloses one or more drawings
class GLView extends React.Component {
	static propTypes = {
		viewClassName: PropTypes.string.isRequired,
		viewName: PropTypes.string,

		// lets try this with plain old CSS and let the containers dictate sizes
		width: PropTypes.number,
		height: PropTypes.number,

		// both undefined early on
		avatar: PropTypes.object,
		space: PropTypes.object,

		// the width and height we measure
		canvasFacts: PropTypes.object.isRequired,
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

		// notin webgl1, avail as an extention
		let vaoExt = this.vaoExt = gl.getExtension("OES_vertex_array_object");
		if (!vaoExt)
			return null;

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

		// webgl-lint extension, needs import at top of this file
		let webglLint = this.webglLint = this.gl.getExtension('GMAN_debug_helper');
		if (webglLint) {
			webglLint.setConfiguration({
				maxDrawCalls: 2000,
				failUnsetSamplerUniforms: true,
			});
			this.tagObject = webglLint.tagObject.bind(webglLint)
		}
		else {
			// ext doesn't work i guess
			this.tagObject = () => {};
		}

		canvas.glview = this;
		canvas.viewName = p.viewName;

		if (traceSetup) console.log(`🖼 🖼 GLView ${p.viewName}: setGLCanvas done`);
	}

	// must do this after the canvas AND the space exist.
	initViewClass =
	() => {
		const p = this.props;

		let vClass = listOfViewClasses[p.viewClassName];

		// MUST use the props.avatar!  we can't get it from the space, cuz which one?
		this.effectiveView = new vClass(p.viewName, this, p.space, p.avatar);
		this.effectiveView.completeView();

		// now that there's an avatar, we can set these functions so everybody can use them.
		p.avatar.doRepaint = this.doRepaint;
		// intrinsic to avatar p.avatar.reStartDrawing = this.reStartDrawing;
		//p.avatar.setGlViewport = this.setGlViewport;
		if (traceSetup) console.log(`🖼 🖼 GLView ${p.viewName} ${p.avatar.label}: done with initViewClass`);

		// BTW, since there hasn't been a doRepaint() func, I betcha it needs to be done right now.
		// never helps this.doRepaint();

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
			p.avatar.ewave.dump(`🖼 🖼 GLView ${p.viewName}: got the ewave right here`);

		// copy from latest wave to view buffer (c++) & pick up highest
		p.avatar.loadViewBuffer()
		if (tracePainting)
			p.avatar.dumpViewBuffer(`🖼 🖼 GLView ${p.viewName}: loaded ViewBuffer`);

		// NO!  now done before drawing each drawing individually this.effectiveView.reloadAllVariables();
		let endReloadVarsNBuffer = performance.now();

		// draw
		this.effectiveView.drawAllDrawings();
		let endDraw = performance.now();
		if (tracePainting)
			console.log(`🖼 🖼 GLView ${p.viewName} ${p.avatar.label}: doRepaint done drawing`);

		return {endReloadVarsNBuffer, endDraw};
	}

	// this just creates the canvas
	render() {
		const p = this.props;
		//const s = this.state;

		if (traceGeometry) {
			// facts are filled in in componentDidUpdate() so the first render, tehre's none
			let facts = p.canvasFacts;
			console.log(`🖼 🖼 GLV rend '${p.viewName}': canvas=${this.canvas?.nodeName}
				Facts.width: ${facts.width}      Facts.height: ${facts.height}`);
			console.log(`🖼 🖼 BUT:  canvas.parent.clientWidth: ${this.canvas?.parentNode?.clientWidth ?? 'no canv'}`);
		}

		// the canvas w&h attributes define its inner coord system
		// We want them to reflect actual pixels on the screen; should be same as client W&H
		// offset outer W&H includes borders, 1px on all sides
		let cWidth = p.width - 2, cHeight = p.height - 2;
		if (this.canvas) {
			cWidth = this.canvas.clientWidth;
			cHeight = this.canvas.clientHeight;
			//let cRect = this.canvas.getBoundingClientRect();
			//cWidth = cRect.width;
			//cHeight = cRect.height;
		}

		// but we override the size with CSS here.  Ultimately, bounding width will change to p.width
		return (
			<canvas className='GLView'
				width={cWidth} height={cHeight}
				ref={ canvas => this.setGLCanvas(canvas) }
			/>
		)
		// took out style={{width: `${p.width}px`, height: `${p.height}px`}}
	}

	componentDidUpdate() {
		const p = this.props;
		//const s = this.state;

		if (this.canvas) {
			// do this only when the dust has settled, other parts of the code depend on canvasFacts
			//let cRect = this.canvas.getBoundingClientRect();
			p.canvasFacts.width = this.canvas.clientWidth;
			p.canvasFacts.height = this.canvas.clientHeight;
		}
		else
			console.warn(`oops no canvas in GLView.componentDidUpdate()`)

		// a one-time initialization.  but upon page load, neither the avatar,
		// space or canvas are there yet.  Don't worry, when the space comes in,
		// we'll all initViewClass.
		if (traceSetup && !this.effectiveView) {
			console.log(`🖼 🖼 GLView:${p.viewName}: time to init?  avatar=${p.avatar?.label}  `+
				`space=${p.space?.nPoints}  canvas=${this.canvas?.nodeName}  `+
				`effectiveView=${this.effectiveView?.viewName}`);
		}
		if (p.avatar && p.space && this.canvas && !this.effectiveView) {
			this.initViewClass();
		}
	}
}

export default GLView;

