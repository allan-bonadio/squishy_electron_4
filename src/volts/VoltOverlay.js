/*
** Volt Overlay -- the offwhite voltage line, and its tactile accessories
**	      for Squishy Electron
** Copyright (C) 2024-2024 Tactile Interactive, all rights reserved
*/

import React, {useRef, useState, useReducer} from 'react';
import PropTypes from 'prop-types';

import VoltageArea from '../volts/VoltageArea.js';
import VoltageSidebar from '../volts/VoltageSidebar.js';
import {getASetting, storeASetting} from '../utils/storeSettings.js';


const VOLTAGE_SIDEBAR_WIDTH = 32;  // passed down to VoltageSidebar.  Seems to want to be 32


function setPT() {
	VoltOverlay.propTypes = {
		// for first couple of renders, space and idunno are null
		space: PropTypes.object,

		// this can be null if stuff isn't ready.  these are now determined by css.
		height: PropTypes.number,

		width: PropTypes.number,
		left: PropTypes.number,

		// includes scrollSetting, heightVolts, measuredMinVolts, measuredMaxVolts, xScale, yScale
		vDisp: PropTypes.object,

		// this component is always rendered so it retains its state,
		// but won't draw anything if the checkbox is off
		showVoltage: PropTypes.string,

		canvasFacts: PropTypes.object,
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
	// vState === v.voltageBuffer now, so I don't have to set it or anything

	// use this function to actually set a point in the voltage buffer, instead of just a regular assignment
	const setAPoint =
	(ix, volts) => voltDispatch({ix, volts});

	// these are in our state, but ALSO in the vDisp, and settings, so keep them synched.
	const [bottomVolts, setBottomVolts] = useState(v.bottomVolts);
	v.bottomVolts = bottomVolts;
	if (getASetting('voltageSettings', 'bottomVolts') != bottomVolts)
			storeASetting('voltageSettings', 'bottomVolts', bottomVolts);

	const [heightVolts, setHeightVolts] = useState(v.heightVolts);
	v.heightVolts = heightVolts;
	if (getASetting('voltageSettings', 'heightVolts') != heightVolts)
			storeASetting('voltageSettings', 'heightVolts', heightVolts);

	/* ************************************************************************ interaction */

	// the actual bottomVolts is ignored; what's important is to tell us that it changed
	const scrollVoltHandler =
	bottomVolts => {
		setBottomVolts(bottomVolts);
	}

	// handles zoom in/out buttons    They pass +1 or -1.
	const zoomVoltHandler =
	upDown => {
		v.zoomVoltHandler(upDown);
		setBottomVolts(v.bottomVolts);
		setHeightVolts(v.heightVolts);
	}

	/* ************************************************************************ rendering */

	// the class on the section here does the showing/hiding when user mouses over.
	// (but see another mechanism in the sidebar!)
	return <section className={(p.showVoltage ?? 'hover') + 'ShowVoltage VoltOverlay'}
			style={{width: p.width}} >
		<VoltageSidebar width={VOLTAGE_SIDEBAR_WIDTH} height={p.height}
			vDisp={p.vDisp}
			showVoltage={p.showVoltage}
			scrollVoltHandler={scrollVoltHandler}
			zoomVoltHandler={zoomVoltHandler}
		/>
		<VoltageArea
			vDisp={p.vDisp}
			showVoltage={p.showVoltage}
			space={p.space}
			height={p.height}
			canvasFacts={p.canvasFacts}
		/>
	</section>
}
//, left: p.left


export default VoltOverlay;
