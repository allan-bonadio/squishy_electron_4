/*
** Resolution/Space tab -- lets user choose a new nStates
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

//import PropTypes from 'prop-types';
import ResolutionDialog from './ResolutionDialog.js';

//function setPT() {
//	SetResolutionTab.propTypes = {
//	};
//}

function SetResolutionTab(props) {
	return (<div className='SetResolutionTab'>
		<button className='setResolutionButton'
			onClick={ev => ResolutionDialog.openResolutionDialog()}>
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
//setPT();

export default SetResolutionTab;
