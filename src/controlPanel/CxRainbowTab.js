/*
** CxRainbow tab -- render the Wave tab on the control panel
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/

import React from 'react';
//import PropTypes, {checkPropTypes} from 'prop-types';

import GLScene from '../gl/GLScene.js';

const RAINBOW_SIZE = 100;

// a component that renders the rainbow circle.  No props.
function CxRainbowTab(props) {
	return <div className='CxRainbowTab  controlPanelPanel'
			title="This tab shows the colors of the wave.">
		<h3>Complex Rainbow</h3>

		<GLScene
			sceneClassName='rainbowScene' sceneName='CxRainbow'
			canvasInnerWidth={RAINBOW_SIZE}
			canvasInnerHeight={RAINBOW_SIZE}
			title="Colors show the Phase of the Wave"
		/>
	</div>;
}

export default CxRainbowTab;
