/*
** flatScene -- main scene for 2d image of 1d space
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import abstractScene from './abstractScene.js';
import flatDrawing from './flatDrawing.js';
import eAvatar from '../engine/eAvatar.js';
import qeConsts from '../engine/qeConsts.js';
// eslint-disable-next-line no-unused-vars
import ticDrawing from './ticDrawing.js';

class flatScene extends abstractScene {
	// must assign space after constructor??
	constructor(sceneName, ambiance, space) {
		super(sceneName, ambiance);

		this.space = space;

		// create avatar but don't stick buffers; the drawing does that
		this.avatar = eAvatar.createAvatar(qeConsts.avFLAT, sceneName);

		// create relevant drawings.  Do not change this order;
		// spent a long time on this.
		this.drawings = [
			//new ticDrawing(this, space),
			new flatDrawing(this, space),
		];


	}
}

export default flatScene;

