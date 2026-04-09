/*
** SizeBox -- up or down box for changing the hight of wave boxes
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import React, {useState, useRef} from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';

import resizeIcon from './waveViewIcons/resize.png';
import {storeASetting} from '../utils/storeSettings.js';

let traceDragCanvasHeight = true;

const propTypes = {
	// our caller, the wave, gets new height
	setHeight: PropTypes.func.isRequired,
	which: PropTypes.string.isRequired,  // either "View" or "Vista"
	initialHeight: PropTypes.number.isRequired,
};


function SizeBox(props) {
	cfpt(propTypes, props);

	let [height, setHeight] = useState(props.initialHeight);
	let stuffRef = useRef({});
	let stuff = stuffRef.current;  // little details we need to keep

	function setWaveHeight(newHeight) {
		if (newHeight == height) return;
		setHeight(newHeight);  // for next time around
		height = newHeight;  // for this time
		props.setHeight(newHeight);  // for the wave box
		storeASetting('miscSettings', props.which + 'Height', newHeight);
	}

	// these are for resizing ONLY with the size box
	// We let the user drag into the size box and drag out if they want
	// note: anything funny and the event falls thru to the wave panel
	const resizePointerDown = ev => {
		if (!(ev.buttons & 1)) return;
		stuff.resizing = true;

		// the small distance from the mousedown to the bottom of the size box
		stuff.yOffset = Math.round(height - ev.pageY);
		if (traceDragCanvasHeight)
			console.log(`🏄 resizePointer down ${ev.pageX} ${ev.pageY} offset=${stuff.yOffset}`);
		ev.target.setPointerCapture(ev.pointerId);

		// now it's ours so don't let it click through
		ev.preventDefault();
		ev.stopPropagation();
	};

	const resizePointerMove = ev => {
		// mouse moves happen all the time; don't bother me
		if (!(ev.buttons & 1)) return;
		if (!stuff.resizing)
			return;

		const vHeight = Math.round(ev.pageY + stuff.yOffset);
		setWaveHeight(vHeight);
		if (traceDragCanvasHeight) {
			console.log(`🏄 resizePointer drag ${ev.pageX} ${ev.pageY}  newheight=${ev.pageY + stuff.yOffset}`);
		}

		ev.preventDefault();
		ev.stopPropagation();
	};

	// usually I send pointerLeave events here, but now with pointerCapture, maybe it doesn't matter.??
	// I do get pointerLeave events, but only after pointerUp, if the pointer is out of the size box.??
	const resizePointerUp = ev => {
		if (!(ev.buttons & 1)) return;

		if (traceDragCanvasHeight)
			console.log(`🏄 resizePointer up ${ev.pageX} ${ev.pageY}`);
		stuff.resizing = false;

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
