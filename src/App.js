/*
**   App -- top level JS for Squishy Electron
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
import './App.scss';

import SquishPanel from './SquishPanel.js';
import CommonDialog from './widgets/CommonDialog.js';
import {eSpaceCreatedPromise} from './engine/eEngine.js';

let traceResize = true;

class App extends React.Component {
	constructor(props) {
		super(props);
		App.me = this;

		this.state = {
			//clientWidth: document.body.clientWidth - 24,
			squishPanelExists: true,  // briefly cycles off and on when user changes resolution
			isDialogShowing: false,
			cppRunning: false,
		};

		eSpaceCreatedPromise.then(space => this.setState({cppRunning: true}));
	}

	/* ************************************************ CommonDialog */

	// this is called before the ResolutionDialog has been instantiated
	static showDialog() {
		App.me.setState({isDialogShowing: true});
	}

	static hideDialog() {
		App.me.setState({isDialogShowing: false});
		CommonDialog.finishClosingDialog();
	}

	/* ************************************************ re-creation */
	// called when user changes dimensions (or maybe other cases?)
	static blinkSquishPanel(createAgain) {
		this.me.createAgain = createAgain
		this.me.setState({squishPanelExists: false})
	}

	componentDidUpdate() {
		if (!this.state.squishPanelExists) {
			// after SquishPanel has been excluded from one render,
			// that guarantees that all the other components have been freed.
			// So now we can start over.  big hack, maybe after I figure out how to kill hot reload I can get rid of this crap.
			SquishPanel.anticipateConstruction();

			this.createAgain();
			this.setState({squishPanelExists: true});
		}
	}

	/* ************************************************ App */

	// once at startup
	componentDidMount() {
		// keep track of any window width changes, to reset the canvas and svg
		// add listener only executed once
		window.addEventListener('resize', ev => {
			if (traceResize)
				console.log(`🍦 window resize to ${this.appEl?.clientWidth}`, ev);
			console.assert(ev.currentTarget === window, `ev.currentTarget === window`);

			// if we don't set the state here, nobody redraws.  Otherwise, get body.clientWidth directly.
			this.setState({clientWidth: document.body.clientWidth})
		});
	}

	render() {
		const s = this.state;

		// until things start up.  Must always have a className theSquishPanel for tooOldTerminate()
		let sqPanel;


		if (s.cppRunning && s.squishPanelExists) {
			// real squishpanel
			sqPanel = <SquishPanel id='theSquishPanel'
				width={this.appEl?.clientWidth ?? document.body.clientWidth}/>;
		}
		else {
			// spinner tells ppl we're working on it
			sqPanel= <div id='theSquishPanel' >
				<img className='spinner' alt='spinner' src='images/eclipseOnTransparent.gif' />;
			</div>;
		}

		const sqDialog = s.isDialogShowing ? <CommonDialog  /> : null;

		return (
			<div className="App" ref={el => this.appEl = el}>
				<h2 className="App-header">
					<img className='splatImage' src='images/splat.png'
						width='100px' alt='squishy icon'/>
					&nbsp; &nbsp;
					Squishy Electron
				</h2>

				{sqPanel}
				{sqDialog}
				<footer>
					<img id='emscriptenLogo' src='logos/emscriptenLogo.svg' alt='powered by Emscripten'/>
					<img id='webassemblyLogo' src='logos/webassemblyLogo.svg'  alt='powered by WebAssembly'/>
					<img id='webglLogo' src='logos/webglLogo.svg'  alt='powered by WebGL'/>
					<img id='openglLogo' src='logos/openglLogo.svg'  alt='powered by OpenGL'/>
				</footer>
			</div>
		);
	}
}

export default App;

