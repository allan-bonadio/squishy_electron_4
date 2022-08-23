/*
** Resolution/Space tab -- lets user choose a new nStates
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import PropTypes from 'prop-types';

function setPT() {
	SetResolutionTab.propTypes = {
		openResolutionDialog: PropTypes.func.isRequired,
	};
}

function SetResolutionTab(props) {
	const p = props;
	// doesn't work p.openResolutionDialog();  // just et ti over with

	return (<div className='SetResolutionTab'>
		<button className='setResolutionButton  round'
			onClick={ev => p.openResolutionDialog()}>
				Change Space
				<div style={{fontSize: '.7em'}}>
					(will reset current wave)</div>
		</button>
		<h3>Reconfigure the Space</h3>

		<p>
			Squishy Electron's space is a one-dimensional region for an electron to travel in.
			You can reconfigure this space here, if you want, with different settings.
			(Your current wave will be reset.)
		</p>

	</div>);
}
setPT();

export default SetResolutionTab;
