/*
** CxRainbow tab -- render the Wave tab on the control panel
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/

import React from 'react';
//import PropTypes, {checkPropTypes} from 'prop-types';

import GLScene from '../gl/GLScene.js';

const RAINBOW_SIZE = 200;

// a component that renders the rainbow circle.  No props.
function CxRainbowTab(props) {
	return <div className='CxRainbowTab  controlPanelPanel'
			title="This tab shows the colors of the wave."
			style={{textAlign: 'left'}}>
		<h3>Complex Rainbow</h3>

		<div style={{display: 'flex', flexDirection: 'row'}}>
			<div key='canvas'
					style={{flex: '0 0 100px', padding: '1em', backgroundColor: 'black'}}>
				<GLScene
					sceneClassName='rainbowScene' sceneName='CxRainbow'
					canvasInnerWidth={RAINBOW_SIZE}
					canvasInnerHeight={RAINBOW_SIZE}
					title="Colors show the Phase of the Wave"
				/>
			</div>
			<div key='blurb' style={{flex: '1 1 200px', textAlign: 'left', margin: '1em'}}>
				The colors in a wave show the phase of that part of the wave.
				The phase is important because it determines whether the wave
				reinforces itself or cancels itself out, at a certain place.
			</div>
		</div>
	</div>;
}

export default CxRainbowTab;
