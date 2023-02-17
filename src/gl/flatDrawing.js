/*
** flat drawing -- draw a 1d quantum wave as a 2d bargraph (band across top)
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import {abstractDrawing} from './abstractDrawing.js';
import cxToColorGlsl from './cxToColor/cxToColor.glsl.js';
import {viewUniform, viewAttribute} from './viewVariable.js';

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
const vertexSrc = `${cxToColorGlsl}
#line 37
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

	// figure out x, basically the point index
	float x;
	x = float(int(vertexSerial) / 2) * barWidth * 2. - 1.;

	gl_Position = vec4(x, y, 0., 1.);

	//  for the color, convert the complex values via this algorithm
	vColor = vec4(cxToColor(vec2(row.x, row.y)), 1.);
	if (!odd)
		vColor = vec4(vColor.r/2., vColor.g/2., vColor.b/2., vColor.a);
	//vColor = vec4(.9, .9, .1, 1.);

	// dot size, in pixels not clip units.  actually a square.
	${pointSize}
}
`;

const fragmentSrc = `
#line 74
precision highp float;
varying highp vec4 vColor;

void main() {
	gl_FragColor = vColor;
}
`;

// the original display that's worth watching: flat upside down hump graph
export class flatDrawing extends abstractDrawing {
	constructor(viewDef) {
		super(viewDef, 'flatDrawing');

		this.vertexShaderSrc = vertexSrc;
		this.fragmentShaderSrc = fragmentSrc;
	}

	// one time set up of variables for this drawing, every time canvas and viewDef is recreated
	createVariables() {
		this.setDrawing();

		if (traceFlatDrawing)
			console.log(`flatDrawing ${this.viewName}: creatingVariables`);

		// loads view buffer from corresponding wave, calculates highest norm.
		// Need this for starting values for highest & smoothHighest
		// this is NOT where it gets called after each iter; see GLView for that
		this.avatar.loadViewBuffer();


		this.maxHeightUniform = new viewUniform('maxHeight', this,
			() => {
				if (traceHighest)
					console.log(`flatDrawing reloading ${this.viewName}: highest=${this.avatar.highest.toFixed(5)}  smoothHighest=${this.avatar.smoothHighest.toFixed(5)}`);

				// add in a few percent
				return {value: this.avatar.smoothHighest * this.viewDef.PADDING_ON_BOTTOM, type: '1f'};
			}
		);

		let nPoints = this.nPoints = this.space.nPoints;
		let barWidth = 1 / (nPoints - 1);
		this.barWidthUniform = new viewUniform('barWidth', this,
			() => ({value: barWidth, type: '1f'}) );

		this.vertexCount = nPoints * 2;  // nPoints * vertsPerBar
		this.rowFloats = 4;
		this.rowAttr = new viewAttribute('row', this, this.rowFloats, () => {
			this.avatar.vBuffer.nTuples = this.vertexCount;
			return this.avatar.vBuffer;
		});

		//this.gl.bindVertexArray(null);
	}

	draw() {
		if (traceFlatDrawing) console.log(`flatDrawing ${this.viewName}, ${this.avatarLabel}: `+
			` drawing ${this.vertexCount/2} points`);
		const gl = this.gl;
		this.setDrawing();

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
			this.avatar.dumpViewBuffer(`finished drawing ${this.viewName} in flatDrawing.js; drew buf:`);
			console.log(`barWidthUniform=${this.barWidthUniform.getFunc()}    `
				+`maxHeightUniform=${this.maxHeightUniform.getFunc()}`);
		}
		// ?? this.gl.bindVertexArray(null);
	}
}

export default flatDrawing;

