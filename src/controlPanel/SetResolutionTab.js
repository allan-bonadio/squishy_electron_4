/*
** Resolution/Space tab -- lets user choose a new nStates
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import React, {useContext} from 'react';
import PropTypes from 'prop-types';

import ResolutionDialog from './ResolutionDialog.js';
import qeConsts from '../engine/qeConsts.js';
import SquishContext from '../sPanel/SquishContext.js';


function setPT() {
	SetResolutionTab.propTypes = {
		grinder: PropTypes.object,
		space: PropTypes.object,
	};
}

function SetResolutionTab(props) {
	const spa = props.space;
	const context = useContext(SquishContext);

	// the resolution dialog is OUTSIDE of the SquishPanel so can't access the context
	function runResolutionDialog() {

		if (context) {
			// freeze the frame while this is going on ... without disturbing the
			// context or SP state, we'll probably reload the page soon anyway
			const timeWasAdvancing = context.shouldBeIntegrating;
			context.controlPanel.stopAnimating();

			ResolutionDialog.openResolutionDialog(props.grinder);  // reloads the page on OK!

			if (timeWasAdvancing)
				context.controlPanel.startAnimating();
		}
	}

	let continuumBlurb, segmentsBetweenEnds;
	if (qeConsts.contWELL == spa.continuum) {
		segmentsBetweenEnds = spa.N - 1;
		continuumBlurb = <span>
			Your space is a <b>Well</b>, just a box with impenetrable walls on the ends.
			So, your wave will bounce back and forth off the ends.  Exactly at the ends,
			your wave will be zero — the voltage is infinite there, so the walls repell the wave.
			So you have {segmentsBetweenEnds} datapoints in use.
		</span>;
	}
	else if (qeConsts.contENDLESS == spa.continuum) {
		segmentsBetweenEnds = spa.N;
		continuumBlurb = <span>
			Your space is <b>Endless</b>, infinite space that cycles around on the ends.
			So, your wave will crawl along until it gets to the right, and then show up on the left.
			You have {segmentsBetweenEnds} datapoints in use.
		</span>;
	}
	else
		throw `bad space continuum ${spa.continuum}`;

	return (<div className='SetResolutionTab controlPanelPanel'>
		<h3>
			Design the Space
			<span className='statusBar'>
				<b>{spa.N}</b> datapoints in
				<b>{spa.continuum ? ' an Endless' : ' a Well'}</b> space.
			</span>
		</h3>
		<button className='setResolutionButton'
					onClick={runResolutionDialog}>
				Change Space
			<div style={{fontSize: '.8em'}}>
			(will reset current wave)</div>
		</button>

		<p className='discussion'>
			Squishy Electron's space is a one-dimensional place for an electron to travel in.
			You can reconfigure this space here, if you want, with different settings.
			(Your current wave will be reset.)
		</p>
		<p className='discussion'>
			Your space is {spa.dimLength.toFixed(2)}nm long, with&nbsp;
			{(spa.dimLength / segmentsBetweenEnds).toFixed(4)}nm between data points.
			{continuumBlurb}
		</p>

	</div>);
}
setPT();


//      <div style={{float: 'left', marginRight: '1em', width: '10em'}}>
//        <b>{spa.N}</b> datapoints <br/>
//        <b>{spa.continuum ? 'Endless' : 'Well'}</b>
//      </div>



export default SetResolutionTab;
