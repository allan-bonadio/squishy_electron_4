/*
** Volt Overlay -- the offwhite voltage line, and its tactile accessories
**	      for Squishy Electron
** Copyright (C) 2024-2025 Tactile Interactive, all rights reserved
*/

import React, {useRef, useState, useReducer} from 'react';
import PropTypes from 'prop-types';

import VoltArea from '../volts/VoltArea.js';
import VoltSidebar from '../volts/VoltSidebar.js';
import {getASetting, storeASetting} from '../utils/storeSettings.js';

function setPT() {
	VoltOverlay.propTypes = {
		// for first couple of renders, space and idunno are null
		space: PropTypes.object,

		// this can be null if stuff isn't ready.  these are now determined by css.
		canvasInnerWidth: PropTypes.number.isRequired,
		canvasInnerHeight: PropTypes.number.isRequired,
		bumperWidth: PropTypes.number.isRequired,

		// includes scrollSetting, heightVolts, measuredMinVolts, measuredMaxVolts, xScale, yScale
		vDisp: PropTypes.object,

		// this component is always rendered so it retains its state,
		// but won't draw anything if the checkbox is off
		showVoltage: PropTypes.string,
	};
}


// this has all the interactive state for the voltage stuff as displayed over the wave.
// Whole thing disappears/appears with mouse hover.
function VoltOverlay(props) {
	const p = props;
	const v = p.vDisp;
	if (!v)
		throw `props.vDisp has no voltDisplay`;

	/* ************************************************************************ state */

	// is this too tedious/slow?  Voltage buffer itself, then bottom and height
	function voltReducer(voltageBuffer, change) {
		// maybe I should also have an action for a sequence of points?
		if (voltageBuffer)
			voltageBuffer[change.ix] = change.volts;
		return voltageBuffer;
	}

	// the Hooks way
	const [vState, voltDispatch] = useReducer(voltReducer, v.voltageBuffer);  // see reducer above

	// use this function to actually set a point in the voltage buffer, instead of just a regular assignment
	const setAPoint =
	(ix, volts) => voltDispatch({ix, volts});

	// these are in our state, but ALSO in the vDisp, and settings, so keep them synched.
	const [bottomVolts, _setBottomVolts] = useState(v.bottomVolts);
	v.bottomVolts = bottomVolts;
	if (getASetting('voltageSettings', 'bottomVolts') != bottomVolts)
			storeASetting('voltageSettings', 'bottomVolts', bottomVolts);

	const [heightVolts, _setHeightVolts] = useState(v.heightVolts);
	v.heightVolts = heightVolts;
	if (getASetting('voltageSettings', 'heightVolts') != heightVolts)
			storeASetting('voltageSettings', 'heightVolts', heightVolts);

	// practically speaking, use these functions whenever you set stuff.
	// They set state, so  immediately after, changes will not be apparent.
	v.setAPoint = setAPoint;
	v.setBottomVolts = (bv) => {
		_setBottomVolts(bv);
		storeASetting('voltageSettings', 'bottomVolts', bv);
	}
	v.setHeightVolts = (hv) => {
		_setHeightVolts(hv);
		storeASetting('voltageSettings', 'heightVolts', hv);
	}

	/* ************************************************************************ rendering */

	// the class on the section here does the showing/hiding when user mouses over.
	// (but see another mechanism in the sidebar!)
	return <section className={(p.showVoltage ?? 'hover') + 'ShowVoltage VoltOverlay'}
			style={{width: p.width}} >
		<VoltSidebar
			vDisp={p.vDisp}
			drawingRight={p.canvasInnerWidth - p.bumperWidth}
			bumperWidth={p.bumperWidth}
			canvasInnerHeight={p.canvasInnerHeight}
			showVoltage={p.showVoltage}
			scrollVoltHandler={v.setBottomVolts}
			zoomVoltHandler={v.zoomVoltHandler}
		/>
		<VoltArea
			vDisp={p.vDisp}
			drawingLeft={p.bumperWidth}
			drawingWidth={p.canvasInnerWidth - 2 * p.bumperWidth}
			canvasInnerHeight={p.canvasInnerHeight}
			showVoltage={p.showVoltage}
			space={p.space}
			setAPoint={setAPoint}
		/>
	</section>;
	//			bumperWidth={p.bumperWidth}

	// n=removed height={p.height} from VOltArea in favor of canvasInnerDims
}
//, left: p.left


export default VoltOverlay;
