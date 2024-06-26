/*
** WaveView -- a webgl image of the quantum wave (or whatever)
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

// WaveView has a 1:1 relationship with a C++ Avatar.
// Each wraps a canvas for display.  Via webgl.
// You can have many in a squishPanel, each subscribing to the same space.
// One is the main view, displaying current simulation.  Others are used in the
// control panel tabs to display proposed settings before effecting them.

import React from 'react';
import PropTypes from 'prop-types';

import eSpace from '../engine/eSpace.js';
import {thousands, thousandsSpaces} from '../utils/formatNumber.js';
import qe from '../engine/qe.js';
import './view.scss';
import {getASetting, storeASetting} from '../utils/storeSettings.js';

import VoltageArea from './VoltageArea.js';
import VoltageSidebar from './VoltageSidebar.js';
import GLView from '../gl/GLView.js';
import {eSpaceCreatedPromise} from '../engine/eEngine.js';


let traceScaling = false;
let traceDragCanvasHeight = false;
let traceWidth = false;

// size of the size box at lower right of canvas; also width of the voltage sidebar
const sizeBoxSize = 24;
const voltageSidebarWidth = 32;  // passed down to VoltageSidebar.  Seems to want to be 32

export class WaveView extends React.Component {
	static propTypes = {
		// the title of the view
		viewName: PropTypes.string,

		space: PropTypes.instanceOf(eSpace),

		// handed in, pixels.  Width of whole waveview,
		// including sidebar.  Canvas is 1 pixel smaller all around.
		width: PropTypes.number,

		showVoltage: PropTypes.bool.isRequired,

		sPanel: PropTypes.object.isRequired,
	};

	constructor(props) {
		super(props);
		this.sPanel = props.sPanel;
		this.sPanel.wView = this;

		this.state = {
			height: getASetting('miscSettings', 'waveViewHeight'),  // pixels
			space: null,  // set when promise comes in

			// No!  dom and he row flex decides canvasWidth: props.width - (props.showVoltage * voltageSidebarWidth),

			// These are in
			vDisp: null,
		}
		// directly measured Canvas width & height and maybe more set by
		// the lower levels with setCanvasFacts() and passed to the
		// lower levels. gotta be initialized in setCanvasFacts()
		this.canvasFacts = {width: 0, height: 0};

		this.formerWidth = props.width;
		this.formerHeight = this.state.height;
		this.formerShowVoltage = props.showVoltage;

		// make the proptypes shuddup about it being undefined
		this.vDisp = null;

		eSpaceCreatedPromise
		.then(space => {
			// this will kick off a render, now that the avatar is in place
			this.setState({space});

			// easy access
			this.space = space;
			this.grinder = space.grinder;
			this.mainEAvatar = space.mainEAvatar;

			this.vDisp = space.vDisp;
			this.setState({vDisp: this.vDisp});  // not needed if it's in the context?
		})
		.catch(ex => {
			console.error(`eSpaceCreatedPromise failed`);
			debugger;
		});
	}

	// we finally have a canvas; give me a copy so I can save it
	setGl =
	gl => {
		if (!gl)
			throw `no gl value`;
		if (!this.gl)
			this.gl = gl;
		else if (this.gl !== gl)
			throw `this.gl ≠ gl !`;
	}

	// we finally have a canvas; rush its dimensions up here.  Early in
	// startup, either or both might be undefined, ignores those
	setCanvasFacts =
	(width, height) => {
		if (width)
			this.canvasFacts.width = width;
		if (height) {
			height += 2;
			this.canvasFacts.height = height;
			if (height != this.state.height)
				this.setState({height: height});
		}
		if (traceWidth)
			console.log(`🏄 WaveView canvasFacts, width=${width}   height: ${height}  `);
		this.gl.viewport(0, 0, width, height);
	}

	componentDidUpdate() {
		const p = this.props;
		const s = this.state;

		// only need this when the WaveView outer dims change, either a user
		// resize or show/hide the voltage.  On that occasion, we have to adjust
		// a lot, including resizing the canvas.
		if (this.mainEAvatar && (this.formerShowVoltage != p.showVoltage
					|| this.formerWidth != this.waveViewEl.clientWidth
					|| this.formerHeight != s.height) ) {
			if (traceScaling) {
				console.log(`🏄 mainEAvatar=${this.mainEAvatar.label}
				formerShowVoltage=${this.formerShowVoltage}   showVoltage=${p.showVoltage}
				formerWidth=${this.formerWidth}   wv.clientWidth=${this.waveViewEl.clientWidth}
				formerHeight=${this.formerHeight}   height=${s.height}`);
			}
			this.formerWidth = p.width;
			this.formerHeight = s.height;
			this.formerShowVoltage = p.showVoltage;
			console.log(`canvasFacts was ${this.canvasFacts.width}W ; WV is now ${p.width}W`);

			this.vDisp.setVoltScales(this.canvasFacts.width, s.height, p.space.nPoints);
		}
	}

	/* ************************************************************************ resizing */

	// these are for resizing the WaveView ONLY.
	mouseDown =
	ev => {
		this.resizing = true;
		this.yOffset = this.state.height - ev.pageY;
		if (traceDragCanvasHeight)
			console.info(`🏄 mouse down ${ev.pageX} ${ev.pageY} offset=${this.yOffset}`);
		const b = document.body;
		b.addEventListener('mousemove', this.mouseMove);
		b.addEventListener('mouseup', this.mouseUp);
		b.addEventListener('mouseleave', this.mouseUp);

		ev.preventDefault();
		ev.stopPropagation();
	}

	mouseMove =
	ev => {
		const vHeight = ev.pageY + this.yOffset;
		if (this.state.height != vHeight)
			this.setState({height: vHeight});
		storeASetting('miscSettings', 'waveViewHeight', vHeight);
		if (traceDragCanvasHeight)
			console.info(`🏄 mouse drag ${ev.pageX} ${ev.pageY}  newheight=${ev.pageY + this.yOffset}`);

		ev.preventDefault();
		ev.stopPropagation();
	}

	mouseUp =
	ev => {
		if (traceDragCanvasHeight)
			console.info(`🏄 mouse up ${ev.pageX} ${ev.pageY}`);
		this.resizing = false;

		const b = document.body;
		b.removeEventListener('mousemove', this.mouseMove);
		b.removeEventListener('mouseup', this.mouseUp);
		b.removeEventListener('mouseleave', this.mouseUp);

		ev.preventDefault();
		ev.stopPropagation();
	}

	/* ************************************************************************ volts */

	// the actual bottomVolts is ignored; what's important is to tell us that it changed
	scrollVoltHandler =
	bottomVolts => {
		this.setState({bottomVolts: bottomVolts});
		this.vDisp.setVoltScales(this.canvasFacts.width, this.state.height, this.props.space.nPoints);
	}

	// handles zoom in/out buttons    They pass +1 or -1.  heightVolts will usually be an integer power of zoomFactor.
	zoomVoltHandler =
	upDown => {
		const v = this.vDisp;
		v.userZoom(upDown);
		this.setState({heightVolts: v.heightVolts});
		this.vDisp.setVoltScales(this.canvasFacts.width, this.state.height, this.props.space.nPoints);
	}

	// when user moves mouse over the canvas (or WaveView whichh is kindofthe same area)
	// the voltage stuff appears and disappears.
	// onMouseEnter={this.mouseEnter} onMouseLeave={this.mouseLeave}
	mouseEnter =
	ev => {
		// non-react
		const voltageArea = document.querySelector('.VoltageArea');
		if (voltageArea)
			voltageArea.style.display = 'inline';
	}

	mouseLeave =
	ev => {
		const voltageArea = document.querySelector('.VoltageArea');
		if (voltageArea)
			voltageArea.style.display = 'none';
	}

	componentDidMount() {
		const wv = document.querySelector('.WaveView');
		wv.addEventListener('mouseleave', this.mouseLeave);
		wv.addEventListener('mouseenter', this.mouseEnter);
	}

	/* ************************************************************************ render */

	render() {
		const p = this.props;
		const s = this.state;

		// if c++ isn't initialized yet, we can assume the time and frame serial
		let elapsedTime = '0';
		let frameSerial = '0';
		if (this.grinder) {
			// after qe has been initialized
			elapsedTime = thousands(this.grinder.elapsedTime.toFixed(4));
			frameSerial = thousands(this.grinder.frameSerial);
		}

		const spinner = p.space ? ''
			: <img className='spinner' alt='spinner' src='/images/eclipseOnTransparent.gif' />;

		// sometimes a fraction of a pixel causes the horiz scroll bar
		// to kick in.  avoid that without messing up everything.
		let widthForCanvas = p.width - .5;
		if (p.showVoltage)
			widthForCanvas -= voltageSidebarWidth + .5;

		if (traceWidth) {
			console.log(`🏄 WaveView render, width=${this.waveViewEl?.clientWidth}`+
			`  parent.clientWidth: ${this.waveViewEl?.parentNode.clientWidth}   widthForCanvas=${widthForCanvas}`);
		}

		// can't make a real GLView until we have the space!  until then, show spinner
		let glView;
		if (s.space) {
			glView = <GLView width={widthForCanvas} height={s.height}
				space={this.space} avatar={this.space.mainEAvatar}
				viewClassName='flatViewDef' viewName='mainView'
				setGl={this.setGl}
				canvasFacts={this.canvasFacts}  setCanvasFacts={this.setCanvasFacts}
			/>
		}
		else {
			let glView = <div style={{width: widthForCanvas, height: s.height}} >
				{spinner}
			</div>;
		}
		return (
		<div className='WaveView'  ref={el => this.waveViewEl = el}
				style={{height: `${s.height}px`}}>
			<div className='viewArea' >
				{glView}

				<section className='viewOverlay' >
					<div className='northWestWrapper'>
						<span className='voNorthWest'>{elapsedTime}</span> ps
					</div>
					<div className='northEastWrapper'>
						frame <span className='voNorthEast'>{thousandsSpaces(frameSerial)}</span>
					</div>

					<img className='sizeBox' src='/images/sizeBox4.png' alt='size box'
						onMouseDown={this.mouseDown}
						style={{width: `${sizeBoxSize}px`, height: `${sizeBoxSize}px`}} />

					{spinner}
				</section>

				<VoltageArea
					space={s.space}
					height={s.height}
					showVoltage={p.showVoltage}
					vDisp={this.vDisp}
					canvasFacts={this.canvasFacts}
				/>

			</div>
			<VoltageSidebar width={voltageSidebarWidth} height={s.height}
				vDisp={this.vDisp}
				showVoltage={p.showVoltage}
				scrollVoltHandler={this.scrollVoltHandler}
				zoomVoltHandler={this.zoomVoltHandler}
			/>

		</div>
		);
	}

}

export default WaveView;

