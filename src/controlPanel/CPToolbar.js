/*
** control panel toolbar -- toolbar immediately below WaveView
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import React, {useRef} from 'react';
import PropTypes from 'prop-types';
import eSpace from '../engine/eSpace.js';
//import {ShowVoltageControl} from './SetVoltageTab.js';
import qeConsts from '../engine/qeConsts.js';
import ResolutionDialog from './ResolutionDialog.js';

let traceCPToolbar = false;
let traceSlowerFaster = false;

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

const propTypes = {
	// chosenRate: PropTypes.number.isRequired,
	// setChosenRate: PropTypes.func.isRequired,

	// called rapidly during click and hold of hare and tortoise buttons
	getQuickDtFactor: PropTypes.func.isRequired,
	setQuickDtFactor: PropTypes.func.isRequired,
	saveDtFactor: PropTypes.func.isRequired,

	startOverHandler: PropTypes.func.isRequired,
	resetVoltageHandler: PropTypes.func.isRequired,
	setShowingTab: PropTypes.func,

	// these two might be undefined during startup, so get ready to punt
	N: PropTypes.number,
	space: PropTypes.instanceOf(eSpace).isRequired,
	cPanel: PropTypes.object.isRequired,
};

// ms delay after pressing speed button before it starts repeating
const SPEED_DELAY = 500;
// how often rapid speed change changes
const SPEED_FREQ = 50;
// how much speed changes each FREQ ms
const FASTER_SPEED = 1.1;
const FASTER_NUDGE = 1.01;
const SLOWER_SPEED = 0.9;
const SLOWER_NUDGE = 0.99;

// the frame rate menu
// const menuFreqs = [
// 		qeConsts.FASTEST,
// 		60, 30, 20, 10, 5, 2,
// 		1, 1/2, 1/5, 1/10, 1/20, 1/30, 1/60];
// const rateOptions = menuFreqs.map(freq => optionForFreq(freq));

function CPToolbar(props) {
	cfpt(propTypes, props);
	const p = props;
	if (traceCPToolbar)
		dbLog(`🧰 CPToolbar starts render.  props=`, props);
	let {setShowingTab} = props;
	//let {chosenRate, setChosenRate, setShowingTab} = props;

	/* ************************************************* speed buttons */
	// spare icons: 🐌🐢🐎  🐇 🌪️

	// the rabbit and tortoise buttons
	// adjust the speed by this factor
	const propel = factor => p.setQuickDtFactor(p.getQuickDtFactor() * factor);

	let intervalRef = useRef(0);
	let timeoutRef = useRef(0);
	const faster = () => propel(1.01);
	const repeatFaster = () =>
		intervalRef.current = setInterval(faster, SPEED_FREQ);

	const slower = () => propel(.99);
	const repeatSlower = () =>
		intervalRef.current = setInterval(slower, SPEED_FREQ);

	// user clicks down on either speed button
	const downSpeedHandler =
	(ev) => {
		// either faster or slower
		if (ev.target.classList.contains('faster')) {
			if (traceSlowerFaster)
				dbLog(`🧰 SlowerFaster Faster starts.  dtFactor=${props.getQuickDtFactor()}  `);
			propel(FASTER_SPEED);  // speed up by big incr
			timeoutRef.current = setTimeout(repeatFaster, SPEED_DELAY);  // then slowly accel over time
		}
		else {
			if (traceSlowerFaster)
				dbLog(`🧰 SlowerFaster SLower starts.  dtFactor=${props.getQuickDtFactor()} `);
			propel(SLOWER_SPEED);
			timeoutRef.current = setTimeout(repeatSlower, SPEED_DELAY);
		}
	};

	// kill all those delays and repeats
	const upSpeedHandler =
	(ev) => {
		console.log(`🐭 timeoutRef.current=${timeoutRef.current}  intervalRef.current=${intervalRef.current}`);
		clearTimeout(timeoutRef.current);
		clearInterval(intervalRef.current);
		timeoutRef.current = intervalRef.current = 0;
		p.saveDtFactor();
	};

	// called upon enter, mouse move, and maybe more events, just in case speeding or
	// slowing is still running but we missed the mouseup event.
	const maybeStopSpeed =
	(ev) => {
		console.log(`maybeStopSpeed ev=`, ev);
		if (0 == ev.buttons)
			upSpeedHandler(ev);
	};

	// the slower and faster buttons should stop when they get mouseUp events.
	// except sometimes those events get lost, so also leave and move events
	const speedControl = () => { return <>
			<div className='toolbarWidget'>
				<button className='toolbarWidget speedButton slower'
						onMouseDown={downSpeedHandler}
						onMouseUp={upSpeedHandler}  onMouseLeave={upSpeedHandler}
						onMouseEnter={maybeStopSpeed} onMouseMove={maybeStopSpeed}>
					<span>🐢</span> slower
				</button>
				<button className='toolbarWidget speedButton faster'
						onMouseDown={downSpeedHandler}
						onMouseUp={upSpeedHandler}  onMouseLeave={upSpeedHandler}
						onMouseEnter={maybeStopSpeed} onMouseMove={maybeStopSpeed}>
					<span>🐇</span> faster
				</button>
			</div>
		</>
	};

	/* ************************************************* resolution dlg buttons */

	// it displays the resolutioin, so it's natural for someone to click on it
	const resolutionHandler = ev => {
		setShowingTab('space');
		ResolutionDialog.openResolutionDialog();
	}

	const resolutionControl = () => <div className='toolbarWidget'>
		<div className='toolbarWidget'>
			<button className='toolbarWidget resolutionBox' onClick={resolutionHandler} >
				resolution {props.N ?? '...'}
			</button>
		</div>
	</div>;

	return <div className='CPToolbar'>

		{speedControl()}

		<span className='toolSpacer' style={{width: '.3em'}}></span>

		{resolutionControl()}

		<span className='toolSpacer' style={{width: '.3em'}}></span>

		<div className='toolbarWidget'>
				<button onClick={props.startOverHandler}>Reset &amp; Start Over</button>
		</div>

		<div className='toolbarWidget'>
				<button onClick={props.resetVoltageHandler}>
					Reset only Voltage
				</button>
		</div>
	</div>;
}



export default CPToolbar;

//
//		<div className='toolbarWidget'>
//			frame rate:
//		</div>
//
//		<div className='toolbarWidget'>
//			<select className='rateSelector' name='rateSelector' value={chosenRate}
//					onChange={ev => setChosenRate(ev.currentTarget.value)} >
//				{rateOptions}
//			</select>
//		</div>
