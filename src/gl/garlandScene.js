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
	constructor(sceneName, ambiance, inputInfo, space) {
		super(sceneName, ambiance, inputInfo, space);

		this.space = space;
		this.inputInfo = inputInfo;

		// create avatar but don't stick buffers; the drawing does that
		this.avatar = eAvatar.createAvatar(sceneName);

		// create relevant drawings.
		this.drawings = [
			new garlandDrawing(this, space),
		];

		const N = this.space.nStates;

		// make the projection matrix.. never changes
		const fieldOfView = (45 * Math.PI) / 180; // in radians
		const aspect = ambiance.canvas.clientWidth / ambiance.canvas.clientHeight;
		const zNear = 0.1;
		const zFar = N * 3;
		const proj = mat4.create();
		mat4.perspective(proj, fieldOfView, aspect, zNear, zFar);


		// the original matrix.  The glsl will multiply on the rotation matrix.
		const origMatrix = mat4.create();
		mat4.translate(
			origMatrix, // destination
			origMatrix, //to translate
			[0.0, 0.0, -N]);

		let to = 5.30;
		let bo = 5.19;
		let zRotation = (to-bo) * Math.random() + bo;
		//let zRotation = 5.30
		dblog(`☕️ zRotation: ${zRotation}`)

		mat4.rotate(
			origMatrix, //destination matrix
			origMatrix, //matrix to rotate
			zRotation, //amount to rotate in radians
			[0, 0, 1]
		); //axis to rotate around (z)


		let top = 5.20;
		let bot = 4.33;
		let yRotation = (top-bot) * Math.random() + bot;
		//let yRotation = 5.7;
		//dblog(`☕️ yRotation: ${yRotation}`)

		mat4.rotate(
			origMatrix,
			origMatrix,
			yRotation, //amount to rotate in radians
			[0, 1, 0]);

		mat4.multiply(origMatrix, origMatrix, proj);

		dump4x4(origMatrix, `orig matrix from scene`);

		this.origMatrix = origMatrix;
	}
}

export default garlandScene;

