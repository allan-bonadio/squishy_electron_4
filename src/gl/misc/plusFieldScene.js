/*
** plusFieldDrawing -- draw a diagnostic triange in space sortof
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
let traceDrawing = true;
let traceMatrix = false;
let traceReload = true;


/* ******************************************* plus scene */

class plusFieldScene extends abstractScene {
	// doesn't need space or inputinfo
	constructor(sceneName, ambiance, paintingNeeds, space) {
		super(sceneName, ambiance, paintingNeeds, space);

		// create avatar but don't add buffers; the drawing does that
		this.avatar = eAvatar.createAvatar(sceneName);

		// create relevant drawings.
		this.drawings = [ new plusFieldDrawing(this) ];
	}
}

/* ******************************************* plus drawing */

const vertexShaderSrc = `// plusField vertexShader
#line 48
precision highp float;

attribute vec4 tip;
varying vec4 colorVar;
uniform mat4 matrix;

void main() {
	gl_PointSize = 4.;

	vec4 posT = matrix * tip;
	gl_Position = posT;

	colorVar = vec4(1,1,.5,1);;
}
`;

const fragmentShaderSrc = `
#line 70
// plusField fragShader
precision highp float;
varying vec4 colorVar;

void main() {
	gl_FragColor = colorVar;
}
`;


// This just sets up six-pointed stars all over the volume for testing

const RADIUS = 1;
const SIDE = 2 * RADIUS + 1;
const nPLUSSES = SIDE ** 3;

// two  verts each * 3 directions
const nVERTICES = 6 * nPLUSSES;

const ARM_LENGTH = .1;

// the original display that's worth watching: plusField upside down hump graph
export class plusFieldDrawing extends abstractDrawing {
	constructor(scene) {
		super(scene, 'plusFieldDrawing');

		// each point in the wave results in two vertices, but it's a strip so consecutive vertices.
		// And each of those is four single floats going to the GPU
		this.avatar = scene.avatar;
		// id 3, no mem, 4 floats per vertex,
		this.buf = this.avatar.attachViewBuffer(3, null, 4, nVERTICES, 'tip');

		this.vertexShaderSrc = vertexShaderSrc;
		this.fragmentShaderSrc = fragmentShaderSrc;

		//console.log(`attachViewBuffer on scene ${scene.sceneName}`);

		this.componentFloats = 4;
		this.populate();
	}

	dump() {
		let total = [];
		let buf = this.buf;
		// loop over
		for (let r = 0; r < SIDE * SIDE * 3; r++) {
			for (let c = 0; c < SIDE; c++) {
				for (let j = 0; j < 4; j++) {
					let ix = ((r *  SIDE + c) * SIDE + j)
					total.push(this.buf[ix].toFixed(1).padStart(6));
				}
				total.push(`\n`);
			}
			total.push(`\n`);
		}
		dblog(`the plus field should have ${3 * SIDE**3 * 8}: `, total.join(' '));
	}

	/* ******************************************* populating */

	populate() {
		let offset = 0;
		let buf = this.buf;
		let here = [0, 0, 0];
		let startOf;

		// direction line points in, x y and z but we use 0 1 2
		for (let direction = 0; direction < 3; direction++) {

			// the position of the center of the plus, along x axis
			for (let xx = -RADIUS; xx < RADIUS; xx++) {
				here[0] = xx;

				// along y axis
				for (let yy = -RADIUS; yy < RADIUS; yy++) {
					here[1] = yy;

					// along z axis
					for (let zz = -RADIUS; zz < RADIUS; zz++) {
						here[2] = zz;
						//(xx * SIDE + yy) * SIDE + zz;

						// for each segment, two vertices.  Each is 4 floats.
						// last float is just a counter
						startOf = offset;
						buf[offset++] = xx;
						buf[offset++] = yy;
						buf[offset++] = zz;
						buf[offset++] = offset/4;
						buf[startOf + direction] += ARM_LENGTH

						startOf = offset;
						buf[offset++] = xx;
						buf[offset++] = yy;
						buf[offset++] = zz;
						buf[offset++] = offset/4;
						buf[startOf + direction] -= ARM_LENGTH

					}
				}
			}
		}
		this.dump();
		dblog(this.buf);
	}

	/* ******************************************* populating */

	// loads view buffer from corresponding wave, calculates highest norm.
	// one time set up of variables for this drawing, every time canvas and scene is recreated
	createVariables() {
		this.gl.useProgram(this.program);
		if (traceReload)
			console.log(` ➕➕➕➕ plusFieldDrawing ${this.sceneName}: creatingVariables`);

		this.matrixUniform = new drawingUniform('matrix', this,
			() => {
			let matrix = this.scene.paintingNeeds.unifiedMatrix;

				 if (!isFinite(matrix[0])) debugger;

				if (traceMatrix) {
					dump4x4('➕➕➕ plusFieldDrawing reloading matrix', matrix);
				}
				return {value: matrix, type: 'Matrix4fv'};
			}
		);

		this.tipAttr = new drawingAttribute('tip', this, 4,
			() => {
			if (traceReload) {
				console.log(`➕➕➕ plusFieldDrawing  tipAttr:  `, this.buf);
			}

			return this.buf;
		});

	}

	// called for each image frame on th canvas.  TODO: roll specialInfo into the input Data Arrays
	draw(width, height, paintingNeeds) {
		if (traceDrawing) {
			console.log(`➕➕➕ plusField Drawing  ${this.avatarLabel}: `
				+` width=${width}, height=${height}  drawing ${this.vertexCount/2} points `
				+` matrix=${this.matrix}`);
		}
		const gl = this.gl;
		gl.useProgram(this.program);

		//this.drawVariables.forEach(v => v.reloadVariable());

		gl.lineWidth(1);  // it's the only option anyway
		gl.drawArrays(gl.GL_LINE_STRIP, 0, nVERTICES);

		if (traceDrawing) {
			console.log(`➕➕➕just drewArays-plusField on avatar ptr=${this.avatar._pointer_} `
				+` this.avatar.label=${this.avatar.label}, `
				+` buffer label=${this.avatar.bufferNames[0]}`);
		}


		if (traceDrawPoints)
			gl.drawArrays(gl.POINTS, 0, nVERTICES);
	}

}

export default plusFieldScene;

