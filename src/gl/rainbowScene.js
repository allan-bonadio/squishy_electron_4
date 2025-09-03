/*
** rainbowScene -- draw a disc for the colors |u| = 1
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/

import {abstractScene} from './abstractScene.js';
import * as THREE from 'three';
import {rainbowDrawing} from './rainbowDrawing.js';
// eslint-disable-next-line no-unused-vars
import {ticDrawing} from './ticDrawing.js';
import qeConsts from '../engine/qeConsts.js';
import eAvatar from '../engine/eAvatar.js';

class rainbowScene extends abstractScene {

	constructor(sceneName, canvas, space, av) {
		super(sceneName, canvas, space, av);

		// Repurpose the avatar for our stuff.  Close enough as long as you have
		// enough datapoints.
		this.canvas = canvas;
		this.avatar = av;
		//av.ints[2] = qeConsts.avRAINBOW;

		// create relevant drawings.
		this.drawings = [ new rainbowDrawing(this) ];
	}
}

export default rainbowScene;

