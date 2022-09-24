/*
**   App -- top level JS for Squishy Electron
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
import './App.scss';

import SquishPanel from './SquishPanel';
import CommonDialog from './widgets/CommonDialog';
//import {dumpJsStack} from './utils/errors';


class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			innerWindowWidth: window.innerWidth,

			isDialogShowing: false,
		};

		App.me = this;
	}


	// this is called before the ResolutionDialog has been instantiated
	static showDialog() {
		App.me.setState({isDialogShowing: true});
	}

	static hideDialog() {
		App.me.setState({isDialogShowing: false});
		CommonDialog.finishClosingDialog();
	}

	/* ************************************************ App */

	// constructor runs twice, so do this once here
	componentDidMount() {
		// keep track of any window width changes, to reset the svg
		// add listener only executed once
		window.addEventListener('resize', ev => {
			console.log(` window resize to ${ev.currentTarget.innerWidth}==> `, ev);
			this.setState({innerWindowWidth: ev.currentTarget.innerWidth})
		});
	}


	//static whyDidYouRender = true;
	render() {
		const s = this.state;

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
				<SquishPanel id='theSquishPanel' width={s.innerWindowWidth}/>

				{sqDialog}
			</div>
		);
	}
}

export default App;
