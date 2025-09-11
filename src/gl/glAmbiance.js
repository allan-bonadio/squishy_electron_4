/*
** glAmbiance -- additional code & settings for doing GL drawing and etc
** Copyright (C) 2023-2025 Tactile Interactive, all rights reserved
*/

// Creates a webgl context from the canvas upon startup.  Also handles a number
// of details; choosing between webgl1 or 2, attaches shims for features in 2
// that are absent in 1, a few other things.  includes gl, canvas node, and some squirrelly code.

// webgl-lint: sigh.  TODO: get this working.  if ever.
// webgl-debug: can wrap a gl in checking code.  TODO: do this too.

// the gl Tests aren't tuned in to node_modules; use the https form for those.
// the app is fine with it, so use the regular form.
let webglLintProm;
if (typeof process == 'undefined') {
//	// no webpack; must be testRunner.html, so no node_modules
}
else {
}

let traceVersion = false;

/* *********************************************** browser-too-old error */
// TODO: there's another copy of this, I think in errors.js
// call this if the browser/machine are just way too old to support webgl
export function tooOldTerminate() {
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

/* ***************************************** actual glAmbiance class */

// create one of these for each canvas, to get the gl context, and other prep.
// Returns a promise because webgl-lint must load asynchronously.
// Promise resolves with gl, when it's all ready.
class glAmbiance {
	// this decides it - feel free to change this
	static preferWebGL2 = true;

	constructor(canvas) {
		this.canvas = canvas;
		this.attachEventHandlers();  // might return errors about context creation/loss

		if (glAmbiance.preferWebGL2)
			this.setupGL2(canvas);
		if (!this.gl)
			this.setupGL1(canvas);
		if (!glAmbiance.preferWebGL2 && !this.gl)
			this.setupGL2(canvas);
		if (!this.gl)
			tooOldTerminate();

		// caller must wait for this before it's ready to go
		if (webglLintProm) {
			this.glProm = webglLintProm
			.then(wgll => {
				// we actually don't care about the object itself, but it needs to be installed
				// webgl-lint extension, possibly imported at top of this file.
				let webglLint = this.gl.getExtension('GMAN_debug_helper');
				if (webglLint) {
					webglLint.setConfiguration({
						//maxDrawCalls: 2000,
						//failUnsetSamplerUniforms: true,
					});
					this.tagObject = webglLint.tagObject.bind(webglLint)
				}
				else {
					// production, or ext doesn't work
					this.tagObject = () => {};
				}
				return this.gl;
			})
		}
		else {
			// i just gotta put in a promise that resolves with the gl
			this.glProm = Promise.resolve(this.gl);
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

	// Watch for errors from GL.  not sure if any of these are useful - seems to
	// only address context loss; when does this happen?
	listenerFunc =
	ev => console.warn(`WebGL event '${ev.type}':`, ev);

	attachEventHandlers() {
		const c = this.canvas;
		c.addEventListener('webglcontextlost', this.listenerFunc);
		c.addEventListener('webglcontextrestored', this.listenerFunc);
		c.addEventListener('webglcontextcreationerror', this.listenerFunc);
	}
};

export default glAmbiance;
