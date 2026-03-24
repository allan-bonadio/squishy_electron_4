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

	}
}

export default garlandScene;

