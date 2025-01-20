/*
** squish panel -- like a self-contained quantum system, including space,
** 				waves, and drawings and interactivity.
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

// SquishPanel has a 1:1 relationship with the c++ qSpace.
// the ResolutionDialog changes the initialParams and recreates the qSpace.

import React from 'react';
import PropTypes from 'prop-types';

import ControlPanel from '../controlPanel/ControlPanel.js';

import {eSpaceCreatedPromise} from '../engine/eEngine.js';

import {interpretCppException} from '../utils/errors.js';
import WaveView from './WaveView.js';
import sAnimator from './sAnimator.js';

import {getASetting, storeASetting} from '../utils/storeSettings.js';
import {tooOldTerminate} from '../utils/errors.js';

// runtime debugging flags - you can change in the debugger or here
let tracePromises = false;
let traceSquishPanel = false;
let traceWidth = true;

const DEFAULT_VIEW_CLASS_NAME = 'flatScene';




/* ************************************************ construction & reconstruction */

export class SquishPanel extends React.Component {
	static propTypes = {
		id: PropTypes.string.isRequired,
		bodyWidth: PropTypes.number.isRequired,
	};

	static squishPanelConstructed = 0;

	constructor(props) {
		super(props);

		if (SquishPanel.squishPanelConstructed) {
			// should not be called twice!
			console.error(`👑 annoying hot reload...🙄  👿 🤢 😵 🤬 😭 😠`);
			debugger;
			location = location;  // eslint-disable-line no-restricted-globals
		}
		SquishPanel.squishPanelConstructed++;

		this.spaceCtx = React.createContext(null);



		this.state = {
			mainViewClassName: DEFAULT_VIEW_CLASS_NAME,

			showVoltage:  getASetting('voltageSettings', 'showVoltage'),

			// the space for this SP.
			space: null,

			//  this will get filled in when the rAF mesurements get settled down in sAnimator
			frameRateMenuFreqs: null,
		};



		if (traceSquishPanel) console.log(`👑 SquishPanel constructor done`);
	}

	/* ******************************************************* space & wave creation */

	componentDidMount() {
		// upon startup, after C++ says it's ready.
		// why do this in DidMount and not in constructor?  dunno...
		eSpaceCreatedPromise
		.then((space) => {
			//const s = this.state;
			if (tracePromises) console.log(`👑 SquishPanel.compDidMount about to set state`);

			// space will end up in the state but meanwhile we need it now
			this.space = space;
			this.setState({space});  // maybe i don't need this if it's in the context?

			// CPToolbar needs frameRateMenuFreqs to draw the menu.  If it exists yet.
			const pickupFreqs = (freqs) => this.setState({frameRateMenuFreqs: freqs});
			this.animator = new sAnimator(this, space, pickupFreqs);

			this.mainEAvatar = space.mainEAvatar;
			this.grinder = space.grinder;

			if (tracePromises) console.log(`👑 SquishPanel.compDidMount done`);
		})
		.catch(ex => {
			// eslint-disable-next-line no-ex-assign
			ex = interpretCppException(ex);
			if (typeof ex == 'string')
				ex = new Error(ex);
			if ('creating second space' == ex.message) {
				// obnoxious hot reloading; let me reload the right way
				debugger;
				location = location;  // eslint-disable-line no-restricted-globals
				// never gets here
			}
			console.error(`eSpaceCreatedPromise threw: `, ex.stack ?? ex.message ?? ex);
			debugger;
			throw ex;
		});

		// check for obsolescence.  Do this after HTML stuff appears.
		if (!window.WebAssembly)
			tooOldTerminate('WebAssembly');
		if (!window.Worker)
			tooOldTerminate('WebWorkers');
	}




	/* ******************************************************* user settings */
	// others managed from ControlPanel
	// can i move these to the control panel?

	// as long as this alo apppears in the CPToolbar, has to be here
	changeShowVoltage =
	ev => {
		let newSetting = ev.target.value;
		this.setState({showVoltage: newSetting});
		storeASetting('voltageSettings', 'showVoltage', newSetting);

		// now make it effective.  This class and css do it.
		// this stays until the next render, which will also generate the same className.
		// this will have to get more specific if/when there's multiple squish panels
		const setSV = voEl => {
			if (!voEl) return;
			voEl.classList.remove('alwaysShowVoltage', 'hoverShowVoltage',
					'neverShowVoltage');
			voEl.classList.add(newSetting + 'ShowVoltage');
		}
		setSV(document.querySelector('.SquishPanel .optionalVoltage'));
	}

	// dump the view buffer, from the JS side.  Why not use the C++ version?
	dumpViewBuffer(title = '') {
		const s = this.state;
		let nRows = s.space.nPoints * 2;
		let vb = s.space.mainVBuffer;
		const _ = (f) => f.toFixed(3).padStart(6);
		console.log(`👑 dump of view buffer '${title}' for ${s.space.nPoints} points in ${nRows} rows`);
		for (let i = 0; i < nRows; i++)
			console.log(_(vb[i*4]), _(vb[i*4+1]), _(vb[i*4+2]), _(vb[i*4+3]));
	}

	/* ******************************************************* rendering */
	// Base function that draws the WebGL, whether during iteration, or during idle times if params change.
	// call this when you change both the GL and iter and elapsed time
	// we need it here in SquishPanel cuz it's often called in ControlPanel but affects WaveView
	redrawWholeMainWave =
	() => {
		let avatar = this.mainEAvatar;
		let grinder = this.grinder;

		// trigger redrawing of WaveView cuz they're passed in via props
		grinder.elapsedTime = 0;
		grinder.frameSerial = 0;

		// directly redraw the GL
		avatar.smoothHighest = 0;
		avatar.doRepaint();
	}

	render() {
		const p = this.props;
		const s = this.state;

		if (traceWidth) console.log(`👑 SquishPanel render, p.bodyWidth=${p.bodyWidth} `
			+ ` body.clientWidth=${document.body.clientWidth}`);

		return (
			<this.spaceCtx.Provider value={s.space}>

				<article id={this.props.id} className="SquishPanel">
					<WaveView
						outerWidth = {p.bodyWidth}
						showVoltage={s.showVoltage}
						sPanel={this}
					/>
					<ControlPanel
						changeShowVoltage={this.changeShowVoltage}
						showVoltage={s.showVoltage}

						redrawWholeMainWave={this.redrawWholeMainWave}

						iStats={this.iStats}
						frameRateMenuFreqs={s.frameRateMenuFreqs}
						animator={this.animator}
						sPanel={this}
					/>
				</article>
			</this.spaceCtx.Provider>
		);
	}
}

export default SquishPanel;
