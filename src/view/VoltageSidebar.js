/*
** Voltage Sidebar -- on the right side of the canvas, for scrolling the voltage range
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

import voltDisplay from '../utils/voltDisplay.js';

let traceVoltageSidebar = false;
let traceDragging = true;

// I dunno but the voltages I'm generating are too strong.
// So I reduced it by this factor, but still have to magnify it to make it visible.
export const spongeFactor = 100;



/* ***************************************************** scrollbar variables */
// we need these to stick around.  Attach these to something before we get multiple SquishPanels someday.

// the offset between top of the scrollbar and the top of the thumb
let thumbY;

// page coord of where user clicked down on thumb
let mouseDownY;

// thumb's offsetTop upon click down.  If null, no drag is in progress.
let offssetTop = null;

// page coords of thumb when moved to the top of its rail
let topOfRail;

let scrollbarEl;
let thumbEl;

function setPT() {
	VoltageSidebar.propTypes = {
		height: PropTypes.number.isRequired,  // must resize with whole canvas
		width: PropTypes.number.isRequired,  // width: must fit what WebView gives us

		// not the min/max voltage of the current view of the potential, but the
		// lowest and highest the user can slide the slider.
		//scrollMin: PropTypes.number.isRequired,
		//scrollMax: PropTypes.number.isRequired,

		// whatever the slider should show, between minMini and maxMaxi
		//scrollSetting: PropTypes.number.isRequired,
		vInfo: PropTypes.instanceOf(voltDisplay),

		// Same as voltage area, this shows and hides along with it
		// but won't draw anything if the checkbox is off
		showVoltage: PropTypes.bool.isRequired,

		// this is how we report a user's actions
		scrollVoltHandler: PropTypes.func.isRequired,
		zoomVoltHandler: PropTypes.func.isRequired,
	}
}


// ultimately, this is a <svg node with a <path inside it
export function VoltageSidebar(props) {
	if (!props) return 'no props';  // too early
	let v = props.vInfo;
	if (!v) return '';  // too early

	if (traceVoltageSidebar) {
		console.log(`🍟 🍟 the VoltageSidebar: width=${props.width} height=${props.height}`);
		console.log(`🍟 🍟     heightVolts=${v.heightVolts}:    ${v.scrollMin} ... ${v.bottomVolts} ... ${v.scrollMax}`);
	}


	/* ***************************************************** scrollbar interaction */
	// common code among all event handlers
	const thumbSlide =
	(ev) => {
		ev.preventDefault();
		ev.stopPropagation();
		if (ev.buttons & 1 && offssetTop != null) {

			// currentTarget is the whole sidebar.
			let rail = ev.currentTarget.querySelector('.voltRail');
			let railHeight = rail.clientHeight;
			let thumb = rail.firstElementChild;
			let freedom = railHeight - thumb.offsetHeight;
			thumbY = Math.min(freedom, Math.max(0, ev.pageY - topOfRail));
			let newFrac = 1 - thumbY / railHeight;

			props.scrollVoltHandler(props.vInfo.changeScroll(newFrac));
			if (traceDragging)
				console.log(`🍟 mouse Move newFrac=${newFrac} freedom=${freedom} shd be constant`);
		}
	}

	const mouseDown =
	(ev) => {
		offssetTop = ev.target.offsetTop;  // the thumb, offset from top of rail
		mouseDownY = ev.pageY;
		topOfRail = ev.pageY - offssetTop;
		//thumbSlide(ev);
	}

	const mouseMove =
	(ev) => {
		thumbSlide(ev);
	}

	// called upon mouseup or a mouse leave
	const mouseUp =
	(ev) => {
		thumbSlide(ev);
		offssetTop = undefined;  // says mouse is up
	}

	/* ***************************************************** scrollbar thumb */
	// should just use forceUpdate on our comp obj instead!
	//if (props.setUpdateVoltageSidebar)
	//	props.setUpdateVoltageSidebar(this.updateVoltageSidebar);

//		style={{height: `${props.height}px`, flexBasis: props.width, display: props.showVoltage ? 'flex' : 'none'}} >

	let sidebarWidth = props.width;
	let sidebarDisplay = 'flex';
	if (! props.showVoltage) {
		// oops not showing
		sidebarWidth = 0;
		sidebarDisplay = 'none';
		return '';
	}

	// render.  The buttons and stuff are almost square.
	return (<aside className='VoltageSidebar'
		onMouseMove={mouseMove} onMouseUp={mouseUp} onMouseLeave={mouseUp}
		style={{height: `100%`, flexBasis: sidebarWidth, display: sidebarDisplay}} >

		<button className='zoomIn' onClick={ev => props.zoomVoltHandler(+1)} style={{flexBasis: props.width}} >
			<img src='images/zoomInIcon.png' alt='zoom in' />
		</button>

		<button className='zoomOut' onClick={ev => props.zoomVoltHandler(-1)} style={{flexBasis: props.width}} >
			<img src='images/zoomOutIcon.png' alt='zoom out' />
		</button>

		<div className='voltRail' ref={el => scrollbarEl = el}>
			<div className='voltThumb' onMouseDown={mouseDown}
				style={{top: thumbY}}  ref={el => thumbEl = el}>
			⚡️
			</div>
		</div>
	</aside>);
}
setPT();

export default VoltageSidebar;
