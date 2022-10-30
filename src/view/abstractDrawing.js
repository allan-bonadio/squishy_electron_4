/*
** abstract Drawing -- superclass for drawing classes in webgl
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

//import {viewUniform, viewAttribute} from './viewVariable';
//import {abstractViewDef} from './abstractViewDef';

/* superclass of all drawings.  A drawing is a piece of code that draws one thing on
a GL canvas.  It's got v&f shaders, a source of data, and a Draw function.
But it does NOT own the canvas or gl object - that's shared among all drawings on a view.
THat's why drawings are not the same thing as ViewDefs: a viewDef has zero or more drawings.

drawings must include:
- vertex and frag shaders, probably backtic strings
- a class which extends abstractDrawing and has methods:
	- drawing instance name
	- contructor sets shaders sources
	- createVariables() to prep the variables, uniform and attr; see viewVariable.js
		Some of those automatically reload on each frame
	- reloadAllVariables()  in abs viewDef should call reloadVariable() on each without drawing have to intervene
	- draw() to issue actual drawing commands
*/

// in addition to being a superclass for other drawings, you can use it straight, to draw a triangle for testing.
export class abstractDrawing {

	/* ************************************************** construction */
	// viewDef is eg flatDrawingViewDef instance.  Here we add ourselves to the ViewDef list of drawings.
	// Constructor of subclasses passes in the drawingName; a literal, it isn't one of their arguments
	constructor(viewDef, drawingName) {
		this.viewDef = viewDef;
		this.viewName = viewDef.viewName;
		this.drawingName = drawingName;

		this.viewVariables = [];  // vars for this drawing ONLY

		this.gl = viewDef.gl;
		//this.vaoExt = viewDef.vaoExt;

		//this.bufferDataDrawMode = viewDef.bufferDataDrawMode;
		//bufferDataDrawMode = this.gl.STATIC_DRAW;

		this.space = viewDef.space;
		this.avatar = viewDef.avatar;
		this.avatarLabel = viewDef.avatar.label;

		// no.  viewDef does this by just setting the drawings array with the drawings it wants.  viewDef.drawings.push(this);
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
		throw new Error(`Error compiling ${type} shader for ${this.viewName}: ${msg}`);
	}

	// call this with your sources in setShaders().
	// must have attached vertexShaderSrc and fragmentShaderSrc already
	// Will set fragmentShader and vertexShader as compiled to this
	// also program, for use with useProgram(), if it all compiles
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
			// after this, you'll attach your viewVariables with your subclassed createVariables() method.
		}

		// somehow failed compile.  So, no program
		const msg = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw new Error(`Error linking program abstractDrawing for ${this.viewDef.viewName}: ${msg}`);
	}

	/* **************************************************  old examples */
	// these are example functions that actually work as a Drawing.  Draw one dot i think.

	// abstract supermethod: write your setShaders() function to compile your two GLSL sources
//	setShaders() {
//		this.vertexShaderSrc = `
//		void main() {
//			gl_Position = vec4(0., 0., 0., 1.);
//			gl_PointSize = 10.;
//		}
//		`;
//
//		this.fragmentShaderSrc = `
//		precision highp float;
//
//		void main() {
//			// bright purple
//			gl_FragColor = vec4(1., .5, 1., 1);
//		}
//		`;
//
//		this.compileProgram();
//	}

	// abstract supermethod: all drawings should write their own createVariables() method.
	// mostly, creating viewVariables that can be dynamically changed.
	// called 1ce at view init.  It will set up callbacks to set new values
	// see viewVariable for routines to make unis and attrs
//	createVariables() {
//		// gotta have at least one attr?  this is just a dummy.
//		this.aPointAttr = new viewAttribute('aPoint', this);
//		this.aPoint = new Float32Array([0, 0, 0., 1.]);
//		this.aPointAttr.attachArray(this.aPoint, 4);
//
//		this.aPointAttr = new viewUniform('aNumber', this);
//	}


	// abstract supermethod: another dummy submethod... write yer  own
//	draw() {
//		const gl = this.gl;
//
//		// dark magenta bg
//		gl.clearColor(.5, 0, .5, 1.);
//		gl.clear(gl.COLOR_BUFFER_BIT);
//
//		//gl.useProgram(this.program);  // not needed viewdef does this
//
//		// one purple dot
//		gl.drawArrays(gl.POINTS, 0, 1);
//	}


	/* ************************************************** interactivity */
	// abstract supermethod: another dummy submethod... write yer  own
	// supposed to set click/touch/keystroke handlers and stuff
	// maybe i should get rid of this
	domSetup() {
	}
}

export default abstractDrawing;
