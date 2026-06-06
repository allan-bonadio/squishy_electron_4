/*
** Orient 3D -- testing sliders for all orientatiosn
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import React, {useState, useReducer} from 'react';
import PropTypes from 'prop-types';

import {getASetting, storeASetting, getAGroup} from '../utils/storeSettings.js';

let traceOrient = false;


const ZPOS_DEFAULT = -100;

const propTypes = {
   //setOrient: PropTypes.func.isRequired,

   // in/out.  Pass it in with, whatever, but must have all these
   // fields (not just the ones in propTypes.shape())
   orient: PropTypes.shape({
   	xAng: PropTypes.number.isRequired,
   	yPos: PropTypes.number.isRequired,
   	hfoView: PropTypes.number.isRequired,
   	// plus others i'm too lazy to do
   }),

   // rotation around xyz axes - separate them so any change renders
	// orientXAng: PropTypes.number.isRequired,
	// orientYAng: PropTypes.number.isRequired,
	// orientZAng: PropTypes.number.isRequired,
	//
	// orientXPos: PropTypes.number.isRequired,
	// orientYPos: PropTypes.number.isRequired,
	// orientZPos: PropTypes.number.isRequired,
	//
	// orientHFOView: PropTypes.number.isRequired,
	// orientFudge: PropTypes.number.isRequired,

	// makeRotMatrix: PropTypes.func.isRequired,
	// mainVistaRepaint: PropTypes.func.isRequired,
   setAngSetting: PropTypes.func.isRequired,
   setOneSetting: PropTypes.func.isRequired,
   setOrientAll: PropTypes.func.isRequired,
   //buildNRepaint: PropTypes.func.isRequired,
}

function Orient3D(props) {
	cfpt(propTypes, props);
	if (!props)
		console.trace(`WTF is this?	 No props?`);

	// these seem unnecessary but the sliders themselves don't update otherwise
	// cmon, cant i just have one state var for this whole component?
	let [xAng, setXAng] = useState(getASetting('orientSettings', 'xAng'));
	let [yAng, setYAng] = useState(getASetting('orientSettings', 'yAng'));
	let [zAng, setZAng] = useState(getASetting('orientSettings', 'zAng'));

	let [xPos, setXPos] = useState(getASetting('orientSettings', 'xPos'));
	let [yPos, setYPos] = useState(getASetting('orientSettings', 'yPos'));
	let [zPos, setZPos] = useState(getASetting('orientSettings', 'zPos'));

	let [hfoView, setHFOView] = useState(getASetting('orientSettings', 'hfoView'));
	let [fudge, setFudge] = useState(getASetting('orientSettings', 'fudge'));

	const setters = {xAng: setXAng, yAng: setYAng, zAng: setZAng,
		xPos: setXPos, yPos: setYPos, zPos: setZPos,
		hfoView: setHFOView, fudge: setFudge};

	//debugger;
	let p = props;
	if (traceOrient)
		dblog(`starting Orient3D `, p);

	// xAng yAng zAng — rotate around just 1 axis as given by this event from this slider
	// xPos yPos zPos — adjust offset object is from origin.
	// hfoView — horiz field of view.	Default should be 45°?
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
		setters[which](value);

		// set in Vista and settings
		props.setAngSetting(which, value);
	}
	// handler, for any Orient3D setting
	function handleOneSetting(ev) {
		let which = ev.target.className;
		let value = ev.target.valueAsNumber;
		setters[which](value);

		// set in Vista and settings
		props.setOneSetting(which, value);
	}

	// rotate all settings to default (zeroes?)
	function resetOrientation(ev) {
		const sdo = sSettings.defaults.orientSettings;

		// becha I dont need any of these if I trigger the whole orient3d
		setXAng(sdo.xAng); setYAng(sdo.yAng); setZAng(sdo.zAng);
		setXPos(sdo.xPos); setYPos(sdo.yPos); setZPos(sdo.zPos);
		setHFOView(sdo.hfoView);
		setFudge(sdo.fudge);

		props.setOrientAll(sdo);
	}

	if (traceOrient)
		dblog(`Orient3D render orient=`, p.orient);

	return <div className='Orient3D' >

		<div>
			<label>xAng {xAng}°
				<input type='range' className='xAng' value={xAng}
					min={-360} max={360} step={1} onChange={handleAngSetting} />
			</label>
		</div>
		<div>
			<label>yAng {yAng}°
				<input type='range' className='yAng' value={yAng}
					min={-360} max={360} step={1} onChange={handleAngSetting} />
			</label>
		</div>
		<div>
			<label>zAng {zAng}°
				<input type='range' className='zAng' value={zAng}
					min={-360} max={360} step={1} onChange={handleAngSetting} />
			</label>
		</div>

		<div>
			<label>xPos {xPos} c
				<input type='range' className='xPos' value={xPos}
					min={-100} max={100} step={1} onChange={handleOneSetting} />
			</label>
		</div>
		<div>
			<label>yPos {yPos} c
				<input type='range' className='yPos' value={yPos}
					min={-100} max={100} step={1} onChange={handleOneSetting} />
			</label>
		</div>
		<div>
			<label>zPos {zPos} c
				<input type='range' className='zPos' value={zPos}
					min={-300} max={1} step={1} onChange={handleOneSetting} />
			</label>
		</div>

		<div>
			<label>fov {hfoView}°
				<input type='range' className='hfoView' value={hfoView}
					min={1} max={120} step={1} onChange={handleOneSetting} />
			</label>
		</div>
		<div>
			<label>fudge {fudge}
				<input type='range' className='fudge' value={fudge}
					min={0} max={2} step={.1} onChange={handleOneSetting} />
			</label>
		</div>

		<button className='glass' onClick={resetOrientation} >reset</button>
	</div>;
}

export default Orient3D;
