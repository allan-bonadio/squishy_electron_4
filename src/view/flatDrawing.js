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
let traceFlatDrawing = false;

// diagnostic purposes
let alsoDrawPoints = false;
let alsoDrawLines = false;
//alsoDrawLines =0;

//let pointSize = alsoDrawPoints ? `gl_PointSize = (row.w+1.) * 5.;` : '';
let pointSize = alsoDrawPoints ? `gl_PointSize = 10.;` : '';

/* ******************************************************* flat drawing */

/*
** data format of attributes:  four column table of floats
** 𝜓.re  𝜓.im   (potential unused)    ...0?...
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
		if (traceFlatDrawing)
			console.log(`flatDrawing ${this.viewName}: creatingVariables`);
debugger;

		// loads view buffer from corresponding wave, calculates highest norm, which we use below.
		this.avatar.loadViewBuffer();


		//let maxHeightUniform =
		this.maxHeightUniform = new viewUniform('maxHeight', this,
			() => {
debugger;
				// this gets called every redrawing (every reloadAllVariables() -> reloadVariable())
				// smooth it out otherwise the wave sortof bounces up and down a little on each step
				// set like this only upon reStartDrawing()
				if (!this.avgHighest)
					this.avgHighest = this.avatar.highest;
				else
					this.avgHighest = (this.avatar.highest + 3*this.avgHighest) / 4;
				if (traceHighest)
					console.log(`flatDrawing reloading ${this.viewName}: highest=${this.avatar.highest.toFixed(5)}  avgHighest=${this.avgHighest.toFixed(5)}`);

				return {value: this.avgHighest, type: '1f'};
			}
		);

		let nPoints = this.nPoints = this.space.nPoints;
		let barWidth = 1 / (nPoints - 1);
		//let barWidthUniform =
		this.barWidthUniform = new viewUniform('barWidth', this,
			() => ({value: barWidth, type: '1f'}) );

		this.vertexCount = nPoints * 2;  // nPoints * vertsPerBar
		this.rowFloats = 4;
		this.rowAttr = new viewAttribute('row', this, this.rowFloats, (oldVal) => {
debugger;
			this.avatar.vBuffer.nTuples = this.vertexCount;
			return this.avatar.vBuffer;
		});
		//this.rowAttr.attachArray(this.avatar.vBuffer, this.rowFloats);
	}

	// call this when you reset the wave otherwise the smoothing is surprised
	reStartDrawing() {
		this.avgHighest = 0;
	}

	draw() {
		const gl = this.gl;
		if (traceFlatDrawing) console.log(`flatDrawing ${this.viewName}, ${this.avatarLabel}: drawing`);

		gl.useProgram(this.program);////

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexCount);

		if (alsoDrawLines) {
			gl.lineWidth(1);  // it's the only option anyway

			gl.drawArrays(gl.LINES, 0, this.vertexCount);
			//gl.drawArrays(gl.LINE_STRIP, 0, this.vertexCount);
		}

		if (alsoDrawPoints)
			gl.drawArrays(gl.POINTS, 0, this.vertexCount);

		// i think this is problematic
		if (dumpViewBufAfterDrawing) {
			this.avatar.dumpViewBuffer(`finished drawing ${this.viewName} in flatDrawing.js; drew buf:`);
			console.log(`barWidthUniform=${this.barWidthUniform.staticValue}    `
				+`maxHeightUniform=`, this.maxHeightUniform.getFunc());
		}
	}
}

export default flatDrawing;

