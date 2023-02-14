/*
** glAux -- additional code for GLView shared  with testsRunner.html
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

// go thru this kicking and screaming cuz the tests aren't tuned in to node_modules
//import 'webgl-lint';
import 'https://greggman.github.io/webgl-lint/webgl-lint.js';

//import {tooOldTerminate} from '../utils/errors.js';

let traceVersion = true;

/* ********************************************************** too old error */

// call this if the browser/machine are just way too old to support the stuff we use:
// what = 'WebGL' at least v1, 'WebAssembly', dedicated 'WebWorkers', ...
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

/* ********************************************************** actual glAux class */

class glAux {
	// this decides it
	static preferWebGL2 = true;

	constructor(canvas) {
		this.canvas = canvas;

		if (glAux.preferWebGL2)
			this.setupGL2(canvas);
		if (!this.gl)
			this.setupGL1(canvas);
		if (!glAux.preferWebGL2 && !this.gl)
			this.setupGL2(canvas);
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
		if (traceVersion)
			console.log(`enabled WebGL 2`);
		return gl;
	}


};


export default glAux;

