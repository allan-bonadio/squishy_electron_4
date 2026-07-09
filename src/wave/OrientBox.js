/*
** Orient 3D -- testing sliders for all orientatiosn
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import React, {useState, useReducer} from 'react';
import PropTypes from 'prop-types';

import {getASetting, storeASetting, getAGroup} from '../utils/storeSettings.js';
import sSettings from '../utils/sSettings.js';

let traceOrient = false;



const propTypes = {
   // in/out.  Pass it in with, whatever, but must have all these
   // fields (not just the ones listed here)
   orient: PropTypes.shape({
   	xAng: PropTypes.number.isRequired,
   	yPos: PropTypes.number.isRequired,
   	hfoView: PropTypes.number.isRequired,
   	// plus others i'm too lazy to do
   }),

   setAngSetting: PropTypes.func.isRequired,
   setOneSetting: PropTypes.func.isRequired,
   setOrientAll: PropTypes.func.isRequired,
}

function OrientBox(props) {
	cfpt(propTypes, props);
	if (!props)
		console.trace(`WTF is this?	 No props?`);

	//debugger;
	let p = props;
	if (traceOrient)
		dblog(`starting OrientBox `, p);

	// xAng yAng zAng — rotate around just 1 axis as given by this event from this slider
	// xPos yPos zPos — adjust offset object is from origin.
	// hfoView — horiz field of view. Default should be 45°?
	// fudge = greggman's fudgeFactor
	// function setOneSetting(which, value) {
	// 	props.setOrient(which, value);  // set in WaveVista and settings
	// 	setters[which](value);  // set state in this component's state
	// 	this.props.orient[which] = value;
	// }

	// handler, only for the angles x y z
	function handleAngSetting(ev) {
		let which = ev.target.className;
		let value = ev.target.valueAsNumber;
		//setters[which](value);

		// set in Vista and settings
		props.setAngSetting(which, value);
	}
	// handler, for any OrientBox setting
	function handleOneSetting(ev) {
		let which = ev.target.className;
		let value = ev.target.valueAsNumber;
		//setters[which](value);

		// set in Vista and settings
		props.setOneSetting(which, value);
	}

	// rotate all settings to default (zeroes?)
	function resetOrientation(ev) {
		const sdo = sSettings.defaults.orientSettings;

		// becha I dont need any of these if I trigger the whole orient3d
		// setXAng(sdo.xAng); setYAng(sdo.yAng); setZAng(sdo.zAng);
		// setXPos(sdo.xPos); setYPos(sdo.yPos); setZPos(sdo.zPos);
		// setHFOView(sdo.hfoView);
		// setFudge(sdo.fudge);

		props.setOrientAll(sdo);
	}

	if (traceOrient)
		dblog(`OrientBox render orient=`, p.orient);

    // all the mins and maxes are the store mins and maxes
	const omm = sSettings.minMaxes.orientSettings;
	const po = p.orient;
	//let maxi = sSettings.minMaxes.lapSettings.dtFactor.max;

	const oneSlider = (vName) =>
		<div>
			<label>{vName} {po[vName]}{vName[1]=='A' ? '°' : 'c'}
				<input type='range' className={vName} value={po[vName]}
					min={omm[vName].min} max={omm[vName].max} step={5} onChange={handleAngSetting} />
			</label>
		</div>;

	return <div className='OrientBox' >
		{oneSlider('xAng')}
		{oneSlider('yAng')}
		{oneSlider('zAng')}

		{oneSlider('xPos')}
		{oneSlider('yPos')}
		{oneSlider('zPos')}

		<button className='glass' onClick={resetOrientation} >reset</button>
	</div>;
}


// sorry paranoid i'll need this again
// <div>
// 	<label>xAng {po.xAng}°
// 		<input type='range' className='xAng' value={po.xAng}
// 			min={omm.xAng.min} max={omm.xAng.max} step={5} onChange={handleAngSetting} />
// 	</label>
// </div>
// <div>
// 	<label>yAng {po.yAng}°
// 		<input type='range' className='yAng' value={po.yAng}
// 			min={omm.yAng.min} max={omm.yAng.max} step={5} onChange={handleAngSetting} />
// 	</label>
// </div>
// <div>
// 	<label>zAng {po.zAng}°
// 		<input type='range' className='zAng' value={po.zAng}
// 			min={omm.zAng.min} max={omm.zAng.max} step={5} onChange={handleAngSetting} />
// 	</label>
// </div>
//
// <div>
// 	<label>xPos {po.xPos} c
// 		<input type='range' className='xPos' value={po.xPos}
// 			min={omm.xPos.min} max={omm.xPos.max} step={1} onChange={handleOneSetting} />
// 	</label>
// </div>
// <div>
// 	<label>yPos {po.yPos} c
// 		<input type='range' className='yPos' value={po.yPos}
// 			min={omm.yPos.min} max={omm.yPos.max} step={1} onChange={handleOneSetting} />
// 	</label>
// </div>
// <div>
// 	<label>zPos {po.zPos} c
// 		<input type='range' className='zPos' value={po.zPos}
// 			min={omm.zPos.min} max={omm.zPos.max} step={1} onChange={handleOneSetting} />
// 	</label>
// </div>
//
// <div>
// 	<label>fov {po.hfoView}°
// 		<input type='range' className='hfoView' value={po.hfoView}
// 			min={omm.hfoView.min} max={omm.hfoView.max} step={1} onChange={handleOneSetting} />
// 	</label>
// </div>
// <div>
// 	<label>fudge {po.fudge}
// 		<input type='range' className='fudge' value={po.fudge}
// 			min={omm.fudge.min} max={omm.fudge.max} step={.1} onChange={handleOneSetting} />
// 	</label>
// </div>



export default OrientBox;
