/*
** flatDrawingViewDef -- main viewDef for 2d image of 1d space
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import {abstractViewDef} from './abstractViewDef';
import {flatDrawing} from './flatDrawing';

class flatDrawingViewDef extends abstractViewDef {
	static displayName = 'Flat View';

	constructor(viewName, canvas, space, avatar) {
		super(viewName, canvas, space, avatar);

		if (! this.space || !this.avatar) {
			debugger;
			throw  `flatDrawingViewDef: being created without space or avatar`;
		}

		// create relevant drawings
		new flatDrawing(this, space);
	}
}

export default flatDrawingViewDef;
