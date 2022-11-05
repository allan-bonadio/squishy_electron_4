/*
** flatDrawingViewDef -- main viewDef for 2d image of 1d space
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import {abstractViewDef} from './abstractViewDef';
import {flatDrawing} from './flatDrawing';
import {ticDrawing} from './ticDrawing';

class flatDrawingViewDef extends abstractViewDef {
	static displayName = 'Flat View';

	constructor(viewName, glview, space, avatar) {
		super(viewName, glview, space, avatar);

		if (! this.space || !this.avatar) {
			debugger;
			throw  `flatDrawingViewDef: being created without space or avatar`;
		}

		//this.plugInAttrVariable = (name, ) => {
		//	gl.enableVertexAttribArray(...);
		//	gl.bindBuffer(gl.ARRAY_BUFFER, bufferForAttribute);
		//	gl.vertexAttribPointer(...);
		//}

		// these define the attr 'name' ids, small ints used internally by the GPU chip
		// we'll call binidAttribLocation() on each before linking
		// this has to be ALL the attr names on all the drawings.  All must be different.
		//this.attrVariableNames = ['row', 'corner'];


		// create relevant drawings.  Somehow I can't get the tics to work with the flat.
		this.drawings = [new flatDrawing(this)];
		//this.drawings = [new ticDrawing(this)];
		//this.drawings = [new flatDrawing(this), new ticDrawing(this)];


	}
}

export default flatDrawingViewDef;
