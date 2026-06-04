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
   setOrient: PropTypes.func.isRequired,

   // this is returned.  Pass it in with, whatever, but must have all these
   // fields (not just the ones in .shape())
   orient: PropTypes.shape({
   	xAng: PropTypes.number.isRequired,
   	yPos: PropTypes.number.isRequired,
   	hfoView: PropTypes.number.isRequired,
   })

   // rotation around xyz axes - separate them so any change renders
   orientX: PropTypes.number.isRequired,
   orientY: PropTypes.number.isRequired,
   orientZ: PropTypes.number.isRequired,

   orientXPos: PropTypes.number.isRequired,
   orientYPos: PropTypes.number.isRequired,
   orientZPos: PropTypes.number.isRequired,

   orientFOView: PropTypes.number.isRequired,
   orientFudge: PropTypes.number.isRequired,

   makeRotMatrix: PropTypes.func.isRequired,
   mainVistaRepaint: PropTypes.func.isRequired,
   setOrient: PropTypes.func.isRequired,
   repaintRecreate: PropTypes.func.isRequired,
}

function Orient3D(props) {
	cfpt(propTypes, props);
	if (!props)
		console.trace(`WTF is this?	 No props?`);

	// these seem unnecessary but the sliders themselves don't update otherwise
	let [xAng, setX] = useState(getASetting('orientSettings', 'xAng'));
	let [yAng, setY] = useState(getASetting('orientSettings', 'yAng'));
	let [zAng, setZ] = useState(getASetting('orientSettings', 'zAng'));

	let [xPos, setXPos] = useState(getASetting('orientSettings', 'xPos'));
	let [yPos, setYPos] = useState(getASetting('orientSettings', 'yPos'));
	let [zPos, setZPos] = useState(getASetting('orientSettings', 'zPos'));

	let [hfoView, setFOView] = useState(getASetting('orientSettings', 'hfoView'));
	let [fudge, setFudge] = useState(getASetting('orientSettings', 'fudge'));

	const setters = {xAng: setX, yAng: setY, zAng: setZ,
		xPos: setXPos, yPos: setYPos, zPos: setZPos,
		hfoView: setFOView, fudge: setFudge};

	// actions are like {yAng: 44.2} usually only changing one at a time
	// doing this so that this particular component renders.
//	  function reducer(orient, action) {
//		  return {...orient, ...action};
//	  }
//	  const [orient, dispatch] = useReducer(reducer, getAGroup('orientSettings'));

	//debugger;
	let p = props;
	if (traceOrient)
		dblog(`starting Orient3D ${p.orientX}  ${p.orientY}	 ${p.orientZ}	`, p);

	// xAng yAng zAng — rotate around just 1 axis as given by this event from this slider
	// xPos yPos zPos — adjust offset object is from camera.
	// hfoView — field of view.	Default should be 45°
	// fudge = greggman's fudgeFactor
	function setOneOrient(ev) {
		let which = ev.target.className;
		props.setOrient(which, ev.target.valueAsNumber);  // set in Vista and settings
		setters[which](ev.target.valueAsNumber);  // set in this components state

		// pass the latest matrix into the repainter and paint it
		props.repaintRecreate();
	}

	// rotate all origin.* to zzero
	function resetOrientation() {
		const sdo = sSettings.defaults.orientSettings;
		props.setOrient('multi', { ...sdo});
		setX(sdo.xAng); setY(sdo.yAng); setZ(sdo.zAng);
		setXPos(sdo.xPos); setYPos(sdo.yPos); setZPos(sdo.zPos);
		setFOView(sdo.hfoView);
		setFudge(sdo.fudge);

		props.repaintOrient();
	}

	if (traceOrient)
		dblog(`Orient3D render orient=`, p.orientX, p.orientY, p.orientZ);

	return <div className='Orient3D' >

		<div>
			<label>xAng {xAng}°</label>
			<input type='range' className='xAng' value={xAng}
				min={-360} max={360} step={1} onChange={setOneOrient} />
		</div>
		<div>
			<label>yAng {yAng}°</label>
			<input type='range' className='yAng' value={yAng}
				min={-360} max={360} step={1} onChange={setOneOrient} />
		</div>
		<div>
			<label>zAng {zAng}°</label>
			<input type='range' className='zAng' value={zAng}
				min={-360} max={360} step={1} onChange={setOneOrient} />
		</div>

		<div>
			<label>xPos {xPos} c</label>
			<input type='range' className='xPos' value={xPos}
				min={-100} max={100} step={1} onChange={setOneOrient} />
		</div>
		<div>
			<label>yPos {yPos} c</label>
			<input type='range' className='yPos' value={yPos}
				min={-100} max={100} step={1} onChange={setOneOrient} />
		</div>
		<div>
			<label>zPoz {zPos} c</label>
			<input type='range' className='zPos' value={zPos}
				min={-300} max={1} step={1} onChange={setOneOrient} />
		</div>

		<div>
			<label>fov {hfoView}° </label>
			<input type='range' className='hfoView' value={hfoView}
				min={1} max={120} step={1} onChange={setOneOrient} />
		</div>
		<div>
			<label>fudge {fudge}° </label>
			<input type='range' className='fudge' value={fudge}
				min={0} max={2} step={.1} onChange={setOneOrient} />
		</div>

		<button className='glass' onClick={resetOrientation} >reset</button>
	</div>;
}

export default Orient3D;
