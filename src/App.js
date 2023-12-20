/*
**   App -- top level JS for Squishy Electron
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import React from 'react';
import './App.scss';

import SquishPanel from './sPanel/SquishPanel.js';
import CommonDialog from './widgets/CommonDialog.js';
import DocReader from './widgets/DocReader.js';
import {eSpaceCreatedPromise} from './engine/eEngine.js';

let traceResize = true;
let traceCoords = true;

class App extends React.Component {
	constructor(props) {
		super(props);
		App.me = this;

		this.state = {
			// somehow if we set these, we get strange sizing problems with the scroll bar.
			//clientWidth: document.body.clientWidth,  // window width as of constructor
			//clientHeight: document.body.clientHeight,

			// always true squishPanelExists: true,  // briefly cycles off and on when user changes resolution
			cppRunning: false,

			// non-null when dialog is showing
			dialogContent: null,
		};

		eSpaceCreatedPromise.then(space => this.setState({cppRunning: true}));
	}

	// once at startup, shortly after first render
	componentDidMount() {
		let bodyClientWidth = document.body.clientWidth;

		// keep track of any window width changes, to reset the canvas and svg
		// add listener only executed once
		window.addEventListener('resize', ev => {
			if (traceResize)
				console.log(`🍦 window resize to ${this.appEl?.clientWidth}`, ev);
			console.assert(ev.currentTarget === window, `ev.currentTarget =?== window`);

			// if we don't set the state here, nobody redraws.  Otherwise, get body.clientWidth directly.
			this.setState({clientWidth: bodyClientWidth});
			if (traceCoords) console.log(`🍦 AppMount: bodyClientWidth= ${bodyClientWidth}`);

			// the doc reader tries to track the window size
			DocReader.setDimensions(bodyClientWidth);
		});

		// meanwhile, sometimes the first render starts before the vertical scrollbar kicks in,
		// cuz there's nothing in the page yet.  This confuses everybody, but give it a kick.
		// NO somehow if I don't init clientWidth in constructor, this catches and fixes it
		if (this.state.clientWidth != bodyClientWidth) {
			this.setState({clientWidth: bodyClientWidth});
			if (traceResize)
				console.log(`🍦 mounting resize cuz scrollbar: ${this.state.clientWidth} --> ${bodyClientWidth} `);
			//debugger;
		}

		// if they got the URL with ?intro=1 on the end, open the introduction
		if ('?intro=1' == location.search) {    // eslint-disable-line no-restricted-globals
			setTimeout(() => {
				DocReader.openWithUri('/intro/intro1.html');
			}, 500);
		}

		// see font sizer, below
		document.body.style.fontSize = localStorage.fontSize || '16px';
	}

	/* ************************************************ Font Sizer */
	// make the font size of the clicked element the global size, and remember it
	setFontSize(ev) {
		let fontSize = ev.target.style.fontSize;
		document.body.style.fontSize = fontSize;
		localStorage.fontSize = fontSize;
	}

	// render all these letter buttons
	renderFontSizer() {
		return <aside className='fontSizer'>
			<span style={{fontSize: '10.24px'}} onClick={this.setFontSize}>A</span>
			<span style={{fontSize: '12.8px'}} onClick={this.setFontSize}>A</span>
			<span style={{fontSize: '16px'}} onClick={this.setFontSize}>A</span>
			<span style={{fontSize: '20px'}} onClick={this.setFontSize}>A</span>
			<span style={{fontSize: '25px'}} onClick={this.setFontSize}>A</span>
		</aside>
	}
	/* ************************************************ CommonDialog */

	// To show the dialog, set the central component and dialog style to something other than null
	// To hide it again, set it to null.  This function does each.
	setDialog =
	(dialogContent, dialogStyle) => {
		// where does this style go to?!?!?!
		this.setState({dialogContent, dialogStyle});
	}

	/* ************************************************ App */

	render() {
		const s = this.state;

		// until things start up.  Must always have a className theSquishPanel for tooOldTerminate()
		let sqPanel;


		if (s.cppRunning) {
			// real squishpanel
			sqPanel = <SquishPanel id='theSquishPanel'
				width={this.appEl?.clientWidth ?? document.body.clientWidth}/>;
		}
		else {
			// spinner tells ppl we're working on it
			sqPanel= <div id='theSquishPanel' >
				<img className='spinner' alt='spinner' src='/images/eclipseOnTransparent.gif' />
			</div>;
		}

		return (
			<main className="App" ref={el => this.appEl = el}>
				<h2 className="App-header">
					{this.renderFontSizer()}
					<img className='splatImage' src='/images/splat.png'
						width='100px' alt='squishy icon'/>
					&nbsp; &nbsp;
					Squishy Electron
				</h2>

				{sqPanel}
				<CommonDialog  dialogContent={s.dialogContent} setDialog={this.setDialog} />
				<footer>
					<img id='emscriptenLogo' src='logos/emscriptenLogo.svg' alt='powered by Emscripten'/>
					<img id='webassemblyLogo' src='logos/webassemblyLogo.svg'  alt='powered by WebAssembly'/>
					<img id='webglLogo' src='logos/webglLogo.svg'  alt='powered by WebGL'/>
					<img id='openglLogo' src='logos/openglLogo.svg'  alt='powered by OpenGL'/>
				</footer>
			</main>
		);
	}
}

export default App;

