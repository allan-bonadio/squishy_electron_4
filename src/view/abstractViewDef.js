/*
** abstract View Def -- superclass for all the views, which live inside the WaveView
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
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
		// what does this do?  Variables shared between drawings?  I don't think so.////
		//No!! none  this.viewVariables = [];

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

	// preliminary construction, called in constructor
//	initCanvas() {
//		//let gl = this.gl = this.canvas.getContext("webgl");
//		//if (! gl)
//		//	gl = this.gl = this.canvas.getContext("experimental-webgl");  // really old
//		//
//		//
//		//if (!gl) throw new Error(`Sorry this browser doesn't do WebGL!  You might be able to turn it on ...`);
//		//this.gl = gl;
//
//		/* If your browser doesn't do GL at first glance:
//
//		Can be enabled in Firefox by setting the about:config preference
//		webgl.enable-prototype-webgl2 to true
//
//		Can be enabled in Chrome by passing the "--enable-unsafe-es3-apis"
//		flag when starting the browser through the command line
//		OR: chrome://flags/#enable-webgl-draft-extensions in Chromium based browsers (Chrome, Opera).
//
//		Safari: Can be enabled in the "Experimental Features" developer menu
//		navigator.userAgent =>
//		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36"
//		navigator.userAgentData =>
//			NavigatorUAData {brands: Array(3), mobile: false}
//			NavigatorUAData
//			brands: Array(3)
//			0: {brand: " Not A;Brand", version: "99"}
//			1: {brand: "Chromium", version: "90"}
//			2: {brand: "Google Chrome", version: "90"}
//			length: 3
//			__proto__: Array(0)
//			mobile: false
//		*/
//	}

	// the final call to set it up does all viewClassName-specific stuff
	// other subclassers override what they want
	completeView() {
		this.setShadersOnDrawings();
		this.createVariablesOnDrawings();

		this.setGeometry();  // call again if canvas outer dimensions change

		// kick it off by drawing it once
		this.drawAllDrawings();

		// and set up interactivity
		// maybe i should get rid of this
		this.domSetupForAllDrawings(this.canvas);


		// just for curiosity's sake
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

	// this does shaders and inputs, iterating thru the list of drawings
	// they got their glsl scripts in their constructors
	setShadersOnDrawings() {
		//console.log('setShadersOnDrawings drawings', this.drawings);
		//console.dir(this.drawings);
		this.drawings.forEach(drawing => {
			//drawing.setShaders();
			drawing.compileProgram();
			//this.gl.useProgram(this.program);  // should be the only time I do useProgram()?
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
	// abstract supermethod: another dummy submethod... write yer  own
	// is this really needed?  seems like it can be omitted...
	// no, call this every time the canvas resizes
	setGeometry() {

		// yeah i think it automatically defaults to all these so we can remove this...?
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
	}

	/* ************************************************** drawing */

	// this should be made pluggable at some point...
	drawBackground() {
		const gl = this.gl;

		// solid opaque black
		//gl.clearColor(.8, .6, .4, 1);
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

	//
	// 	// abstract supermethod: another dummy submethod... write yer  own
	// 	originaDraw() {
	// 		const gl = this.gl;
	//
	// 		gl.clearColor(0, 0, 0, 0);
	// 		gl.clear(gl.COLOR_BUFFER_BIT);
	//
	// 		gl.useProgram(this.program);
	//
	// 		//this.vaoExt.bindVertexArrayOES(this.vao);
	// 		//this.cornerAttr.reloadVariable()
	//
	// 		const primitiveType = gl.TRIANGLES;
	// 		const offset = 0;
	// 		const count = 3;
	// 		gl.drawArrays(primitiveType, offset, count);
	// 	}

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

	/* ********************************************************************************************************  */
	/* ************************************************** you can ignore the rest except for the very bottom */
	/* ********************************************************************************************************  */
	/* ************************************* crawling out of the wreckage */
	// pass in the actual DOM element.
	// do EXACTLY THE SAME as
	// https://webgl2fundamentals.org/webgl/lessons/webgl-fundamentals.html
//	static crawlFromTheWreckage(canvas) {
//		let vd = new abstractViewDef('crawlFromTheWreckage', canvas);
//		vd.cftw(canvas);
//	}
//
//	//CFTW - crawl from the wreckage - the result of some disaster where i couldn't get gl going again...
//	cftw(canvas) {
//		var gl;
//		if (false) {
//			// do gregg's  original code
//			gl = canvas.getContext("webgl2");
//			if (!gl) throw 'no webgl2 for you!';
//		}
//		else {
//			// integrate my version of the truth
//			gl = this.gl;
//		}
//
//
//		/* ==================  shaders */
//		var vertexShaderSource, fragmentShaderSource, vertexShader, fragmentShader, program;
//		if (false) {
//			vertexShaderSource = `
//
//			// an attribute is an input (in) to a vertex shader.
//			// It will receive data from a vBuffer
//			attribute vec4 corner;
//			uniform cornerColor;
//			varying color;
//
//			// all shaders have a main function
//			void main() {
//
//			  // gl_Position is a special variable a vertex shader
//			  // is responsible for setting
//			  gl_Position = corner;
//			  color = cornerColor;
//			}
//			`;
//
//
////CFTW
//			fragmentShaderSource = `
//
//			// fragment shaders don't have a default precision so we need
//			// to pick one. highp is a good default. It means "high precision"
//			precision highp float;
//			varying vec4 color;
//			void main() {
//			  // Just set the output to a constant reddish-purple
//			  gl_FragColor = color;
//			}
//			`;
//
//
//			function createShader(gl, type, source) {
//			  var shader = gl.createShader(type);
//			  gl.shaderSource(shader, source);
//			  gl.compileShader(shader);
//			  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
//			  if (success) {
//				return shader;
//			  }
//
//			  console.log(gl.getShaderInfoLog(shader));
//			  gl.deleteShader(shader);
//			}
//
//
//			vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
//			fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
//
//			function createProgram(gl, vertexShader, fragmentShader) {
//			  program = gl.createProgram();
//			  gl.attachShader(program, vertexShader);
//			  gl.attachShader(program, fragmentShader);
//			  gl.linkProgram(program);
//			  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
//			  if (success) {
//				return program;
//			  }
//
//			  console.log(gl.getProgramInfoLog(program));
//			  gl.deleteProgram(program);
//			}
//
//
////CFTW
//			program = createProgram(gl, vertexShader, fragmentShader);
//		}
//		else {
//
////			this.compileProgram(proxyVertexShader, proxyFragmentShader);
//			program = this.program;
//			vertexShader = this.vertexShader;
//			fragmentShader = this.fragmentShader;
//		}
//
//
//
//
//
//
//		/* ==================  attrs */
//
////CFTW
//		var positionAttributeLocation, positionBuffer, positions;
//		if (false) {
//
//			positionAttributeLocation = gl.getAttribLocation(program, "corner");
//
//			positionBuffer = gl.createBuffer();
//
//			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
//
//			// three 2d points
//			positions = [
//			  0, 0,
//			  0, 0.5,
//			  0.7, 0,
//			];
//			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
//
//			//vao = this.vaoExt.createVertexArrayOES();
//			//this.vaoExt.bindVertexArrayOES(vao);
//
//			// is this a VAO function?  Does it do anything in webgl1?
//			gl.enableVertexAttribArray(positionAttributeLocation);
//
//			var size = 2;          // 2 components per iteration
//			var type = gl.FLOAT;   // the data is 32bit floats
//			var normalize = false; // don't normalize the data
//			var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
//			var offset = 0;        // start at the beginning of the vBuffer
//			// is this a VAO function?  Does it do anything in webgl1?
//			gl.vertexAttribPointer(
//				positionAttributeLocation, size, type, normalize, stride, offset)
//		}
//		else {
//			this.createVariables();
//			positionAttributeLocation = this.viewVariables[0].attrLocation;
//			positionBuffer = this.viewVariables[0].glBuffer;
//			//vao = this.viewVariables[0].vao;
//		}
//
//
////CFTW
//
//
//
//		/* ==================  viewport */
//		if (false) {
//			// we don't need thid do we??
//			//webglUtils.resizeCanvasToDisplaySize(gl.canvas);
//
//			gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
//		}
//		else {
//			this.setGeometry();
//		}
//
//		/* ==================  draw */
//		if (false) {
//			// Clear the canvas
//			gl.clearColor(0, 0, 0, 0);
//			gl.clear(gl.COLOR_BUFFER_BIT);
//
//			// Tell it to use our program (pair of shaders)
//			//gl.useProgram(program);
//
//			// Bind the attribute/vBuffer set we want. ... again?
//			//this.vaoExt.bindVertexArrayOES(vao);
//
//
//			var primitiveType = gl.TRIANGLES;
//			var off = 0;
//			var count = 3;
//			gl.drawArrays(primitiveType, off, count);
//
//		}
//		else {
//			this.draw()
//		}
//	}

//CFTW end
}
/* *********************************************************** end of CFTW */

export default abstractViewDef;

