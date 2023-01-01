/*
** tic drawing -- tic marks for the flat drawing, along the sides
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

import {abstractDrawing} from './abstractDrawing.js';
// eslint-disable-next-line no-unused-vars
import {viewUniform, viewAttribute} from './viewVariable.js';

let traceDumpVertices = false;
let traceTicDrawing = false;
let traceHighest = false;

// diagnostic purposes
let alsoDrawPoints = false;
let alsoDrawLines = false;

// buffer size starts at this
const INITIAL_BUFFER_NTICS = 5;  // always too small; for testing ////

// buffer: x & y, * 3 vertices per tic
const FLOATS_PER_TIC = 6;

// AVG_ψ is 1/N, the height of a circular wave
const TICS_PER_AVG_ψ  = 2;


let pointSize = alsoDrawPoints ? `gl_PointSize = 10.;` : '';

/* ******************************************************* tic drawing */

/*
** data format of attributes:  2 column table of floats
** x and y coords x 3 pairs in sequence, each a triangle
*/

// make the line number for the start correspond to this JS file line number - the NEXT line
const vertexSrc = `
#line 38
attribute vec2 corner;
uniform float maxHeight;
varying highp vec4 vColor;

void main() {
	gl_Position = vec4(corner.x, corner.y, 0., 1.);

	vColor = vec4(.5, .5, .5, (corner.x == -1.) ? 1. : .5);

	// dot size, in pixels not clip units
	${pointSize}
}
`;

const fragmentSrc = `
#line 59
precision highp float;
varying highp vec4 vColor;

void main() {
	gl_FragColor = vColor;
}
`;

// the original display that's worth watching: tic upside down hump graph
export class ticDrawing extends abstractDrawing {
	constructor(viewDef) {
		super(viewDef, 'ticDrawing');

		// we always use this for our coordinates, generated on the fly
		// dynamically expanded as needed
		this.roomForNTics = INITIAL_BUFFER_NTICS
		this.coordBuffer = new Float32Array(this.roomForNTics * FLOATS_PER_TIC);  // n of floats

		this.vertexShaderSrc = vertexSrc;
		this.fragmentShaderSrc = fragmentSrc;
	}

	// one time set up of variables for this drawing, every time canvas and viewDef is recreated
	createVariables() {
		if (traceTicDrawing) console.log(`➤ ➤ ➤ ticDrawing ${this.viewName}: creatingVariables`);

		this.vao = this.gl.createVertexArray();

		this.cornerFloats = 2;
		this.cornerAttr = new viewAttribute('corner', this, this.cornerFloats, () => {
			return this.generateTics();
		});
	}

	generateTics() {
		// how big should the tics be?
		let ticHalfHeight = 2 / this.gl.drawingBufferHeight;  // fixed number of pixels
		let ticWidth = 20 / this.gl.drawingBufferWidth;  // fixed number of pixels
		let ticOrigin = -1 - ticWidth/2;

		if (traceHighest)
			console.log(`➤ ➤ ➤ ticDrawing '${this.viewName}, ${this.avatarLabel}':`+
				` highest is ${this.avatar.highest.toFixed(6)}`);


		// number of tics on left side, comes from the flatDrawing but handle it if it isn't drawing
		let highest = this.avatar.smoothHighest ?? 1/ this.avatar.space.nStates;
		let nTics = Math.floor(highest * this.avatar.space.nStates * TICS_PER_AVG_ψ - .1);
		nTics = this.nTics = Math.min(nTics, 100);
		if (this.roomForNTics <= nTics) {
			let nuTics = Math.ceil(nTics * 1.3 + 1);  // room for some more but not too many
			console.warn(`➤ ➤ ➤ highest=${highest.toFixed(4)}, nTics=${nTics}  `+
				`  exceeds roomForNTics=${this.roomForNTics} . `+
				` Expanding buffer... new roomForNTics=${nuTics}`);
			this.roomForNTics = nuTics;
			this.coordBuffer = new Float32Array(this.roomForNTics * FLOATS_PER_TIC);
		}
		let cb = this.coordBuffer;

		// now fill it in.  avoid tic 0 cuz it's always at the edge.
		for (let t = 1; t <= nTics; t++) {
			let offset = t * FLOATS_PER_TIC;
			let y = 1 - 2 * t * this.avatar.smoothHighest / TICS_PER_AVG_ψ;
			let extraWidth = t % TICS_PER_AVG_ψ == 0 ? ticWidth : 0;

			// ok, top x, y, point x, y, bottom x, y, in clip coords (-1...1)
			cb.set([
				ticOrigin, y - ticHalfHeight,
				ticWidth + extraWidth - 1, y,
				ticOrigin, y + ticHalfHeight,
			], offset);
		}

		this.vertexCount = nTics * 3;  // 3 verts per tic
		if (traceDumpVertices) {
			console.log(`➤ ➤ ➤ ticDrawing '${this.viewName}, ${this.avatarLabel}':`+
				` created ${nTics*3} vertices for ${nTics} tics`);
			for (let t = 0; t < nTics; t++) {
				let f = t * FLOATS_PER_TIC;
				let dump = `    ➤ ➤ ➤ tic [${t}] `;
				for (let j = 0; j < 6; j += 2)
					dump += `    ${cb[f + j].toFixed(4)} @ ${cb[f + j + 1].toFixed(4)}`;
				console.log(dump);
			}
		}
		cb.nTuples = this.vertexCount;
		return cb;
	}

	draw() {
		const gl = this.gl;
		if (traceTicDrawing)
			console.log(`➤ ➤ ➤ ticDrawing '${this.viewName}, ${this.avatarLabel}': start draw`);

		this.setDrawing();
		this.viewVariables.forEach(v => v.reloadVariable());


		let start = 3;
		let len = this.vertexCount - start;

		gl.drawArrays(gl.TRIANGLES, start, len);

		if (alsoDrawLines) {
			gl.lineWidth(1);  // it's the only option anyway

			gl.drawArrays(gl.LINE_STRIP, start, len);  // gl.LINE_STRIP, gl.LINES, gl.LINE_LOOP
		}

		if (alsoDrawPoints)
			gl.drawArrays(gl.POINTS, start, len);
	}
}

export default ticDrawing;
