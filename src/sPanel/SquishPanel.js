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

		// during dev, this gets called TWICE
		SquishPanel.squishPanelConstructed++;

		// make sure the context object doesn't keep getting replaced - it's this one
		this.contextObj = {
			name: 'main',
			shouldBeIntegrating: getASetting('frameSettings', 'shouldBeIntegrating'),
		};

		this.state = {
			mainSceneClassName: DEFAULT_SCENE_NAME,

			// the space for this SP.
			space: null,

			// the context sub-objects
			shouldBeIntegrating: this.contextObj.shouldBeIntegrating,
			controlPanel: {},
			waveView: {},
		};

		if (traceSquishPanel) console.log(`👑 SquishPanel constructor done`);
	}

	/* ****************************************** context */
	static contextType = SquishContext;

	// sbi, the state is kept in this state, the context, and in the grinder
	// this should be the only way to set sbi.  Note does NOT trigger!
	setShouldBeIntegrating = (sbi) => {
		this.setState({shouldBeIntegrating: sbi});
		if (this.grinder) {
			this.grinder.shouldBeIntegrating = sbi;
			if (sbi)
				this.grinder.triggerIteration();
		}

		storeASetting('frameSettings', 'shouldBeIntegrating', sbi);
		console.trace(`👑 called setShouldBeIntegrating(${sbi})`);
	};

	// these functions are passed in props to lower levels mostly for initialization.
	// called once ONLY in control panel during setup
	setCPContext = (cp) => {
		this.setState({controlPanel: cp});
		this.contextObj.controlPanel = cp;
	}

	// called once ONLY in waveView during setup
	setWVContext = (wv) => {
		this.setState({waveView: wv});
		this.contextObj.waveView = wv;
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

			this.animator = new sAnimator(this, space, this.setShouldBeIntegrating);

			this.mainEAvatar = space.mainEAvatar;
			this.grinder = space.grinder;
			pointerContextMap.register(space.grinder.pointer, this.context);
			//pointerContextMap.dump();

			// somebody needs to start this going if it was already on last time
			// but wait till everything is ready.  TODO: should do this in a sync
			// way; time is hokey
			if (getASetting('frameSettings', 'shouldBeIntegrating')) {
				setTimeout(() => this.setShouldBeIntegrating(true), 500)	;
			}

			if (tracePromises) console.log(`👑 SquishPanel.compDidMount done`);
		})
		.catch(ex => {
			// eslint-disable-next-line no-ex-assign
			ex = interpretCppException(ex);
			if (typeof ex == 'string')
				ex = new Error(ex);
			//if ('creating second space' == ex.message) {
			//	// obnoxious hot reloading; let me reload the right way
			//	debugger;
			//	location = location;  // eslint-disable-line no-restricted-globals
			//	// never gets here
			//}
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

		// make sure the context object doesn't keep getting replaced by using the same one every time
		this.contextObj.shouldBeIntegrating = s.shouldBeIntegrating;

		return (
			<SquishContext.Provider value={this.contextObj}>
				<article id={this.props.id} className="SquishPanel">
					<WaveView
						outerWidth = {p.bodyWidth}
						animator={this.animator}
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
