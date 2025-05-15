/*
** Volt Overlay -- the offwhite voltage line, and its tactile accessories
**		    for Squishy Electron
** Copyright (C) 2024-2025 Tactile Interactive, all rights reserved
*/

import React, {useRef, useState, useReducer} from 'react';
import PropTypes from 'prop-types';

import VoltArea from '../volts/VoltArea.js';
import VoltSidebar from '../volts/VoltSidebar.js';
import {getASetting, storeASetting} from '../utils/storeSettings.js';

let traceGeometry = false;

function setPT() {
	VoltOverlay.propTypes = {
		// for first couple of renders, space and idunno are null
		space: PropTypes.object,
		mainVDisp: PropTypes.object,


		// this can be null if stuff isn't ready.
		canvasInnerWidth: PropTypes.number.isRequired,
		canvasInnerHeight: PropTypes.number.isRequired,
		bumperWidth: PropTypes.number.isRequired,

		// this component is always rendered so it retains its state,
		// but won't draw anything if the checkbox is off
		////showVoltage: PropTypes.string,
	};
}


// this has all the interactive state for the voltage stuff as displayed over the wave.
// Whole thing disappears/appears with mouse hover.
function VoltOverlay(props) {
	const p = props;
	const mVD = p.mainVDisp;
	if (!mVD)
		throw `props.mainVDisp has no voltDisplay`;

	/* ************************************************************************ state */

	// is this too tedious/slow?  Voltage buffer itself, then bottom and height
	function voltReducer(voltageBuffer, change) {
		// maybe I should also have an action for a sequence of points?
		if (voltageBuffer)
			voltageBuffer[change.ix] = change.volts;
		return voltageBuffer;
	}

	// showVoltage state kept in Control Panel but duplicated here cuz here's where it's drawn
	let [showVoltage, setShowVoltage] = useState(getASetting('voltageSettings', 'showVoltage'));

	// see reducer above
	const [vState, voltDispatch] = useReducer(voltReducer, mVD.voltageBuffer);

	// use this function to actually set a point in the voltage buffer, instead of just a regular assignment
	const setAPoint =
	(ix, volts) => voltDispatch({ix, volts});

	// these are in our state, but ALSO in the mainVDisp, and settings, so keep them synched.
	const [bottomVolts, _setBottomVolts] = useState(mVD.bottomVolts);
	mVD.bottomVolts = bottomVolts;
	if (getASetting('voltageSettings', 'bottomVolts') != bottomVolts)
			storeASetting('voltageSettings', 'bottomVolts', bottomVolts);

	const [heightVolts, _setHeightVolts] = useState(mVD.heightVolts);
	mVD.heightVolts = heightVolts;
	if (getASetting('voltageSettings', 'heightVolts') != heightVolts)
			storeASetting('voltageSettings', 'heightVolts', heightVolts);

	// practically speaking, use these functions whenever you set stuff.
	// They set state, so  immediately after, changes will not be apparent.
	mVD.setAPoint = setAPoint;
	mVD.setBottomVolts = (bv) => {
		_setBottomVolts(bv);
		storeASetting('voltageSettings', 'bottomVolts', bv);
	}
	mVD.setHeightVolts = (hv) => {
		_setHeightVolts(hv);
		storeASetting('voltageSettings', 'heightVolts', hv);
	}

	// used by control panel when user changes ShowVoltage menu
	p.space.updateShowVoltage = (sv) => {
		setShowVoltage(sv);
	}
//
//	const enterOverlay = ev => {
////		const vo = document.querySelector('.VoltOverlay');
////		vo.style.visibility = 'visible';
////		console.log(`ptrEnter vo`);
//	}
//
//	const leaveOverlay = ev => {
////		const vo = document.querySelector('.VoltOverlay');
////		vo.style.visibility = 'hidden';
////		console.log(`ptrLeave vo`);
//	}

	/* ********************************************************** rendering */
	if (traceGeometry)
		console.log(`vOverlay: ciWidth=${p.canvasInnerWidth} ciHeight=${p.canvasInnerHeight}`);

	// the class on the section here does the showing/hiding when user mouses over.
	// (but see another mechanism in the sidebar!)
	return <section className={(showVoltage ?? 'hover') + 'ShowVoltage VoltOverlay'}
			style={{width: p.width}} >
		<VoltSidebar
			mainVDisp={p.mainVDisp}
			drawingRight={p.canvasInnerWidth - p.bumperWidth}
			bumperWidth={p.bumperWidth}
			canvasInnerHeight={p.canvasInnerHeight}
			scrollVoltHandler={mVD.setBottomVolts}
			zoomVoltHandler={mVD.zoomVoltHandler}
		/>
		<VoltArea
			mainVDisp={p.mainVDisp}
			drawingLeft={p.bumperWidth}
			drawingWidth={p.canvasInnerWidth - 2 * p.bumperWidth}
			canvasInnerHeight={p.canvasInnerHeight}
			space={p.space}
			setAPoint={setAPoint}
		/>
	</section>;
}

//, left: p.left
	//			bumperWidth={p.bumperWidth}
	// n=removed height={p.height} from VOltArea in favor of canvasInnerDims
//removed from sidebar: 			showVoltage={p.showVoltage}


export default VoltOverlay;
