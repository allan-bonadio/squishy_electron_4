/*
** control panel toolbar -- toolbar immediately below WaveView
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
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


// ms delay after pressing speed button before it starts repeating
const SPEED_DELAY = 500;
// how often rapid speed change happens as user holds down speed button
const SPEED_FREQ = 50;
// how much speed changes each FREQ ms
const FASTER_BOOST = 1.1;
const FASTER_NUDGE = 1.01;
const SLOWER_BOOST = 0.9;
const SLOWER_NUDGE = 0.99;

/* ************************************************* resolution dlg buttons */

// called when human clicks on res box
// it displays the resolution, so it's natural for someone to click on it
const resolutionHandler = (ev) => {
	//setShowingTab('space');
	ResolutionDialog.openResolutionDialog();
}

// the actual button they click.  The number doesn't change within a reset
const renderResolutionControl = (N) => <div className='toolbarWidget'>
	<div className='toolbarWidget'>
		<button className='toolbarWidget resolutionBox' onClick={resolutionHandler} >
			resolution {N}
		</button>
	</div>
</div>;


/* ************************************************* speed buttons */
// spare icons: 🐌🐢🐎  🐇 🌪️

// the rabbit and tortoise buttons
// The vonNeuman rate is refDt
// But the dt that the inner machinery uses is stretchedDt = refDt * dtFactor
// dtFactor.  This is the 'speed' of the integration;
// under user control, hopefully guard mechanisms to lower dtFactor if
// it's getting too much divergence .
//let propel;

// All of the following code does NOT need props or this or anything
// besides the ev object; those are in the component itself.

// also it's OK to have globals - the software is only interacting with one human at a time.
let timeoutId, intervalId;


/* ********************************************* CPToolbar */

const propTypes = {
	// called rapidly during click and hold of hare and tortoise buttons
	getQuickDtFactor: PropTypes.func.isRequired,
	setQuickDtFactor: PropTypes.func.isRequired,
	saveDtFactor: PropTypes.func.isRequired,

	resetWaveHandler: PropTypes.func.isRequired,
	resetVoltageHandler: PropTypes.func.isRequired,
	//setShowingTab: PropTypes.func,

	// these two might be undefined during startup, so get ready to punt
	N: PropTypes.number,
	space: PropTypes.instanceOf(eSpace).isRequired,
	cPanel: PropTypes.object.isRequired,
};

function CPToolbar(props) {
	cfpt(propTypes, props);
	const p = props;
	if (traceCPToolbar)
		dbLog(`🧰 CPToolbar starts render.  props=`, props);

	/* ********************************************* speed buttons */
	// user clicks/taps down on either the slower or faster speed button
	const downSpeedHandler =
	(ev) => {
		// either faster or slower
		if (ev.target.classList.contains('faster')) {
			if (traceSlowerFaster)
				dbLog(`🧰 SlowerFaster Faster starts.   `);
			propel(FASTER_BOOST);  // speed up by big incr
			timeoutId = setTimeout(repeatFaster, SPEED_DELAY);  // then slowly accel over time
		}
		else {
			if (traceSlowerFaster)
				dbLog(`🧰 SlowerFaster SLower starts.  `);
			propel(SLOWER_BOOST);
			timeoutId = setTimeout(repeatSlower, SPEED_DELAY);
		}
	};

	// mouse up (or equiv) on these speed buttons.  means, stop everything
	const upSpeedHandler =
	(ev) => {
		if (0 == timeoutId && 0 == intervalId)
			return;
		clearTimeout(timeoutId);
		clearInterval(intervalId);
		timeoutId = intervalId = 0;
		p.saveDtFactor();
	};

	// called upon enter, mouse move, and maybe more events, just in case speeding or
	// slowing is still running but we missed the mouseup event.
	// cuz it just keeps on getting faster/slower
	const maybeStopSpeed =
	(ev) => {
		console.log(`maybeStopSpeed ev=`, ev);
		if (0 == ev.buttons)
			upSpeedHandler(ev);
	};

	// pushes the dtFactor to revise slowly.  never more than 1%
	const propel = (boost) => p.setQuickDtFactor(p.getQuickDtFactor() * boost);

	const faster = () => propel(1.01);
	const repeatFaster = () =>
		intervalId = setInterval(faster, SPEED_FREQ);

	const slower = () => propel(.99);
	const repeatSlower = () =>
		intervalId = setInterval(slower, SPEED_FREQ);

	let {setShowingTab} = props;

	// the slower and faster buttons should stop when they get mouseUp events.
	// except sometimes those events get lost, so also leave and move events
	const renderSpeedControl = () => (<>
			<button className='toolbarWidget speedButton slower'
					onMouseDown={downSpeedHandler}
					onMouseUp={upSpeedHandler}
					onMouseLeave={upSpeedHandler}
					onMouseEnter={maybeStopSpeed}>
				<span>🐢</span> slower
			</button>

			<span className='toolbarWidget speedButtonDisplay'>
				&nbsp;
			</span>

			<button className='toolbarWidget speedButton faster'
					onMouseDown={downSpeedHandler}
					onMouseUp={upSpeedHandler}
					onMouseLeave={upSpeedHandler}
					onMouseEnter={maybeStopSpeed}>
			<span>🐇</span> faster
		</button>
	</>);

	/* 			onMouseMove={maybeStopSpeed}>
					{onMouseMove={maybeStopSpeed}> */

/* *************************************************** render */

	return (<div className='CPToolbar'>

		{renderSpeedControl()}
		<span className='toolSpacer' style={{width: '.3em'}}></span>
		{renderResolutionControl(props.N)}
		<span className='toolSpacer' style={{width: '.3em'}}></span>

		<div className='toolbarWidget'>
				<button onClick={props.resetWaveHandler}>Reset Wave</button>
		</div>

		<div className='toolbarWidget'>
				<button onClick={props.resetVoltageHandler}>Reset Voltage</button>
		</div>
	</div>);
}

export default CPToolbar;

