/*
** Start-Stop Overlay -- pause and resume buttons modeled after youtube
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/

import React, {useRef, useState, useReducer, useContext} from 'react';
import PropTypes from 'prop-types';

import SquishContext from './SquishContext.js';

import startIcon from './waveViewIcons/start2.png';
import stopIcon from './waveViewIcons/stop2.png';
import singleStepIcon from './waveViewIcons/singleStep2.png';


let traceContext = false;

// no props!  does everything thru context.
function StartStopOverlay(props) {
	const context = useContext(SquishContext);
	//const context = props.context;
	if (traceContext) {
		console.log(`StartStopOverlay starting context:`,
				context.setShouldBeIntegrating,
				context.controlPanel,
				context.waveView);
	}
	const cp = context.controlPanel;
	function startStopHandler(ev) {
		cp.startStop?.();
	}
	function singleStepHandler(ev) {
		cp.singleFrame?.();
	}

	let label = 'start integrating';
	let icon = startIcon;
	if (context.shouldBeIntegrating) {
		label = 'stop integrating';
		icon = stopIcon
	}

	// the start/stop icon toggles depending on state
	return <section className='StartStopOverlay waveButtonPanel' >
		<img className='startStopWidget'
			alt={label} title={label}
			src={icon}
			onClick={startStopHandler} />

		<img className='singleStepWidget' alt='singleStep button'
			src={singleStepIcon}
			onClick={singleStepHandler} />

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

