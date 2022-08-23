/*
** Common Dialog -- general dialog framework for Squishy Electron
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

import App from '../App';

export default class CommonDialog extends React.Component {

	static propTypes = {
		token: PropTypes.number,
	};

	state = {};

	static me = this;

	static openDialog(centralComponent) {
		CommonDialog.centralComponent = centralComponent;
		App.showDialog();
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
				<div className='dialogSpacer' />
				{CommonDialog.centralComponent}
				<div className='dialogSpacer' />
			</aside>
		);
	}

}
