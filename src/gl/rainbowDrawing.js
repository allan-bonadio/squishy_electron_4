/*
** rainbow drawing -- draw a disc for the colors |u| = 1
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/


import {abstractDrawing} from './abstractDrawing.js';
import eAvatar from '../engine/eAvatar.js';
import cx2rygb from './cx2rygb/cx2rygb.glsl.js';
import {drawingUniform, drawingAttribute} from './drawingVariable.js';
import qeConsts from '../engine/qeConsts.js';
import qeFuncs from '../engine/qeFuncs.js';

let traceViewBufAfterDrawing = false;
let traceRainbowDrawing = true;


/* ********************************** shaders */

//  ${cx2rygb}
const vertexShaderSrc = `${cx2rygb}
#line 23
precision highp float;
attribute vec2 pos;
attribute vec3 col;
attribute vec2 wave;
varying vec3 colorVar;

void main() {
	vec3 distract;  // pretend to use the attrs we don't use

	gl_PointSize = 4.;
	gl_Position = vec4(pos, 0, 1);

	// for testing w fake color
	//colorVar = col;

	// for actual testing of cx to rygb
	colorVar = cx2rygb(wave);

	distract.bgr = col.rgb;
	distract.gb = wave.rg;
}
`;

const fragmentShaderSrc = `
#line 38
precision highp float;
varying vec3 colorVar;

void main() {
	gl_FragColor = vec4(colorVar, 1);
}
`;

const π = 3.141592653589793;

const DEGREES_PER_SEG = 10;
const RADIANS_PER_SEG = DEGREES_PER_SEG / 180. * π;
const nSEGS = Math.round(360 / DEGREES_PER_SEG);
const nVERTS = nSEGS + 2;  // zero is central pt; then we use start & end again

// a piechart-like image of all the complex colors around |u| = 1
export class rainbowDrawing extends abstractDrawing {
	// constructor must create the Avatar if the scene hasn't, create all of attrs and uniforms.
	// Sets this.avatar, .canvas, .geometry, .material, .mesh
	constructor(scene) {
		super(scene, 'Rainbow');
		this.avatar = scene.avatar;
		this.vertexShaderSrc = vertexShaderSrc;
		this.fragmentShaderSrc = fragmentShaderSrc;
	}

	// one time set up of variables for this drawing, every time canvas and scene is recreated
	createVariables() {
		this.setDrawing();
		if (traceRainbowDrawing)
			console.log(`🌈 🌈 rainbow: creatingVariables`);

		const pos = this.pos = this.avatar.attachViewBuffer(0, null, 2, nVERTS, 'pos');
		const col = this.col = this.avatar.attachViewBuffer(1, null, 3, nVERTS, 'col');
		const wave = this.wave = this.avatar.attachViewBuffer(2, null, 2, nVERTS, 'wave');

		// load the data before sending off the buffers
		this.loader(this.avatar);

		this.posAttr = new drawingAttribute('pos', this, 2, () => {
			return pos;
		});

		this.colAttr = new drawingAttribute('col', this, 3, () => {
			return col;
		});

		this.waveAttr = new drawingAttribute('wave', this, 2, () => {
			return wave;
		});
	}


	// load up the avatar with numbers.  We generate bare coords ±1
	loader(avatar) {
		const pos = avatar.getViewBuffer(0);
		const col = avatar.getViewBuffer(1);
		const wave = avatar.getViewBuffer(2);
		let p = 0, c = 0, w = 0;
		const RADIUS = 1;
		const originX = 0, originY = 0;

		// the starting point
		pos[p+0] = originX;
		pos[p+1] = originY;

		col[c+0] = col[c+1] = col[c+2] = 1;

		wave[w+0] = wave[w+1] = 0;

		// all the vertices, plus the initial [1] vert again
		for (let s = 0; s <= nSEGS; s++) {
			p = s * 2 + 2;
			c = s * 3 + 3;
			w = s * 2 + 2;

			let angle = s * RADIANS_PER_SEG;
			let si0 = Math.sin(angle);
			let co0 = Math.cos(angle);
			// console.log(`seg: ${s}  angle: ${angle.toFixed(4)} `
			// 	+` degrees: ${(angle * 180 / 3.1415926535898).toFixed(4)} `
			// 	+` sine ${si0.toFixed(4)}   cosine ${co0.toFixed(4)}`);

			pos[p + 0] = RADIUS * co0 + originX;
			pos[p + 1] = RADIUS * si0 + originY;


			col[c + 0] = (si0 + 1) / 2;
			col[c + 1] = (co0 + 1) / 2;
			col[c + 2] = s / nSEGS;

			wave[w + 0] = co0;
			wave[w + 1] = si0;

			// complexToRYGB(&cx, colors[p]);
		}
	}

	// called for each image frame on th canvas
	draw(width, height, specialInfo) {
		// diagnostic purposes
		let traceDrawPoints = true;
		let traceDrawLines = true;

		if (traceRainbowDrawing) {
			console.log(`🌈 🌈 rainbowDrawing  ${this.avatarLabel}: `
				+` width=${width}, height=${height}  drawing ${nVERTS} points`);
		}
		const gl = this.gl;
		this.setDrawing();

		this.viewVariables.forEach(v => v.reloadVariable());
		//gl.drawArrays(gl.TRIANGLE_STRIP, 0, nVERTS);
		gl.drawArrays(gl.TRIANGLE_FAN, 0, nVERTS);

		if (traceDrawLines) {
			gl.lineWidth(1);  // it's the only option anyway

			gl.drawArrays(gl.LINE_LOOP, 0, nVERTS);
		}

		if (traceDrawPoints)
			gl.drawArrays(gl.POINTS, 0, nVERTS);

		if (traceViewBufAfterDrawing) {
			this.avatar.dumpViewBuffers(3, `🌈 🌈 finished drawing rainbowDrawing.js; drew buf:`);
		}
		// ?? this.gl.bindVertexArray(null);
	}
}

export default rainbowDrawing;

