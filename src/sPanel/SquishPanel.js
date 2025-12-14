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

//const DEFAULT_SCENE_NAME = 'flatScene';

let me;
let state2, state3;

window.sbiGrinder = null;
window.sbiCk = () => {
	if (sbiGrinder && me ) {
		console.log(`‹›‹›‹›‹›‹›‹›  st=>${me.state.shouldBeIntegrating}   gr=>${sbiGrinder.shouldBeIntegrating}`);
		if (me.state.shouldBeIntegrating !== sbiGrinder.shouldBeIntegrating) {
			console.error(`‹›‹›‹›‹›‹›‹›  state: ${me.state.shouldBeIntegrating}   sbi  grinder: ${sbiGrinder.shouldBeIntegrating}`);
			debugger;
		}
	}
}


/* ************************************************ construction & reconstruction */

class SquishPanel extends React.Component {
	static propTypes = {
		bodyWidth: PropTypes.number.isRequired,
	};

	static squishPanelConstructed = 0;

	constructor(props) {
		super(props);
		checkPropTypes(this.constructor.propTypes, props, 'prop', this.constructor.name);

		// during dev, this gets called TWICE
		SquishPanel.squishPanelConstructed++;

		// will be set by subcomponents
		this.mainRepaint = null;
		this.spectRepaint = null;

		// this becomes the context object - the context sub-objects:
		this.state = {
			name: 'main',  // someday when we have multiple SPs & spaces, this will name each.

			// the space for this SP will be set after it is created
			space: null,

			shouldBeIntegrating: false,  // will be set when space promise comes in
			controlPanel: {},
			waveView: {},
		};
		// see above this.#shouldBeIntegrating = false;

	me = this;

////me.state = this.state;



		// animator will still need grinder, mainRepaint() and context,
		// which don't exist yet.  Each will be on this.whatever
		this.animator = new sAnimator(this, this.getContext);

		if (traceSquishPanel) console.log(`👑 SquishPanel constructor done`);
	}

	/* ****************************************** context */
	static contextType = SquishContext;

	// sbi, the state is kept in this state, the context, and in the grinder
	// this should be the only way to set sbi.  Note does NOT trigger!  Nor set grinder.
	setShouldBeIntegrating = (sbi) => {
		this.setState({shouldBeIntegrating: sbi});

		storeASetting('frameSettings', 'shouldBeIntegrating', sbi);
		console.log(`👑 👑 called setShouldBeIntegrating(${sbi})`);
	};

	// this sets grinder.sbi and does the first trigger
	shouldBeIntegratingUpdate() {

		state2 = this.state;
		if (me.state !== state2) console.warn(`me.state !== state2 in shouldBeIntegratingUpdate`);



		// when it really starts integrating
		if (this.grinder) {
			const sbi = this.state.shouldBeIntegrating;
			this.grinder.shouldBeIntegrating = sbi;
			if (sbi)
				this.grinder.triggerIteration();
			console.log(`👑  shouldBeIntegratingUpdate: shouldBeIntegrating state.sbi=${sbi} and `
				+` gr.sbi=${this.grinder.shouldBeIntegrating} now in effect & triggered; `
				+` gr.isIntegrating=${this.grinder.isIntegrating}\n \n`);

		}
	}

	// these functions are passed in props to lower levels mostly for initialization.
	// called once ONLY in control panel during setup.  Either one can set space.
	setCPContext = (cp) => {
		this.setState({controlPanel: cp});
		this.setState({space: cp.space});
		//this.stateObj.controlPanel = cp;
	}

	// called once ONLY in waveView during setup  Either one can set space.
	setWVContext = (wv) => {
		this.setState({waveView: wv});
		this.setState({space: wv.space});
	}

	getContext = () => this.state;

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
			pointerContextMap.register(space.pointer, this.state);

			//this.mainAvatar = space.mainAvatar;
			this.grinder = space.grinder;
sbiGrinder=this.grinder;
			pointerContextMap.register(space.grinder.pointer, this.state);
			//pointerContextMap.dump();
			this.animator.grinder = this.grinder;
			this.animator.space = this.space;
			this.animator.context = this.state;
			//debugger;

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
	// Base function that draws the WebGL after waveParams change.
	// We need it here in SquishPanel cuz it's often called in
	// ControlPanel but affects WaveView.  Should be implemented thru context TODO
	resetAndRepaintMainWave = () => {
		//debugger;
		//let avatar = this.mainAvatar;
		let grinder = this.grinder;

		// trigger redrawing of WaveView cuz they're passed in via props
		grinder.elapsedTime = 0;
		grinder.frameSerial = 0;

		// directly redraw the GL
		this.mainRepaint();
	}

	// we need the repaint func for the main canvas, and (someday) the spectrum canvas
	// GLScene will pass that up when they get rendered
	setMainRepaint = (mainRepaint) => {
		if (this.mainRepaint) return;
		this.mainRepaint = this.animator.mainRepaint = mainRepaint;
	};
	setSpectRepaint = (spectRepaint) => {
		if (this.spectRepaint) return;
		this.spectRepaint = this.animator.spectRepaint = spectRepaint;
	};

	setSPElement = (el) => this.squishPanelEl = el;

	render() {
		const p = this.props;
		const s = this.state;

		// does NOT alter any react component state but does start integration
		this.shouldBeIntegratingUpdate();

sbiCk();

state3 = this.state;
if (me.state !== state3) console.warn(`me.state !== state3 in render`)
if (state2 !== state3) console.warn(`state2 !== state3 in render`)



		if (traceWidth)
			console.log(`👑 SquishPanel render, p.bodyWidth=${p.bodyWidth} = outerWidth `
				+ ` body.clientWidth=${document.body.clientWidth}`);
		//debugger;

		return (
			<SquishContext.Provider value={this.state} >
				<article className={`SquishPanel space` + s.name} ref={this.setSPElement}>
					<WaveView
						outerWidth = {p.bodyWidth}
						animator={this.animator}
						setWVContext={this.setWVContext}
						setShouldBeIntegrating={this.setShouldBeIntegrating}
						setMainRepaint={this.setMainRepaint}
						setSpectRepaint={this.setSpectRepaint}
						sPanel={this}
					/>
					<ControlPanel
						resetAndRepaintMainWave={this.resetAndRepaintMainWave}

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
