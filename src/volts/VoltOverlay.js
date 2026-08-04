/*
** Volt Overlay -- the offwhite voltage line, and its tactile accessories & interactions
**	  for Squishy Electron
** Copyright (C) 2024-2026 Tactile Interactive, all rights reserved
*/

import React, {useRef, useState, useReducer, useContext} from 'react';

import PropTypes from 'prop-types';

import VoltArea from '../volts/VoltArea.js';
import VoltSidebar from '../volts/VoltSidebar.js';
import {getASetting, storeASetting} from '../utils/storeSettings.js';
import SquishContext from '../sPanel/SquishContext.js';

let traceGeometry = false;
let traceShowVoltage = true;

// holds the state for the potential buffer/line, and for the
// displayed top and bottom voltage React state, which change from
// scrolling and zooming the displayed voltage line and axes.
const propTypes = {
	// for first couple of renders, space and idunno are null
	space: PropTypes.object,
	mainVDisp: PropTypes.object,


	// Actual canvas size, not counting borders.  these can be null if space isn't ready.
	canvasInnerWidth: PropTypes.number.isRequired,
	canvasInnerHeight: PropTypes.number.isRequired,

	// for well continuum in 2d
	bumperWidth: PropTypes.number.isRequired,
};



// this has all the interactive state for the voltage stuff as displayed over the wave.
// Whole thing disappears/appears with mouse hover.
// this component is always rendered so it retains its state,
// but won't draw anything if it shouldn't
function VoltOverlay(props) {
	cfpt(propTypes, props);
	const p = props;
	const mainVDisp = p.mainVDisp;
	if (!mainVDisp)
		throw `props.mainVDisp has no voltDisplay`;

	const context = useContext(SquishContext);

	/* ************************************************************************ state */

	// the whole voltageBuffer is state for this component
	function voltReducer(voltageBuffer, change) {
		if (voltageBuffer)
			voltageBuffer[change.ix] = change.volts;
		return voltageBuffer;
	}
	const [vState, voltDispatch] = useReducer(voltReducer, mainVDisp.voltageBuffer);

	// use this function to actually set a point in the voltage
	// buffer, instead of just a regular assignment.  This is not
	// saved from one session to the next.  TODO
	const setAPoint = (ix, volts) => voltDispatch({ix, volts});
	mainVDisp.setAPoint = setAPoint;

	// these are in our state, but ALSO in the mainVDisp, and settings, so keep them synched.
	const [bottomVolts, _setBottomVolts] = useState(mainVDisp.bottomVolts);
	mainVDisp.bottomVolts = bottomVolts;
	if (getASetting('voltageSettings', 'bottomVolts') != bottomVolts)
			storeASetting('voltageSettings', 'bottomVolts', bottomVolts);

	const [heightVolts, _setHeightVolts] = useState(mainVDisp.heightVolts);
	mainVDisp.heightVolts = heightVolts;
	if (getASetting('voltageSettings', 'heightVolts') != heightVolts)
			storeASetting('voltageSettings', 'heightVolts', heightVolts);

	// these set & keep state for bottomVolts and heightVolts, so
	// immediately after, changes will not be apparent, till after render. Practically
	// speaking, use these functions whenever you set them.  These are
	// NOT kept in the ControlPanel state, unlike most other settings.
	//  But they ARE stored in the storeSettings.
	mainVDisp.setBottomVolts = (bv) => {
		_setBottomVolts(bv);
		storeASetting('voltageSettings', 'bottomVolts', bv);
	}
	mainVDisp.setHeightVolts = (hv) => {
		_setHeightVolts(hv);
		storeASetting('voltageSettings', 'heightVolts', hv);
	}

	// for showing voltage; menu in Volts tab, but VoltOverlay needs
	// to be re-rendered, too.
	let [showVoltage, setShowVoltage]
		= useState(getASetting('voltageSettings', 'showVoltage'));

	// calle by control panel when user changes ShowVoltage menu switch, to pass it along
	p.space.updateShowVoltage = (sv) => {
		if (traceShowVoltage) dblog(` updateShowVoltage(${sv}), prev `
			+` showVoltage from showVoltageRef=${showVoltage}  former setting `
			+` getASetting(showVoltage)=${getASetting('voltageSettings', 'showVoltage')}`);
		setShowVoltage(sv);
		storeASetting('voltageSettings', 'showVoltage', sv);
	}

	/* ********************************************************** rendering */
	if (traceGeometry)
		console.log(`vOverlay: ciWidth=${p.canvasInnerWidth} ciHeight=${p.canvasInnerHeight}`);

	// the class on the section here does the showing/hiding when user mouses over.
	if (traceShowVoltage)
		dblog(` about to render VoltOverlay, showVoltage ref=${showVoltage}`)
	return <section className={(showVoltage ?? 'hover') + 'ShowVoltage VoltOverlay'}
			style={{width: p.width}} >
		<VoltSidebar
			mainVDisp={p.mainVDisp}

			canvasInnerHeight={p.canvasInnerHeight}
			scrollVoltHandler={mainVDisp.setBottomVolts}
			zoomVoltHandler={mainVDisp.zoomVoltHandler}
			space={p.space}
			bumperWidth={p.bumperWidth}
		/>
		<VoltArea
			mainVDisp={p.mainVDisp}
			drawingLeft={p.bumperWidth}
			drawingWidth={p.canvasInnerWidth - 2 * p.bumperWidth}
			//drawingRight={p.canvasInnerWidth - p.bumperWidth}

			canvasInnerHeight={p.canvasInnerHeight}
			space={p.space}
			setAPoint={setAPoint}
		/>
	</section>;
}

export default VoltOverlay;


// 			drawingLeft={p.bumperWidth}
// 			drawingWidth={p.canvasInnerWidth - 2 * p.bumperWidth}
// 			//drawingRight={p.canvasInnerWidth - p.bumperWidth}
