/*
** WaveView -- a webgl image of the quantum wave (or whatever)
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

// WaveView has a 1:1 relationship with a C++ Avatar.
// Each wraps a canvas for display.  Via webgl.
// You can have many in a squishPanel, each subscribing to the same space.
// One is the main view, displaying current simulation.  Others are used in the
// control panel tabs to display proposed settings before effecting them.

import React from 'react';
import PropTypes from 'prop-types';

//import eSpace from '../engine/eSpace.js';
//import eAvatar from '../engine/eAvatar.js';
import {thousands} from '../utils/formatNumber.js';
import qe from '../engine/qe.js';
import {interpretCppException} from '../utils/errors.js';
import './view.scss';
// import {abstractViewDef} from './abstractViewDef.js';
// import flatDrawingViewDef from './flatDrawingViewDef.js';
import {getASetting, storeASetting} from '../utils/storeSettings.js';
import VoltageArea from './VoltageArea.js';
import GLView from './GLView.js';
import {eSpaceCreatedPromise} from '../engine/eEngine.js';


//import {listOfViewClasses} from './listOfViewClasses.js';

//import {dumpJsStack} from '../utils/errors.js';

let traceDragCanvasHeight = false;

export class WaveView extends React.Component {
	static propTypes = {
		// the title of the view
		viewName: PropTypes.string,

		width: PropTypes.number,  // handed in, depends on window width

		setUpdateVoltageArea: PropTypes.func,

		showVoltage: PropTypes.bool.isRequired,
	};

	constructor(props) {
		super(props);

		this.state = {
			height: getASetting('miscSettings', 'viewHeight'),
			space: null,  // set when promise comes in
		}

		this.formerWidth = props.width;
		this.formerHeight = this.state.height;

		eSpaceCreatedPromise
		.then(space => {
			// this will kick off a render, now that the avatar is in place
			this.setState({space});

			// easy access
			this.space = space;
			this.grinder = space.grinder;
			this.mainEAvatar = space.mainEAvatar;
		})
		.catch(ex => {
			// eslint-disable-next-line no-ex-assign
			ex = interpretCppException(ex);
			console.error(ex.stack ?? ex.message ?? ex);
		});
	}

	/* ************************************************************************ resizing */

	// these are for resizing the WaveView ONLY.
	mouseDown =
	ev => {
		this.resizing = true;
		this.yOffset = this.state.height - ev.pageY;
		if (traceDragCanvasHeight)
			console.info(`mouse down ${ev.pageX} ${ev.pageY} offset=${this.yOffset}`);
		const b = document.body;
		b.addEventListener('mousemove', this.mouseMove);
		b.addEventListener('mouseup', this.mouseUp);
		b.addEventListener('mouseleave', this.mouseUp);

		this.sizeBox.style.borderColor = '#aaa';
		ev.preventDefault();
		ev.stopPropagation();
	}

	mouseMove =
	ev => {
			const viewHeight = ev.pageY + this.yOffset;
			if (this.state.height != viewHeight)
				this.setState({height: viewHeight});
			storeASetting('miscSettings', 'viewHeight', viewHeight);
			if (traceDragCanvasHeight)
				console.info(`mouse drag ${ev.pageX} ${ev.pageY}  newheight=${ev.pageY + this.yOffset}`);

			ev.preventDefault();
			ev.stopPropagation();
		//}
	}

	mouseUp =
	ev => {
			if (traceDragCanvasHeight)
				console.info(`mouse up ${ev.pageX} ${ev.pageY}`);
			this.resizing = false;

			const b = document.body;
			b.removeEventListener('mousemove', this.mouseMove);
			b.removeEventListener('mouseup', this.mouseUp);
			b.removeEventListener('mouseleave', this.mouseUp);

			this.sizeBox.style.borderColor = 'transparent';

			ev.preventDefault();
			ev.stopPropagation();
		//}
	}

	/* ************************************************************************ render */

	render() {
		const p = this.props;
		const s = this.state;

		let wholeRect = null;  // if null, not ready (first render, etc)
		if (this.element) {
			wholeRect = this.element.getBoundingClientRect();
		}

		// if c++ isn't initialized yet, we can assume the time and frame serial
		let elapsedTime = '0';
		let frameSerial = '0';
		if (this.grinder) {
			// after qe has been initialized
			elapsedTime = thousands(this.grinder.elapsedTime.toFixed(4));
			frameSerial = thousands(this.grinder.frameSerial);
		}

		const spinner = qe.cppLoaded ? ''
			: <img className='spinner' alt='spinner' src='images/eclipseOnTransparent.gif' />;

		// voNorthWest/East are populated during frame
		// Always generate the VoltageArea so it keeps its state, but it won't always draw
		return (<div className='WaveView'  ref={el => this.element = el} style={{height: s.height + 'px'}}>

			<GLView width={p.width} height={s.height}
				space={this.space} avatar={this.mainEAvatar}
				viewClassName='flatDrawingViewDef' viewName={p.viewName} />

			<aside className='viewOverlay'
				style={{width: `${p.width}px`, height: `${s.height}px`}}>

				<div className='northWestWrapper'>
					<span className='voNorthWest'>{elapsedTime}</span> ps
				</div>
				<div className='northEastWrapper'>
					frame <span className='voNorthEast'>{frameSerial}</span>
				</div>

				<div className='sizeBox' onMouseDown={this.mouseDown} ref={el => this.sizeBox = el}>
					<div />
				</div>

				{spinner}
			</aside>

			<VoltageArea
				space={s.space} wholeRect={wholeRect}
				canvas={this.canvas}
				setUpdateVoltageArea={p.setUpdateVoltageArea}
				showVoltage={p.showVoltage}/>
		</div>);
	}

	componentDidUpdate() {
		const p = this.props;
		const s = this.state;

		// only need this when the canvas outer dims change
		if (this.mainEAvatar && (this.formerWidth != p.width || this.formerHeight != s.height)) {
			this.mainEAvatar.setGeometry();
			this.formerWidth = p.width;
			this.formerHeight = s.height;
		}
	}

}

export default WaveView;
