/*
** abstract Drawing -- superclass for drawing classes in webgl
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

/* superclass of all drawings.  A drawing is a piece of code that draws one thing on
a GL canvas.  It's got v&f shaders, a source of data, and a Draw function.
But it does NOT own the canvas or gl object - that's shared among all drawings on a scene.
THat's why drawings are not the same thing as Scenes: a scene has zero or more drawings.
Also, a canvas may alternate between scenes.

drawings must include:
- vertex and frag shaders, probably backtic strings
- a class which extends abstractDrawing and has methods:
	- drawing instance name
	- contructor sets shaders sources
	- createVariables() to prep the variables, uniform and attr; see drawingVariable.js
		Some of those automatically reload on each frame
	- draw() to issue actual drawing commands after reloading variables
*/

let traceAttrNames = false;

// a superclass for  drawings,
// handles some common tasks.  For every drawing, there's a program
export class abstractDrawing {

	/* ************************************************** construction */
	// scene is eg flatScene instance.  Here we add ourselves to the Scene list of drawings.
	// Constructor of subclasses passes in the drawingName; a literal, it isn't one of their arguments
	constructor(scene, drawingName) {
		this.scene = scene;
		this.gl = scene.gl;
		this.sceneName = scene.sceneName;
		this.tagObject = scene.tagObject;
		this.space = scene.space;
		this.avatar = scene.avatar;
		this.avatarLabel = scene.avatar?.label ?? 'no avatar';
		this.shaderTypes = {
			[this.gl.VERTEX_SHADER]: 'vertex',
			[this.gl.FRAGMENT_SHADER]: 'fragment'};

		this.drawingName = drawingName;

		this.drawVariables = [];  // vars for this drawing ONLY
	}

	/* *********************************** Shader Creation/Compile */

	// tell GL that this is the program to use.  On this gl context, till another setDrawing.
	setDrawing() {
		if (!this.program)
			throw `in drawing: bad program=${this.program}`;
		gl.useProgram(this.program);
	}

	// compile one or the other shader; used only by compileProgram()
	compileShader(type, srcString) {
		const {gl} = this;
		const shType = this.shaderTypes[type];

		let shader = gl.createShader(type);

		gl.shaderSource(shader, srcString);
		gl.compileShader(shader);
		var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

		if (success) return shader;

		// error in compilation
		let msg = gl.getShaderInfoLog(shader);
		//gl.deleteShader(shader);
		msg = `Error compiling ${shType} `
			+` shader for ${this.sceneName}: ${msg}`;
		console.error(msg);  // somehow react swallows this error sometimes
		throw new Error(msg);
	}

	// call this with your sources in setShaders().
	// must have attached vertexShaderSrc and fragmentShaderSrc already.
	// Will set fragmentShader and vertexShader as compiled to those srcs.
	// Creates program, for use with useProgram(), if it all compiles.
	compileProgram() {
		const {gl} = this;

		// create program for this drawing, and put them into use
		const program = gl.createProgram();
		let label = program.$qLabel = `${this.sceneName}-${this.drawingName}-program`;
		this.tagObject(program, label);


		const vertexShader = this.compileShader(gl.VERTEX_SHADER,
			this.vertexShaderSrc);
		gl.attachShader(program, vertexShader);
		this.vertexShader = vertexShader;
		label = vertexShader.$qLabel = `${this.sceneName}-${this.drawingName}-vshader`;
		this.tagObject(vertexShader, label);

		const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER,
			this.fragmentShaderSrc);
		gl.attachShader(program, fragmentShader);
		this.fragmentShader = fragmentShader;
		label = fragmentShader.$qLabel = `${this.sceneName}-${this.drawingName}-fshader`;
		this.tagObject(fragmentShader, label);

		gl.linkProgram(program);
		if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
			this.program = program;
			this.setDrawing();  // is this needed?!

			if (traceAttrNames)
				this.dumpAttrNames('right after link');
			return
			// after this, you'll attach your drawVariables with your subclassed createVariables() method.
		}

		// somehow failed compile.  So, no program
		const msg = gl.getProgramInfoLog(program);
		//gl.deleteProgram(program);
		throw new Error(`Error linking program for
			${this.sceneName} ${this.drawingName}: ${msg}`);
	}

	draw(width, height, specialInfo) {
		throw new Error(`cannot draw abstract drawing scene ${this.sceneName} `
			+` drawing ${this.drawingName}`);
	}

}

export default abstractDrawing;
