/*
** Star View Def -- an old prototype used to develop the View Variable system
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import {abstractScene} from '../abstractScene.js';
import {abstractDrawing} from '../abstractDrawing.js';
import {drawingUniform, drawingAttribute} from '../drawingVariable.js';


let corners;

// create this table the way drawingAttribute likes it
function createVertices() {
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
#line 38
precision highp float;
uniform vec4 cornerColorUni;
varying vec4 nuColor;

attribute vec2 corner;

// always returns 0...1
float scramble(float a) {
	return fract(exp(a/8. + 1.12));
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
#line 7065
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
			new drawingUniform('cornerColorUni', this,
				() => {
					return {value: [0, 1, .5, 1], type: '4fv'}
				}
			);

		createVertices();

		this.cornerAttr = new drawingAttribute('corner', this, 2, () => corners);
		//this.cornerAttr.attachArray(corners, 2);
	}

	draw(width, height, specialInfo) {
		const gl = this.gl;
		this.setDrawing();
		//debugger;

		gl.viewport(0, 0, width, height);

		// is this a good place to do this?
		gl.lineWidth(1.0);  // it's the only option anyway

		this.cornerColorUni.reloadVariable();

		// for EACH type, that's enabled, draw with it.  fun!
		starScene.typesList.forEach(type => {

			gl.drawArrays(gl[type], 0, corners.nTuples);
		})
	}

}

/* **************************************************************** Star View Def */


export class starScene extends abstractScene {
	constructor(sceneName, ambiance, space, avatar) {
		super(sceneName, ambiance, space, avatar);

		if (! this.space || !this.avatar) {
			throw  new Error(`starScene: being created without space or avatar`);
		}

		// create relevant drawings
		this.drawings = [new starDrawing(this)];
	}
}

export default starScene;

starScene.sceneClassName = 'starScene';
