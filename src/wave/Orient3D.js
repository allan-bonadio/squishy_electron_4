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

   // rotation around xyz axes - separate them so any change renders
   orientX: PropTypes.number.isRequired,
   orientY: PropTypes.number.isRequired,
   orientZ: PropTypes.number.isRequired,

   orientXPos: PropTypes.number.isRequired,
   orientYPos: PropTypes.number.isRequired,
   orientZPos: PropTypes.number.isRequired,

   orientFOView: PropTypes.number.isRequired,

   makeRotMatrix: PropTypes.func.isRequired,
   mainVistaRepaint: PropTypes.func.isRequired,
   setOrient: PropTypes.func.isRequired,
   repaintRecreate: PropTypes.func.isRequired,
}

function Orient3D(props) {
	cfpt(propTypes, props);
	if (!props)
	    console.trace(`WTF is this?  No props?`);

    // these seem unnecessary but the sliders themselves don't update otherwise
    let [x, setX] = useState(getASetting('orientSettings', 'x'));
    let [y, setY] = useState(getASetting('orientSettings', 'y'));
    let [z, setZ] = useState(getASetting('orientSettings', 'z'));

    let [xPos, setXPos] = useState(getASetting('orientSettings', 'xPos'));
    let [yPos, setYPos] = useState(getASetting('orientSettings', 'yPos'));
    let [zPos, setZPos] = useState(getASetting('orientSettings', 'zPos'));

    let [foView, setFOView] = useState(getASetting('orientSettings', 'foView'));

    const setters = {x: setX, y: setY, z: setZ,
        xPos: setXPos, yPos: setYPos, zPos: setZPos,
        foView: setFOView};

    // actions are like {y: 44.2} usually only changing one at a time
    // doing this so that this particular component renders.
//    function reducer(orient, action) {
//        return {...orient, ...action};
//    }
//    const [orient, dispatch] = useReducer(reducer, getAGroup('orientSettings'));

	//debugger;
    let p = props;
    if (traceOrient)
        dblog(`starting Orient3D ${p.orientX}  ${p.orientY}  ${p.orientZ}   `, p);

    // x y z — rotate around just 1 axis as given by this event from this slider
    // xPos yPos zPos — adjust offset object is from camera.
    // foView — field of view.  Default should be 45°
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
	    setX(sdo.x); setY(sdo.y); setZ(sdo.z);
        setXPos(sdo.xPos); setYPos(sdo.yPos); setZPos(sdo.zPos);
        setFOView(sdo.foView);

        props.repaintOrient();
	}

    if (traceOrient)
        dblog(`Orient3D render orient=`, p.orientX, p.orientY, p.orientZ);

	return <div className='Orient3D' >

	    <div>
	        <label>x {x}°</label>
			<input type='range' className='x' value={x}
				min={-360} max={360} step={1} onChange={setOneOrient} />
	    </div>
	    <div>
	        <label>y {y}°</label>
			<input type='range' className='y' value={y}
				min={-360} max={360} step={1} onChange={setOneOrient} />
	    </div>
	    <div>
	        <label>z {z}°</label>
			<input type='range' className='z' value={z}
				min={-360} max={360} step={1} onChange={setOneOrient} />
		</div>

	    <div>
	        <label>x {xPos} c</label>
			<input type='range' className='xPos' value={xPos}
				min={-100} max={100} step={1} onChange={setOneOrient} />
	    </div>
	    <div>
	        <label>y {yPos} c</label>
			<input type='range' className='yPos' value={yPos}
				min={-100} max={100} step={1} onChange={setOneOrient} />
	    </div>
	    <div>
	        <label>z {zPos} c</label>
			<input type='range' className='zPos' value={zPos}
				min={-100} max={1} step={1} onChange={setOneOrient} />
		</div>

	    <div>
	        <label>fov {foView}° </label>
			<input type='range' className='foView' value={foView}
				min={1} max={179} step={1} onChange={setOneOrient} />
		</div>
		<button onClick={resetOrientation} >reset</button>
    </div>;
}

export default Orient3D;
