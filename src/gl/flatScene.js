/*
** flatScene -- main viewDef for 2d image of 1d space
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

import {abstractScene} from './abstractScene.js';
import {flatDrawing} from './flatDrawing.js';
// eslint-disable-next-line no-unused-vars
import {ticDrawing} from './ticDrawing.js';

class flatScene extends abstractScene {

	constructor(viewName, ambiance, space, avatar) {
		super(viewName, ambiance, space, avatar);

		if (! this.space || !this.avatar) {
			debugger;
			throw  `flatScene: being created without space or avatar`;
		}

		// normally autoranging would put the highest peak at the exact bottom.
		// but we want some extra space.  not much.
		this.PADDING_ON_BOTTOM = 1.02;

		// create relevant drawings.  Do not change this order;
		// spent a long time on this.
		this.drawings = [
			new ticDrawing(this),
			new flatDrawing(this),
		];


	}
}

export default flatScene;

