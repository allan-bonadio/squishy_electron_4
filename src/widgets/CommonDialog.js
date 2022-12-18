/*
** Common Dialog -- general dialog framework for Squishy Electron
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
// eslint-disable-next-line no-unused-vars
import PropTypes from 'prop-types';

import App from '../App.js';
import {interpretCppException} from '../utils/errors.js';

// this does the Simple case
function SimpleDialog(props) {
	return (<section id='SimpleDialog' >
		<details>{props.text}</details>
		<nav><button className='round' onClick={CommonDialog.startClosingDialog} >OK</button></nav>
	</section>);
}

function prepError(ex) {
	// eslint-disable-next-line no-ex-assign
	ex = interpretCppException(ex);
	let stackBox;
	if (ex.stack)
		stackBox = ex.stack.split('\n').map((line, key) => <div key={key} >{line}</div>);

	if (ex.message && ex.stack) {
		// use the new cool details & summary (just learned about it)
		return (<details style={{overflowY: 'auto'}} key='msg_stack'>
			<summary>{ex.message}</summary>
			<small>{stackBox}</small>
		</details>);
	}
	else if (ex.message) {
		return (<h4 key='msg'>{ex.message}</h4>);
	}
	else if (ex.stack) {
		return (<section style={{overflowY: 'auto'}} key='stack'>
			<div>{stackBox}</div>
		</section>);
	}
}

// similar but for an error, comes out in Red
function ErrorDialog(props) {
	let ex = props.error;

	console.error('ErrorDialog handles exception:\n'+ JSON.stringify(ex, null, '  '));

	return <article id='ErrorDialog' style={{border: '3px black outset'}}>
		<h2><big>🧯</big> Error</h2>
		<h3>(probably not your fault)</h3>
		{prepError(ex)}
		<nav><button className='round' onClick={CommonDialog.startClosingDialog} >OK</button></nav>
	</article>;
}

// HEY!  this can be a function component - no state, no props.  App has all the state.

// how to use:
//    CommonDialog.openSimpleDialog("sorry, luser, you screwed up!  Don't ever do that again!");
// That makes a simple dialog with that text and an OK button.
//
//    CommonDialog.openErrorDialog(new Error("sorry, luser, you screwed up!  Don't ever do that again!"), 'SetWavePanel');
// That makes a error dialog with stack or message and an OK button.
//
//    CommonDialog.openDialog(<MyGargantuanDialogContent />);
// Makes a complex dialog given that component... must have an outer frame!  cuz
// that's the whole dialog!  Call CommonDialog.startClosingDialog() when it
// should dismiss itself.  You're responsible for everything else.

// Hey!  this should use <dialog>  https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
// along with  autofocus  https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus
// this should probably be a func component: no state, no using this, no CONSTRUCTOR!
export default class CommonDialog extends React.Component {

	static propTypes = {
		//token: PropTypes.number,
	};

	state = {};

	static me = this;

	static openDialog(centralComponent) {
		CommonDialog.centralComponent = centralComponent;
		App.showDialog();
	}

	static openSimpleDialog(text) {
		CommonDialog.openDialog(<SimpleDialog text={text} />);
	}

	static openErrorDialog(ex, where) {
		CommonDialog.openDialog(<ErrorDialog error={ex} where={where} />);
	}

	// called by client sw (whoever called us) after user clicks OK or Cancel
	static startClosingDialog() {
		App.hideDialog();
	}

	// called when App finishes closing it
	static finishClosingDialog() {
		CommonDialog.centralComponent = null;
	}

	render() {
		return (
			<aside className='backdrop'>
				{CommonDialog.centralComponent}
			</aside>
		);
	}
}

