/*
** flatDrawingViewDef -- main viewDef for 2d image of 1d space
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import {abstractViewDef} from './abstractViewDef';
import {flatDrawing} from './flatDrawing';
import {potentialDrawing} from './potentialDrawing';

class flatDrawingViewDef extends abstractViewDef {
	static displayName = 'Flat View';

	constructor(viewName, canvas, space) {
		super(viewName, canvas, space);

		if (! this.space) throw  `flatDrawingViewDef: being created without space`;

		// create relevant drawings
		new flatDrawing(this, space);

// get rid of this
//		if (options.potential)
//			new potentialDrawing(this, space);

		// maybe this is not needed on the instance?  this.name = 'Flat View';
	}
}


export default flatDrawingViewDef;

