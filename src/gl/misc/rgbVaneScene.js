/*
** rgbVaneDrawing -- draw a diagnostic triange in space sortof
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import {vec4, mat4} from 'gl-matrix';

import abstractDrawing from '../abstractDrawing.js';
import abstractScene from '../abstractScene.js';
import {drawingUniform, drawingAttribute} from '../drawingVariable.js';
// import cx2rygb from '../cx2rygb/cx2rygb.glsl.js';
import qeFuncs from '../../engine/qeFuncs.js';
import qeConsts from '../../engine/qeConsts.js';
import {dump4x4} from '../helpers3D.js';
import eAvatar from '../../engine/eAvatar.js';

//this doesn't work yet.  Not sure if I'll keep it.

// diagnostic purposes; draws more per vertex
let traceDrawPoints = false;
let traceDrawing = false;
let traceDrawLines = false;
let traceGLAfterDrawing = false;
let traceMatrix = true;
let traceReload = false;


/* ******************************************* vane scene */

const vertexShaderSrc = `// rgbVane vertexShader
#line 25
precision highp float;

attribute vec4 pos;
attribute vec4 color;
varying vec4 colorVar;
uniform mat4 matrix;

void main() {
	gl_PointSize = 4.;

	gl_Position = pos * matrix;
	//gl_Position = vec4(pos, 0, 1);

	colorVar = color;


	// for actual testing of cx to rygb
	//colorVar = vec4(0.4, 0.6, 0.2, 1.0);
}
`;

const fragmentShaderSrc = `
#line 45
// rgbVane fragShader
precision highp float;
varying vec4 colorVar;

void main() {
	gl_FragColor = colorVar;
	//gl_FragColor = vec4(colorVar);
}
`;

class rgbVaneScene extends abstractScene {
	// doesn't need space or inputinfo
	constructor(sceneName, ambiance, paintingNeeds, space) {
		super(sceneName, ambiance, paintingNeeds, space);

		this.canvas = ambiance.canvas;
		this.gl = ambiance.gl;

		// create avatar but don't add buffers; the drawing does that
		this.avatar = eAvatar.createAvatar(sceneName);

		// create relevant drawings.
		this.drawings = [ new rgbVaneDrawing(this) ];
	}
}

/* ******************************************* vane drawing */


// The Vane is like a weather vane, outdoors on a post, pointing
// north, east etc.  This one is a pyramid peaking at 0,0,0., with
// three legs coming out in the x y z directions.  x is red, length 1,
// y is green, length 2, and z blue, length 3.


// vertex positions
const posData = new Float32Array([
0, 0, 0, 1,
1, 0, 0, 1,
0, 2, 0, 1,
0, 0, 0, 1,
0, 2, 0, 1,
0, 0, 1, 1,
0, 0, 0, 1,
0, 0, 1, 1,
1, 0, 0, 1,
0, 0, 0, 1,
]);

// just rgb for the vertices above
const colorData = new Float32Array([
1, 1, 1, 1,
1, 0, 0, 1,  // red
0, 1, 0, 1,
1, 1, 1, 1,
0, 1, 0, 1,  // green
0, 0, 1, 1,
1, 1, 1, 1,  // white
0, 0, 1, 1,
1, 0, 0, 1,
1, 1, 1, 1,
]);


// the original display that's worth watching: rgbVane upside down hump graph
export class rgbVaneDrawing extends abstractDrawing {
	constructor(scene) {
		super(scene, 'rgbVaneDrawing');

		// each point in the wave results in two vertices, but it's a strip so consecutive vertices.
		// And each of those is four single floats going to the GPU
		this.avatar = scene.avatar;
		this.avatar.attachViewBuffer(1, null, 4, 10, 'pos');
		this.avatar.attachViewBuffer(2, null, 4, 10, 'color');

		this.vertexShaderSrc = vertexShaderSrc;
		this.fragmentShaderSrc = fragmentShaderSrc;

		//console.log(`attachViewBuffer on scene ${scene.sceneName}`);

		this.componentFloats = 4;
		this.nVertices = posData.length / this.componentFloats;
		if (posData.length != colorData.length)
			throw `posData length ${posData.length} != colorData length ${colorData.length}`;
	}

	// loads view buffer from corresponding wave, calculates highest norm.
	// one time set up of variables for this drawing, every time canvas and scene is recreated
	createVariables() {
		this.gl.useProgram(this.program);
		if (traceDrawing)
			console.log(`🌀🌀🌀 rgbVaneDrawing ${this.sceneName}: creatingVariables`);

		this.matrixUniform = new drawingUniform('matrix', this,
			() => {
				//let matrix = this.scene.paintingNeeds.unifiedMatrix;
				let matrix = mat4.create();
				// mat4.scale(matrix, matrix, [.3, .3, .3, .3, ]);
				// mat4.rotateX(matrix, matrix, 1.0);
				// mat4.rotateY(matrix, matrix, 2.0);

				let canvas = this.gl.canvas;
				let aspect = canvas.width / canvas.height;
				let fovy = 1;
				let near = 0.5, far = 100;
				mat4.perspectiveNO(matrix, fovy, aspect, near, far);

				mat4.rotateX(matrix, matrix, 1.5);
				mat4.rotateZ(matrix, matrix, 1.5);

				 if (!isFinite(matrix[0])) debugger;

				if (traceMatrix) {
					dump4x4('🌀🌀🌀 rgbVaneDrawing reloading matrix', matrix);
				}
				return {value: matrix, type: 'Matrix4fv'};
			}
		);

		this.posAttr = new drawingAttribute('pos', this, 4,
			() => {
			if (traceReload) {
				console.log(`🌀🌀🌀 rgbVaneDrawing  posAttr:  `,
					posData);
			}

			return posData;
		});

		this.colorAttr = new drawingAttribute('color', this, 4,
			() => {
				if (traceReload) {
					console.log(`🌀🌀🌀 rgbVaneDrawing  colorAttr:  `,
							colorData);
			}

			return colorData;
		});

	}

	// called for each image frame on th canvas.  TODO: roll specialInfo into the input Data Arrays
	draw(width, height, paintingNeeds) {
		if (traceDrawing) {
			console.log(`🌀🌀🌀 rgbVane Drawing  ${this.avatarLabel}: `
				+` width=${width}, height=${height}  drawing ${this.vertexCount/2} points `
				+` matrix=${this.matrix}`);
		}
		const gl = this.gl;
		gl.useProgram(this.program);


		//this.drawVariables.forEach(v => v.reloadVariable());

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.nVertices);
		if (traceDrawing) {
			console.log(`🌀🌀🌀just drewArays-rgbVane on avatar ptr=${this.avatar._pointer_} `
				+` this.avatar.label=${this.avatar.label}, `
				+` buffer label=${this.avatar.bufferNames[0]}`);
		}

		if (traceDrawLines) {
			gl.lineWidth(1);  // it's the only option anyway
			gl.drawArrays(gl.GL_LINE_STRIP, first, count);
		}

		if (traceDrawPoints)
			gl.drawArrays(gl.POINTS, first, count);

		if (traceGLAfterDrawing) {
			this.simulateGL(
				`🌀🌀🌀 finished drawing in rgbVaneDrawing.js; drew buf:`);
			console.log(`🌀🌀🌀  matrixUniform=`, this.matrixUniform.reloadFunc());
		}
	}

	// simulate and calculate what WebGL would calculate, and dump that.
	// give or take fidelity of the below.
	simulateGL() {
		let startEnd2 = this.space.startEnd2;
		let first = startEnd2.start2;
		let count = startEnd2.end2 - startEnd2.start2;
		let vertexSerial, ix, point, odd, factor, row;
		let rows = this.avatar.getViewBuffer(0);
		let gl_Position = vec4.create();

		const _ = c => (gl_Position[c] / gl_Position[3]).toFixed(4).padStart(7);

		// collect these otherwise the console merges dup lines
		let text = ` 🌀🌀 what the GPU calculates, only the `
			+`${count} vertices, not the points:`;

		for (let i = 0; i < count; i++) {
			let vertexSerial = first + i;
			let rs = vertexSerial * 4;
			row = vec4.fromValues(rows[rs], rows[rs+1], rows[rs+2], rows[rs+3]);
			ix = Math.floor(vertexSerial / 2);
			point = vec4.create();
			odd = (ix & 1);
			factor = odd ? INNER_FACTOR : OUTER_FACTOR;
			point[0] = row[0] * factor;
			point[1] = row[1] * factor;
			point[2] = 0;
			point[3] = vertexSerial;

			// point * matrix;
			vec4.transformMat4(gl_Position, point, this.scene.paintingNeeds.unifiedMatrix);
			text += ` 🌀🌀${(ix + '').padStart(3)} `
				+` ${_(0)}   ${_(1)}   ${_(2)}  \n`;
			//dblog(` 🌀🌀${_(0)}   ${_(1)}   ${_(2)}   ${_(3)}  `);
		}
		dblog(text + `  🌀🌀 `);
	}
}

export default rgbVaneScene;

