/*
** control panel toolbar -- toolbar immediately below WaveView
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';
import eSpace from '../engine/eSpace.js';
//import {ShowVoltageControl} from './SetVoltageTab.js';
import qeConsts from '../engine/qeConsts.js';

let traceCPToolbar = false;

window.dbLog = console.log;

// frequencies are per second numbers.  We want nice labels.
function optionForFreq(rate) {
	if (qeConsts.FASTEST == rate) {
		return <option value={qeConsts.FASTEST} key={qeConsts.FASTEST}>Fastest</option>;
	}
	else if (rate > 1) {
		// 1 per sec or more - phrase it this way
		return <option value={rate} key={rate}>{rate} per sec</option>;
	}
	else if (rate == 1) {
		// 1 per sec or more - phrase it this way
		return <option value={rate} key={rate}>once per sec</option>;
	}
	else {
		return <option value={rate} key={rate}>every {1 / rate} sec</option>;
	}
}

function setPT() {
	CPToolbar.propTypes = {
		chosenRate: PropTypes.number.isRequired,
		setChosenRate: PropTypes.func.isRequired,

		// should get rid of this at some point TODO
		//shouldBeIntegrating: PropTypes.bool.isRequired,

		startOverHandler: PropTypes.func.isRequired,
		resetVoltageHandler: PropTypes.func.isRequired,
		//showVoltage: PropTypes.string.isRequired,

		// these two might be undefined during startup, so get ready to punt
		N: PropTypes.number,
		space: PropTypes.instanceOf(eSpace).isRequired,
		cPanel: PropTypes.object.isRequired,
	};
}

// the frame rate menu
const menuFreqs = [
		qeConsts.FASTEST,
		60, 30, 20, 10, 5, 2,
		1, 1/2, 1/5, 1/10, 1/20, 1/30, 1/60];
const rateOptions = menuFreqs.map(freq => optionForFreq(freq));

function CPToolbar(props) {
	cfpt(CPToolbar, props);
	if (traceCPToolbar)
		dbLog(`🧰 CPToolbar starts.  props=`, props);
	let {chosenRate, setChosenRate} = props;

	// for the old buttons - obsolete
	let runningClass = props.shouldBeIntegrating ? 'running' : '';

	return <div className='CPToolbar'>
		<div className='toolbarWidget'>
			frame rate:
		</div>

		<div className='toolbarWidget'>
			<select className='rateSelector' name='rateSelector' value={chosenRate}
					onChange={ev => setChosenRate(ev.currentTarget.value)} >
				{rateOptions}
			</select>
		</div>

		<span className='toolSpacer' style={{width: '.3em'}}></span>

		<div className='toolbarWidget'>
			resolution {props.N ?? '...'} &nbsp;
		</div>

		<div className='toolbarWidget'>
				<button onClick={props.startOverHandler}>Start Over</button>
		</div>

		<div className='toolbarWidget'>
				<button onClick={props.resetVoltageHandler}>
					Reset Voltage
				</button>
		</div>
	</div>;
}

setPT();

export default CPToolbar;

//<button className={`startStopToggle startStopTool ${runningClass}`}
//	onClick={ev => {
//		if (traceCPToolbar)
//			dbLog(`🧰 CPToolbar startStop -> props=`, props);
//		props.cPanel.startStop(ev)
//	}}>
//	{ props.shouldBeIntegrating
//		? <span><big>&nbsp;</big>▐▐ <big>&nbsp;</big></span>
//		: <big>►</big> }
//</button>
//
//<button className={`stepButton startStopTool`}
//	onClick={ev=>{
//		if (traceCPToolbar)
//			dbLog(`🧰 CPToolbar singleFrame -> props=`, props);
//		props.cPanel.singleFrame(ev);
//	}}>
//	<big>►</big> ▌
//</button>
//
//<span className='toolSpacer' style={{width: '.3em'}}></span>
//
