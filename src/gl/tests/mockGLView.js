/*
** mockGLView -- substitute for the real GLView in tests
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

//import webglLint from './node_modules_symlink/webgl-lint/webgl-lint.js';
import 'https://greggman.github.io/webgl-lint/webgl-lint.js';
import glAux from '../glAux.js';
import abstractViewDef from '../abstractViewDef.js';

import flatDrawingViewDef from '../flatDrawingViewDef.js';
import starViewDef from './starViewDef.js';

// this mostly replicates GLView in a lame sortof way
// I think we have a global namespace here... not sure
const $ = document.querySelector;
const $$=document.querySelectorAll;

let effectiveView = null;


export const mockAvatar = {
	loadViewBuffer() {
		console.log('loadViewBuffer');

	}
};

export const mockSpace = {

};

const viewClassNamez = {
	flat: flatDrawingViewDef,
	star: starViewDef,
}


// now it's on glAux object   export let preferWebGL2 = true;


export class mockGLView {
	constructor(vcName) {
		this.state = {canvas: null};
		this.space = mockSpace;
		this.avatar = mockAvatar;

		this.testViewClassName = vcName;
	}

	// just pretend
	setState(newValues) {
		Object.assign(this.state, newValues);
	}

	// yes we get the real canvas in here
	setGLCanvas(canvas) {
		if (this.canvas === canvas)
			return;  // already done
		this.canvas = canvas;

		// note deffault is wgl1
		glAux.preferWebGL2 = (localStorage.version == '2');

		this.aux = new glAux(canvas);
		this.gl = this.aux.gl;
		this.tagObject = this.aux.tagObject;
	}

	testViewClasses = {
	}

	// instantiate the view class we'll use
	initViewClass(viewClassName) {
		console.log(`initViewClass(${viewClassName})`);

		this.viewClassName = viewClassName;
		let vClass = viewClassNamez[viewClassName];
		this.testViewClasses[viewClassName] =
			this.effectiveView =
			new vClass(viewClassName, this, mockSpace, mockAvatar);
		this.effectiveView.completeView();
		this.avatar.doRepaint = this.doRepaint;

	}

	// repaint whole GL image.
	doRepaint() {
		console.log('doRepaint');
		mockAvatar.loadViewBuffer();
		this.effectiveView.drawAllDrawings();
	}

};

// does this do anything?
export default mockGLView;
