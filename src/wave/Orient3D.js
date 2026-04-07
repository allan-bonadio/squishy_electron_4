/*
** Orient 3D -- testing sliders for all orientatiosn
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import React, {useState, useReducer} from 'react';
import PropTypes from 'prop-types';

import {getASetting, storeASetting, getAGroup} from '../utils/storeSettings.js';

let traceOrient = false;

const propTypes = {
   setOrient: PropTypes.func.isRequired,

   // separate them so any change renders
   orientX: PropTypes.number.isRequired,
   orientY: PropTypes.number.isRequired,
   orientZ: PropTypes.number.isRequired,
}

function Orient3D(props) {
	cfpt(propTypes, props);
	if (!props)
	    console.trace(`WTF is this?  No props?`);

    // actions are like {y: 44.2} usually only changing one at a time
    // doing this so that this particular component renders.
    function reducer(orient, action) {
        return {...orient, ...action};
    }
    const [orient, dispatch] = useReducer(reducer, getAGroup('orientSettings'));

	//debugger;
    let p = props;
    if (traceOrient)
        dblog(`starting Orient3D ${p.orientX}  ${p.orientY}  ${p.orientZ}   `, p);

	function setOneSlider(ev) {
		let which = ev.target.className;
		props.setOrient(which, ev.target.valueAsNumber);
		dispatch({[which]: ev.target.valueAsNumber});
	}

    if (traceOrient)
        dblog(`Orient3D render orient=`, p.orientX, p.orientY, p.orientZ);

	return <div className='Orient3D' >
	    <div>
	        <label>{p.orientX}°</label>
			<input type='range' className='x' value={p.orientX}
				min={-360} max={360} step={1} onChange={setOneSlider} />
	    </div>
	    <div>
	        <label>{p.orientY}°</label>
			<input type='range' className='y' value={p.orientY}
				min={-360} max={360} step={1} onChange={setOneSlider} />
	    </div>
	    <div>
	        <label>{p.orientZ}°</label>
			<input type='range' className='z' value={p.orientZ}
				min={-360} max={360} step={1} onChange={setOneSlider} />
		</div>
    </div>;
}

export default Orient3D;
