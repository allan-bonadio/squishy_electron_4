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




// ***************************************************** scrollbar interaction */
// const body = document.body;
//
// // we need these to stick around.  Attach these to something before we get multiple SquishPanels someday.
//
// let railEl;
// let thumbEl;
//
// // page Y coords of thumb when moved to the top of its rail
// let topOfRail;
//
// // mousedown Y coord of mouse rel to top of thumb
// let offsetInsideThumb;
//
//
// // thumb's offsetTop upon click down.  If null, no drag is in progress.
// // the pixel version of .bottomVolts, upside down
// let offsetTop = null;
//
// // every time function is called, we set the props here.  There's only one so we can use this global.
// let savedProps;
//
// // the offset between top of the scrollbar and the top of the thumb, = offsetTop while dragging
// let thumbY;
//
// let railHeight;
//
// // maxBottom - minBottom in pixels
// let thumbFreedom;
//
// // putting them here so they don't have to be recompiled every render
//
// const mouseDown =
// (ev) => {
// 	ev.preventDefault();
// 	ev.stopPropagation();
//
// 	offsetTop = ev.target.offsetTop;  // the thumb's offset from top of rail
// 	offsetInsideThumb = ev.nativeEvent.offsetY;  // like <32
// 	topOfRail = ev.pageY - offsetInsideThumb - offsetTop;
//
// 	// only registered while dragging
// 	body.addEventListener('mousemove', thumbSlide);
// 	//body.addEventListener('mouseleave', mouseUp);
// 	body.addEventListener('mouseup', mouseUp);
// }
//
// // called upon mouseMove, Up and Leave
// const thumbSlide =
// (ev) => {
// 	ev.preventDefault();
// 	ev.stopPropagation();
//
// 	if ((ev.buttons & 1) && offsetTop != null) {
// 		// must use page coords cuz the event handler is attached to doc body
// 		thumbY = Math.min(thumbFreedom, Math.max(0, ev.pageY - offsetInsideThumb - topOfRail));
// 		let frac = 1 - thumbY / thumbFreedom;  // 1=scrolled to top, 0=scrolled to bottom
//
// 		// scrollVoltHandler() changes VoltageArea scales, userScroll() calcs and changes bottomVolts
// 		savedProps.scrollVoltHandler(savedProps.vDisp.userScroll(frac));
// 		if (traceDragging) {
// 			savedProps.vDisp.dumpVoltDisplay(
// 				`🍟 mouse Move thumbY=${thumbY} thumbFreedom=${thumbFreedom} shd be constant`);
// 		}
// 	}
// }
//
// // called upon mouseup or a mouse leave
// const mouseUp =
// (ev) => {
// 	thumbSlide(ev);
// 	offsetTop = null;  // says mouse is up
//
// 	body.removeEventListener('mousemove', thumbSlide);
// 	//body.removeEventListener('mouseleave', mouseUp);
// 	body.removeEventListener('mouseup', mouseUp);
// }


/* ***************************************************** scrollbar  */

function setPT() {
	VoltageSidebar.propTypes = {
		width: PropTypes.number.isRequired,  // width: fixed or zero
		height: PropTypes.number.isRequired,  // ultimately we'll get this from the element itself

		vDisp: PropTypes.instanceOf(voltDisplay),

		// Same as voltage area, this shows and hides along with it
		// but won't draw anything if the checkbox is off
		showVoltage: PropTypes.string.isRequired,
	}
}


function VoltageSidebar(props) {
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

	// render.  The buttons are almost square.
	return (<aside className='VoltageSidebar' >
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

export default VoltageSidebar;



// 		<div className='voltRail' ref={el => railEl = el}>
// 			<div className='voltThumb' onMouseDown={mouseDown}
// 				style={{top: 0}}  ref={el => thumbEl = el}>
// 			⚡️
// 			</div>
// 		</div>
