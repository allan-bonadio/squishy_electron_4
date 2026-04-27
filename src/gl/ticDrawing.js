/*
** tic drawing -- tic marks for the flat drawing, along the sides
** Copyright (C) 2022-2026 Tactile Interactive, all rights reserved
*/

import {abstractDrawing} from './abstractDrawing.js';
// eslint-disable-next-line no-unused-vars
import {drawingUniform, drawingAttribute} from './drawingVariable.js';

let traceDumpVertices = true;
let traceTicDrawing = true;
let traceHighest = true;
let traceDrawPoints = true;

// buffer size starts at this
const BUFFER_MAX_NTICS = 100;

// buffer: x & y, * 3 vertices per tic
const FLOATS_PER_VERTEX = 2;  // 2D
const VERTICES_PER_TIC = 2;  // left end, then right end
const FLOATS_PER_TIC = FLOATS_PER_VERTEX * VERTICES_PER_TIC;

// AVG_ψ is 1/N, the height of a circular wave
const TICS_PER_AVG_PSI  = 2;  // testing

const BUFFER_ID = 1;

let pointSize = traceDrawPoints ? `gl_PointSize = 5.;` : '';

/* ******************************************************* tic drawing */

/*
** data format of attributes:  2 column table of floats
** x and y coords, 2 pairs in sequence, each a line segment unconnected.
** Y coord is same units as flat display; x unit is native WebGL -1...+1
*/

// make the line number for GLSL at the start correspond to the JS file line number - the NEXT line
// gets out of sync so easily!

// all this really has to do is shovel out the points.  The LINE drawing mode alternates line endings
const vertexSrc = `// ticDrawing vertex
#line 42
attribute vec2 endPoint;
uniform float maxHeight;
//varying highp vec4 vColor;

void main() {
	float y = endPoint.y / maxHeight;
	y = 1. - 2. * y;
	gl_Position = vec4(endPoint.x, y, 0., 1.);

	//vColor = vec4(.5, 1., 1., 1.);

	// dot size, in pixels not clip units
	${pointSize}
}
`;

const fragmentSrc = `// ticDrawing frag
#line 60
precision highp float;
//varying highp vec4 vColor;

void main() {
	gl_FragColor = vec4(0.5, 1., 0.5, 1.);
}
`;

// tics in green along left side
export class ticDrawing extends abstractDrawing {
	constructor(scene) {
		super(scene, 'ticDrawing');

		//debugger;
		this.avatar = scene.avatar;
		this.coordBuffer = this.avatar.attachViewBuffer(BUFFER_ID, null,
			2, BUFFER_MAX_NTICS * FLOATS_PER_TIC, '2D Tics');
		//this.coordBuffer = new Float32Array(BUFFER_MAX_NTICS * FLOATS_PER_TIC);

		this.vertexShaderSrc = vertexSrc;
		this.fragmentShaderSrc = fragmentSrc;
	}

	// one time set up of variables for this drawing, every time canvas
	// and scene is recreated
	createVariables() {
		//debugger;
		this.setDrawing();
		if (traceTicDrawing)
			console.log(`➤ ➤ ➤ ticDrawing ${this.sceneName}: creatingVariables`);

		// same as in flatDrawing, y is in units of ψ
		this.maxHeightUniform = new drawingUniform('maxHeight', this,
			() => {
				if (traceHighest)
					console.log(`ticDrawing reloading ${this.sceneName}: `+
						` highest=${this.avatar.double0?.toFixed(5)}`);

				// don't use measured highest if zero or undefined
				let h = this.avatar.double0 || 1 /  this.space.nStates;
				return {value: h * this.scene.PADDING_ON_BOTTOM,
					type: '1f'};
			}
		);

		this.endPointAttr = new drawingAttribute('endPoint', this,
			FLOATS_PER_VERTEX, () => this.generateTics());
	}

	// generate the current tics, for the attribute's reloadFunc
	generateTics() {
		// x, in clip coords.  Width is really length of tic
		let ticWidth = 0.1;
		//let ticWidth = 2000 / this.gl.drawingBufferWidth;
		//let ticWidth = 200 / this.gl.drawingBufferWidth;
		//let ticWidth = 20 / this.gl.drawingBufferWidth;

		let ticOrigin = -50;
		//let ticOrigin = -0.5;
		//let ticOrigin = -1;

		if (traceHighest)
			console.log(`➤ ➤ ➤ ticDrawing ${this.sceneName}, ${this.avatarLabel}:`+
				` highest is ${this.avatar.double0?.toFixed(6)}  ticWidth=${ticWidth}`);

		//debugger;
		// number of tics on left side, comes from the flatDrawing scale
		// but workaround if it isn't drawing
		let avgψ = 1 /  this.space.nStates;
		// if smooth highest isn't calculated yet, just use average ψ
		let highest = this.avatar?.double0 || avgψ;
		let highestPerAvgPsi = highest / avgψ;

		// this is number of tics should be, except we skip the one at zero
		let nTics = Math.floor(TICS_PER_AVG_PSI * highestPerAvgPsi - .1);
		nTics = this.nTics = Math.min(nTics, BUFFER_MAX_NTICS) - 1;

		// now fill it in.  avoid tic 0 cuz it's always at the edge.  Buffer starts at tic 1.
		let cb = this.coordBuffer;
		let separationPerTic =  avgψ / (TICS_PER_AVG_PSI );
		for (let t = 1; t <= nTics; t++) {
			let y = t * separationPerTic;
			// fill in two vertices at once
			//cb.set([0, 0, 0, 0],  (t-1) * FLOATS_PER_TIC);
            cb.set([
               ticOrigin, y,
               ticOrigin + ticWidth, y,
            ],  (t-1) * FLOATS_PER_TIC);
		}

		this.vertexCount = nTics * VERTICES_PER_TIC;
		if (traceDumpVertices) {
			console.log(`➤ ➤ ➤ generateTics ${this.sceneName}, ${this.avatarLabel}:`+
				` creating ${this.vertexCount} vertices for ${nTics} tics`);
			for (let t = 0; t < nTics; t++) {
				let f = t * FLOATS_PER_TIC;
				let dump = ` ➤ ➤ ➤ tic [${t}] `;
				for (let j = 0; j < FLOATS_PER_TIC; j += 2)
					dump += `   x=${cb[f + j].toFixed(4)}   y=${cb[f + j + 1].toFixed(4)}`;
				console.log(dump);
			}
		}
		cb.nTuples = this.vertexCount;
		return cb;
	}

	draw(width, height, paintingNeeds) {
		if (traceTicDrawing)
			console.log(`➤ ➤ ➤ ticDrawing drawing ${this.sceneName}, ${this.avatarLabel}: `+
				` start draw ${this.vertexCount/2} tics`);
		if (this.vertexCount <= 0)
			return;

		//debugger;
		const gl = this.gl;
		this.setDrawing();
		//gl.viewport(0, 0, width, height);

		this.drawVariables.forEach(v => v.reloadVariable());

		// if (this.vertexCount > BUFFER_MAX_NTICS * VERTICES_PER_TIC)
		// 	debugger;
        gl.lineWidth(1);
		gl.drawArrays(gl.LINE_STRIP, 0, this.vertexCount);
		//gl.drawArrays(gl.LINES, 0, this.vertexCount);

		if (traceDrawPoints)
			gl.drawArrays(gl.POINTS, 0, this.vertexCount);
	}
}

export default ticDrawing;
