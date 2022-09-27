/*
** abstract Drawing -- superclass for drawing classes in webgl
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import {viewUniform, viewAttribute} from './viewVariable';
//import {abstractViewDef} from './abstractViewDef';

/* superclass of all drawings.  A drawing is a piece of code that draws one thing on
a GL canvas.  It's got v&f shaders, a source of data, and a Draw function.
But it does NOT own the canvas or gl object - that's shared among all drawings on a view.
THat's why drawings are not the same thing as ViewDefs: a viewDef has zero or more drawings.

drawings must include:
- vertex and frag shaders, probably backtic strings
- a class which extends abstractDrawing and has methods:
	- class and instance names
	- setShaders() to prep the shaders
	- setInputs() to prep the variables, uniform and attr; see viewVariable.js
	- draw() to issue actual drawing commands
*/

// in addition to being a superclass for other drawings, you can use it straight, to draw a triangle for testing.
export class abstractDrawing {
	static drawingName: 'abstractDrawing';

	/* ************************************************** construction */
	// view is eg flatDrawingViewDef.  Here we add ourselves to the ViewDef list of drawings.
	constructor(view, space) {
		this.view = view;
		this.viewVariables = [];

		this.gl = view.gl;
		this.vaoExt = view.vaoExt;

		this.bufferDataDrawMode = view.bufferDataDrawMode;
		//bufferDataDrawMode = this.gl.STATIC_DRAW;

		// isn't this passed in as a separate arg?
		this.space = view.space;

		view.drawings.push(this);
	}

	/* ************************************************** Shader Creation/Compile */

	// used only by compileProgram()
	compileShader(type, srcString) {
		const {gl} = this;

		var shader = gl.createShader(type);
		gl.shaderSource(shader, srcString);
		gl.compileShader(shader);
		var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if (success) return shader;

		const msg = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		if (35633 == type) type = 'vertex';
		throw `Error compiling ${type} shader for ${this.viewName}: ${msg}`;
	}

	// call this with your sources in setShaders().
	// must have attached vertexShaderSrc and fragmentShaderSrc already
	compileProgram() {
		const {gl} = this;

		const program = gl.createProgram();

		const vertexShader = this.compileShader(gl.VERTEX_SHADER, this.vertexShaderSrc);
		gl.attachShader(program, vertexShader);
		this.vertexShader = vertexShader;

		const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSrc);
		gl.attachShader(program, fragmentShader);
		this.fragmentShader = fragmentShader;


		gl.linkProgram(program);
		var success = gl.getProgramParameter(program, gl.LINK_STATUS);
		if (success) {
			this.program = program;
			return
			// after this, you'll attach your viewVariables with your subclassed setInputs() method.
		}

		const msg = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw `Error linking program abstractDrawing for ${this.view.viewName}: ${msg}`;
	}

	/* **************************************************  test drawing */
	// these are example functions that actually work as a Drawing.  Draw one dot i think.

	// abstract supermethod: write your setShaders() function to compile your two GLSL sources
	setShaders() {
		this.vertexShaderSrc = `
		void main() {
			gl_Position = vec4(0., 0., 0., 1.);
			gl_PointSize = 10.;
		}
		`;

		this.fragmentShaderSrc = `
		precision highp float;  // does this do anything?

		void main() {
			// bright purple
			gl_FragColor = vec4(1., .5, 1., 1);
		}
		`;

		this.compileProgram();
	}

	// abstract supermethod: all drawings should write their own setInputs() method.
	// mostly, creating viewVariables that can be dynamically changed
	setInputs() {
		// gotta have at least one attr?  this is just a dummy.
		this.aPointAttr = new viewAttribute('aPoint', this);
		this.aPoint = new Float32Array([0, 0, 0., 1.]);
		this.aPointAttr.attachArray(this.aPoint, 4);

		this.aPointAttr = new viewUniform('aNumber', this);
	}


	// abstract supermethod: another dummy submethod... write yer  own
	draw() {
		const gl = this.gl;

		// dark magenta bg
		gl.clearColor(.5, 0, .5, 1.);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.useProgram(this.program);

		// one purple dot
		gl.drawArrays(gl.POINTS, 0, 1);
	}


	/* ************************************************** interactivity */
	// abstract supermethod: another dummy submethod... write yer  own
	// supposed to set click/touch/keystroke handlers and stuff
	// maybe i should get rid of this
	domSetup() {
	}
}

export default abstractDrawing;

