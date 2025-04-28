/*
** Resolution/Space tab -- lets user choose a new nStates
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import PropTypes from 'prop-types';

import ResolutionDialog from './ResolutionDialog.js';
import qeConsts from '../engine/qeConsts.js';

function setPT() {
	SetResolutionTab.propTypes = {
		grinder: PropTypes.object,
		space: PropTypes.object,
	};
}

function SetResolutionTab(props) {
	const spa = props.space;

	let continuumBlurb, segmentsBetweenEnds;
	if (qeConsts.contWELL == spa.continuum) {
	  continuumBlurb = <div>
	    Your space is a <b>Well</b>, just a box with impenetrable walls on the ends.
      So, your wave will bounce back and forth off the ends.  Exactly at the ends,
      your wave will be zero — the voltage is infinite there, so the walls repell the wave.
      So you actually have {spa.N - 2} datapoints in play.
    </div>;
	  segmentsBetweenEnds = spa.N - 1;
	}
	if (qeConsts.contENDLESS == spa.continuum) {
	  continuumBlurb = <div>
      Your space is <b>Endless</b>, infinite space that cycles around on the ends.
      So, your wave will crawl along until it gets to the end.
      So you actually have {spa.N - 2} datapoints in play.
    </div>;
	  segmentsBetweenEnds = spa.N;
	}

	return (<div className='SetResolutionTab'>
		<button className='setResolutionButton'
			onClick={ev => (props.grinder)
					&& ResolutionDialog.openResolutionDialog(props.grinder)}>
				Change Space
			<div style={{fontSize: '.8em'}}>
			(will reset current wave)</div>
		</button>
		<h3 style={{display: 'inline-block', }}>Reconfigure the Space</h3>
		<span style={{marginLeft: '3em', backgroundColor: '#ace', padding: '.5em',
		      }}>
		  <b>{spa.N}</b> datapoints in
      <b>{spa.continuum ? ' an Endless' : ' a Well'}</b> space.
    </span>

		<p className='discussion'>
			Squishy Electron's space is a one-dimensional place for an electron to travel in.
			You can reconfigure this space here, if you want, with different settings.
			(Your current wave will be reset.)
		</p>
		<div className='discussion'>
      Your space is {spa.dimLength.toFixed(2)}nm long, with&nbsp;
      {(spa.dimLength / segmentsBetweenEnds).toFixed(4)}nm between data points.
		  {continuumBlurb}
		</div>

	</div>);
}
setPT();


//      <div style={{float: 'left', marginRight: '1em', width: '10em'}}>
//        <b>{spa.N}</b> datapoints <br/>
//        <b>{spa.continuum ? 'Endless' : 'Well'}</b>
//      </div>



export default SetResolutionTab;
