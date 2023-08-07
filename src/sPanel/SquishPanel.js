/*
** squish panel -- like a self-contained quantum system, including space,
** 				waves, and drawings and interactivity.
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

// SquishPanel has a 1:1 relationship with the c++ qSpace.
// the ResolutionDialog changes the initialParams and recreates the qSpace.

import React from 'react';
import PropTypes from 'prop-types';

import ControlPanel from '../controlPanel/ControlPanel.js';

import {eSpaceCreatedPromise} from '../engine/eEngine.js';

import {interpretCppException} from '../utils/errors.js';
import WaveView from '../view/WaveView.js';
//import CommonDialog from '../widgets/CommonDialog.js';
import sAnimator from './sAnimator.js';

import {getASetting, storeASetting} from '../utils/storeSettings.js';
import {tooOldTerminate} from '../utils/errors.js';

// runtime debugging flags - you can change in the debugger or here
let tracePromises = false;
let traceSquishPanel = false;
let traceWidth = false;

const DEFAULT_VIEW_CLASS_NAME = 'flatViewDef';


/* ************************************************ Context */

// this will be available all over the squish panel.  so maybe I don't have to
// mess around with these props so much. how did i go so long without learning
// contexts?
const SpaceContext = React.createContext({space: null});

/* ************************************************ construction & reconstruction */

export class SquishPanel extends React.Component {
	static propTypes = {
		id: PropTypes.string.isRequired,
		width: PropTypes.number,
	};

	static squishPanelConstructed = 0;

	constructor(props) {
		super(props);

		if (SquishPanel.squishPanelConstructed) {
			// should not be called twice!  now that i've got craco and space recreate relods the page,
			// I shouldn't need this anymore, right ?!?!?!?!?  TODO
			console.log(`annoying hot reload; continue to really reload page...🙄  👿 🤢 😵 🤬 😭 😠`);
			debugger;
			location = location;  // eslint-disable-line no-restricted-globals
		}
		SquishPanel.squishPanelConstructed++;

		this.state = {
			mainViewClassName: DEFAULT_VIEW_CLASS_NAME,

			showVoltage:  getASetting('voltageSettings', 'showVoltage'),
		};

		// this is the actual 'frequency' as a period in milliseconds, as set by that menu.
		// convert between like 1000/n
		// eg the menu on the CPToolbar says 10/sec, so this becomes 100
		// we actually get it from the control panel which is the official rate keeper
		this.framePeriod = getASetting('frameSettings', 'framePeriod');

		if (traceSquishPanel) console.log(`👑 SquishPanel constructor done`);
	}

	// this squishPanelConstructed count will detect hot reloading screwing up the app,
	// but the space dialog also wants to do this.  sigh.  TODO: eliminate this
// 	static anticipateConstruction() {
// 		SquishPanel.squishPanelConstructed = 0;
// 	}

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

			this.animator = new sAnimator(this, space);

			this.mainEAvatar = space.mainEAvatar;
			this.grinder = space.grinder;

			if (tracePromises) console.log(`👑 SquishPanel.compDidMount done`);
		})
		.catch(ex => {
			// eslint-disable-next-line no-ex-assign
			ex = interpretCppException(ex);
			if ('from C++: Trying to start a new space when one already exists!' == ex.message) {
				// obnoxious hot reloading; frequently end up here, so let me reload the right way
				debugger;
				location = location;  // eslint-disable-line no-restricted-globals
				// never gets here
			}
			console.error(`error  SquishPanel.didMount.then():`, ex.stack ?? ex.message ?? ex);
			debugger;
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

	toggleShowVoltage =
	ev => {
		this.setState({showVoltage: ev.target.checked});
		storeASetting('voltageSettings', 'showVoltage', ev.target.checked);
	}

	// dump the view buffer, from the JS side.  Why not use the C++ version?
	dumpViewBuffer(title = '') {
		const s = this.state;
		let nRows = s.space.nPoints * 2;
		let vb = s.space.mainVBuffer;
		const _ = (f) => f.toFixed(3).padStart(6);
		console.log(`dump of view buffer '${title}' for ${s.space.nPoints} points in ${nRows} rows`);
		for (let i = 0; i < nRows; i++)
			console.log(_(vb[i*4]), _(vb[i*4+1]), _(vb[i*4+2]), _(vb[i*4+3]));
	}

	// get this from the control panel every time user changes it
	setFramePeriod =
	(period) => {
		this.framePeriod = period;
		if (this.animator)
			this.animator.framePeriod = period;
	}


//	(period) => this.setState({framePeriod: period},
//		() => console.log(`frame period is now set to ${this.state.framePeriod}`));

	// SetVoltageTab goes and changes the voltage.  VoltageArea needs to know when it changes.
	// So pass this down and it'll give us the va instance.
	//gimmeVoltageArea =
	//(vArea) => {
	//	this.voltageArea = vArea;
	//}

	// something tells me that this isn't the way to do it in React
	//tellMeWhenVoltsChanged =
	//voltageParams => {
	//	//console.log(`SquishPanel.tellMeWhenVoltsChanged:`, voltageParams);
	//	this.voltageArea?.updateVoltageArea(voltageParams);
	//}

	/* ******************************************************* rendering */
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
		avatar.reStartDrawing();
		avatar.doRepaint();
	}

	render() {
		const p = this.props;
		const s = this.state;

		if (traceWidth) console.log(`👑 SquishPanel render, p.width=${p.width} `
			+ ` body.clientWidth=${document.body.clientWidth}`);

		//setUpdateVoltageArea={this.setUpdateVoltageArea}
		//populateFamiliarVoltage={this.populateFamiliarVoltage}
		return (
				<div id={this.props.id} className="SquishPanel">
					<WaveView
						width={p.width}
						space={this.space}
						showVoltage={s.showVoltage}
						sPanel={this}
					/>
					<ControlPanel

						setFramePeriod={this.setFramePeriod}

						toggleShowVoltage={this.toggleShowVoltage}
						showVoltage={s.showVoltage}

						redrawWholeMainWave={this.redrawWholeMainWave}

						iStats={this.iStats}

						animator={this.animator}
						sPanel={this}
					/>
				</div>
		);

		/*{{this.animator?.renderRunningOneCycle() ?? ''}}*/
	}
}

SquishPanel.contextType = SpaceContext;

export default SquishPanel;
