/*
** Start-Stop Overlay -- pause and resume buttons modeled after youtube
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/

import React, {useRef, useState, useReducer, useContext} from 'react';
import PropTypes from 'prop-types';

import SquishContext from './SquishContext.js';

import singleStepIcon from './waveViewIcons/singleStep2.png';
import pauseIcon from './waveViewIcons/pause2.png';
import startIcon from './waveViewIcons/start2.png';
import upDownIcon from './waveViewIcons/upDown2.png';


//let traceGeometry = false;

//function setPT() {
//	VoltOverlay.propTypes = {
//		// for first couple of renders, space and idunno are null
//
//		// this component is always rendered so it retains its state,
//		// but won't draw anything if the checkbox is off
//		////showVoltage: PropTypes.string,
//	};
//}
//singleStep2.png
//pause2.png
//start2.png
//upDown2.png

function StartStopOverlay(props) {
	const context = useContext(SquishContext);

	function startHandler(ev) {
		context.controlPanel.start_BlahBlahBlah;
	}
	function singleStepHandler(ev) {
		context.controlPanel.singleStep_BlahBlahBlah
	}

	return <section className='StartStopOverlay waveButtonPanel' >
		<img className='startStopWidget' src={startIcon} alt='start button'
			onClick={startHandler} />

		<img className='singleStepWidget' src={singleStepIcon} alt='singleStep button'
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

