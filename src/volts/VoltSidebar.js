/*
** Voltage Sidebar -- on the right side of the canvas, for scrolling the voltage range
** Copyright (C) 2023-2025 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

import voltDisplay from './voltDisplay.js';
//import {VOLT_SIDEBAR_WIDTH} from './voltConstants.js';
//new URL("./image.png", import.meta.url);

import downIcon from './voltIcons/downIcon2.png';
import upIcon   from './voltIcons/upIcon2.png';
import minusIcon from './voltIcons/minusIcon2.png';
import plusIcon from './voltIcons/plusIcon2.png';

let traceVoltageSidebar = false;
let traceDragging = false;

const propTypes = {
		// x coordinate of the right edge or the bumper on the right side
		drawingRight: PropTypes.number.isRequired,
		canvasInnerHeight: PropTypes.number.isRequired,
		bumperWidth: PropTypes.number,

		mainVDisp: PropTypes.instanceOf(voltDisplay),
	}


function VoltSidebar(props) {
	if (!props) return '';  // too early
	cfpt(propTypes, props);
	let sidebarWidth = props.width;

	let mVD = props.mainVDisp;
	if (!mVD) return '';  // too early or first render

	if (!mVD.heightVolts  || mVD.heightVolts <= 0)
		throw `bad heightVolts ${mVD.heightVolts}`

	// so how far down is the thumb from top of rail in pix?
	//thumbY = thumbFreedom * (1 - (mVD.bottomVolts - mVD.minBottom) / mVD.heightVolts)

	if (traceVoltageSidebar) {
		console.log(`🍟 V Sidebar rend: width=${sidebarWidth}  heightVolts=${mVD.heightVolts}  `
			+ mVD.minBottom);
	}

	// Hovering  to show/hide voltage - hovering over the sidebar
	// buttons can make the voltage stuff disappear.  these make sure
	// the voltage still shows if the mouse is over the sidebar.
	const pointerEnter = ev => {
		const vo = document.querySelector('.WaveView .VoltOverlay');
		if (vo) vo.style.visibility = 'visible';
	};
	const pointerLeave = ev => {
		const vo = document.querySelector('.WaveView .VoltOverlay');
		if (vo) vo.style.visibility = '';
	};

	// render.  The buttons are almost square.  The + and – are emojis
	// The arrows need the div for alignment.
	return (
		<aside className='VoltSidebar waveButtonPanel'
				onPointerEnter={pointerEnter} onPointerLeave={pointerLeave} >

			<button className='scrollUp' onClick={ev => mVD.scrollVoltHandler(+1)}>
				<img src={upIcon} height='1em' />
			</button>

			<button className='zoomIn' onClick={ev => mVD.zoomVoltHandler(-1)}>
				<img src={plusIcon} height='1em' />
			</button>

			<button className='zoomOut' onClick={ev => mVD.zoomVoltHandler(+1)}>
				<img src={minusIcon} height='1em' />
			</button>

			<button className='scrollDown' onClick={ev => mVD.scrollVoltHandler(-1)}>
				<img src={downIcon} height='1em' />
			</button>

		</aside>
	);
}

export default VoltSidebar;
