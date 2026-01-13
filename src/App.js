/*
** App -- top level JS for Squishy Electron
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

import React from 'react';

import SquishPanel from './sPanel/SquishPanel.js';
import CommonDialog from './widgets/CommonDialog.js';
import DocReader from './sPanel/DocReader.js';
import DocMenu from './sPanel/DocMenu.js';

import {eSpaceCreatedPromise} from './engine/eEngine.js';
import './App.scss';


let traceResize = false;
let traceState = false;

class App extends React.Component {
	constructor(props) {
		super(props);
		if (!props) return;  // dunno why but suddenly this is happening a lot

		App.me = this;

		this.state = {
			// somehow if we set these, we get strange sizing problems with the scroll bar.  ?? fixing i think
			// the canvas needs the literal width (in px) for its width attr.
			// We want it to exactly conform like it's a regular element.  So
			// put it in the  state and make sure it changes whenerver the
			// window width changes.  And pass it down.
			// no always get it from this.bodyWidth: 500,  // will be corrected a bit later

			// part of startup to get the q engine running
			cppRunning: false,

			// non-null when dialog is showing
			//dialogContent: null,
		};
		if (traceState)
			console.log(`init App state to:`, this.state);

		eSpaceCreatedPromise.then(space =>{
			// there's lots of thens on this promise, so cppRunning
			// won't be on for many of them
			this.setState({cppRunning: true})

			// everything squishes around upon startup, especially
			// after the space is created, so do this a bit later
			setTimeout(this.widthDidChange, 300);
		});
	}

	get bodyWidth() {
		return document.body.clientWidth;
	}

	// respond properly whenever width changed (usually user & sizebox).  Cuz canvas
	// needs to resize itself.  Don't bother passing it in; we'll do the right thing.
	widthDidChange = () => {
		//this.bodyWidth = document.body.clientWidth;
		this.setState({bodyWidth: this.bodyWidth});  // triggers rerenders & resizes
		if (traceResize)
			console.log(`🍦 widthDidChange: set this.bodyWidth= ${this.bodyWidth}`);

		// the doc reader tries to track the window size
		// not anymore.  these function(s) are commented out.	DocReader.setDimensions(this.bodyWidth);
	}

	// once at startup, shortly after first render
	componentDidMount() {
		let timeout;

		// keep track of any window width changes, to reset the canvas and svg
		// add listener only executed once
		window.addEventListener('resize', ev => {
			if (traceResize) {
				console.log(`🍦  resize ev, body.clientSize: `
					+` ${this.bodyWidth}  ${document.body.clientHeight}. \nevent`, ev);
			}
			console.assert(ev.currentTarget === window, `ev.currentTarget =?== window`);

			// another resize event!  postpone again
			if (timeout)
				clearTimeout(timeout);
			timeout = setTimeout(() => {
				// finally settled down
				timeout = null;
				this.widthDidChange();
			}, 300);

		});

		// meanwhile, sometimes the first render starts before the vertical scrollbar kicks in,
		// cuz there's nothing in the page yet.  This confuses everybody, but give it a kick.
		// NO somehow if I don't init clientWidth in constructor, this catches and fixes it
		//if (this.state.clientWidth != this.bodyWidth) {
		//	if (traceResize)
		//		console.log(`🍦 ‼️mounting resize cuz scrollbar: ${this.state.clientWidth} --> ${this.bodyWidth} `);
		//	this.setState({clientWidth: this.bodyWidth});
		//	//debugger;
		//}

		// parse URL args
		let locArgs = {};
		if (location.search) {
			let arArgs = location.search.substr(1).split('&');    // eslint-disable-line no-restricted-globals
			arArgs.map(txt => txt.split('=')).forEach(pair => locArgs[pair[0]] = pair[1] ?? 'noSquishArg');

			// if they got the URL with ?intro=anything on the end, open the introduction doc reader
			if (locArgs.intro) {
				setTimeout(() => {
					DocReader.openWithUri('/intro/intro1.html');
				}, 500);
			}
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

	// render all these letter buttons.  Each is 1.25x bigger than the previous.
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

		// until things start up.  Must always have a className SquishPanel for tooOldTerminate()
		let sqPanel;
		if (s.cppRunning) {
			// real squishpanel
			sqPanel = <SquishPanel className='SquishPanel' bodyWidth={this.bodyWidth} />;
			if (traceResize) {
				console.log(`🍦 App renders SquishPanel when cppRunning, `
					+`body.clientWidth=${document.body.clientWidth}  `
					+ `this.bodyWidth=${this.bodyWidth} this.appEl=`, this.appEl);
			}
		}
		else {
			// spinner tells ppl we're working on it
			sqPanel= <div className='SquishPanel' >
				<img className='spinner' alt='spinner' src='/images/eclipseOnTransparent.gif' />
			</div>;
			if (traceState) {
				console.log(`🍦 render when NOT cppRunning, body.clientWidth=${this.bodyWidth}`);
			}
		}

		return (
			<main className="App" ref={el => this.appEl = el}>
				<h2 className="App-header">
					{this.renderFontSizer()}
					<DocMenu />
					<img className='splatImage' src='/images/splat.png'
						width='100px' alt='squishy icon'/>
					&nbsp; &nbsp;
					Squishy Electron
				</h2>

				{sqPanel}

				<CommonDialog	dialogContent={s.dialogContent} setDialog={this.setDialog} />
				<DocReader  />
				<footer>
					<aside id='traceOnScreen'>
						<p className='A' />
						<p className='B' />
						<p className='C' />
					</aside>

					<img id='emscriptenLogo' src='logos/emscriptenLogo.svg'
						alt='powered by Emscripten'/>
					<img id='webassemblyLogo' src='logos/webassemblyLogo.svg'
						alt='powered by WebAssembly'/>
					<img id='webglLogo' src='logos/webglLogo.svg'
						alt='powered by WebGL'/>
				</footer>
			</main>
		);
	}
}

export default App;

