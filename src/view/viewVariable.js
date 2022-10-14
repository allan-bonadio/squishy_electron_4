/*
** view variable -- maintaining and attaching webgl Attribute and Uniform variables
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

let traceGLCalls = true;

// attr arrays and uniforms that can change on every frame.
// you can set a static value or a function that'll return it

// superclass for all of these.
export class viewVariable {
	// the owner is the view or the drawing it's used in.  Must have a:
	// gl, vaoExt, viewVariables array, bufferDataDrawMode enum
	// program,
	constructor(varName, owner) {
		this.owner = owner;
		this.gl = owner.gl;
		//this.vaoExt = owner.vaoExt;

		this.varName = varName;
		if (! varName || ! owner) throw new Error(`bad name${!varName} or owner${!owner} used to create a view var`);

		// both views and drawings often have this array, so 'owner' might not be a view
		let vv = owner.viewVariables;
		if (vv.includes(this)) {
			console.error(`duplicate variable ${varName}!!`);
			return null;  // thisis a duplicate, why?
		}
		vv.push(this);

		this.bufferDataDrawMode = owner.bufferDataDrawMode;
		if (traceGLCalls) console.log(`created viewVariable '${varName}', owner:`, owner);
	}
}


/* ************************************************** uniforms for variables */

// uniforms don't vary from one vertex to another
// create this as many times as you have uniforms as input to either or both shaders
export class viewUniform extends viewVariable {
	constructor(varName, owner) {
		super(varName, owner);

		//function that will get value
		//from wherever and return it.
		//if (typeof getFunc == 'function')
		//this.valueVar = getFunc;

		// this turns out to be an internal magic object
		this.uniformLoc = this.gl.getUniformLocation(this.owner.program, varName);
		if (!this.uniformLoc) throw new Error(`Cannot find uniform loc for uniform variable ${varName}`);
		if (traceGLCalls) console.log(`created viewUniform '${varName}'`);
	}

	// change the value, sortof, by one of these two ways:
	// - changing the function that returns it.  Pass function in.
	//         the func should return an object eg {value=1.234, type='1f'}
	// - just setting the static Value.  Pass in any non-function value, and a type.
	// types you can use: 1f=1 float single.  1i=1 int 32 bit.
	// 2fv, 3fv, 4fv=vec2, 3, 4; Must pass in an array value if type includes 'v'.
	// must return in an array value, typed or not.  Same for 2iv, etc.
	// Matrix2fv, 3, 4: square matrices, col major order.  must be typed!
	// there are non-square variants, but only in webgl2
	setValue(valueVar, type) {
		if (typeof valueVar == 'function') {
			this.getFunc = valueVar;
			this.staticValue = this.staticType = undefined;
			if (traceGLCalls) console.log(`set function value on viewUniform '${this.varName}'`);
		}
		else {
			this.staticValue = valueVar;
			this.staticType = type;
			this.getFunc = undefined;
			if (traceGLCalls) console.log(`set static value ${valueVar} on viewUniform '${this.varName}'`);
		}
		this.reloadVariable();
	}

	// set the uniform to it - upload latest value to GPU
	// call this when the uniform's value changes, to reload it into the GPU
	// call abstractViewDef::reloadAllVariables() for all
	reloadVariable() {
		let value = this.staticValue;
		let type = this.staticType;
		if (this.getFunc) {
			const v = this.getFunc();
			value = v.value;
			type = v.type;
		}

		// you can't pass null or undefined
		if (null == value || null == type)
			throw new Error(`uniform variable has no value(${value}) or no type(${type})`);
		const gl = this.gl;
		const pgm = this.owner.program;

		//gl.useProgram(pgm);  // a Gain?

		// do i have to do this again?
		this.uniformLoc = gl.getUniformLocation(pgm, this.varName);

		const method = `uniform${type}`;

		// the matrix variations have this extra argument right in the middle
		const args = [this.uniformLoc];
		if (/^Matrix/.test(type))
			args.push(false);
		args.push(value);

		//console.log(`reload Uniform variable ${this.varName} with `+
		//	` method gl.${method}() with these args:`, args);

		//gl.useProgram(pgm);  // a Gain?

		gl[method].apply(gl, args);  // wish me luck

		if (traceGLCalls) console.log(`viewUniform.reloadVariable '${this.varName}' to:`, args);

		//this.gl.uniform1f(this.uniformLoc, value);
		//this.gl.uniform1i(this.uniformLoc, value);
	}
}

/* *********************************************** attributes for arrays */
// attributes DO change from one vertex to another; each row of the attr array
// is given to the vertex shader, which crunches whatever and decides upon the
// coordinates and color for that point

// create this as many times as you have buffers as input to either shader
export class viewAttribute extends viewVariable {
	constructor(varName, owner) {
		super(varName, owner);
		const gl = this.gl;

		// small integer indicating which attr this is
		const atLo = this.attrLocation = gl.getAttribLocation(owner.program, varName);

		if (atLo < 0)
			throw new Error(`viewAttribute:attr loc for '${varName}' is bad: `+ atLo);
		if (traceGLCalls) console.log(`created viewAttribute '${varName}'`);
	}

 	// call after construction.  has <float32TypedArray> data input,
	// broken into rows of <stride> Bytes,
	// but we only use the <size> number of Floats from each row,
	// <offset> from the start of each row.  size=1,2,3 or 4,
	// to make an attr that's a scalar, vec2, vec3 or vec4
	attachArray(float32TypedArray, size, stride = size * 4, offset = 0) {
		const gl = this.gl;

		// allocate actual ram in GPU chip
		const gBuf = this.glBuffer = gl.createBuffer();

		// magical vao which is apparently a list of cpu-side buffers.
		// Each is named with some integer in opengl, but I don't think we see these in webgl 1.
		// you have to dispose of it ultimately
		//const vaoExt = this.vaoExt;
		//let vao = this.vao = vaoExt.createVertexArrayOES();
		//vaoExt.bindVertexArrayOES(vao);
		// now do calls to bindBuffer() or vertexAttribPointer()
		// a Record of these will be "recorded" in the VAO

		// attach GPU buffer to our GL
		gl.bindBuffer(gl.ARRAY_BUFFER, gBuf);

		// now attach some data to it, with CPU-side arrays
		this.float32TypedArray = this.owner.float32TypedArray = float32TypedArray;
		gl.bufferData(gl.ARRAY_BUFFER, float32TypedArray, this.bufferDataDrawMode);

		gl.enableVertexAttribArray(this.attrLocation);

		// // row is 4 floats: real, imag, potential, vertex index/serial
		gl.vertexAttribPointer(
				this.attrLocation,
				size, gl.FLOAT,
				false, stride, offset);  // don't normalize


		// again?  gl.enableVertexAttribArray(this.attrLocation);

//		var vao = this.vao = vaoExt.createVertexArrayOES();
//		vaoExt.bindVertexArrayOES(vao);
//		vao;
//		gl.enableVertexAttribArray(this.attrLocation);
//
//		gl.vertexAttribPointer(this.attrLocation, size, gl.FLOAT, false, stride, offset);
		if (traceGLCalls) console.log(`viewAttribute '${this.varName}' set to size=${size}, stride=${stride}, offset=${offset}  row [1]:`,
				float32TypedArray[8], float32TypedArray[9], float32TypedArray[10], float32TypedArray[11]);

		this.reloadVariable();
	}

	// call this when the array's values change, to reload them into the GPU.
	// No function; the original array must change its values.
	reloadVariable() {
		const gl = this.gl;
		//console.log(`reload Array variable ${this.this.varName} : `, this.float32TypedArray);
		// not sure we have to do this again...
		gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);

		// do we have to do THIS again?  Does it just slurp it up from the pointer from last time?!?!
		gl.bufferData(gl.ARRAY_BUFFER, this.float32TypedArray, this.bufferDataDrawMode);

		if (traceGLCalls) console.log(`viewAttribute '${this.varName}' reloaded row[1]:`,
				this.float32TypedArray[8], this.float32TypedArray[9], this.float32TypedArray[10], this.float32TypedArray[11]);
	}

}


