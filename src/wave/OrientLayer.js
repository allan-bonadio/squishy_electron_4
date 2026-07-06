/*
** Orient Layer -- container for all rotation and other controls for WaveVista
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import React, {useRef, useReducer} from 'react';
import PropTypes from 'prop-types';

import PivotOverlay from './PivotOverlay.js';
import Orient3D from './Orient3D.js';
import matrixGen from './matrixGen.js';

import {getASetting, storeASetting, getAGroup, storeAGroup}
	from '../utils/storeSettings.js';
import sSettings from '../utils/sSettings.js';

let traceOrient = false;
let traceDontShowPivotOverlay = false;
let traceShowOrient3D = true;
let traceAction = true;

const propTypes = {
	nStates: PropTypes.number,
	canvasInnerWidth: PropTypes.number.isRequired,
	canvasInnerHeight: PropTypes.number.isRequired,
	paintingNeeds: PropTypes.object.isRequired,
	mainVistaRepaint: PropTypes.func,
}

// this encloses the elements that the user drags or clicks to change
// the contents of the orient objct: angles but also offsets.
// Also owns the orient and matrixGen objects.
function OrientLayer(props) {
	if (!props) console.trace(`WTF is this?	 No props?`);
	if (!props.nStates) return '';  // no space yet
	cfpt(propTypes, props);

	// here, action is just an object with one or more member values
	// to substitute in.  always the same 'type'
	function reducer(ori, action) {
		// note whole object changed as per reducer rules
		ori = {...ori, ...action};
		storeAGroup('orientSettings', ori);
		if (traceAction)
			dblog(`orient layer action `, action, `  new angles: `, ori);
		return ori;
	}

	const initialOrient = () => getAGroup('orientSettings');  // called if needed
	const [orient, dispatch] = useReducer(reducer, null, initialOrient);

	// the matrixGen calculates The Matrix
	let mGenRef = useRef(null);
	if (!mGenRef.current) {
		mGenRef.current = new matrixGen(orient, props.nStates,
			props.canvasInnerWidth, props.canvasInnerHeight);
	}
	const mGen = mGenRef.current;

	/* ******************************************* orientation	*/

	// these are called when user tries to pivot or orient

	// after angles have changed, call this to ripple it thru and
	// repaint JUST the rotation angles.  Save a microsecond :-) of cpu by
	// avoiding matrix mults.
	const orientNRepaint = () => {
		paintingNeeds.unifiedMatrix = mGen.unifyMatrices();
		// wait this isn't right needs to just do orientation TODO
		if (props.mainVistaRepaint)
			props.mainVistaRepaint(props.paintingNeeds);
	}

	// repaint, rebuilding all matrices, effecting all changes.  Do
	// this when canvas areas need to repaint & resize or other
	// Orient3D settings besides just the angles
	const buildNRepaint = () => {
		props.paintingNeeds.unifiedMatrix = mGen.unifyMatrices();
		if (props.mainVistaRepaint)
			props.mainVistaRepaint(props.paintingNeeds);
	}

	// do most of setting any one them
	const setOne = (varName, newVal) => {
		if (traceOrient) dblog(`️🏔️ set one(${varName}, `, newVal, `) `);
		//orient[varName] = newVal;
		dispatch({[varName]: newVal})
		storeASetting('orientSettings', varName, newVal);
	}

	// set a rotation ANGLE: xAng, yAng or zAng
	const setAngSetting = (coord, newVal) => {
		setOne(coord, newVal);

		//orientNRepaint();
		buildNRepaint();
	}

	// set Any of the Orient settings, angle or not
	const setOneSetting = (varName, newVal) => {
		setOne(varName, newVal);
		buildNRepaint();
	}

	// set all of them.  newVal is an obj with all of them.
	// Missing ones won't be set.  this is for reset on Orient3D
	const setOrientAll = (newSettings) => {
		if (traceOrient) dblog(`️🏔️ setOrientAll(${coord}, `, newSettings, `) `);
		let newOrient = Object.assign({}, orient, newSettings);
		dispatch(newOrient);
		storeAGroup('orientSettings', orient);
		buildNRepaint();
	}

	// // handler, only for the angles x y z
	// function handleAngSetting(ev) {
	// 	let which = ev.target.className;
	// 	let value = ev.target.valueAsNumber;
	// 	setters[which](value);
	//
	// 	// set in Vista and settings
	// 	setAngSetting(which, value);
	// }
	// // handler, for any Orient3D setting
	// function handleOneSetting(ev) {
	// 	let which = ev.target.className;
	// 	let value = ev.target.valueAsNumber;
	// 	dispatch({[which]: value});
	//
	// 	//setters[which](value);
	//
	// 	// set in Vista and settings
	// 	//props.setOneSetting(which, value);
	// }
	//
	// // rotate all settings to default (zeroes?)
	// function resetOrientation(ev) {
	// 	const sdo = sSettings.defaults.orientSettings;
	// 	dispatch(sdo);
	//
	// 	// becha I dont need any of these if I trigger the whole orient3d
	// 	// setXAng(sdo.xAng); setYAng(sdo.yAng); setZAng(sdo.zAng);
	// 	// setXPos(sdo.xPos); setYPos(sdo.yPos); setZPos(sdo.zPos);
	// 	// setHFOView(sdo.hfoView);
	// 	// setFudge(sdo.fudge);
	// 	//
	// 	// props.setOrientAll(sdo);
	// }

	if (traceOrient)
		dblog(`OrientLayer render orient=`, orient);

	// normally on for production use
	let pivotOverlay = '';
	if (!traceDontShowPivotOverlay){
		pivotOverlay = <PivotOverlay
				orient={orient}
				setAngSetting={setAngSetting}
			/>;
	}

	// normally off for production use
	let orientOverlay = '';
	if (traceShowOrient3D){
		orientOverlay = <Orient3D
				orient={orient}
				setAngSetting={setAngSetting}
				setOneSetting={setOneSetting}
				setOrientAll={setOrientAll}
			/>;
	}


	return <div className='OrientLayer' >
		{pivotOverlay}
		{orientOverlay}
	</div>;
}

export default OrientLayer;
