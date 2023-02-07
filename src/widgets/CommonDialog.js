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

/* *********************************************************** CommonDialog */
// set prop types
function setPT() {
	CommonDialog.propTypes = {
	};
}

const setDialogElement =
(el) => {
	CommonDialog.dialogElement ??= el;

	// google's polyfill for the <dialog element
	if (el)
		dialogPolyfill.registerDialog(el);
}

function CommonDialog(props) {
	CommonDialog.setDialog = props.setDialog;  // method on App

	// early on, this hasn't been set yet, so can't start the app with dialog open.
//	if (CommonDialog.dialogElement) {
//		if (props.dialogContent)
//		else
//			CommonDialog.dialogElement.close();

		// I want to use this someday, nonmodal... CommonDialog.dialogElement.show();
	//}

	return (
		<dialog id='CommonDialog' ref={el => setDialogElement(el)}>
			{props.dialogContent}
		</dialog>
	);
}
setPT();


CommonDialog.openDialog =
(dialogContent) => {
	// tells App to show the dialog.  The App holds the state.
	// So we, here, send the content to App, who saves it in its state,
	// only to pass it down here in CommonDialog's props
	CommonDialog.setDialog(dialogContent);
	if (CommonDialog.dialogElement) {
		try {
			// will throw if dialog already up
			CommonDialog.dialogElement.showModal();
		} catch (ex) {
			// not a big deal
			console.log(ex);
		}
	}
	}
	// so... is this dialog going to 'flash' previous contents when it shows?!?!?!?!
}

// called by client sw (whoever called us) after user clicks OK or Cancel.
CommonDialog.closeDialog =
() => {
	CommonDialog.setDialog(null);
	if (CommonDialog.dialogElement)
		CommonDialog.dialogElement.close();
}

// called when App finishes closing it.  No - nobody calls this.
//CommonDialog.finishClosingDialog() {
//	CommonDialog.centralComponent = null;
//}


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
	CommonDialog.openDialog(<SimpleDialog text={text} />);
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
	CommonDialog.openDialog(<ErrorDialog error={ex} where={where} />);
}

// for testing
window.CommonDialog = CommonDialog;

export default CommonDialog;
