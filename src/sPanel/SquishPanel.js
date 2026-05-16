/*
** squish panel -- like a self-contained quantum system, including space,
**				waves, and drawings and interactivity.
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

// SquishPanel has a 1:1 relationship with the c++ qSpace.
// the ResolutionDialog changes the initialParams and recreates the qSpace.

import React from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';

import ControlPanel from '../controlPanel/ControlPanel.js';

import {interpretCppException} from '../utils/errors.js';
import WaveView from '../wave/WaveView.js';
import WaveVista from '../wave/WaveVista.js';
import sAnimator from './sAnimator.js';
import eSpace from '../engine/eSpace.js';

import {getASetting, storeASetting, getAGroup} from '../utils/storeSettings.js';
import {tooOldTerminate} from '../utils/errors.js';
import {cppActivePromise} from '../engine/eEngine.js';

import SquishContext from './SquishContext.js';
import pointerContextMap from '../engine/pointerContextMap.js';	 // TODO: get rid of this
import {waitForSpaceCreatedPromise} from '../wave/waveContext.js';	// TODO: get rid of this
//import waveAux from '../wave/waveAux.js';


// runtime debugging flags - you can change in the debugger or here
let tracePromises = false;
let traceSquishPanel = false;
let traceWidth = false;
let traceSBIUpdate = false;
let traceNewSpace = false;

/* ************************************************ construction & reconstruction */






class SquishPanel extends React.Component {
	static propTypes = {
		bodyWidth: PropTypes.number.isRequired,	 // width of window which dictates view and vista width
	};

	constructor(props) {
		super(props);
		checkPropTypes(this.constructor.propTypes, props, 'prop', this.constructor.name);

		// during dev, this gets called TWICE
		SquishPanel.squishPanelConstructed++;

		//this.box = new waveAux();

		// will be set by subcomponents
		this.mainViewRepaint = null;
		this.mainVistaRepaint = null;
		this.spectRepaint = null;

		// this becomes the context object - the context sub-objects:
		this.state = {
			name: 'main',  // someday when we have multiple SPs & spaces, this will name each.

			// the space for this SP will be set after it is created
			space: null,

			shouldBeIntegrating: false,	 // will be set when space promise comes in
			controlPanel: {},
			waveView: {},

			fakeChange: 1,

			// loopyt spaceReady: new Promise(this.spaceNowReady, this.spaceCreationError)
		};

		// for now, 3d is turned off for public use.  Append ?3d to use it.
		if (window.enable3D) {
			this.state.show2D = getASetting('miscSettings', 'show2D');
			this.state.show3D = getASetting('miscSettings', 'show3D');
		}
		else {
			this.state.show2D = true;
			this.state.show3D = false;
		}

		// this will end up in everybody's context.	 Unfortunately, the
		// context isn't always there on creation.	This is why we pass
		// the space down the props
		this.state.spaceCreatedProm = new Promise((succeed, fail) => {
			this.spaceSucceed = succeed;
			this.spaceFail = fail;
			if (tracePromises)
				dblog(`🐥 wv.spaceCreatedProm (re)created:`, succeed, fail);
		});

		cppActivePromise.then(() => {
			let params = getAGroup('spaceParams');
			params.label = 'x';	 // the x coordinate, the only dimension of the space
			this.create1DMainSpace(params);
		});

		// animator will still need grinder, mainViewRepaint() and context,
		// which don't exist yet.  Each will be on this.whatever
		this.animator = new sAnimator(this, this.getContext);

		if (traceSquishPanel) dblog(`👑 SquishPanel constructor done`);
	}

	// called when spaceReady promise results.
	// spaceNowReady = (space) => {
	//
	// }

	// space creation got an error, sorry.
	spaceCreationError = (ex) => {
		console.error(`Error creating the space: `, ex.stack ?? ex.message ?? ex);
		alert(`Sorry, but we could not create the space for the Squishy Electron.\n` + ex.message);
		open(`https://www.youtube.com/watch?v=JP9KP-fwFhk`,
			`Quantum4Dummies`, '')


	}

	/* ****************************************** context */
	static contextType = SquishContext;

	// sbi, the state is kept in this state, the context, and in the grinder
	// this should be the only way to set sbi.	Note does NOT trigger!	Nor set grinder.
	setShouldBeIntegrating = (sbi) => {
		this.setState({shouldBeIntegrating: sbi});

		storeASetting('lapSettings', 'shouldBeIntegrating', sbi);
		if (traceSBIUpdate)
			dblog(`👑 👑 called setShouldBeIntegrating(${sbi})`);
	};

	// this sets grinder.sbi and does the first trigger
	shouldBeIntegratingUpdate() {
		// when it really starts integrating
		if (this.grinder) {
			const sbi = this.state.shouldBeIntegrating;
			this.grinder.shouldBeIntegrating = sbi;
			if (sbi)
				this.grinder.triggerIteration();

			if (traceSBIUpdate) {
				dblog(`👑  shouldBeIntegratingUpdate: shouldBeIntegrating state.sbi=${sbi} and `
					+` gr.sbi=${this.grinder.shouldBeIntegrating} now in effect & triggered; `
					+` gr.isIntegrating=${this.grinder.isIntegrating}\n `
					+`gr.stretchedDt=${gr.stretchedDt}\n`);
			}
		}
	}

	activateX(showX, whetherTo) {
		this.setState({[showX]: whetherTo});
		storeASetting('miscSettings', showX, whetherTo);
	}

	// these are the functions that change the 2d/3d setting.  Get at the state in the context.	 These functions get passed down.
	activate2D = (ev) => {
		// if turning off 2d, make sure 3d is on.  but leave it alone if shift is down.
		this.activateX('show2D', ! this.state.show2D) ;
		if (!ev.shiftKey)
			this.activateX('show3D', this.state.show2D || this.state.show3D) ;
	};
	activate3D = (ev) => {
		// if turning off 2d, make sure 3d is on
		this.activateX('show3D', ! this.state.show3D) ;
		if (!ev.shiftKey)
			this.activateX('show2D', this.state.show2D || this.state.show3D) ;
	};

	// these functions are passed in props to lower levels mostly for initialization.
	// called once ONLY in control panel during setup.	Either one can set space.
	setCPContext = (cp) => {
		this.setState({controlPanel: cp});
		// not there anyway this.setState({space: cp.space});
		//this.stateObj.controlPanel = cp;
	}

	// called once ONLY in waveView during setup  Either one can set space.
	setWVContext = (wv, space) => {
		this.setState({waveView: wv, space});
	}

	getContext = () => this.state;

	/* ****************************************** space & wave creation */

	// spaceParams is {N, continuum, dimLength, label: 'x'}
	// label=label for this dimension, not the whole space
	create1DMainSpace(spaceParams) {
		try {
			// eSpace expects an array of param sets, one for each dimension
			// N, continuum, etc
			if (traceNewSpace)
				dblog(`space 🐣 creating, `);
			this.space = new eSpace([spaceParams], 'main');
			if (traceNewSpace)
				dblog(`space 🐣 has been created, `);

			// wakes up stuff all over the JS, and gives them the space,
			// that they've been waiting for
			//eSpaceCreatedSucceed(space);
			this.spaceSucceed(this.space);

			if (traceNewSpace)
				dblog(`spaceCreatedProm 🐣	resolved`);
		} catch (ex) {
			// this is called from spaceCreatedProm so trigger its fail
			// eslint-disable-next-line no-ex-assign
			const iex = interpretCppException(ex);
			debugger;
			if (traceNewSpace)
				dblog(`🎇 🐣 🎇 space Created failed!  `);
			//eSpaceCreatedFail(iex);
		}
	}

	componentDidMount() {
		// upon startup, after C++ says it's ready.
		// why do this in DidMount and not in constructor?	dunno...
		this.state.spaceCreatedProm
		.then((space) => {
			//const s = this.state;
			if (tracePromises) dblog(`👑 SquishPanel.compDidMount about to set state`);

			// space will end up in the state but meanwhile we need it now
			this.space = space;
			this.setState({space});	 // maybe i don't need this if it's in the context?
			pointerContextMap.register(space.pointer, this.state);

			//this.mainAvatar = space.mainAvatar;
			this.grinder = space.grinder;
			pointerContextMap.register(space.grinder.pointer, this.state);
			//pointerContextMap.dump();
			this.animator.grinder = this.grinder;
			this.animator.space = this.space;
			this.animator.context = this.state;
			//debugger;

			// somebody needs to start this going if it was already on last time
			// but wait till everything is ready.  TODO: should do this in a sync
			// way; time is hokey
			if (getASetting('lapSettings', 'shouldBeIntegrating')) {
				setTimeout(() => this.setShouldBeIntegrating(true), 500)	;
			}

			if (tracePromises) dblog(`👑 SquishPanel.compDidMount done`);
		})
		.catch(ex => {
			// eslint-disable-next-line no-ex-assign
			ex = interpretCppException(ex);
			if (typeof ex == 'string')
				ex = new Error(ex);
			console.error(`spaceCreatedProm threw: `, ex.stack ?? ex.message ?? ex);
			debugger;
			throw ex;
		});

		// check for obsolescence.	Do this after HTML stuff appears.
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
		//grinder.frameSerial = 0;

		// directly redraw the GL
		this.mainViewRepaint?.();
		this.mainVistaRepaint?.();
		this.spectRepaint?.();
	}

	// we need the repaint func for the main canvas, and (someday) the spectrum canvas
	// GLScene will pass that up when they get rendered
	setMainViewRepaint = (mainViewRepaint) => {
		if (this.mainViewRepaint) return;
		this.mainViewRepaint = this.animator.mainViewRepaint = mainViewRepaint;
	};
	setMainVistaRepaint = (mainVistaRepaint) => {
		if (this.mainVistaRepaint) return;
		this.mainVistaRepaint = this.animator.mainVistaRepaint = mainVistaRepaint;
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

		if (traceWidth)
			dblog(`👑 SquishPanel render, p.bodyWidth=${p.bodyWidth} = outerWidth `
				+ ` body.clientWidth=${document.body.clientWidth}`);
		//debugger;

		let wView = '';
		if (s.show2D) {
			wView = <WaveView
					outerWidth = {p.bodyWidth}
					animator={this.animator}
					setWVContext={this.setWVContext}
					setShouldBeIntegrating={this.setShouldBeIntegrating}
					setMainViewRepaint={this.setMainViewRepaint}
					setSpectRepaint={this.setSpectRepaint}
					spaceCreatedProm={this.state.spaceCreatedProm}
					sPanel={this}
					show2D={s.show2D}
			/>;
		}
		let wVista = '';
		if (s.show3D) {
			wVista = <WaveVista
					outerWidth = {p.bodyWidth}
					animator={this.animator}
					setWVContext={this.setWVContext}
					setShouldBeIntegrating={this.setShouldBeIntegrating}
					setMainVistaRepaint={this.setMainVistaRepaint}
					setSpectRepaint={this.setSpectRepaint}
					spaceCreatedProm={this.state.spaceCreatedProm}
					sPanel={this}
					show3D={s.show3D}
			/>;
		}

		return (
			<SquishContext.Provider value={this.state} >
				<article className={`SquishPanel space` + s.name} ref={this.setSPElement}>

					{wVista}
					{wView}

					<ControlPanel
						resetAndRepaintMainWave={this.resetAndRepaintMainWave}

						iStats={this.iStats}
						animator={this.animator}
						setCPContext={this.setCPContext}
						activate2D={this.activate2D}
						activate3D={this.activate3D}
						setShouldBeIntegrating={this.setShouldBeIntegrating}
						sPanel={this}
						spaceCreatedProm={this.state.spaceCreatedProm}
						paintingNeeds={this.paintingNeeds}
					/>
				</article>
			</SquishContext.Provider>
		);
	}
}

export default SquishPanel;
