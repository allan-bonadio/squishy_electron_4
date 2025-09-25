/*
** testRunner -- js for in-browser webgl tests  with testsRunner.html
** Copyright (C) 2023-2025 Tactile Interactive, all rights reserved
*/

import glAmbiance from '../glAmbiance.js';
import {mockSpace, mockAvatar, mockGLScene} from './mockGLScene.js';
import {starScene} from './starScene.js';
import {noiseScene} from './noiseScene.js';

// pretend jquery
window.$ = document.querySelector.bind(document);
window.$$ = (sel) => Array.from(document.querySelectorAll(sel));

// set the event handler on each element that matches the selector, which
// probably matches more than one
function setHandlersOnAll(name, handler, initialValue) {
	$$(`[name='${name}']`).forEach(el => {
		el.addEventListener('input', handler);

		if (el.type == 'radio') {
			// individual radios have to be checked/unchecked
			el.checked = (el.value == initialValue);
		}
		else if (el.localName == 'option') {
			// to set a select, set its value.  that'll set an option to Selected.
			el.selected = (el.value == initialValue);
		}
	});
}

/* ************************************************************* global handlers */

// the radio buttons for GL version.  I'm using localStorge as my 'state'.  Remember they're all strings.
function selectVersion(ev) {
	localStorage.version = ev.target.value;
	location = location; // reload page
}

function selectSceneClass(ev) {
	localStorage.completeScene = ev.target.value;
}

export let glView;

function startGLView() {
	let canvas = $('canvas');
	let width = $('input[name="canvasWidth"]').value;
	canvas.setAttribute('width', width);
	canvas.style.width = width + 'px';

	let height = $('input[name="canvasWidth"]').value;
	canvas.setAttribute('height', height);
	canvas.style.height = height + 'px';

	glView = new mockGLScene(localStorage.completeScene ?? 'star', 'mockGLScene Runner');

	// really set as a ref by React when page renders first time
	//glView.setGLCanvas(this, gl, $('canvas'));


	// too soon so ...
	setTimeout(() => {
		// just for kicks, erase it to some stupid color
		const gl = glView.gl;

		// solid opaque black.  Erase for both 2d and 3d.
		// debugging ... gl.clearColor(.8, .6, .4, 1);
		gl.clearDepth(1);  // default anyway
		gl.clearColor(.3, .7, .5, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		glView.doRepaint()
	}, 1000)
}


/* ************************************************************* flat handlers */

// menu for N
function selectN(ev) {
	localStorage.N = ev.target.value;
	mockSpace.N = +ev.target.value;
}

// the radio buttons for well/endless
function selectContinuum(ev) {
	localStorage.continuum = ev.target.value;
	mockSpace.continuum = ev.target.value;
}


/* ************************************************************* star handlers */

starScene.typesList = [];

function setupPenTypes() {
	let typesList = starScene.typesList = localStorage.penType;
	if (typesList)
		typesList = typesList.split(' ').filter(c => c);
	else
		typesList = [];
	$$(`[name=penType]`).forEach(check => {
		check.checked = typesList.includes(check.value);
		check.addEventListener('click', selectPenTypes);
	});
	starScene.typesList = typesList;
}
// menu for drawing type(s)
function selectPenTypes(ev) {
	let target = ev.target;
	if (target.checked) {
		starScene.typesList.push(target.value);
	}
	else {
		let pos = starScene.typesList.indexOf(target.value);
		if (pos >= 0)
			starScene.typesList.splice(pos, 1);
	}
	localStorage.penType = starScene.typesList.join(' ');
}


/* ************************************************************* Init */

window.addEventListener('DOMContentLoaded', ev => {
	$('status').innerHTML = `DOMContentLoaded, waiting for page to come to front...`;
	try {
		setHandlersOnAll(`version`, selectVersion, localStorage.version);
		setHandlersOnAll(`completeScene`, selectSceneClass, localStorage.completeScene ?? 'star');

		setHandlersOnAll(`N`, selectN, localStorage.N ?? 16);
		setHandlersOnAll(`continuum`, selectContinuum, localStorage.continuum ?? '1');

		setupPenTypes();

		$(`#startButton`).addEventListener('click', startGLView);

		$('status').innerHTML = `page came to front...`;

		console.log('DOMContentLoaded, ev=', ev);
	} catch (ex) {
		console.error(`testRunner initializing mockGLview:`, ex.stack ?? ex.message ?? ex);
	}
})

