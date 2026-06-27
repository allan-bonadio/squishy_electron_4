/*
** garlandScene -- main scene for 3d quantum waves for endless and well
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import {mat4} from 'gl-matrix';

import abstractScene from './abstractScene.js';
import garlandDrawing from './garlandDrawing.js';
import {rgbVaneDrawing} from './misc/rgbVaneScene.js';
import eAvatar from '../engine/eAvatar.js';


class garlandScene extends abstractScene {
	constructor(sceneName, ambiance, paintingNeeds, space) {
		super(sceneName, ambiance, paintingNeeds, space);

		// create avatar but don't stick buffers; the drawing does that
		this.avatar = eAvatar.createAvatar(sceneName);

		// all the different buffers we might use in this scene
		this.garlandAvatarID = 0;

		this.rgbVanePosAvatarID = 1;  // testing only
		this.rgbVaneColorAvatarID = 2;  // testing only
		this.plusFieldAvatarID = 3;  // testing only

		// create relevant drawings.
		this.drawings = [
			new garlandDrawing(this, space),
			new rgbVaneDrawing(this, space),
		];

	}

}

export default garlandScene;

