/*
** Voltage Sidebar -- on the right side of the canvas, for scrolling the voltage range
** Copyright (C) 2023-2025 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

import voltDisplay from './voltDisplay.js';
import {VOLT_SIDEBAR_WIDTH} from './voltConstants.js';


let traceVoltageSidebar = false;
let traceDragging = false;

// I dunno but the voltages I'm generating are too strong.
// So I reduced it by this factor, but still have to magnify it to make it visible.
export const spongeFactor = 100;

function setPT() {
	VoltSidebar.propTypes = {
		// x coordinate of the right edge or the bumper on the right side
		drawingRight: PropTypes.number.isRequired,
		canvasInnerHeight: PropTypes.number.isRequired,
		bumperWidth: PropTypes.number,

		mainVDisp: PropTypes.instanceOf(voltDisplay),
	}
}

function VoltSidebar(props) {
	if (!props) return '';  // too early
	let sidebarWidth = props.width;

	let mVD = props.mainVDisp;
	if (!mVD) return '';  // too early or first render

	if (!mVD.heightVolts  || mVD.heightVolts <= 0)
		throw `bad heightVolts ${mVD.heightVolts}`

	// so how far down is the thumb from top of rail in pix?
	//thumbY = thumbFreedom * (1 - (mVD.bottomVolts - mVD.minBottom) / mVD.heightVolts)

	if (traceVoltageSidebar) {
		console.log(`🍟 V Sidebar rend: width=${sidebarWidth}  heightVolts=${mVD.heightVolts}  `
			+`${mVD.minBottom} `);
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
		<aside className='VoltSidebar' style={{width: VOLT_SIDEBAR_WIDTH + 'px'}}
				onPointerEnter={pointerEnter} onPointerLeave={pointerLeave} >
			<p/>

			<button className='scrollUp' onClick={ev => mVD.scrollVoltHandler(+1)}>
					<div>
						⬆︎
					</div>
			</button>
			<p/>

			<button className='zoomIn' onClick={ev => mVD.zoomVoltHandler(-1)}>
				+
			</button>
			<p/>

			<button className='zoomOut' onClick={ev => mVD.zoomVoltHandler(+1)}>
				–
			</button>
			<p/>

			<button className='scrollDown' onClick={ev => mVD.scrollVoltHandler(-1)}>
					<div>
						⬇︎
					</div>
			</button>
			<p/>

		</aside>
	);
}
setPT();

export default VoltSidebar;



// 		<div className='voltRail' ref={el => railEl = el}>
// 			<div className='voltThumb' onMouseDown={mouseDown}
// 				style={{top: 0}}  ref={el => thumbEl = el}>
// 			⚡️
// 			</div>
// 		</div>
