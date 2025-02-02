/*
** flat drawing -- draw a 1d quantum wave as a 2d bargraph (band across top)
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import {abstractDrawing} from './abstractDrawing.js';
import cx2rgb from './cx2rgb/cx2rgb.glsl.js';
import {drawingUniform, drawingAttribute} from './drawingVariable.js';

let traceViewBufAfterDrawing = false;
let traceHighest = false;
let traceFlatDrawing = false;

// diagnostic purposes
let traceDrawPoints = false;
let traceDrawLines = false;

let pointSize = traceDrawPoints ? `gl_PointSize = 10.;` : '';

/* ******************************************************* flat drawing */

/*
** data format of attributes:  four column table of floats
** 𝜓.re  𝜓.im   (voltage unused)    ...0?...
** uses gl_VertexID to figure out whether the y should be re^2+im^2  NO! opengl 2 only
** or zero
*/

// make the line number for the start correspond to this JS file line number - the NEXT line
const vertexSrc = `${cx2rgb}
#line 32
varying highp vec4 vColor;
attribute vec4 row;
uniform float barWidth;
uniform float maxHeight;

void main() {
	// figure out y
	float y;
	int vertexSerial = int(row.w);
	bool odd = int(vertexSerial) / 2 * 2 < vertexSerial;
	if (odd) {
		y = (row.x * row.x + row.y * row.y) / maxHeight;
	}
	else {
		y = 0.;
	}
	y = 1. - 2. * y;

	// figure out x, basically the point index; map to -1...+1
	float x;
	x = float(int(vertexSerial) / 2) * barWidth * 2. - 1.;

	gl_Position = vec4(x, y, 0., 1.);

	//  for the color, convert the complex values via this algorithm
	vColor = vec4(cx2rgb(vec2(row.x, row.y)), 1.);
	if (!odd)
		vColor = vec4(vColor.r/2., vColor.g/2., vColor.b/2., vColor.a);
	//vColor = vec4(.9, .9, .1, 1.);

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

		this.vertexShaderSrc = vertexSrc;
		this.fragmentShaderSrc = fragmentSrc;
	}

	// one time set up of variables for this drawing, every time canvas and scene is recreated
	createVariables() {
		this.setDrawing();

		if (traceFlatDrawing)
			console.log(`🫓 flatDrawing ${this.outerDims}: creatingVariables`);

		// loads view buffer from corresponding wave, calculates highest norm.
		// Need this for starting values for highest & smoothHighest
		// this is NOT where it gets called after each iter; see GLView for that
		this.avatar.loadViewBuffer();


		this.maxHeightUniform = new drawingUniform('maxHeight', this,
			() => {
				if (traceHighest)
					console.log(`🫓 flatDrawing reloading outer: ${this.outerDims}: `
						+` highest=${this.avatar.highest.toFixed(5)} `
						+` smoothHighest=${this.avatar.smoothHighest.toFixed(5)}`);

				// add in a few percent
				return {value: this.avatar.smoothHighest * this.scene.PADDING_ON_BOTTOM, type: '1f'};
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
		if (traceFlatDrawing) console.log(`🫓 barWidth= ${barWidth}`);
		this.barWidthUniform = new drawingUniform('barWidth', this,
			() => {
				barWidth = 1 / (nPoints - 1)
				return { value: barWidth, type: '1f' };
			}
		);

		this.vertexCount = nPoints * 2;  // nPoints * vertsPerBar
		this.rowFloats = 4;
		this.rowAttr = new drawingAttribute('row', this, this.rowFloats, () => {
			this.avatar.vBuffer.nTuples = this.vertexCount;
			return this.avatar.vBuffer;
		});

		// see  abstractDrawing for bindVertexArray()
	}

	// called for each image frame on th canvas
	draw(width, height, specialInfo) {
		if (traceFlatDrawing) {
			console.log(`🫓 flatDrawing ${this.outerDims}, ${this.avatarLabel}: `
				+` drawing ${this.vertexCount/2} points`);
		}
		const gl = this.gl;
		this.setDrawing();

		let bw = specialInfo.bumperWidth;
		gl.viewport(bw, 0, width - 2 * bw, height);

		this.viewVariables.forEach(v => v.reloadVariable());
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexCount);

		if (traceDrawLines) {
			gl.lineWidth(1);  // it's the only option anyway

			gl.drawArrays(gl.LINES, 0, this.vertexCount);
		}

		if (traceDrawPoints)
			gl.drawArrays(gl.POINTS, 0, this.vertexCount);

		// i think this is problematic
		if (traceViewBufAfterDrawing) {
			this.avatar.dumpViewBuffer(`finished drawing ${this.outerDims} in flatDrawing.js; drew buf:`);
			console.log(`barWidthUniform=${this.barWidthUniform.getFunc()}    `
				+`maxHeightUniform=${this.maxHeightUniform.getFunc()}`);
		}
		// ?? this.gl.bindVertexArray(null);
	}
}

export default flatDrawing;

