/*
** Common Dialog -- general dialog framework for Squishy Electron
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
// eslint-disable-next-line no-unused-vars
import PropTypes from 'prop-types';

import App from '../App.js';

// this does the Simple case
function SimpleDialog(props) {
	return <div id='SimpleDialog' >
		<p>{props.text}</p>
		<nav><button className='round' onClick={CommonDialog.startClosingDialog} >OK</button></nav>
	</div>;
}

// similar but for an error, comes out in Red
function ErrorDialog(props) {
	let err = props.error;
	let msg = `${props.where} : ${err.stack ?? err.message ?? err.toString()}`;
	return <div id='ErrorDialog' >
		<p>{msg}</p>
		<nav><button className='round' onClick={CommonDialog.startClosingDialog} >OK</button></nav>
	</div>;
}

// similar but for an error, comes out in Red
function ErrorBoundaryDialog(props) {
	let err = props.error;
	let msg = `${props.where} : ${err.stack ?? err.message ?? err.toString()}`;
	return <div id='ErrorDialog' >
		<p>{msg}</p>
		<nav><button className='round' onClick={CommonDialog.startClosingDialog} >OK</button></nav>
	</div>;
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

	static openErrorDialog(err, where) {
		CommonDialog.openDialog(<ErrorDialog error={err} where={where} />);
	}

	static openErrorBoundaryDialog(content) {
		CommonDialog.openDialog(<ErrorBoundaryDialog >
			{content}
		</ErrorBoundaryDialog>);
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
