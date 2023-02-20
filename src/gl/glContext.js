/*
** glContext -- additional code for GLView shared  with testsRunner.html
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

// this should be renamed to 'glContext' or similar

// webgl-lint: sigh.
// the gl Tests aren't tuned in to node_modules; use the https form for those.
// the app is fine with it, so use the regular form.
// Or comment out both, to disable webgl-lint entirely.
import 'webgl-lint';
//import 'https://greggman.github.io/webgl-lint/webgl-lint.js';

//import {tooOldTerminate} from '../utils/errors.js';

let traceVersion = false;

/* ********************************************************** too old error */

// call this if the browser/machine are just way too old to support webgl
export function tooOldTerminate(what) {
	let tooOldMessage = `Sorry, your browser is too old for WebGL.
		That's really really old!!
		Probably the best solution is to get a more recent browser.`;
	let b = document.body;
	b.innerHTML = tooOldMessage;
	b.style.backgroundColor = '#f88' ;
	b.style.color = '#000' ;
	b.style.padding = '4em' ;
	throw `So long, and thanks for all the fish!`;
}

/* ********************************************************** actual glContext class */

// create one of these for each canvas, to get the gl context, and other prep.
class glContext {
	// this decides it - feel free to change this
	static preferWebGL2 = true;

	constructor(canvas) {
		this.canvas = canvas;
		this.attachEventHandlers();  // might return errors about context creation/loss

		if (glContext.preferWebGL2)
			this.setupGL2(canvas);
		if (!this.gl)
			this.setupGL1(canvas);
		if (!glContext.preferWebGL2 && !this.gl)
			this.setupGL2(canvas);
		if (!this.gl)
			tooOldTerminate(`Sorry, your browser's WebGL is kinidof old.`);

		// webgl-lint extension, needs import at top of this file.  Otherwise,
		// getExtension returns null and tagObject() is an empty function, so no probs.
		let webglLint = this.webglLint = window.isDevel && this.gl.getExtension('GMAN_debug_helper');
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
		this.WebGLVersion = 1;
		if (traceVersion)
			console.log(`enabled original WebGL 1`);
		return gl;
	}

	// try to set up GL2, return falsy if it can't
	setupGL2() {
		const gl = this.canvas.getContext("webgl2");
		if (!gl)
			return null;
		this.gl = gl;
		this.WebGLVersion = 2;
		if (traceVersion)
			console.log(`enabled WebGL 2`);
		return gl;
	}

	// not sure if any of these are useful - seems to only address context loss; when does this happen?
	listenerFunc =
	ev => console.warn(`WebGL event '${ev.type}':`, ev);

	attachEventHandlers() {
		const c = this.canvas;
		c.addEventListener('webglcontextlost', this.listenerFunc);
		c.addEventListener('webglcontextrestored', this.listenerFunc);
		c.addEventListener('webglcontextcreationerror', this.listenerFunc);
	}
};


export default glContext;
