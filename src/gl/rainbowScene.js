/*
** rainbowScene -- draw a disc for the colors |u| = 1
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/

import {abstractScene} from './abstractScene.js';
import {rainbowDrawing} from './rainbowDrawing.js';
// eslint-disable-next-line no-unused-vars
import {ticDrawing} from './ticDrawing.js';
import qeConsts from '../engine/qeConsts.js';
import eAvatar from '../engine/eAvatar.js';

	const nSegs = 36;
	const nVerts = nSegs + 1;

class rainbowScene extends abstractScene {

	constructor(sceneName, ambiance, inputInfo) {
		super(sceneName, ambiance);

		this.canvas = ambiance.canvas;
		this.gl = ambiance.gl;

		// create avatar but don't add buffers; the drawing does that
		this.avatar = eAvatar.createAvatar(qeConsts.avRAINBOW, sceneName);

		// create relevant drawings.
		this.drawings = [ new rainbowDrawing(this) ];
	}
}


export default rainbowScene;

