/*
** Star View Def -- an old prototype used to develop the View Variable system
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import {abstractViewDef} from '../abstractViewDef.js';
import {abstractDrawing} from '../abstractDrawing.js';
import {viewUniform, viewAttribute} from '../viewVariable.js';


let corners;

// create this table the way viewAttribute likes it
function createCorners() {
	// create the data for the corners attribute
	const sin = Math.sin;
	const cos = Math.cos;
	corners = new Float32Array([
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
	corners.nTuples = corners.length / 2;
}

// keep these #lines pointing to the next line number in the file!
const vertexSrc = `
#line 43
precision highp float;
uniform vec4 cornerColorUni;
varying vec4 nuColor;

attribute vec2 corner;
//attribute vec4 corner;

// always returns 0...1
float scramble(float a) {
	return fract(exp(a + 7.12));
}

void main() {
	gl_Position = corner.xyyy;
	gl_Position.zw = vec2(0., 1.);

	nuColor.r = scramble(corner.x);
	nuColor.g = scramble(corner.y + cornerColorUni.g);
	nuColor.b = scramble(corner.x + corner.y);
	nuColor.a = scramble(corner.x - corner.y);

	gl_PointSize = 10.;  // dot size, actually a crude square
}
`;

const fragmentSrc = `
#line 70
precision highp float;
uniform vec4 cornerColorUni;
varying vec4 nuColor;

void main() {
	// colored triangle, depends on the uniform?
	gl_FragColor = nuColor;
	//gl_FragColor = cornerColorUni;
	//gl_FragColor = vec4(0., .5, 1., 1.);
}
`;

export class starDrawing extends abstractDrawing {

	constructor(viewDef) {
		super(viewDef, 'starDrawing');

		this.vertexShaderSrc = vertexSrc;
		this.fragmentShaderSrc = fragmentSrc;
	}

	// all to do this one differently
	createVariables() {
		this.setDrawing();
		//debugger;

		this.cornerColorUni =
			new viewUniform('cornerColorUni', this,
				() => {
					return {value: [0, 1, .5, 1], type: '4fv'}
				}
			);

//		const cornerAttributeLocation = gl.getAttribLocation(this.program, 'corner');
//		const cornerBuffer = gl.createBuffer();  // actual ram in GPU chip
//		gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);


		createCorners();

		this.cornerAttr = new viewAttribute('corner', this, 2, () => corners);
		//this.cornerAttr.attachArray(corners, 2);
	}

	draw() {
		const gl = this.gl;
		this.setDrawing();
		//debugger;

		// is this a good place to do this?
		gl.lineWidth(1.0);  // it's the only option anyway

		this.cornerColorUni.reloadVariable();

		// for EACH type, that's enabled, draw with it.  fun!
		starViewDef.typesList.forEach(type => {

			gl.drawArrays(gl[type], 0, corners.nTuples);
		})
	}

}

/* **************************************************************** Star View Def */


export class starViewDef extends abstractViewDef {
	static displayName = 'Star View';

	constructor(viewName, glview, space, avatar) {
		super(viewName, glview, space, avatar);

		if (! this.space || !this.avatar) {
			throw  new Error(`flatDrawingViewDef: being created without space or avatar`);
		}

		// create relevant drawings
		this.drawings = [new starDrawing(this)];
	}
}

export default starViewDef;

starViewDef.viewClassName = 'starViewDef';
