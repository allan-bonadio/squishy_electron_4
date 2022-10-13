/*
** flat drawing -- draw a 1d quantum wave as a 2d bargraph (band across top)
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import {abstractDrawing} from './abstractDrawing';
import cxToColorGlsl from './cxToColor.glsl';
//import qe from '../engine/qe';
import {viewUniform, viewAttribute} from './viewVariable';
//import SquishPanel from '../SquishPanel';
//import {eSpaceCreatedPromise} from '../engine/eEngine';

let dumpViewBufAfterDrawing = false;
let traceHighest = false;

// diagnostic purposes
let alsoDrawPoints = true;
let alsoDrawLines = true;
//alsoDrawLines =0;

let ps = alsoDrawPoints ? `gl_PointSize = (row.w+1.) * 5.;//10.;` : '';

/* ******************************************************* flat drawing */

/*
** data format of attributes:  four column table of floats
** 𝜓.re  𝜓.im   (potential unused)    ...0?...
** uses gl_VertexID to figure out whether the y should be re^2+im^2  NO! opengl 2 only
** or zero
*/

// make the line number for the start correspond to this JS file line number
const vertexSrc = `${cxToColorGlsl}
#line 33
varying highp vec4 vColor;
attribute vec4 row;
uniform float barWidth;
uniform float maxHeight;

void main() {
	// figure out y
	float y;
	int vertexSerial = int(row.w);
	if (vertexSerial / 2 * 2 < vertexSerial) {
		y = (row.x * row.x + row.y * row.y) / maxHeight;
	}
	else {
		y = 0.;
	}
	y = 1. - 2. * y;

	// figure out x, basically the point index
	float x;
	x = float(int(vertexSerial) / 2) * barWidth * 2. - 1.;

	// and here we are
	gl_Position = vec4(x, y, 0., 1.);

	//  for the color, convert the complex values via this algorithm
	vColor = vec4(cxToColor(vec2(row.x, row.y)), 1.);
	//vColor = vec4(.9, .9, .1, 1.);

	// dot size, in pixels not clip units.  actually a square.
	${ps}
}
`;

const fragmentSrc = `
#line 68
precision highp float;
varying highp vec4 vColor;

void main() {
	gl_FragColor = vColor;
}
`;

// the original display that's worth watching: flat upside down hump graph
export class flatDrawing extends abstractDrawing {
	// apparently supplied by default
	//constructor(viewDef, space, avatar) {
	//	super(viewDef, space, avatar);
	//}

	static drawingClassName: 'flatDrawing';
	drawingClassName: 'flatDrawing';

	setShaders() {
		this.vertexShaderSrc = vertexSrc;
		this.fragmentShaderSrc = fragmentSrc;
		this.compileProgram();
		this.gl.useProgram(this.program);  // should be the only time I do useProgram()
	}


	setInputs() {
		// loads view buffer from corresponding wave, calculates highest norm, which we use below.
		this.avatar.dumpViewBuffer('before loaded');
		const highest = this.avatar.loadViewBuffer();
		this.avatar.dumpViewBuffer('just loaded');

		// smooth it out otherwise the wave sortof bounces up and down a little on each step
		// must find a way to set the avgHighest
		if (!this.avgHighest)
			this.avgHighest = highest;
		else
			this.avgHighest = (highest + 3*this.avgHighest) / 4;
		if (traceHighest)
			console.log(`flatDrawing: highest=${highest.toFixed(5)}  avgHighest=${this.avgHighest.toFixed(5)}`);

		let maxHeightUniform = this.maxHeightUniform = new viewUniform('maxHeight', this);
		maxHeightUniform.setValue(() => {
			return {value: this.avgHighest, type: '1f'};
		});

		let barWidthUniform = this.barWidthUniform = new viewUniform('barWidth', this);
		let nPoints = this.nPoints = this.space.nPoints;
		let barWidth = 1 / (nPoints - 1);
		barWidthUniform.setValue(barWidth, '1f');

		this.rowAttr = new viewAttribute('row', this);
		this.vertexCount = nPoints * 2;  // nPoints * vertsPerBar
		this.rowFloats = 4;
		this.rowAttr.attachArray(this.space.mainVBuffer, this.rowFloats);
	}

	// call this when you reset the wave otherwise the smoothing is surprised
	resetAvgHighest() {
		this.avgHighest = 0;
	}

	draw() {
		const gl = this.gl;

		// should not be necessary!!  gl.useProgram(this.program);
		//this.rowAttr.reloadVariable()

		//gl.bindVertexArray(this.vao);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexCount);

		if (alsoDrawLines) {
			gl.lineWidth(1);  // it's the only option anyway

			gl.drawArrays(gl.LINES, 0, this.vertexCount);
			//gl.drawArrays(gl.LINE_STRIP, 0, this.vertexCount);
		}

		if (alsoDrawPoints)
			gl.drawArrays(gl.POINTS, 0, this.vertexCount);

		// i think this is problematic
		if (dumpViewBufAfterDrawing)
			this.avatar.dumpViewBuffer(`finished drawing in flatDrawing.js; drew buf:`);
	}
}

export default flatDrawing;

