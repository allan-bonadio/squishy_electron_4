/*
** garlandScene -- main scene for 3d quantum waves for endless and well
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import {mat4} from 'gl-matrix';

import abstractScene from './abstractScene.js';
import garlandDrawing from './garlandDrawing.js';
import {dump4x4} from './math3d.js';
import eAvatar from '../engine/eAvatar.js';


class garlandScene extends abstractScene {
	// inputInfo.continuum = 'endless' or 'well'
	constructor(sceneName, ambiance, inputInfo, space) {
		super(sceneName, ambiance);

		this.space = space;
		this.inputInfo = inputInfo;

		// create avatar but don't stick buffers; the drawing does that
		this.avatar = eAvatar.createAvatar(sceneName);

		// create relevant drawings.  Do not change this order;
		// spent a long time on this.
		this.drawings = [
			new garlandDrawing(this, space),
		];

		// make the projection matrix
		const fieldOfView = (45 * Math.PI) / 180; // in radians
		const aspect = ambiance.canvas.width / ambiance.canvas.height;
		const zNear = 0.1;
		const zFar = 100.0;
		const proj = mat4.create();
		mat4.perspective(proj, fieldOfView, aspect, zNear, zFar);


		// the original matrix.  The glsl will multiply on the rotation matrix.
		const origMatrix = mat4.create();

		mat4.translate(
			origMatrix, // destination
			origMatrix, //to translate
			[-0.0, 0.0, -6.0]);

		let yRotation = 0;
		mat4.rotate(
			origMatrix,
			origMatrix,
			yRotation * 0, //amount to rotate in radians
			[0, 1, 0]);

		mat4.multiply(origMatrix, origMatrix, proj);

		dump4x4(origMatrix, `orig matrix from scene`);

		this.origMatrix = origMatrix;
	}
}

export default garlandScene;

