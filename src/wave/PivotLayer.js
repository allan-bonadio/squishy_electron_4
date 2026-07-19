/*
** PivotLayer -- layer for user to rotate 3d image of wave
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import React, {useContext, useRef} from 'react';
import PropTypes from 'prop-types';

// one mouse unit equals how many screen pixel units?
// or, um, the angle in degrees it should equate to.  Adjust to taste.
let X_PIX_RATIO = .005;
let Y_PIX_RATIO = .005;

// round off passed  angle to factor of 5°
const roundAngle = (theta) => Math.max(-90, Math.min(90, Math.round(theta/5) * 5));


const propTypes = {
	// in/out.  Pass it in with, whatever, but must have all these
	// fields (not just the ones listed here): {xyz}{Ang,Pos}
	orient: PropTypes.shape({
		xAng: PropTypes.number.isRequired,
		yAng: PropTypes.number.isRequired,
		zAng: PropTypes.number.isRequired,
		//hfoView: PropTypes.number,
		// plus others i'm too lazy to do
	}),

	setAngSetting: PropTypes.func.isRequired,
};

export function PivotLayer(props) {
	cfpt(propTypes, props);

	const pointerDownRef = useRef();
	let pointerDown = pointerDownRef.current;


	const downHandler = (ev) => {
		if (0 == ev.buttons)
			return;


		if (!pointerDown) {
			// must be starting - mouse down, or mouse enter
			// remember where mouse down was and what angles that meant
			pointerDown = pointerDownRef.current = {x: ev.clientX, y: ev.clientY,
				xAng: props.orient.xAng, yAng: props.orient.yAng};
		}

		// ok now, how far has it moved and in what direction? measure
		// from mousedown point.  Note:xAng and yAng need to be
		// reversed: xAng is rotation around y axis, etc.
		let delMouseY = ev.clientX - pointerDown.x;
		let delMouseX = ev.clientY - pointerDown.y;

		// so that means new angles are:
		props.setAngSetting('xAng',
			roundAngle(props.orient.xAng + delMouseX * X_PIX_RATIO));
			//Math.round(props.orient.xAng + delMouseX * X_PIX_RATIO));
		props.setAngSetting('yAng',
			roundAngle(props.orient.yAng + delMouseY * Y_PIX_RATIO));
			//Math.round(props.orient.yAng + delMouseY * Y_PIX_RATIO));
	}

	const moveHandler = (ev) => {
		if (0 == ev.buttons) {
			// mouse up, turn off everything
			pointerDownRef.current = null;
			return;
		}

		if (!pointerDown) {
			// must be starting - mouse down, or mouse enter
			// remember where mouse down was and what angles that meant
			pointerDown = pointerDownRef.current = {x: ev.clientX, y: ev.clientY,
				xAng: props.orient.xAng, yAng: props.orient.yAng};
		}

		// ok now, how far has it moved and in what direction? measure
		// from mousedown point.  Note:xAng and yAng need to be
		// reversed: xAng is rotation around y axis, etc.
		let delMouseY = ev.clientX - pointerDown.x;
		let delMouseX = ev.clientY - pointerDown.y;

		dblog(`client    pDown    delMouse`);
		dblog(`${ev.clientX}  —  ${pointerDown.x}  =  ${delMouseX}`);
		dblog(`${ev.clientY}  —  ${pointerDown.y}  =  ${delMouseY}`);

		dblog(`Ang   + delMouse*RATIO    new angle`);
		dblog(`${props.orient.xAng} +   ${delMouseX * X_PIX_RATIO}  `
			+`=  ${props.orient.xAng + delMouseX * X_PIX_RATIO}`);
		dblog(`${props.orient.yAng}  +  ${delMouseY * Y_PIX_RATIO}  `
			+`=  ${props.orient.yAng + delMouseY * Y_PIX_RATIO}`);

		// so that means new angles are:
		props.setAngSetting('xAng',
			roundAngle(props.orient.xAng + delMouseX * X_PIX_RATIO));
			//Math.round(props.orient.xAng + delMouseX * X_PIX_RATIO));
		props.setAngSetting('yAng',
			roundAngle(props.orient.yAng + delMouseY * Y_PIX_RATIO));
			//Math.round(props.orient.yAng + delMouseY * Y_PIX_RATIO));
	}


	return <section className='PivotLayer'
		onPointerMove={moveHandler} />
}

export default PivotLayer;
