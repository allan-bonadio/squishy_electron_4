/*
** abstract View Def -- superclass for all the views, which live inside the WaveView
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

//import {abstractDrawing} from './abstractDrawing.js';


// Each abstractViewDef subclass is a definition of a kind of view; one per each kind of view.
// (A WaveView owns an instance of the def and is a React component enclosing the canvas.)

/* ****************************************  */


// This is the superclass of all view defs; with common webgl and space plumbing.
// viewName is not the viewClassName, which is one of flatViewDef, garlandView, ...
// there should be ONE of these per canvas, so each WaveView should have 1.
export class abstractViewDef {
	static displayName = 'Abstract View';

	/* ************************************************** construction */
	// viewName: personal name for the viewDef instance, for error msgs
	// canvas: real <canvas> DOM element, after it's been created by React
	// class name from instance: vu.constructor.name   from class: vuClass.name
	constructor(viewName, glview, space, avatar) {
		this.viewName = viewName;
		this.canvas = glview.canvas;
		this.gl = glview.gl
		if (! this.canvas) throw new Error(`abstractViewDef: being created without canvas`);

		this.space = space;
		this.avatar = avatar;

		// all of the drawings in this view
		// they get prepared, and drawn, in this same order
		this.drawings = [];
	}

	// the final call to set it up does all viewClassName-specific stuff
	// other subclassers override what they want
	completeView() {
		this.setShadersOnDrawings();
		this.createVariablesOnDrawings();

		// call again if canvas outer dimensions change
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

		// kick it off by drawing it once
		this.drawAllDrawings();

		// and set up interactivity
		// maybe i should get rid of this
		this.domSetupForAllDrawings(this.canvas);


		// just for curiosity's sake, pretty cool
		//curioShader(this.gl, this.vertexShader);
		//curioShader(this.gl, this.fragmentShader);
		//curioProgram(this.gl, this.program);
		//curioParameter(this.gl);
	}

	/* ************************************************** Shader Creation/Compile   NO! see abstractDrawing!! */
//	compileShader(type, srcString) {
//		const {gl} = this;
//
//		var shader = gl.createShader(type);
//		gl.shaderSource(shader, srcString);
//		gl.compileShader(shader);
//		var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
//		if (success) return shader;
//
//		// Error!
//		const msg = gl.getShaderInfoLog(shader);
//		gl.deleteShader(shader);
//		let ty = (gl.VERTEX_SHADER == type)
//			? 'vertex'
//			: (gl.FRAGMENT_SHADER == type)
//				? 'fragment'
//				: 'unknown type of';
//		throw new Error(`Error compiling ${ty} shader for ${this.viewName}: ${msg}`);
//	}

	// call this with your sources in setShaders().  NO! see abstractDrawing!!
	// must have attached vertexShaderSrc and fragmentShaderSrc already
//	compileProgram() {
//		const {gl} = this;
//
//		const program = gl.createProgram();
//
//		const vertexShader = this.compileShader(gl.VERTEX_SHADER, this.vertexShaderSrc);
//		gl.attachShader(program, vertexShader);
//		this.vertexShader = vertexShader;
//
//		const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSrc);
//		gl.attachShader(program, fragmentShader);
//		this.fragmentShader = fragmentShader;
//
//
//		gl.linkProgram(program);
//		var success = gl.getProgramParameter(program, gl.LINK_STATUS);
//		if (success) {
//			this.program = program;
//			return
//			// after this, you'll attach your viewVariables with your subclassed createVariables() method.
//		}
//
//		const msg = gl.getProgramInfoLog(program);
//		gl.deleteProgram(program);
//		throw new Error(`Error linking program for ${this.viewName}: ${msg}`);
//	}

	// this does shaders and inputs, integrating thru the list of drawings
	// they got their glsl scripts in their constructors
	setShadersOnDrawings() {
		this.drawings.forEach(drawing => {
			drawing.compileProgram();
		});
	}

	/* ************************************************** buffers & variables */

	// go and call createVariables on each of the drawings.
	// Should be done ONCE when canvas & avatar are created, or recreated.
	// NOT upon every repaint!!
	createVariablesOnDrawings() {
		this.drawings.forEach(drawing => {
			drawing.setDrawing();
			drawing.createVariables();
		});
	}

	// reload ALL the variables on this view
	// should be done once before every repaint
//	reloadAllVariables() {
//		this.drawings.forEach(drawing => {
//			drawing.setDrawing();
////			gl.useProgram(drawing.program);
////			gl.bindVertexArray(drawing.vao);
//			drawing.viewVariables.forEach(v => v.reloadVariable());
//		});
//	}

	/* ************************************************** Geometry and transformations */
	// Synch the gl viewport to the canvvas size.  call this every time the canvas resizes
	//setGlViewport() {
	//	this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
	//}

	/* ************************************************** drawing */

	// this should be made pluggable at some point...
	drawBackground() {
		const gl = this.gl;

		// solid opaque black
		// debugging ... gl.clearColor(.8, .6, .4, 1);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
	}

	drawAllDrawings() {
		// not specific to any drawing; I guess it's kindof a drawing itself
		this.drawBackground();

		this.drawings.forEach(drawing => {
			drawing.setDrawing();
			drawing.viewVariables.forEach(v => v.reloadVariable());
			drawing.draw();
		});
	}

	/* ************************************************** dom interactivity */
	// maybe i should get rid of this
	domSetupForAllDrawings(canvas) {
		this.drawings.forEach(drawing => {
			drawing.domSetup(canvas);
		});

	}

	/* ******************************************************* debugging tips  */

//	debug1() {
//		const gl = this.gl
//
//		// prints mfg and model of GPU.  yawn.
//		const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
//		const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
//		const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
//		console.log(`--- debug_renderer_info: vendor='${vendor}' renderer='${renderer}'`);
//
//		// prints src of shaders, decompiled after compilation.  Fairly interesting; not all that useful.
//		const ds = gl.getExtension('WEBGL_debug_shaders');
//		var vSrc = ds.getTranslatedShaderSource(this.vertexShader);
//		var fSrc = ds.getTranslatedShaderSource(this.fragmentShader);
//		console.log(`--- vertexShader:
//${vSrc}
//--- fragmentShader:
//${fSrc}
//`);

		// also try this URL in chrome...    chrome://web-app-internals/
		// after enabling it here: chrome://flags/#enable-webgl-draft-extensions
		// or is it heree??!?!    chrome://flags/#record-web-app-debug-info
		// firefox: webgl.enable-draft-extensions in Firefox

		// try this on flores after restarting chrome since Jun 12: chrome://memories/
		// enabled here in chrome:      chrome://flags/#memories-debug

		// cool, list all exts:
//		const available_extensions = gl.getSupportedExtensions();
//		console.log(`--- available GL extensions:\n${available_extensions.join('\n')}`);
//	}

	//static viewClassName: 'abstractViewDef';

}
/* *********************************************************** end of CFTW */

export default abstractViewDef;

