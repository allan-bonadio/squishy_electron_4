/*
** abstract Drawing -- superclass for drawing classes in webgl
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

/* superclass of all drawings.  A drawing is a piece of code that draws one thing on
a GL canvas.  It's got v&f shaders, a source of data, and a Draw function.
But it does NOT own the canvas or gl object - that's shared among all drawings on a effSceneRef.
THat's why drawings are not the same thing as Scenes: a scene has zero or more drawings.

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
		this.avatarLabel = scene.avatar.label;

		this.drawingName = drawingName;

		this.perDrawingVAO = scene.perDrawingVAO
		if (this.perDrawingVAO) {
			this.vao = this.gl.createVertexArray();
			this.tagObject(this.vao, `${this.avatarLabel}-${this.drawingName}-vao`);
		}
		else {
			this.vao = scene.vao;
		}

		this.viewVariables = [];  // vars for this drawing ONLY

		// the specific scene will put the drawing instances  into the array in its creator
	}

	/* ************************************************** Shader Creation/Compile */

	// tell GL that this is the vao and program to use
	setDrawing() {
		const gl = this.gl;
		if (!this.program || !this.vao)
			throw `in drawing: bad program=${this.program} or vao=${this.vao}`;

		gl.useProgram(this.program);
		gl.bindVertexArray(this.vao);
	}

	// compile one or the other shader; used only by compileProgram()
	compileShader(type, srcString) {
		const {gl} = this;

		let shType = (gl.VERTEX_SHADER == type)
			? 'vertex'
			: gl.FRAGMENT_SHADER == type
				? 'fragment'
				: 'unknown type ';

		let shader = gl.createShader(type);
		this.tagObject(shader, `${this.avatarLabel}-${this.drawingName}-${shType}-sh`);

		gl.shaderSource(shader, srcString);
		gl.compileShader(shader);
		var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if (success) return shader;

		// error in compilation
		const msg = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`Error compiling ${shType} shader for ${this.sceneName}: ${msg}`);
	}

	// call this with your sources in setShaders().
	// must have attached vertexShaderSrc and fragmentShaderSrc already.
	// Will set fragmentShader and vertexShader as compiled to those srcs.
	// Creates program, for use with useProgram(), if it all compiles.
	compileProgram() {
		const {gl} = this;

		// create program (and vao?) for this drawing, and put them into use
		const program = gl.createProgram();
		this.tagObject(program, `${this.avatarLabel}-${this.drawingName}-pgm`);


		const vertexShader = this.compileShader(gl.VERTEX_SHADER,
			this.vertexShaderSrc);
		gl.attachShader(program, vertexShader);
		this.vertexShader = vertexShader;

		const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER,
			this.fragmentShaderSrc);
		gl.attachShader(program, fragmentShader);
		this.fragmentShader = fragmentShader;

		gl.linkProgram(program);
		var success = gl.getProgramParameter(program, gl.LINK_STATUS);

		if (success) {
			this.program = program;
			this.setDrawing();  // is this needed?!

			if (traceAttrNames)
				this.dumpAttrNames('right after link');
			return
			// after this, you'll attach your viewVariables with your subclassed createVariables() method.
		}

		// somehow failed compile.  So, no program
		const msg = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw new Error(`Error linking program for
			${this.scene.sceneName} ${this.drawingName}: ${msg}`);
	}

	draw(width, height, specialInfo) {
		console.error(`abstract drawing draw(${width, height})`);
	}

}

export default abstractDrawing;
