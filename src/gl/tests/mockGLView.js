/*
** mockGLView -- substitute for the real GLView in tests
** Copyright (C) 2023-2024 Tactile Interactive, all rights reserved
*/

import 'https://greggman.github.io/webgl-lint/webgl-lint.js';
import ctxFactory from '../ctxFactory.js';
import abstractViewDef from '../abstractViewDef.js';

import flatViewDef from '../flatViewDef.js';
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
	flat: flatViewDef,
	star: starViewDef,
}


export class mockGLView {
	constructor(viewClassName, viewName) {
		this.state = {canvas: null};
		this.space = mockSpace;
		this.avatar = mockAvatar;

		this.viewName = viewName;
		this.viewClassName = viewClassName;
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
		ctxFactory.preferWebGL2 = (localStorage.version == '2');

		this.ctxFactory = new ctxFactory(canvas);
		this.ctxFactory.glProm
		.then(gl => {
			this.gl = gl;
			this.tagObject = this.ctxFactory.tagObject;

			canvas.glview = this;
			canvas.viewName = this.viewName;

			this.initViewClass();

			// finally!
			console.log(`🖼 🖼 mockGLView ${this.viewName}: created!`);
		})
	}

	testViewClasses = {
	}

	// instantiate the view class we'll use
	initViewClass() {
		console.log(`initViewClass: viewClassName=${this.viewClassName} viewName${this.viewName}`);

		// already got it this.viewClassName = viewClassName;
		let vClass = viewClassNamez[this.viewClassName];
		this.testViewClasses[this.viewClassName] =
			this.effectiveView =
			new vClass(this.viewClassName, this, mockSpace, mockAvatar);
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
