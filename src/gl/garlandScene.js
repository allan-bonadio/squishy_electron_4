/*
** garlandScene -- main scene for 3d quantum waves for endless and well
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import {mat4} from 'gl-matrix';

import abstractScene from './abstractScene.js';
import garlandDrawing from './garlandDrawing.js';
import {dump4x4} from './helpers3D.js';
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

        // code moved to waveVista and waveAux
//		const N = this.space.nPoints;
//
//		let to = 5.30;
//		let bo = 5.19;
//		let zRotation = (to-bo) * Math.random() + bo;
//		//let zRotation = 5.30
//		dblog(`☕️ zRotation: ${zRotation}`)
//
//		mat4.rotate(
//			origMatrix, //destination matrix
//			origMatrix, //matrix to rotate
//			zRotation, //amount to rotate in radians
//			[0, 0, 1]
//		); //axis to rotate around (z)
//
//
//		let top = 5.20;
//		let bot = 4.33;
//		let yRotation = (top-bot) * Math.random() + bot;
//		//let yRotation = 5.7;
//		//dblog(`☕️ yRotation: ${yRotation}`)
//
//		mat4.rotate(
//			origMatrix,
//			origMatrix,
//			yRotation, //amount to rotate in radians
//			[0, 1, 0]);
//
//		mat4.multiply(origMatrix, origMatrix, proj);
//
//		dump4x4(origMatrix, `orig matrix from scene`);
//
//		this.origMatrix = origMatrix;
	}

}

export default garlandScene;

