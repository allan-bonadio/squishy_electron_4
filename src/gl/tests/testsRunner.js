/*
** testRunner -- js for webgl tests  with testsRunner.html
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

import glAux from '../glAux.js';
import {mockSpace, mockAvatar, mockGLView} from './mockGLView.js';
import {starViewDef} from './starViewDef.js';

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

// it's now on glAux
//preferWebGL2
//export let preferWebGL2 = true;

// the radio buttons for GL version.  I'm using localStorge as my 'state'.  Remember they're all strings.
function selectVersion(ev) {
	localStorage.version = ev.target.value;
	location = location; // reload page
}

function selectViewClass(ev) {
	localStorage.viewClass = ev.target.value;
}

export let glView;

function startGLView() {
	glView = new mockGLView();

	// really set as a ref by React when page renders first time
	glView.setGLCanvas($('canvas'));

	// initViewClass() really done in a componentDidUpdate()
	// but we don't have the complications
	glView.initViewClass(localStorage.viewClass);

	/// try it?
	glView.doRepaint();
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

starViewDef.typesList = [];

function setupDrawingTypes() {
	let typesList = starViewDef.typesList = localStorage.drawingType;
	if (typesList)
		typesList = typesList.split(' ').filter(c => c);
	else
		typesList = [];
	$$(`[name=drawingType]`).forEach(check => {
		check.checked = typesList.includes(check.value);
		check.addEventListener('click', selectDrawingTypes);
	});
	starViewDef.typesList = typesList;
}
// menu for drawing type(s)
function selectDrawingTypes(ev) {
	let target = ev.target;
	if (target.checked) {
		starViewDef.typesList.push(target.value);
	}
	else {
		let pos = starViewDef.typesList.indexOf(target.value);
		if (pos >= 0)
			starViewDef.typesList.splice(pos, 1);
	}
	localStorage.drawingType = starViewDef.typesList.join(' ');
}

// the radio buttons for well/endless
//function selectContinuum(ev) {
//	localStorage.continuum = ev.target.value;
//	mockSpace.continuum = ev.target.value;
//}


/* ************************************************************* Init */

window.addEventListener('DOMContentLoaded', ev => {
	$('status').innerHTML = `DOMContentLoaded, waiting for page to come to front...`;
	try {
		setHandlersOnAll(`version`, selectVersion, localStorage.preferWebGL2);
		setHandlersOnAll(`viewClass`, selectViewClass, localStorage.viewClass ?? 'star');

		setHandlersOnAll(`N`, selectN, localStorage.N ?? 16);
		setHandlersOnAll(`continuum`, selectContinuum, localStorage.continuum ?? '1');

		setupDrawingTypes();

		$(`#startButton`).addEventListener('click', startGLView);

		$('status').innerHTML = `page came to front...`;

		console.log('DOMContentLoaded, ev=', ev);
	} catch (ex) {
		console.error(`testRunner initializing mockGLview:`, ex.stack ?? ex.message ?? ex);
	}
})

