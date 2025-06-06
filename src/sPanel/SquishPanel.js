/*
** squish panel -- like a self-contained quantum system, including space,
** 				waves, and drawings and interactivity.
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

// SquishPanel has a 1:1 relationship with the c++ qSpace.
// the ResolutionDialog changes the initialParams and recreates the qSpace.

import React from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';

import ControlPanel from '../controlPanel/ControlPanel.js';

import {eSpaceCreatedPromise} from '../engine/eEngine.js';

import {interpretCppException} from '../utils/errors.js';
import WaveView from './WaveView.js';
import sAnimator from './sAnimator.js';

import {getASetting, storeASetting} from '../utils/storeSettings.js';
import {tooOldTerminate} from '../utils/errors.js';

import SquishContext from './SquishContext.js';
import pointerContextMap from '../engine/pointerContextMap.js';

// runtime debugging flags - you can change in the debugger or here
let tracePromises = false;
let traceSquishPanel = false;
let traceWidth = false;

const DEFAULT_SCENE_NAME = 'flatScene';

/* ************************************************ construction & reconstruction */

export class SquishPanel extends React.Component {
	static propTypes = {
		id: PropTypes.string.isRequired,
		bodyWidth: PropTypes.number.isRequired,
	};

	static squishPanelConstructed = 0;

	constructor(props) {
		super(props);
		checkPropTypes(this.constructor.propTypes, props, 'prop', this.constructor.name);

//		if (SquishPanel.squishPanelConstructed) {
//			// should not be called twice!
//			console.error(`👑 annoying hot reload...🙄  👿 🤢 😵 🤬 😭 😠`);
//			debugger;
//			location = location;  // eslint-disable-line no-restricted-globals
//		}
// why does this continue to happen!?!?!?
		SquishPanel.squishPanelConstructed++;

		this.state = {
			mainSceneClassName: DEFAULT_SCENE_NAME,

			// the space for this SP.
			space: null,

			// the context sub-objects
			shouldBeIntegrating: getASetting('frameSettings', 'shouldBeIntegrating'),
			controlPanel: {},
			waveView: {},
		};

		if (traceSquishPanel) console.log(`👑 SquishPanel constructor done`);
	}

	/* ****************************************** context */
	static contextType = SquishContext;

	// these functions are passed in props to lower levels mostly for initialization.
	// sbi, the state is kept here (and in the grinder) and passed down.
	setShouldBeIntegrating = (sbi) => {
		this.setState({shouldBeIntegrating: sbi})
		if (this.grinder)
			this.grinder.shouldBeIntegrating = sbi;
		storeASetting('frameSettings', 'shouldBeIntegrating', sbi);
	};

	setCPContext = (cp) => {
		this.setState({controlPanel: cp});
	}

	setWVContext = (wv) => {
		this.setState({waveView: wv});
	}

	/* ****************************************** space & wave creation */

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
			pointerContextMap.register(space.pointer, this.context);

			this.animator = new sAnimator(this, space);

			this.mainEAvatar = space.mainEAvatar;
			this.grinder = space.grinder;
			pointerContextMap.register(space.grinder.pointer, this.context);
			pointerContextMap.dump();

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

	// dump the view buffer, from the JS side.  Why not use the C++ version?
//	dumpViewBuffer(title = '') {
//		const s = this.state;
//		let nRows = s.space.nPoints * 2;
//		let vb = s.space.mainVBuffer;
//		const _ = (f) => f.toFixed(3).padStart(6);
//		console.log(`👑 dump of view buffer '${title}' for ${s.space.nPoints} points in ${nRows} rows`);
//		for (let i = 0; i < nRows; i++)
//			console.log(_(vb[i*4]), _(vb[i*4+1]), _(vb[i*4+2]), _(vb[i*4+3]));
//	}

	/* ******************************************************* rendering */
	// Base function that draws the WebGL, whether during iteration, or during
	// idle times if waveParams change. call this when you change both the GL and iter
	// and elapsed time. We need it here in SquishPanel cuz it's often called in
	// ControlPanel but affects WaveView.  Should be implemented thru context TODO
	repaintWholeMainWave = () => {
		debugger;
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

		if (traceWidth) console.log(`👑 SquishPanel render, p.bodyWidth=${p.bodyWidth} = outerWidth `
			+ ` body.clientWidth=${document.body.clientWidth}`);
		const space = s.space;

		return (
			<SquishContext.Provider value={{
							name: 'main',
							shouldBeIntegrating: s.shouldBeIntegrating,
							controlPanel: s.controlPanel,
							waveView: s.waveView,
						}}>
				<article id={this.props.id} className="SquishPanel">
					<WaveView
						outerWidth = {p.bodyWidth}
						setWVContext={this.setWVContext}
						setShouldBeIntegrating={this.setShouldBeIntegrating}
						sPanel={this}
					/>
					<ControlPanel
						repaintWholeMainWave={this.repaintWholeMainWave}

						iStats={this.iStats}
						animator={this.animator}
						setCPContext={this.setCPContext}
						setShouldBeIntegrating={this.setShouldBeIntegrating}
						sPanel={this}
					/>
				</article>
			</SquishContext.Provider>
		);
	}
}

export default SquishPanel;
