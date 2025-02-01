/*
** mockGLView -- substitute for the real GLView in tests
** Copyright (C) 2023-2025 Tactile Interactive, all rights reserved
*/

TODO: rename to mockGLScene

import 'https://greggman.github.io/webgl-lint/webgl-lint.js';
import glAmbiance from '../glAmbiance.js';
import abstractScene from '../abstractScene.js';

import flatScene from '../flatScene.js';
import starScene from './starScene.js';

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
	flat: flatScene,
	star: starScene,
}

gonna have to rewrite this as a function
export class mockGLView {
	proptypes: {
		specialInfo: PropTypes.object,
	}

	constructor(viewClassName, sceneName) {
		this.state = {canvas: null};
		this.space = mockSpace;
		this.avatar = mockAvatar;

		this.sceneName = sceneName;
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
		glAmbiance.preferWebGL2 = (localStorage.version == '2');

		this.glAmbiance = new glAmbiance(canvas);
		this.glAmbiance.glProm
		.then(gl => {
			this.gl = gl;
			this.tagObject = this.glAmbiance.tagObject;

			canvas.glview = this;
			canvas.sceneName = this.sceneName;

			this.initViewClass();

			// finally!
			console.log(`🖼 🖼 mockGLView ${this.sceneName}: created!`);
		})
	}

	testViewClasses = {
	}

	// instantiate the view class we'll use
	initViewClass() {
		console.log(`initViewClass: viewClassName=${this.viewClassName} sceneName${this.sceneName}`);

		// already got it this.viewClassName = viewClassName;
		let vClass = viewClassNamez[this.viewClassName];
		this.testViewClasses[this.viewClassName] =
			this.effectiveView =
			new vClass(this.viewClassName, this, mockSpace, mockAvatar);
		this.effectiveView.completeView(specialInfo);
		this.avatar.doRepaint = this.doRepaint;

	}

	// repaint whole GL image.
	doRepaint() {
		console.log('doRepaint');
		mockAvatar.loadViewBuffer();
		this.effectiveView.drawAllDrawings(width, height, p.specialInfo);
	}

};

// does this do anything?
export default mockGLView;
