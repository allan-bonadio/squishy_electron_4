/*
** CxRainbow tab -- render the Wave tab on the control panel
** Copyright (C) 2025-2026 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

import GLScene from '../gl/GLScene.js';

const RAINBOW_SIZE = 200;

const propTypes = {
	// only present after eSpace promise
	space: PropTypes.shape({
		pointer: PropTypes.number,
		dimensions: PropTypes.arrayOf(PropTypes.object),
	}),
};


// a component that renders the rainbow circle.  No props.
function CxRainbowTab(props) {
	cfpt(propTypes, props);

	return <div className='CxRainbowTab  controlPanelPanel'
			title="This tab shows the colors of the wave."
			style={{textAlign: 'left'}}>
		<h3>Complex Rainbow</h3>

		<div style={{display: 'flex', flexDirection: 'row'}}>
			<div key='theCanvas'
					style={{flex: '0 0 100px', padding: '1em', backgroundColor: 'black'}}>
				<GLScene
					space={props.space}
					sceneClassName='rainbowScene' sceneName='CxRainbow'
					paintingNeeds={{}}
					canvasInnerWidth={RAINBOW_SIZE}
					canvasInnerHeight={RAINBOW_SIZE}
					title="Colors show the Complex Phase of the Wave"
				/>
			</div>
			<div key='blurb' style={{flex: '1 1 200px', textAlign: 'left', margin: '1em'}}>
				The colors in a wave show the phase of that part of the wave.
				The phase is important because it determines whether the wave
				reinforces itself or cancels itself out, at each state (place).
			</div>
		</div>
	</div>;
}

export default CxRainbowTab;
