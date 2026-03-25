/*
** garlandScene -- main scene for 3d quantum waves for endless and well
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

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
		const projectionMatrix = mat4.create();
		mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);


		// set drawing position to 'identity' point, the center of the scene
		const modelViewMatrix = mat4.create();

		//   Move the drawing position a bit to where I want to start the square
let cubeRotation=1;

		mat4.translate(
			modelViewMatrix, // destination matrix
			modelViewMatrix, // matrix to translate
			[-0.0, 0.0, -6.0]
		); // amout to translate

		mat4.rotate(
			modelViewMatrix, //destination matrix
			modelViewMatrix, //matrix to rotate
			cubeRotation, //amount to rotate in radians
			[0, 0, 1]
		); //axis to rotate around (z)

		mat4.rotate(
			modelViewMatrix, //destination matrix
			modelViewMatrix, //matrix to rotate
			cubeRotation * 0.7, //amount to rotate in radians
			[0, 1, 0]
		); //axis to rotate around (x)


	}
}

export default garlandScene;

