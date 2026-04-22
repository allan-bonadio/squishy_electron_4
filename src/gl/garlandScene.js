/*
** garlandScene -- main scene for 3d quantum waves for endless and well
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import {mat4} from 'gl-matrix';

import abstractScene from './abstractScene.js';
import garlandDrawing from './garlandDrawing.js';
//import rgbVaneDrawing from './rgbVaneDrawing.js';
import eAvatar from '../engine/eAvatar.js';


class garlandScene extends abstractScene {
	constructor(sceneName, ambiance, paintingNeeds, space) {
		super(sceneName, ambiance, paintingNeeds, space);

		this.space = space;
		this.paintingNeeds = paintingNeeds;

		// create avatar but don't stick buffers; the drawing does that
		this.avatar = eAvatar.createAvatar(sceneName);

		// create relevant drawings.
		this.drawings = [
			new garlandDrawing(this, space),
			// cant get it too work dont care  new rgbVaneDrawing(this, space),
		];

	}

}

export default garlandScene;

