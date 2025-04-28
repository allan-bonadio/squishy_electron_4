/*
** Resolution/Space tab -- lets user choose a new nStates
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import PropTypes from 'prop-types';
import ResolutionDialog from './ResolutionDialog.js';

function setPT() {
	SetResolutionTab.propTypes = {
		// we won't need this till user clicks button
		grinder: PropTypes.object,
	};
}

function SetResolutionTab(props) {
	return (<div className='SetResolutionTab controlPanelPanel'>
		<h3>Reconfigure the Space</h3>
		<button className='setResolutionButton'
			onClick={ev => (props.grinder)
					&& ResolutionDialog.openResolutionDialog(props.grinder)}>
				Change Space
			<div style={{fontSize: '.8em'}}>
				(will reset current wave)</div>
		</button>
		<p className='discussion'>
			Squishy Electron's space is a one-dimensional region for an electron to travel in.
			You can reconfigure this space here, if you want, with different settings.
			(Your current wave will be reset.)
		</p>

	</div>);
}
setPT();

export default SetResolutionTab;
