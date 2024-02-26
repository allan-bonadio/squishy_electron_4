/*
** flatViewDef -- main viewDef for 2d image of 1d space
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

import {abstractViewDef} from './abstractViewDef.js';
import {flatDrawing} from './flatDrawing.js';
// eslint-disable-next-line no-unused-vars
import {ticDrawing} from './ticDrawing.js';

class flatViewDef extends abstractViewDef {

	constructor(viewName, glview, space, avatar) {
		super(viewName, glview, space, avatar);

		if (! this.space || !this.avatar) {
			debugger;
			throw  `flatViewDef: being created without space or avatar`;
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

export default flatViewDef;

