/*
** PivotOverlay -- layer for user to rotate 3d image of wave
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import React, {useContext, useRef} from 'react';
import PropTypes from 'prop-types';

// one mouse unit equals how many screen pixel units?
// or, um, the angle in degrees it should equate to
let X_PIX_RATIO = .05;
let Y_PIX_RATIO = .05;

const roundAngle = (theta) => Math.max(-90, Math.min(90, Math.round(theta/5) * 5));


const propTypes = {
	// in/out.  Pass it in with, whatever, but must have all these
	// fields (not just the ones listed here): {xyz}{Ang,Pos}
	orient: PropTypes.shape({
		xAng: PropTypes.number.isRequired,
		yPos: PropTypes.number.isRequired,
		hfoView: PropTypes.number.isRequired,
		// plus others i'm too lazy to do
	}),

	setAngSetting: PropTypes.func.isRequired,
};

export function PivotOverlay(props) {
	cfpt(propTypes, props);

	const pointerDownRef = useRef();
	let pointerDown = pointerDownRef.current;


	const moveHandler = (ev) => {
		if (0 == ev.buttons) {
			// mouse up, turn off everything
			pointerDownRef.current = null;
			return;
		}

		if (!pointerDown) {
			// must be starting - mouse down, or mouse enter
			// remember where mouse down was and what angles that meant
			pointerDown = pointerDownRef.current = {x: ev.pageX, y: ev.pageY,
				xAng: props.orient.xAng, yAng: props.orient.yAng};
		}

		// ok now, how far has it moved and in what direction? measure
		// from mousedown point.  Note:xAng and yAng need to be
		// reversed: xAng is rotation around y axis, etc.
		let delMouseY = ev.pageX - pointerDown.x;
		let delMouseX = ev.pageY - pointerDown.y;

		// so that means new angles are:
		props.setAngSetting('xAng',
			roundAngle(props.orient.xAng + delMouseX * X_PIX_RATIO));
			//Math.round(props.orient.xAng + delMouseX * X_PIX_RATIO));
		props.setAngSetting('yAng',
			roundAngle(props.orient.yAng + delMouseY * Y_PIX_RATIO));
			//Math.round(props.orient.yAng + delMouseY * Y_PIX_RATIO));
	}

	return <section className='PivotOverlay'
		onPointerMove={moveHandler} />
}

export default PivotOverlay;
