/*
** view variable -- maintaining and attaching webgl Attribute and Uniform variables
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

let traceGLCalls = false;
let traceUniforms = false;
let traceAttributes = false;

// attr arrays and uniforms that can change on every frame.
// you can set a static value or a function that'll return it
// The set is drawing-specific.

// superclass for all of these.
export class drawingVariable {
	// the drawing is what it's used in.  Must have a:
	// gl, viewVariables array, program,
	// getFunc will AUTOMATICALLY be called before each frame to refresh the value
	constructor(varName, drawing, getFunc) {
		this.drawing = drawing;
		this.gl = drawing.gl;
		this.tagObject = drawing.tagObject;

		this.getFunc = getFunc;

		this.varName = varName;
		if (! varName || ! drawing)
			throw new Error(`bad name ${varName} or drawing ${drawing} used to create a view var`);

		let vv = drawing.viewVariables;
		if (vv.includes(this)) {
			console.error(`𒐿 duplicate variable ${varName}!!`);
			return null;
		}
		vv.push(this);

		// whichever variable this is a subclass of, constructors will need this
		// or maybe this is already done and so this is superflous?
		drawing.setDrawing();
//		gl.useProgram(drawing.program);
//		gl.bindVertexArray(drawing.vao);

		if (traceGLCalls) console.log(`𒐿 created drawingVariable '${varName}', drawing:`, drawing);
	}
}


/* ************************************************** uniforms for variables */

function isFiniteAr(value) {
	if (typeof value == 'object') {
		// they ALL must be finite
		for (let v of value) {
			if (!isFiniteAr(v))
				return false;
		}
		return true;
	}
	else
		return isFinite(value);
}

// uniforms don't vary from one vertex to another
// create this as many times as you have uniforms as input to either or both shaders
export class drawingUniform extends drawingVariable {
	constructor(varName, drawing, getFunc) {
		super(varName, drawing, getFunc);

		// this turns out to be an internal magic object
		this.uniformLoc = this.gl.getUniformLocation(this.drawing.program, varName);
		if (!this.uniformLoc) throw new Error(`Cannot find uniform loc for uniform variable ${varName}`);
		if (traceUniforms) console.log(`𒐿 created drawingUniform '${varName}'`);

		this.reloadVariable();
	}

	// set the uniform to it - upload latest value to GPU
	// call this when the uniform's value changes, to reload it into the GPU
	// actually, calls before each draw, always
	reloadVariable() {
		// is passed the previous value
		const {value, type} =  this.getFunc();
		if (traceUniforms)
			console.log(`𒐿 re-loading uniform ${this.varName} with value=${value} type ${type}`);

		// you can't pass null or undefined to webgl, but remember this
		this.value = value;
		if (null == value || !isFiniteAr(value) || null == type) {
			// this means, we won't draw this particular drawing this time around.
			// better luck next time.
			//debugger;
			//throw new Error(`𒐿 uniform variable has no value(${value}) or no type(${type})`);
			this.drawing.skipDrawing = true;
			return;
		}

		const gl = this.gl;
		this.uniformLoc = gl.getUniformLocation(this.drawing.program, this.varName);

		const method = `uniform${type}`;

		// the matrix variations have this extra argument right in the middle
		const args = [this.uniformLoc];
		if (/^Matrix/.test(type))
			args.push(false);
		args.push(value);

		// like gl.uniform4f(this.uniformLoc, value)
		gl[method].apply(gl, args);

		if (traceUniforms) {
			console.log(`𒐿 drawingUniform reloaded U variable '${this.varName}' in `);
			console.log(`            ${this.drawing.avatarLabel} uniform gl.${method}`
				+`  (${args[0].constructor.name}, ${args[1]}, ${args[2]} ) `);
		}
	}
}


/* *********************************************** attributes for arrays */
// attributes DO change from one vertex to another; each row of the attr array
// is given to the vertex shader, which crunches whatever and decides upon the
// coordinates and color for that point

// create this as many times as you have buffers as input to vec shader
// always float32.  getFunc must return a Float32TypedArray with a non-array property
// 'nTuples' that gives the number of rows or vertices used, each tupleWidth number of floats
// eg for x & y, tupleWidth=2.  sequence of several tuples gets draw, however.
export class drawingAttribute extends drawingVariable {
	constructor(varName, drawing, tupleWidth, getFunc = () => {}) {
		super(varName, drawing, getFunc);
		const gl = this.gl;
		this.tupleWidth = tupleWidth;  // num of float32s in each row/tuple
		this.drawing.setDrawing();

		// small integer indicating which attr this is.  Set by compileProgram() for each drawing in the view def
		const attrLocation = this.attrLocation = this.gl.getAttribLocation(drawing.program, varName);

		if (attrLocation < 0)
			throw new Error(`𒐿 drawingAttribute:attr loc for '${varName}' is bad: `+ attrLocation);

		// create gl GPU buffer
		const glBuffer = this.glBuffer = gl.createBuffer();
		this.tagObject(glBuffer, `${drawing.avatarLabel}-${drawing.drawingName}-${varName}-va`);

		// connect  ARRAY_BUFFER to glBuffer.  do I have to do this if I'm not (yet) attaching the JS-space array?
		gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);

		// our attribute here, connect it to that glBuffer
		gl.enableVertexAttribArray(this.attrLocation);
		gl.vertexAttribPointer(
				this.attrLocation,
				tupleWidth, gl.FLOAT,
				false, tupleWidth * 4, 0);  // normalize, stride, offset
		if (traceGLCalls) console.log(`𒐿  drawingAttribute '${this.varName}' connected to its glBuffer to tupleWidth=${tupleWidth}`);

		// we haven't touched the actual JS data yet, this does it
		this.reloadVariable();
	}

	// call this when the array's values change, to reload them into the GPU.
	// getFunc() gets past the previous array (or undefined first time)
	// must return another Float32Array (or same) with extra JS property 'nTuples'
	reloadVariable() {
		const gl = this.gl;
		this.drawing.setDrawing();

		// get the latest from the real world.
		// WebGL2Fundamentals said we don't have to do this if it's the same buffer (w/diff values) every time.
		// if I understood them correctly.  afraid to try...
		let floatArray = this.floatArray = this.getFunc();
		//if (this.floatArray !== newFloatArray) {
		//	gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
		//	gl.bufferData(gl.ARRAY_BUFFER, newFloatArray, gl.DYNAMIC_DRAW);
		//	this.floatArray  = newFloatArray;
		//}
		this.nTuples = this.floatArray.nTuples;

		// must do a bufferData() every frame now with our own personal vao?  maybe not
		gl.bufferData(gl.ARRAY_BUFFER, floatArray, gl.DYNAMIC_DRAW);

		if (traceAttributes) {
			console.log(`𒐿 drawingAttribute '${this.varName}' reloaded, ${this.nTuples}`
				+ ` tuples of ${this.tupleWidth} floats each:`);
			for (let t = 0; t < this.nTuples; t++) {
				let line = `[${t}]  `;
				for (let f = 0; f < this.tupleWidth; f++)
					line += `  ${this.floatArray[t * this.tupleWidth + f].toFixed(6)}`;
				console.log(line);
			}
		}
	}
}


