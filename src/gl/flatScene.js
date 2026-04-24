/*
** flatScene -- main scene for 2d image of 1d space
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

import abstractScene from './abstractScene.js';
import flatDrawing from './flatDrawing.js';
import eAvatar from '../engine/eAvatar.js';
// eslint-disable-next-line no-unused-vars
import ticDrawing from './ticDrawing.js';

class flatScene extends abstractScene {
	constructor(sceneName, ambiance, paintingNeeds, space) {
		super(sceneName, ambiance, paintingNeeds, space);

		this.PADDING_ON_BOTTOM = 1.02;

		// this.space = space;
		//this.paintingNeeds = paintingNeeds; done in abstract scene

		// create avatar but don't stick buffers; the drawing does that
		this.avatar = eAvatar.createAvatar(sceneName);

		// create relevant drawings.  Do not change this order;
		// spent a long time on this.
		this.drawings = [
			new ticDrawing(this, space),
			new flatDrawing(this, space),
		];


	}
}

export default flatScene;

