/*
** flatDrawingViewDef -- main viewDef for 2d image of 1d space
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import {abstractViewDef} from './abstractViewDef.js';
import {flatDrawing} from './flatDrawing.js';
// eslint-disable-next-line no-unused-vars
import {ticDrawing} from './ticDrawing.js';

class flatDrawingViewDef extends abstractViewDef {
	static displayName = 'Flat View';

	constructor(viewName, glview, space, avatar) {
		super(viewName, glview, space, avatar);

		if (! this.space || !this.avatar) {
			debugger;
			throw  `flatDrawingViewDef: being created without space or avatar`;
		}

		// create relevant drawings.  Somehow I can't get the tics to work with the flat.
		this.drawings = [new flatDrawing(this)];


	}
}

export default flatDrawingViewDef;

