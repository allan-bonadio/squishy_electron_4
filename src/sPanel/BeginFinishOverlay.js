/*
** Begin-Finish Overlay -- pause and resume buttons modeled after youtube
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/

import React, {useRef, useState, useReducer, useContext} from 'react';
import PropTypes from 'prop-types';

import SquishContext from './SquishContext.js';

import beginIcon from './waveViewIcons/begin.png';
import finishIcon from './waveViewIcons/finish.png';
import runningIcon from './waveViewIcons/runningIcon.png';


let traceContext = false;
let traceBeginFinish = true;

window.ckSBI = () => {

}

// no props!  does everything thru context.
function BeginFinishOverlay(props) {
	const context = useContext(SquishContext);
	if (traceContext) {
		console.log(`BeginFinishOverlay begining context:`,
				context.setShouldBeIntegrating,
				context.controlPanel,
				context.waveView);
	}
	const cp = context.controlPanel;
	if (!cp)
		return null;

	// function beginFinishHandler(ev) {
	// 	cp.beginFinish?.(ev);
	// }
	// function beginRunning(ev) {
	// 	cp.beginRunning?.(ev);
	// }
	// function finishRunning(ev) {
	// 	cp.finishRunning?.(ev);
	// }
	// function beginSingleFrameHandler(ev) {
	// 	cp.beginSingleFrame?.(ev);
	// }
	function preventDragAway(ev) {
		ev.preventDefault();
	}

	const helpRunning = 'Runs while you hold down this button; release to finish.';
	let ssButton;
	if (context.shouldBeIntegrating) {
		if (traceBeginFinish) console.log(`🛑 was integrating, making finish button`);
		ssButton = <button className='beginFinishWidget finishButton' onClick={cp.finishAnimating}
					alt='🛑 finish integrating' title='🛑 finish integrating' >
			<img src={finishIcon}  style={{width: '1em'}}/>
		</button>
	}
	else {
		if (traceBeginFinish) console.log(`🟩 integration is finishped, making begin button`);
		ssButton = <button className='beginFinishWidget beginButton' onClick={cp.beginAnimating}
				alt='🟩 begin integrating'  title='🟩 begin integrating' >
			<img src={beginIcon}  style={{width: '1em'}} />
		</button>
	}

	// the begin/finish icon toggles depending on state
	return <section className='BeginFinishOverlay waveButtonPanel' >
		{ssButton}

		<span style={{width: '2em', display: 'inline-block'}} />

		{/* longer running button; runs as long as you hold it down */}
		<button className='runningWidget'
				alt={helpRunning} title={helpRunning} onMouseMove={preventDragAway}
				onMouseDown={cp.beginAnimating}
				onMouseUp={cp.finishAnimating} onMouseLeave={cp.finishAnimating}>
			<img	src={runningIcon} style={{width: '2em'}}/>
		</button>

	</section>;
}

export default BeginFinishOverlay;

