/*
** flat drawing -- draw a 1d quantum wave as a 2d bargraph (band across top)
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import abstractDrawing from './abstractDrawing.js';
import {drawingUniform, drawingAttribute} from './drawingVariable.js';
import cx2rygb from './cx2rygb/cx2rygb.glsl.js';
import qeFuncs from '../engine/qeFuncs.js';
import qeConsts from '../engine/qeConsts.js';

let traceViewBufAfterDrawing = false;
let traceMaxHeight = false;
let traceFlatDrawing = false;
let traceViewport = false;
let traceCounts = false;

// diagnostic purposes
let traceDrawPoints = false;
let traceDrawLines = false;

let pointSize = traceDrawPoints ? `gl_PointSize = 10.;` : '';
let displayWrapEdges = false;  // soon to be a pref

/* ******************************************************* flat drawing */

/*
** data format of attributes:  four column table of floats
** 𝜓.re  𝜓.im   (voltage unused)    ...0?...
** uses gl_VertexID to figure out whether the y should be re^2+im^2  NO! opengl 2 only
** or zero
*/

// make the line number for the start correspond to this JS file line number - the NEXT line
const vertexSrc = `${cx2rygb}
#line 32
varying highp vec4 vColor;
attribute vec4 row;
uniform float barWidth;
uniform float maxHeight;

void main() {
	int vertexSerial = int(row.w);
	bool odd = int(vertexSerial) / 2 * 2 < vertexSerial;

	// figure out y
	float y;
	if (odd) {
		y = (row.x * row.x + row.y * row.y) / maxHeight;
	}
	else {
		y = 0.;  // top of the screen
	}
	y = 1. - 2. * y;

	// figure out x, basically the point index; map to -1...+1
	float x;
	x = float(int(vertexSerial) / 2) * barWidth * 2. - 1.;

	gl_Position = vec4(x, y, 0., 1.);

	//  for the color, convert the complex values via this algorithm
	vColor.rgb = cx2rygb(row.xy);
	//vColor.rgb = cx2rygb(vec2(row.x, row.y));
	vColor.a = 1.;
	//vColor = vec4(cx2rygb(vec2(row.x, row.y)), 1.);

	// make the colors darker toward zero (top)
	if (!odd)
		vColor = vec4(vColor.r/2., vColor.g/2., vColor.b/2., vColor.a);

	// dot size, in pixels not clip units.  actually a square.
	${pointSize}
}
`;

const fragmentSrc = `
#line 69
precision highp float;
varying highp vec4 vColor;

void main() {
	gl_FragColor = vColor;
}
`;

// the original display that's worth watching: flat upside down hump graph
export class flatDrawing extends abstractDrawing {
	constructor(scene) {
		super(scene, 'flatDrawing');

		// each point in the wave results in two vertices, top and wave.
		// And each of those is four single floats going to the GPU
		this.avatar = scene.avatar;
		this.avatar.attachViewBuffer(0, null, 4, this.space.nPoints * 2, 'flat drawing');

		this.vertexShaderSrc = vertexSrc;
		this.fragmentShaderSrc = fragmentSrc;

		//console.log(`attachViewBuffer on scene ${scene.sceneName}`);
	}

	// loads view buffer from corresponding wave, calculates highest norm.
	// one time set up of variables for this drawing, every time canvas and scene is recreated
	createVariables() {
		this.setDrawing();
		if (traceFlatDrawing)
			console.log(`♭♭♭ flatDrawing: creatingVariables`);

		// normally autoranging would put the highest peak at the exact bottom.
		// but we want some extra space.  not much.
		const vertStretch = 1.0;  // not sure why
		//const vertStretch = 0.7;  // not sure why
		const PADDING_ON_BOTTOM = 1.02 * vertStretch;

		this.maxHeightUniform = new drawingUniform('maxHeight', this,
			() => {
				// fresh out of the loader, maxHeight wobbles up and down.  Smooth it.
				if (!this.maxHeight)
					this.maxHeight = this.avatar.d0;
				else
					this.maxHeight = (this.maxHeight * 15 + this.avatar.d0) / 16;
					//this.maxHeight = (this.maxHeight * 255 + this.avatar.d0) / 256;

				if (traceMaxHeight)
					console.log(`♭♭♭ flatDrawing reloading outer:  `
						+` maxHeight=${this.avatar.maxHeight.toFixed(5)} `);

				return {value: this.maxHeight * PADDING_ON_BOTTOM, type: '1f'};
			}
		);


		// WELL continuum:  potential at the ends of the well are infinite; so
		// psi on the border points is zero. These are the boundary datapoints,
		// so for N=8, 10 edges between 9 bars, 7 between and 2 on ends.

		// for ENDLESS, we wrap around one bar, so if N=8, there's two border bar at 0 and 8.
		// there's 7 bars between.  9 bars total, 10 edges, matching the 10 = nPoints
		// So, the same for WELL and ENDLESS

		// barWidth: width of each bargraph bar
		let nPoints = this.nPoints = this.space.nPoints;
		let barWidth;
		this.barWidthUniform = new drawingUniform('barWidth', this,
			() => {
				barWidth = 1 / (nPoints - 1)
				return { value: barWidth, type: '1f' };
			}
		);
		if (traceFlatDrawing) console.log(`♭♭♭ barWidth= ${barWidth}`);

		this.vertexCount = nPoints * 2;  // nPoints * vertsPerBar
//this.vertexCount += this.vertexCount;////
		this.rowFloats = 4;
		this.rowAttr = new drawingAttribute('row', this, this.rowFloats, () => {

			if (traceCounts) {
				console.log(`at flatLoader; this.vertexCount=${this.vertexCount} `
					+` total floats=${this.vertexCount * this.rowFloats}`);
			}
			qeFuncs.avatar_avFlatLoader(this.avatar.pointer, 0, this.space.mainFlick.pointer,
					this.vertexCount);

			// old this.avatar.vBuffer.nTuples = this.vertexCount;
			return this.avatar.getViewBuffer(0);
		});

		// see  abstractDrawing for bindVertexArray()
	}

	// called for each image frame on th canvas
	draw(width, height, specialInfo) {
		if (traceFlatDrawing) {
			console.log(`♭♭♭ flatDrawing  ${this.avatarLabel}: `
				+` width=${width}, height=${height}  drawing ${this.vertexCount/2} points `
				+` maxHeight=${this.maxHeight}`);
		}
		const gl = this.gl;
		this.setDrawing();

		let bw = specialInfo.bumperWidth;
		gl.viewport(bw, 0, width - 2 * bw, height);
		if (traceViewport) {
			console.log(`♭♭♭ flatDrawing set viewport on ${this.avatarLabel}: `
				+` width-2bw=${width - 2 * bw}, height=${height}  `
				+` drawing ${this.vertexCount/2} points`);
		}
		this.viewVariables.forEach(v => v.reloadVariable());
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexCount);
		// console.log(`just drewArays-flat on avatar ptr=${this.avatar.pointer} `
		// 	+` this.avatar.label=${this.avatar.label}, buffer label=${this.avatar.bufferNames[0]}`);

		if (traceDrawLines) {
			gl.lineWidth(1);  // it's the only option anyway

			gl.drawArrays(gl.LINES, 0, this.vertexCount);
		}

		if (traceDrawPoints)
			gl.drawArrays(gl.POINTS, 0, this.vertexCount);

		// i think this is problematic
		if (traceViewBufAfterDrawing) {
			this.avatar.dumpViewBuffer(`♭♭♭ finished drawing in flatDrawing.js; drew buf:`);
			console.log(`♭♭♭ barWidthUniform=${this.barWidthUniform.getFunc()}    `
				+`maxHeightUniform=${this.maxHeightUniform.getFunc()}`);
		}
		// ?? this.gl.bindVertexArray(null);
	}
}

export default flatDrawing;

