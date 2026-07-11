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

const propTypes = {
	height: PropTypes.number.isRequired,
	// our caller, the wave, gets new height
	setHeight: PropTypes.func.isRequired,
	which: PropTypes.string.isRequired,  // either "view" or "vista"
	// or potentially other things that use the size box.   Do I really need this?
};


function SizeBox(props) {
	cfpt(propTypes, props);

	// this will remember the height from the latest render
	let [draggingPageY, setDraggingPageY] = useState();
	let [draggingHeight, setDraggingHeight] = useState(props.height);

	function setWaveHeight(newHeight) {
		if (isNaN(newHeight)) debugger;

		// don't CONTINUOUSLY set the canvas size!
		if (draggingHeight && newHeight == draggingHeight) return;

		props.setHeight(newHeight);  // for the wave box
		storeASetting('miscSettings', props.which + 'Height', newHeight);
	}

	// these are for resizing ONLY with the size box
	// note: anything funny and the event falls thru to the wave panel
	const resizePointerDown = ev => {
		if (!(ev.buttons & 1)) return;
		ev.target.setPointerCapture(ev.pointerId);
		isResizing = true;

		// for next move
		setDraggingPageY(Math.round(ev.pageY));  // it comes in with lots of decimal places
		setDraggingHeight(props.height);

		if (traceDragCanvasHeight)
			console.log(`📦📦 resizePointer down Height=${props.height} `
				+`evPageY=${draggingPageY}`);

		// now it's ours so don't let it click through
		ev.preventDefault();
		ev.stopPropagation();
	};

	// all the moving happens in the moment, in the move handler
	const resizePointerMove = ev => {
		// mouse moves happen all the time; don't bother me
		if (!(ev.buttons & 1)) return;
		if (!isResizing)
			return;
		if (isNaN(draggingHeight) || isNaN(draggingPageY)) debugger;

		// movement since last move or down event
		let pageY = Math.round(ev.pageY);   // it comes in with lots of decimal places
		let newHeight = draggingHeight + pageY - draggingPageY;
		if (isNaN(newHeight)) debugger;
		setWaveHeight(newHeight);
		setDraggingPageY(pageY);
		setDraggingHeight(newHeight);

		if (traceDragCanvasHeight) {
			console.log(`📦📦 resizePointer Move draggingHeight=${newHeight} `
				+` pageY=${pageY}`);
		}

		ev.preventDefault();
		ev.stopPropagation();
	};

	const resizePointerUp = ev => {
		if (!(ev.buttons & 1)) return;

		if (traceDragCanvasHeight)
			console.log(`📦📦 resizePointer up pageY=${ev.pageY}`);
		isResizing = false;
		// PointerCapture turns off automatically on mouseup

		ev.preventDefault();
		ev.stopPropagation();
	};

	return <div className='sizeBox'
				onPointerDown={resizePointerDown}
				onPointerUp={resizePointerUp}
				onPointerLeave={resizePointerUp}
				onPointerMove={resizePointerMove}
				title="To adjust the height, drag this box up or down">
			<img src={resizeIcon} alt='size box' />
		</div>
}


export default SizeBox;
