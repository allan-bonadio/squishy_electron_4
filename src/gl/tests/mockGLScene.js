/*
** mockGLScene -- substitute for the real GLScene in tests
** Copyright (C) 2023-2025 Tactile Interactive, all rights reserved
*/

import 'https://greggman.github.io/webgl-lint/webgl-lint.js';
import glAmbiance from '../glAmbiance.js';
import abstractScene from '../abstractScene.js';

import flatScene from '../flatScene.js';
import starScene from './starScene.js';

// this mostly replicates GLScene in a lame sortof way
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

const sceneClassNamez = {
	flat: flatScene,
	star: starScene,
}

gonna have to rewrite this as a function
export class mockGLScene {
	proptypes: {
		specialInfo: PropTypes.object,
	}

yeah i think this has to change too
	constructor(sceneName, ambiance, inputInfo) {
		this.state = {canvas: null};
		this.space = mockSpace;
		this.avatar = mockAvatar;

		this.sceneName = sceneName;
		this.sceneClassName = sceneClassName;
	}

	// just pretend
	setState(newValues) {
		Object.assign(this.state, newValues);
	}

	// yes we get the real canvas in here
	setGLCanvas(this, gl, canvas) {
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

			this.initSceneClass();

			// finally!
			console.log(`🖼 🖼 mockGLScene ${this.sceneName}: created!`);
		})
	}

	testSceneClasses = {
	}

	// instantiate the view class we'll use
	initSceneClass() {
		console.log(`initSceneClass: sceneClassName=${this.sceneClassName} sceneName${this.sceneName}`);

		// already got it this.sceneClassName = sceneClassName;
		let sClass = sceneClassNamez[this.sceneClassName];
		this.testSceneClasses[this.sceneClassName] =
			this.effectiveView =
			new sClass(this.sceneClassName, this, mockSpace, mockAvatar);
		this.effectiveView.completeScene(specialInfo);
		this.avatar.glRepaint = this.glRepaint;

	}

	// repaint whole GL image.
	glRepaint() {
		console.log('glRepaint');
		mockAvatar.loadViewBuffer();
		this.effectiveView.drawAllDrawings(width, height, p.specialInfo);
	}

};

// does this do anything?
export default mockGLScene;
