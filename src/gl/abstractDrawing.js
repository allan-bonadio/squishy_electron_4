/*
** abstract Drawing -- superclass for drawing classes in webgl
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

//import {viewUniform, viewAttribute} from './viewVariable.js';
//import {abstractViewDef} from './abstractViewDef.js';

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
	- draw() to issue actual drawing commands after reloading variables
*/

let traceAttrNames = false;

// a superclass for  drawings,
// handles some common tasks.  For every drawing, there's a program
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
		this.tagObject = viewDef.tagObject;

		// if per-drawing, it'll be created below.  If not, use the viewdef's
		this.vao = viewDef.vao;

		this.space = viewDef.space;
		this.avatar = viewDef.avatar;
		this.avatarLabel = viewDef.avatar.label;

		// no.  viewDef does this by just setting the drawings array with the drawings it wants.  viewDef.drawings.push(this);
	}

	/* ************************************************** Shader Creation/Compile */

	// tell GL that this is the vao and program to use
	setDrawing() {
		const gl = this.gl;
		gl.useProgram(this.program);
		gl.bindVertexArray(this.vao);
	}

	// used only by compileProgram()
	compileShader(type, srcString) {
		const {gl} = this;

		let vType = (gl.VERTEX_SHADER == type)
			? 'vertex'
			: gl.FRAGMENT_SHADER == type
				? 'fragment'
				: 'unknown type ';

		let shader = gl.createShader(type);
		this.tagObject(shader, `${this.viewName}-${this.drawingName}-${vType}-sh`);

		gl.shaderSource(shader, srcString);
		gl.compileShader(shader);
		var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if (success) return shader;

		const msg = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`Error compiling ${vType} shader for ${this.viewName}: ${msg}`);
	}

	// call this with your sources in setShaders().
	// must have attached vertexShaderSrc and fragmentShaderSrc already
	// Will set fragmentShader and vertexShader as compiled to this
	// also program, for use with useProgram(), if it all compiles
	compileProgram() {
		const {gl} = this;

		// create program (and vao?) for this drawing, and put them into use
		const program = gl.createProgram();
		this.tagObject(program, `${this.viewName}-${this.drawingName}-pgm`);

		// if not per drawing, this.vao already points to viewDef's
		if (this.viewDef.perDrawingVAO) {
			this.vao = this.gl.createVertexArray();
			this.tagObject(this.vao, `${this.drawingName}-vao`);
		}

		this.setDrawing();

		const vertexShader = this.compileShader(gl.VERTEX_SHADER, this.vertexShaderSrc);
		gl.attachShader(program, vertexShader);
		this.vertexShader = vertexShader;

		const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSrc);
		gl.attachShader(program, fragmentShader);
		this.fragmentShader = fragmentShader;

		// before linking, we have to nail down attr ids.  Get stored in the vao.  Am I doing thisi right?
		//this.viewDef.attrVariableNames.forEach((name, ix) => gl.bindAttribLocation(program, ix+1, name));

		gl.linkProgram(program);
		var success = gl.getProgramParameter(program, gl.LINK_STATUS);

		if (success) {
			this.program = program;

			if (traceAttrNames)
				this.dumpAttrNames('right after link');
			return
			// after this, you'll attach your viewVariables with your subclassed createVariables() method.
		}

		// somehow failed compile.  So, no program
		const msg = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw new Error(`Error linking program for
			${this.viewDef.viewName} ${this.drawingName}: ${msg}`);
	}


	/* **************************************************  old examples */

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

}

export default abstractDrawing;
