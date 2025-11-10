/*
** Noise View Def -- an old prototype used to develop the View Variable system
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import {abstractScene} from '../abstractScene.js';
import {abstractDrawing} from '../abstractDrawing.js';
import {drawingUniform, drawingAttribute} from '../drawingVariable.js';


const IMAGE_WIDTH = 256;
const IMAGE_PIXELS = IMAGE_WIDTH * IMAGE_WIDTH;
let vertices = new Float32Array(IMAGE_PIXELS * 2);  // vec2
let colors = new Float32Array(IMAGE_PIXELS * 3);  // vec3

// create this table the way drawingAttribute likes it
function createNoise() {
	for (let x = 0; x < IMAGE_WIDTH; x++) {
		for (let y = 0; y < IMAGE_WIDTH; y++) {
			let index = x * IMAGE_WIDTH + y;
			vertices[index * 2] = x;
			vertices[index * 2 + 1] = y;

			colors[index * 3] = Math.random();
			colors[index * 3 + 1] = Math.random();
			colors[index * 3 + 2] = Math.random();
		}

	}

	vertices.nTuples = IMAGE_PIXELS;
	corners.nTuples = IMAGE_PIXELS;
}

// keep these #lines pointing to the next line number in the file!
const vertexSrc = `
#line 38
precision highp float;
uniform int imageWidth;
varying vec4 color;

attribute vec2 vertices;
attribute vec3 colors;

void main() {
	gl_Position = vertices.xy / imageWidth * 2. - 1.;
	gl_Position.zw = vec2(0., 1.);

	color.rgb =colors.rgb;
	color.a = 1.;

	gl_PointSize = 1.;
}
`;

const fragmentSrc = `
#line 58
precision highp float;
varying vec4 color;

void main() {
	gl_FragColor = color;
}
`;

export class noiseDrawing extends abstractDrawing {

	constructor(sceneName, ambiance, inputInfo, space) {
		super(sceneName, ambiance, inputInfo, space);

		this.vertexShaderSrc = vertexSrc;
		this.fragmentShaderSrc = fragmentSrc;
	}

	// all to do this one differently
	createVariables() {
		this.setDrawing();
		//debugger;

		this.imageWidthUni =
			new drawingUniform('imageWidth', this,
				() => { return {value: IMAGE_WIDTH, type: 'i'}});

		createVertices();

		this.verticesAttr = new drawingAttribute('vertices', this, 2, () => {return {value: vertices, type: 'vec2'}});
		this.colorsAttr = new drawingAttribute('colors', this, 2, () => {return {value: colors, type: 'vec2'}});
	}

	draw(width, height, specialInfo) {
		const gl = this.gl;
		this.setDrawing();
		debugger;

		gl.viewport(... drawing calculates this on the fly);

		//this.cornerColorUni.reloadVariable();

		gl.drawArrays(gl.POINTS, 0, IMAGE_PIXELS);
	}

}

/* **************************************************************** Noise View Def */


export class noiseScene extends abstractScene {
	constructor(sceneName, ambiance) {
		super(sceneName, ambiance);

		if (! this.space) throw  new Error(`noiseScene: being created without space`);

		this.avatar = eAvatar.createAvatar(qeConsts.avRAINBOW, sceneName);

		// create relevant drawings
		this.drawings = [new noiseDrawing(this)];
	}
}

export default noiseScene;

noiseScene.sceneClassName = 'noiseScene';
