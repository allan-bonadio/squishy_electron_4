/*
** Voltage Sidebar -- on the right side of the canvas, for scrolling the voltage range
** Copyright (C) 2023-2024 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

import voltDisplay from './voltDisplay.js';

let traceVoltageSidebar = false;
let traceDragging = false;

// I dunno but the voltages I'm generating are too strong.
// So I reduced it by this factor, but still have to magnify it to make it visible.
export const spongeFactor = 100;





function setPT() {
	VoltSidebar.propTypes = {
		width: PropTypes.number.isRequired,  // width of sidebar: fixed or zero

		canvasInnerDims: PropTypes.object.isRequired,
		bumperWidth: PropTypes.number,

		vDisp: PropTypes.instanceOf(voltDisplay),

		// Same as voltage area, this shows and hides along with it
		// but won't draw anything if the checkbox is off
		//showVoltage: PropTypes.string,
	}
}


function VoltSidebar(props) {
	if (!props) return '';  // too early
	let sidebarWidth = props.width;

	let v = props.vDisp;
	if (!v) return '';  // too early or first render

	if (!v.heightVolts  || v.heightVolts <= 0) throw `bad heightVolts ${v.heightVolts}`

	// so how far down is the thumb from top of rail in pix?
	//thumbY = thumbFreedom * (1 - (v.bottomVolts - v.minBottom) / v.heightVolts)

	if (traceVoltageSidebar) {
		console.log(`🍟 V Sidebar rend: width=${sidebarWidth}  heightVolts=${v.heightVolts}  ${v.minBottom} `);
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
	return (<aside className='VoltSidebar'
			onPointerEnter={pointerEnter} onPointerLeave={pointerLeave} >
		<p/>

		<button className='scrollUp'
				onClick={ev => v.scrollVoltHandler(+1)}>
			⬆︎
		</button>
		<p/>

		<button className='zoomIn'
				onClick={ev => v.zoomVoltHandler(-1)}>
			+
		</button>
		<p/>

		<button className='zoomOut'
				onClick={ev => v.zoomVoltHandler(+1)}>
			–
		</button>
		<p/>

		<button className='scrollDown'
				onClick={ev => v.scrollVoltHandler(-1)}>
			⬇︎
		</button>
		<p/>

	</aside>);
}
setPT();

export default VoltSidebar;



// 		<div className='voltRail' ref={el => railEl = el}>
// 			<div className='voltThumb' onMouseDown={mouseDown}
// 				style={{top: 0}}  ref={el => thumbEl = el}>
// 			⚡️
// 			</div>
// 		</div>
