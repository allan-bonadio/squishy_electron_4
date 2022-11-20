/*
**   App -- top level JS for Squishy Electron
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
import './App.scss';

import SquishPanel from './SquishPanel';
import CommonDialog from './widgets/CommonDialog';
//import {dumpJsStack} from './utils/errors';

let traceResize = false;

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			innerWindowWidth: window.innerWidth,
			isDialogShowing: false,
			squishPanelExists: true,
		};

		App.me = this;
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
				console.log(` window resize to ${ev.currentTarget.innerWidth}==> `, ev);
			this.setState({innerWindowWidth: ev.currentTarget.innerWidth})
		});
	}

	//static whyDidYouRender = true;
	render() {
		const s = this.state;

		let sqPanel = null;
		if (s.squishPanelExists)
			sqPanel = <SquishPanel id='theSquishPanel' width={s.innerWindowWidth}/>;

		//const stateParams = sParams || s.stateParams;
		const sqDialog = s.isDialogShowing ? <CommonDialog  /> : null;
			//stateParams={stateParams}
			//closeResolutionDialog={() => this.closeResolutionDialog()}

		return (
			<div className="App">
				<h2 className="App-header">
					<img className='splatImage' src='splat.png'
						width='100px' alt='squishy icon'/>
					&nbsp; &nbsp;
					Squishy Electron
				</h2>

				{sqPanel}
				{sqDialog}
			</div>
		);
	}

}

export default App;
