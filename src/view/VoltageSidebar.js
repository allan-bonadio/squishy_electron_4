/*
** Voltage Sidebar -- on the right side of the canvas, for scrolling the voltage range
** Copyright (C) 2023-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';
//import {scaleLinear} from 'd3-scale';

//import qe from '../engine/qe.js';
//import eSpace from '../engine/eSpace.js';
//import {dumpVoltage} from '../utils/voltageUtils.js';

let traceVoltageSidebar = true;

// I dunno but the voltages I'm generating are too strong.
// So I reduced it by this factor, but still have to magnify it to make it visible.
export const spongeFactor = 100;


function setPT() {
	VoltageSidebar.propTypes = {
		height: PropTypes.number.isRequired,  // must resize with whole canvas
		width: PropTypes.number.isRequired,  // width: must fit what WebView gives us

		// not the min/max voltage of the current view of the potential, but the
		// lowest and highest the user can slide the slider.
		scrollMin: PropTypes.number.isRequired,
		scrollMax: PropTypes.number.isRequired,

		// whatever the slider should show, between minMini and maxMaxi
		scrollSetting: PropTypes.number.isRequired,

		// Same as voltage area, this shows and hides along with it
		// but won't draw anything if the checkbox is off
		showVoltage: PropTypes.bool.isRequired,

		// this is how we report a user's actions
		scrollHandler: PropTypes.func.isRequired,
		zoomHandler: PropTypes.func.isRequired,
	}
}


// ultimately, this is a <svg node with a <path inside it
export function VoltageSidebar(p) {
	if (traceVoltageSidebar) {
		console.log(`🍟 🍟 the VoltageSidebar: width=${p.width} height=${p.height}`);
		console.log(`🍟 🍟     scroll 𝚫=${p.scrollMax-p.scrollMin}:
			${p.scrollMin} ... ${p.scrollSetting} ... ${p.scrollMax}`);
	}

	// should just use forceUpdate on our comp obj instead!
	//if (props.setUpdateVoltageSidebar)
	//	props.setUpdateVoltageSidebar(this.updateVoltageSidebar);

//		style={{height: `${p.height}px`, flexBasis: p.width, display: p.showVoltage ? 'flex' : 'none'}} >

	let sidebarWidth = p.width;
	let sidebarDisplay = 'flex';
	if (! p.showVoltage) {
		// oops not showing
		sidebarWidth = 0;
		sidebarDisplay = 'none';
		return '';
	}

	// render.  The buttons and stuff are almost square.
	return (<aside className='VoltageSidebar'
		style={{height: `100%`, flexBasis: sidebarWidth, display: sidebarDisplay}} >

		<button className='zoomIn' onClick={ev => p.zoomHandler(+1)} style={{flexBasis: p.width}} >
			<img src='images/zoomInIcon.png' alt='zoom in' />
		</button>

		<button className='zoomOut' onClick={ev => p.zoomHandler(-1)} style={{flexBasis: p.width}} >
			<img src='images/zoomOutIcon.png' alt='zoom out' />
		</button>

		<div className='lightningBolt' onClick={ev => p.zoomHandler(-1)} style={{flexBasis: p.width}} >
			⚡️
		</div>

		{/* firefox requires orient=vertical; chrome/safari appearance:slider-vertical.  each ignore the other */}
		<input type='range' orient='vertical'
			min={p.scrollMin} max={p.scrollMax} value={p.scrollSetting} step='any'
			onChange={p.scrollHandler}
		/>

	</aside>);
}
setPT();

export default VoltageSidebar;
