/*
** Common Dialog -- general dialog framework for Squishy Electron
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import React from 'react';
// eslint-disable-next-line no-unused-vars
import PropTypes from 'prop-types';

import dialogPolyfill from 'dialog-polyfill';
import 'dialog-polyfill/dist/dialog-polyfill.css';

//import App from '../App.js';
import {interpretCppException} from '../utils/errors.js';


// how to use:
//    CommonDialog.openSimpleDialog("Elvis has left the building.");
// That makes a simple (non-error) dialog with that text and an OK button.
//
//    CommonDialog.openErrorDialog(new Error("sorry, luser, you screwed up!  Don't ever do that again!"), 'SetWavePanel');
// That makes a error dialog with stack or message and an OK button.
//
//    CommonDialog.openDialog(<MyGargantuanDialogContent />);
// Makes a complex dialog given that component.  Call CommonDialog.closeDialog() when it
// should dismiss itself.  You're responsible for everything else.
//
// If you don't close dialog before another dialog opens,
// it'll print an error on the console but actually the 2nd dialog will still work.

// to test the polyfill, try changing 'dialog' to a 'footer' element
//		- here in this file
//		- also in node_modules/dialog-polyfill/dist/dialog-polyfill.esm.js
//			global search-replace /'dialog'/ to /'footer'/
//		- also in node_modules/dialog-polyfill/dist/dialog-polyfill.css
//			replace /dialog/ to /footer/ with WHOLE WORD on, ie  NOT in _dialog_overlay
// 	- optional: change also in App.scss; or just realize that non-essential styles will be omitted
// You'll have to kill and restart npm start; it caches the node_modules and doesn't check for changes.
// and set them BACK when you're done!


/* *********************************************************** CommonDialog */
// set prop types
function setPT() {
	CommonDialog.propTypes = {
		// stuff that goes inside the <dialog>
		dialogContent: PropTypes.object,

		// style on the <dialog>, including BG color
		dialogStyles: PropTypes.object,
	};

	CommonDialog.defaultProps = {
		dialogContent: <div>empty dialog</div>,
		dialogStyles: {backgroundColor: '#333'},
	};
}

// ref function when we finally render
const setDialogElement =
(el) => {
	CommonDialog.dialogElement = el;  // the raw DOM object

	// google's polyfill for the <dialog element; harmless if a modern browser
	if (el)
		dialogPolyfill.registerDialog(el);
}

function CommonDialog(props) {
	CommonDialog.setDialog = props.setDialog;  // method on App

	// I want to use this someday, nonmodal... CommonDialog.dialogElement.show();

	return (
		<dialog id='CommonDialog' ref={el => setDialogElement(el)} style={props.dialogStyles}>
			{props.dialogContent}
		</dialog>
	);
}
setPT();


CommonDialog.openDialog =
(dialogContent, dialogStyles) => {
	// tells App to show the dialog.  The App holds the state.
	// So we, here, send the content to App, who saves it in its state,
	// only to pass it down here in CommonDialog's props
	CommonDialog.setDialog(dialogContent, dialogStyles);
	if (CommonDialog.dialogElement) {
		try {
			// will throw if dialog already up
			CommonDialog.dialogElement.showModal();
		} catch (ex) {
			// not a big deal
			console.log(ex);
		}
	}

	// so... is this dialog going to 'flash' previous contents when it shows?!?!?!?!
}

// called by client sw (whoever called us) after user clicks OK or Cancel.
CommonDialog.closeDialog =
() => {
	CommonDialog.setDialog(null, null);
	if (CommonDialog.dialogElement)
		CommonDialog.dialogElement.close();
}

/* *********************************************************** SimpleDialog  component */

// this does the Simple case, just a simple dialog with an OK button
function SimpleDialog(props) {
	// There is one and only one CommonDialog, so I can use IDs in it
	return (
		<article id='SimpleDialog' >
			<p>{props.text}</p>
			<nav>
				<button onClick={CommonDialog.closeDialog} autoFocus={true} >OK</button>
			</nav>
		</article>
	);
}

CommonDialog.openSimpleDialog =
(text) => {
	CommonDialog.openDialog(<SimpleDialog text={text}/>,  {backgroundColor: '#ddd'});
}

/* *********************************************************** ErrorDialog component */

// given an exception, take it apart and turn it into React elements the way we want it
function prepError(ex) {
	// eslint-disable-next-line no-ex-assign
	ex = interpretCppException(ex);
	let stackBox;
	if (ex.stack)
		stackBox = ex.stack.split('\n').map((line, key) => <div key={key} >{line}</div>);

	if (ex.message && ex.stack) {
		// use details & summary
		return (<details style={{overflow: 'auto'}} key='msg_stack'>
			<summary>{ex.message}</summary>
			<small>{stackBox}</small>
		</details>);
	}
	else if (ex.message) {
		return (<h4 key='msg'>{ex.message}</h4>);
	}
	else if (ex.stack) {
		return (<section style={{overflow: 'auto'}} key='stack'>
			<div>{stackBox}</div>
		</section>);
	}
}

// similar but for an error, comes out in Red
function ErrorDialog(props) {
	let ex = props.error;

	console.error('ErrorDialog displays: ', ex);
	let where = props.where ? ` at ${props.where}` : '';
	return (
		<article id='ErrorDialog' >
			<h2><big>💥</big> Error {where}</h2>
			{prepError(ex)}
			<nav>
				<button onClick={CommonDialog.closeDialog} autoFocus={true} >OK</button>
			</nav>
		</article>
	);
}

CommonDialog.openErrorDialog =
(ex, where) => {
	CommonDialog.openDialog(<ErrorDialog error={ex} where={where} />,
			{backgroundColor: '#a00'});
}

// for testing
window.CommonDialog = CommonDialog;

export default CommonDialog;
