/*
** garlandScene -- main scene for 3d quantum waves for endless and well
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import {mat4} from 'gl-matrix';

import abstractScene from './abstractScene.js';
import eGarlandDrawing from './eGarlandDrawing.js';
import wGarlandDrawing from './wGarlandDrawing.js';
import eAvatar from '../engine/eAvatar.js';
// eslint-disable-next-line no-unused-vars
//import ticDrawing from './ticDrawing.js';

// I'm cheating by using the same scene for these two alternate drawings.
// hoping also to share some code in this file?

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
		if ('endless' == inputInfo.continuum) {
				this.drawings = [
					new eGarlandDrawing(this, space),
				];
		}
		else if ('well' == inputInfo.continuum) {
				this.drawings = [
					new wGarlandDrawing(this, space),
				];
		}

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

		let yRotation = .2;
		mat4.rotate(
			origMatrix,
			origMatrix,
			yRotation * 0.7, //amount to rotate in radians
			[0, 1, 0]);

        mat4.multiply(origMatrix, origMatrix, proj);

        this.origMatrix = origMatrix;
	}
}

export default garlandScene;

