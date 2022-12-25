/*
** Star View Def -- an old prototype used to develop the View Variable system
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import {abstractViewDef} from './abstractViewDef.js';
import {abstractDrawing} from './abstractDrawing.js';
import {viewUniform, viewAttribute} from './viewVariable.js';


// NOT DEBUGGED YET!!!


// this makes a light green color if false, a little on the yellow side.
// if true, you should see something brighter and less yellow
let includeUniform = true;


export class starDrawing extends abstractDrawing {

	constructor(viewDef) {
		super(viewDef, 'starDrawing');

		this.vertexShaderSrc = `
		attribute vec4 corner;
		void main() {
			gl_Position = corner;

			gl_PointSize = 10.;  // dot size, actually a crude square
		}
		`;

		const decl = includeUniform ? `uniform vec4 cornerColorUni;` : '';
		const cornerColorUni = includeUniform ? `cornerColorUni` : 'vec4(0.,.5,1.,1.)';
		this.fragmentShaderSrc = `
		precision highp float;
		${decl}

		void main() {
			// colored triangle, depends on the uniform?
			gl_FragColor = ${cornerColorUni};
		}
		`;
	}

	// all to do this one differently
	createVariables() {
		//const gl = this.gl;

		//let cornerColorUni;
		if (includeUniform) {
			//cornerColorUni =
			this.cornerColorUni =
				new viewUniform('cornerColorUni', this,
					() => ({value: [0, 1, .5, 1],   // teal
						type: '4fv'}) );
		}

//		const cornerAttributeLocation = gl.getAttribLocation(this.program, 'corner');
//		const cornerBuffer = gl.createBuffer();  // actual ram in GPU chip
//		gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);

		// create the data for the corners attribute
		const sin = Math.sin;
		const cos = Math.cos;
		const corners = new Float32Array([
			cos(1), sin(1),
			cos(3), sin(3),
			cos(5), sin(5),
			cos(7), sin(7),
			cos(9), sin(9),
			cos(11), sin(11),
			cos(0), sin(0),
			cos(2), sin(2),
			cos(4), sin(4),
			cos(6), sin(6),
			cos(8), sin(8),
			cos(10), sin(10),
		]);

		this.cornerAttr = new viewAttribute('corner', this, 2, () => corners);
		//this.cornerAttr.attachArray(corners, 2);
	}

//	createVariables() {
//		// loads view buffer from corresponding wave, calculates highest norm, which we use below.
//		const highest = this.avatar.loadViewBuffer();
//
//		// smooth it out otherwise the wave sortof bounces up and down a little on each step
//		// must find a way to set the avgHighest
//		if (!this.avgHighest)
//			this.avgHighest = highest;
//		else
//			this.avgHighest = (highest + 3*this.avgHighest) / 4;
//		if (traceHighest)
//			console.log(`starDrawing: highest=${highest.toFixed(5)}  avgHighest=${this.avgHighest.toFixed(5)}`);
//
//		let maxHeightUniform = this.maxHeightUniform = new viewUniform('maxHeight', this);
//		maxHeightUniform.setValue(() => {
//			return {value: this.avgHighest, type: '1f'};
//		});
//
//		let barWidthUniform = this.barWidthUniform = new viewUniform('barWidth', this);
//		let nPoints = this.nPoints = this.space.nPoints;
//		let barWidth = 1 / (nPoints - 1);
//		barWidthUniform.setValue(barWidth, '1f');
//
//		this.rowAttr = new viewAttribute('row', this);
//		this.vertexCount = nPoints * 2;  // nPoints * vertsPerBar
//		this.rowFloats = 4;
//		this.rowAttr.attachArray(this.space.mainVBuffer, this.rowFloats);
//	}

	draw() {
		const gl = this.gl;

		// is this a good place to do this?
		gl.lineWidth(1.0);  // it's the only option anyway

		gl.clearColor(0, 0, .3, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		if (includeUniform) {
			this.cornerColorUni.reloadVariable();
		}

		// shouldn't need gl.useProgram(this.program);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 12);


		gl.drawArrays(gl.LINE_STRIP, 0, 12);
		gl.drawArrays(gl.POINTS, 0, 12);

		//gl.POINTS,     // most useful and foolproof but set width in vertex shader
		//gl.LINES,      // tend to scribble all over
		//gl.LINE_STRIP, // tend to scribble all over
		//gl.TRIANGLES,  // more sparse triangles
	}


//	draw() {
//		const gl = this.gl;
//
//		gl.useProgram(this.program);
//		//this.rowAttr.reloadVariable()
//
//		//gl.bindVertexArray(this.vao);
//		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexCount);
//
//		if (alsoDrawLines) {
//			gl.lineWidth(1);  // it's the only option anyway
//
//			gl.drawArrays(gl.LINES, 0, this.vertexCount);
//			//gl.drawArrays(gl.LINE_STRIP, 0, this.vertexCount);
//		}
//
//		if (alsoDrawPoints)
//			gl.drawArrays(gl.POINTS, 0, this.vertexCount);
//
//		// i think this is problematic
//		if (dumpViewBufAfterDrawing)
//			this.avatar.dumpViewBuffer(`finished drawing in starDrawing; drew buf:`);
//	}
}


export class starViewDef extends abstractViewDef {
	static displayName: 'star';

	constructor(viewName, glview, space, avatar) {
		super(viewName, glview, space, avatar);

		if (! this.space || !this.avatar) {
			debugger;
			throw  new Error(`flatDrawingViewDef: being created without space or avatar`);
		}

		// create relevant drawings
		new starDrawing(this, space);
	}




}

export default starViewDef;

starViewDef.viewClassName = 'starViewDef';
