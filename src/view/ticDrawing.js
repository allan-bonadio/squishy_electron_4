/*
** tic drawing -- tic marks for the flat drawing, along the sides
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

import {abstractDrawing} from './abstractDrawing';
import {viewUniform, viewAttribute} from './viewVariable';

let traceDumpVertices = true;
let traceTicDrawing = true;

// diagnostic purposes
let alsoDrawPoints = true;
let alsoDrawLines = true;

// buffer size starts at this
const INITIAL_BUFFER_NTICS = 5;  // always too small; for testing ////

// x & y, * 3 vertices per tic
const FLOATS_PER_TIC = 6;

// AVG_ψ is 1/N, the height of a circular wave
const TICS_PER_AVG_ψ  = 10;


let pointSize = alsoDrawPoints ? `gl_PointSize = 10.;` : '';

/* ******************************************************* tic drawing */

/*
** data format of attributes:  2 column table of floats
** x and y coords of 3 coords in sequence, each a triangle
*/

// make the line number for the start correspond to this JS file line number - the NEXT line
const vertexSrc = `
#line 38
attribute vec2 corner;
uniform float maxHeight;

void main() {
	// figure out y
	float y;
	y = 1. - 2. * (corner.y / maxHeight);

	// figure out x
	float x;
	x = 1. - 2. * corner.x;

	gl_Position = vec4(x/4., y/4., 0., 1.);////

	// dot size, in pixels not clip units
	${pointSize}
}
`;

const fragmentSrc = `
#line 59
precision highp float;

void main() {
	gl_FragColor = vec4(1., .5, .2, 1.);
	//gl_FragColor = vec4(.5, .5, .5, .5);
}
`;

// the original display that's worth watching: tic upside down hump graph
export class ticDrawing extends abstractDrawing {
	constructor(viewDef) {
		super(viewDef, 'ticDrawing');

		// we always use this for our coordinates, generated on the fly
		// dynamically expanded as needed
		this.ticsBufferSize = INITIAL_BUFFER_NTICS
		this.coordBuffer = new Float32Array(this.ticsBufferSize * FLOATS_PER_TIC);  // n of floats

		this.vertexShaderSrc = vertexSrc;
		this.fragmentShaderSrc = fragmentSrc;
	}

	// one time set up of variables for this drawing, every time canvas and viewDef is recreated
	createVariables() {
		if (traceTicDrawing) console.log(`➤ ➤ ➤ ticDrawing ${this.viewName}: creatingVariables`);

debugger;
		let maxHeightUniform = this.maxHeightUniform =
			new viewUniform('maxHeight', this,
				() => {
					// this gets called every redrawing (every reloadAllVariables() -> reloadVariable())
					// isn't smoothed out as with flatDrawing - see if that's good or bad
					return {value: this.avatar.highest, type: '1f'};
				}
			);

		this.cornerFloats = 2;
		this.cornerAttr = new viewAttribute('corner', this, this.cornerFloats, () => {

			return this.generateTics();
		});
		//this.cornerAttr.attachArray(this.avatar.vBuffer, this.cornerFloats);
	}

	// call this when you reset all the data, otherwise the smoothing is surprised
	reStartDrawing = () => {}

	generateTics() {
		debugger;

		// number of tics on each side
		let nTics = this.nTics = Math.floor(this.avatar.highest * this.avatar.space.nStates * TICS_PER_AVG_ψ);
		if (this.ticsBufferSize < nTics) {
			console.warn(`➤ ➤ ➤ exceeded this.ticsBufferSize=${this.ticsBufferSize}, `+
				` nTics was ${nTics}.  Expanding...`);
			this.ticsBufferSize = Math.ceil(nTics * 1.3 + 1);  // room for some more but not too many
			this.coordBuffer = new Float32Array(this.ticsBufferSize * FLOATS_PER_TIC);
		}

		// now fill it in
		for (let t = 0; t <= nTics; t++) {
			let offset = t * FLOATS_PER_TIC;
			let y = t / TICS_PER_AVG_ψ;

			// ok, top x, y, point x, y, bottom x, y
			this.coordBuffer.set([
				0, y-.1,
				1, y,
				0, y+.1,
			], offset);
		}

		this.vertexCount = nTics * 3;  // 3 verts per tic
		this.coordBuffer.nTuples = this.vertexCount;
		if (traceDumpVertices) {
			console.log(`➤ ➤ ➤ ticDrawing '${this.viewName}, ${this.avatarLabel}':`+
				` created ${nTics} tics for ${nTics*3} vertices`);
			let cb = this.coordBuffer;
			for (let t = 0; t < nTics; t++) {
				let f = t * FLOATS_PER_TIC;
				let dump = `    ➤ ➤ ➤ tic [${t}] `;
				for (let j = 0; j < 6; j += 2)
					dump += `    ${cb[f + j].toFixed(2)} @ ${cb[f + j + 1].toFixed(2)}`;
				console.log(dump);
			}
		}
		return this.coordBuffer;
	}

	draw() {
		const gl = this.gl;
		if (traceTicDrawing)
			console.log(`➤ ➤ ➤ ticDrawing '${this.viewName}, ${this.avatarLabel}': start draw`);

		this.generateTics();  // wrong time!!!

		gl.useProgram(this.program);////
		// already done in doRepaint()    this.cornerAttr.reloadVariable();////

		gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);

		if (alsoDrawLines) {
			gl.lineWidth(1);  // it's the only option anyway

			gl.drawArrays(gl.LINES, 0, this.vertexCount);
			//gl.drawArrays(gl.LINE_STRIP, 0, this.vertexCount);
		}

		if (alsoDrawPoints)
			gl.drawArrays(gl.POINTS, 0, this.vertexCount);

		// i think this is problematic
		//if (dumpViewBufAfterDrawing) {
		//	this.avatar.dumpViewBuffer(`finished drawing ${this.viewName} in ticDrawing.js; drew buf:`);
		//	console.log(`barWidthUniform=${this.barWidthUniform.staticValue}    `
		//		+`maxHeightUniform=`, this.maxHeightUniform.getFunc());
		//}
	}
}

export default ticDrawing;
