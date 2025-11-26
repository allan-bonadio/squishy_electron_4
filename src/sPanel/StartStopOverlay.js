/*
** Start-Stop Overlay -- pause and resume buttons modeled after youtube
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/

import React, {useRef, useState, useReducer, useContext} from 'react';
import PropTypes from 'prop-types';

import SquishContext from './SquishContext.js';

import startIcon from './waveViewIcons/start2.png';
import stopIcon from './waveViewIcons/stop3.png';
import singleStepIcon from './waveViewIcons/singleStep2.png';


let traceContext = false;
let traceStartStop = false;

// no props!  does everything thru context.
function StartStopOverlay(props) {
	const context = useContext(SquishContext);
	if (traceContext) {
		console.log(`StartStopOverlay starting context:`,
				context.setShouldBeIntegrating,
				context.controlPanel,
				context.waveView);
	}
	const cp = context.controlPanel;
	if (!cp)
		return null;

	function startStopHandler(ev) {
		cp.startStop?.(ev);
	}
	function startSingleFrameHandler(ev) {
		cp.startSingleFrame?.(ev);
	}
	function preventDragAway(ev) {
		ev.preventDefault();
	}

	const helpSF = 'only do 1 frame.  Use Option , Alt or Control ^ for 10, Shift for 100) ';
	let ssButton;
	if (context.shouldBeIntegrating) {
		if (traceStartStop)
			console.log(`🛑 was integrating, making stop button`)
		ssButton = <button className='startStopWidget stopButton' onClick={cp.stopAnimating}
				alt='🛑 stop integrating' title='🛑 stop integrating' >
			<img onMouseDown={preventDragAway} src={stopIcon} />
		</button>
	}
	else {
		if (traceStartStop)
			console.log(`🎬 integration is stopped, making start button`)
		ssButton = <button className='startStopWidget startButton' onClick={cp.startAnimating}
				alt='🎬 begin integrating'  title='🎬 begin integrating' >
			<img onMouseDown={preventDragAway} src={startIcon} />
		</button>
	}

	// the start/stop icon toggles depending on state
	return <section className='StartStopOverlay waveButtonPanel' >
		{ssButton}

		<span style={{width: '2em', display: 'inline-block'}} />

		<button className='startSingleFrameWidget' onClick={startSingleFrameHandler}
				alt={helpSF} title={helpSF} onMouseMove={preventDragAway} >
			<img onMouseDown={preventDragAway}
					src={singleStepIcon} />
		</button>

	</section>;
}

export default StartStopOverlay;

//		<img className='pauseWidget' src={pauseIcon} alt='pause button'
//			onMouseClick={this.pauseHandler} />
//
//		<img className='upDownWidget' src={upDownIcon} alt='upDown button'
//			onMouseClick={this.upDownHandler} />

//
//singleStep2.png
//pause2.png
//start2.png
//upDown2.png

