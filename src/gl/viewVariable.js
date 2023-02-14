/*
** view variable -- maintaining and attaching webgl Attribute and Uniform variables
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

let traceGLCalls = false;
let traceUniforms = false;
let traceAttributes = true;

// attr arrays and uniforms that can change on every frame.
// you can set a static value or a function that'll return it

// superclass for all of these.
export class viewVariable {
	// the drawing is the view or the drawing it's used in.  Must have a:
	// gl, viewVariables array, program,
	// getFunc will be called before each frame to refresh the value
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

		if (traceGLCalls) console.log(`𒐿 created viewVariable '${varName}', drawing:`, drawing);
	}
}


/* ************************************************** uniforms for variables */

// uniforms don't vary from one vertex to another
// create this as many times as you have uniforms as input to either or both shaders
export class viewUniform extends viewVariable {
	constructor(varName, drawing, getFunc) {
		super(varName, drawing, getFunc);

		// this turns out to be an internal magic object
		this.uniformLoc = this.gl.getUniformLocation(this.drawing.program, varName);
		if (!this.uniformLoc) throw new Error(`Cannot find uniform loc for uniform variable ${varName}`);
		if (traceUniforms) console.log(`𒐿 created viewUniform '${varName}'`);

		this.reloadVariable();
	}

	// change the value, sortof, by one of these two ways:
	// - changing the function that returns it.  Pass function in.
	//         the func should return an object eg {value:1.234, type:'1f'}
	// - just setting the static Value.  Set any non-function value, and a type.
	// types you can use: 1f=1 float single.  1i=1 int 32 bit.
	// 2fv, 3fv, 4fv=vec2, 3, 4; Must pass in an array value if type includes 'v'.
	// must return in an array value, typed or not.  Same for 2iv, etc.
	// Matrix2fv, 3, 4: square matrices, col major order.  must be typed!
	// there are non-square variants, but only in webgl2
//	setValue(valueVar, type) {
//		if (typeof valueVar == 'function') {
//			this.getFunc = valueVar;
//			this.staticValue = this.staticType = undefined;
//			if (traceUniforms) console.log(`𒐿 set function value on viewUniform '${this.varName}'`);
//		}
//		else {
//			this.staticValue = valueVar;
//			this.staticType = type;
//			this.getFunc = undefined;
//			if (traceUniforms) console.log(`𒐿 set static value ${valueVar} type ${type} on viewUniform '${this.varName}'`);
//		}
//		this.reloadVariable();
//	}

	// set the uniform to it - upload latest value to GPU
	// call this when the uniform's value changes, to reload it into the GPU
	// actually, calls before each draw, always
	reloadVariable() {
		// is passed the previous value
		const {value, type} =  this.getFunc(this.value);
		if (traceUniforms) console.log(
			`𒐿 re-loading uniform ${this.varName} with value=${value} type ${type}`);

		// you can't pass null or undefined
		if (null == value || null == type)
			throw new Error(`𒐿 uniform variable has no value(${value}) or no type(${type})`);
		this.value = value;

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
			console.log(`𒐿 viewUniform reloaded U variable '${this.varName}' in `+
				`${this.drawing.avatarLabel} like:   gl.${method}(${args.map(a => a + ', ')})`);
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
export class viewAttribute extends viewVariable {
	constructor(varName, drawing, tupleWidth, getFunc = () => {}) {
		super(varName, drawing, getFunc);
		const gl = this.gl;
		this.tupleWidth = tupleWidth;  // num of float32s in each row/tuple

		// small integer indicating which attr this is.  Set by compileProgram() for each drawing in the view def
		const attrLocation = this.attrLocation = this.gl.getAttribLocation(drawing.program, varName);

		if (attrLocation < 0)
			throw new Error(`𒐿 viewAttribute:attr loc for '${varName}' is bad: `+ attrLocation);

		// attach GPU buffer to our GL
		const glBuffer = this.glBuffer = gl.createBuffer();
		this.tagObject(glBuffer, `${drawing.avatarLabel}-${drawing.drawingName}-${varName}-va`);

		gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
		gl.enableVertexAttribArray(this.attrLocation);

		gl.vertexAttribPointer(
				this.attrLocation,
				tupleWidth, gl.FLOAT,
				false, tupleWidth * 4, 0);  // normalize, stride, offset

		if (traceGLCalls) console.log(`𒐿  viewAttribute '${this.varName}' set to tupleWidth=${tupleWidth}`);

		this.reloadVariable();
	}

	// call this when the array's values change, to reload them into the GPU.
	// getFunc() gets past the previous array (or undefined first time)
	// must return another Float32Array (or same) with JS property 'nTuples'
	reloadVariable() {
		const gl = this.gl;

		// get the latest
		let floatArray = this.floatArray = this.getFunc();
		this.nTuples = floatArray.nTuples

		this.drawing.setDrawing();

		// must do a bufferData() every frame now with our own personal vao?
		gl.bufferData(gl.ARRAY_BUFFER, floatArray, gl.DYNAMIC_DRAW);

		if (traceAttributes) {
			console.log(`𒐿 viewAttribute '${this.varName}' reloaded, ${this.nTuples} tuples of ${this.tupleWidth} floats each:`);
			for (let t = 0; t < this.nTuples; t++) {
				let line = `[${t}]  `;
				for (let f = 0; f < this.tupleWidth; f++)
					line += `  ${floatArray[t * this.tupleWidth + f].toFixed(6)}`;
				console.log(line);
			}
		}
	}
}


