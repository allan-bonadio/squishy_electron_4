/*
** SizeBox -- up or down box for changing the hight of wave boxes
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import React, {useState, useRef} from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';

import resizeIcon from './waveViewIcons/resize.png';
import {storeASetting} from '../utils/storeSettings.js';

let traceDragCanvasHeight = true;

// only one human can drag it at a time, right?  so its ok to make it global.
let isResizing;
let resizingYOffset;

const propTypes = {
	// our caller, the wave, gets new height
	setHeight: PropTypes.func.isRequired,
	//initialHeight: PropTypes.number.isRequired,
	which: PropTypes.string.isRequired,  // either "view" or "vista"
};


function SizeBox(props) {
	cfpt(propTypes, props);

//	let [height, setHeight] = useState(props.initialHeight);
	// this will remember the height from the latest render
	let height;

	function setWaveHeight(newHeight) {
		// don't CONTINUOUSLY set the canvas size!
		if (height && newHeight == height) return;

		//setHeight(newHeight);  // for next time around
		height = newHeight;
		props.setHeight(newHeight);  // for the wave box
		storeASetting('miscSettings', props.which + 'Height', newHeight);
	}

	// these are for resizing ONLY with the size box
	// We let the user drag into the size box and drag out if they want
	// note: anything funny and the event falls thru to the wave panel
	const resizePointerDown = ev => {
		if (!(ev.buttons & 1)) return;
		isResizing = true;
		if (!height)
			height = ev.pageY;

		// the small distance from the mousedown to the bottom of the size box
		resizingYOffset = Math.round(height - ev.pageY);
		if (traceDragCanvasHeight)
			console.log(`📦📦 resizePointer down ${ev.pageX} ${ev.pageY} offset=${resizingYOffset}`);
		ev.target.setPointerCapture(ev.pointerId);

		// now it's ours so don't let it click through
		ev.preventDefault();
		ev.stopPropagation();
	};

	const resizePointerMove = ev => {
		// mouse moves happen all the time; don't bother me
		if (!(ev.buttons & 1)) return;
		if (!isResizing)
			return;

		const vHeight = Math.round(ev.pageY + resizingYOffset);
		setWaveHeight(vHeight);
		if (traceDragCanvasHeight) {
			console.log(`📦📦 resizePointer drag ${ev.pageX} ${ev.pageY}  newheight=${ev.pageY + resizingYOffset}`);
		}

		ev.preventDefault();
		ev.stopPropagation();
	};

	// usually I get pointerLeave events here, but now with
	// pointerCapture, maybe it doesn't matter.?? I do get pointerLeave
	// events, but only after pointerUp, if the pointer is out of the
	// size box.??
	const resizePointerUp = ev => {
		if (!(ev.buttons & 1)) return;

		if (traceDragCanvasHeight)
			console.log(`📦📦 resizePointer up ${ev.pageX} ${ev.pageY}`);
		isResizing = false;

		ev.preventDefault();
		ev.stopPropagation();
	};

	return <div className='sizeBox'
				onPointerEnter={resizePointerDown}
				onPointerDown={resizePointerDown}
				onPointerUp={resizePointerUp}
				onPointerLeave={resizePointerUp}
				onPointerMove={resizePointerMove}
				title="To adjust the height, drag this up or down">
			<img src={resizeIcon} alt='size box' />
		</div>
}


export default SizeBox;
