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
let traceDrawPoints = false;

// buffer size starts at this
const BUFFER_MAX_NTICS = 50;

// buffer: x & y, * 3 vertices per tic
const FLOATS_PER_VERTEX = 2;
const VERTICES_PER_TIC = 2;
const FLOATS_PER_TIC = FLOATS_PER_VERTEX * VERTICES_PER_TIC;

// AVG_ψ is 1/N, the height of a circular wave
//normal const TICS_PER_AVG_ψ  = 1;
const TICS_PER_AVG_ψ  = 2;  // testing

//// old
//const AVG_ψ_PER_TIC  = .5;  // testing
////const AVG_ψ_PER_TIC  = 1;  // normal


let pointSize = traceDrawPoints ? `gl_PointSize = 5.;` : '';

/* ******************************************************* tic drawing */

/*
** data format of attributes:  2 column table of floats
** x and y coords x 4 pairs in sequence, each a tiny rectangle
*/

// make the line number for the start correspond to this JS file line number - the NEXT line
// gets out of sync so easily!
const vertexSrc = `
#line 48
attribute vec2 endPoint;
uniform float maxHeight;
varying highp vec4 vColor;

void main() {
	float y = endPoint.y / maxHeight;
	y = 1. - 2. * y;
	gl_Position = vec4(endPoint.x, y, 0., 1.);

	vColor = vec4(.5, 1., 1., 1.);

	// dot size, in pixels not clip units
	${pointSize}
}
`;

const fragmentSrc = `
#line 64
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
		this.coordBuffer = new Float32Array(BUFFER_MAX_NTICS * FLOATS_PER_TIC);

		this.vertexShaderSrc = vertexSrc;
		this.fragmentShaderSrc = fragmentSrc;
	}

	// one time set up of variables for this drawing, every time canvas and viewDef is recreated
	createVariables() {
		this.setDrawing();
		if (traceTicDrawing)
			console.log(`➤ ➤ ➤ ticDrawing ${this.viewName}: creatingVariables`);

		// same as in flatDrawing, y is in units of ψ
		this.maxHeightUniform = new viewUniform('maxHeight', this,
			() => {
				if (traceHighest)
					console.log(`ticDrawing reloading ${this.viewName}: `+
						` highest=${this.avatar.highest?.toFixed(5)} `+
						` smoothHighest=${this.avatar.smoothHighest?.toFixed(5)}`);

				// add in a few percent
				return {value: this.avatar.smoothHighest * this.viewDef.PADDING_ON_BOTTOM,
					type: '1f'};
			}
		);

		this.endPointAttr = new viewAttribute('endPoint', this, FLOATS_PER_VERTEX, () => {
			return this.generateTics();
		});
	}

	// generate the current tics, for the attribute's getFunc
	generateTics() {
		// x, in clip coords
		let ticWidth = 20 / this.gl.drawingBufferWidth;
		let ticOrigin = -1;

		if (traceHighest)
			console.log(`➤ ➤ ➤ ticDrawing ${this.viewName}, ${this.avatarLabel}:`+
				` highest is ${this.avatar.highest?.toFixed(6)}`);

		// number of tics on left side, comes from the flatDrawing scalebut handle it if it isn't drawing
		let avgψ = 1 /  this.avatar.space.nStates;
		// if smooth highest isn't calculated yet, just use average ψ
		let highest = this.avatar.smoothHighest ?? avgψ;
		let highestInAvgψs = highest / avgψ;

		// this is number of tics should be, except we skip the one at zero
		let nTics = Math.floor(TICS_PER_AVG_ψ * highestInAvgψs - .1);
		nTics = this.nTics = Math.min(nTics, BUFFER_MAX_NTICS) - 1;
		// now fill it in.  avoid tic 0 cuz it's always at the edge.  Buffer starts at tic 1.
		let cb = this.coordBuffer;
		let heightPerTic =  avgψ / (TICS_PER_AVG_ψ );
		for (let t = 1; t <= nTics; t++) {
			let y = t * heightPerTic;
			// for maj and minor tics let extraWidth = t % TICS_PER_AVG_ψ == 0 ? ticWidth : 0;

			cb.set([
				ticOrigin, y,
				ticOrigin + ticWidth, y,
			],  (t-1) * FLOATS_PER_TIC);
		}

		this.vertexCount = nTics * VERTICES_PER_TIC;
		if (traceDumpVertices) {
			console.log(`➤ ➤ ➤ generateTics ${this.viewName}, ${this.avatarLabel}:`+
				` created ${this.vertexCount} vertices for ${nTics} tics`);
			for (let t = 0; t < nTics; t++) {
				let f = t * FLOATS_PER_TIC;
				let dump = `    ➤ ➤ ➤ tic [${t}] `;
				for (let j = 0; j < FLOATS_PER_TIC; j += 2)
					dump += `    ${cb[f + j].toFixed(4)} @ ${cb[f + j + 1].toFixed(4)}`;
				console.log(dump);
			}
		}
		cb.nTuples = this.vertexCount;
		return cb;
	}

	draw() {
		if (traceTicDrawing)
			console.log(`➤ ➤ ➤ ticDrawing drawing ${this.viewName}, ${this.avatarLabel}: `+
				` start draw ${this.vertexCount/2} tics`);
		if (this.vertexCount <= 0)
			return;

		const gl = this.gl;
		this.setDrawing();

		this.viewVariables.forEach(v => v.reloadVariable());

		if (this.vertexCount > BUFFER_MAX_NTICS * VERTICES_PER_TIC)
			debugger;
		gl.drawArrays(gl.LINES, 0, this.vertexCount);

		if (traceDrawPoints)
			gl.drawArrays(gl.POINTS, 0, this.vertexCount);
	}
}

export default ticDrawing;
