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

//import eSpace from '../engine/eSpace';
//import eAvatar from '../engine/eAvatar';
import {thousands} from '../utils/formatNumber';
import qe from '../engine/qe';
import {interpretCppException} from '../utils/errors';
import './view.scss';
// import {abstractViewDef} from './abstractViewDef';
// import flatDrawingViewDef from './flatDrawingViewDef';
import {getASetting, storeASetting} from '../utils/storeSettings';
import PotentialArea from './PotentialArea';
import GLView from './GLView';
import {eSpaceCreatedPromise} from '../engine/eEngine';


//import {listOfViewClasses} from './listOfViewClasses';

//import {dumpJsStack} from '../utils/errors';

let traceDragCanvasHeight = false;

export class WaveView extends React.Component {
	static propTypes = {
		// the class itself.  Not the instance! the class, the type of view, with drawings baked in.
		// not the class!  just the class name.  Not a JS class!
		viewClassName: PropTypes.string,

		// the title of the view
		viewName: PropTypes.string,

		width: PropTypes.number,  // handed in, depends on window width

		elapsedTime: PropTypes.number,  // redraws when these change
		iterateSerial: PropTypes.number,

		//returnGLFuncs: PropTypes.func.isRequired,
		setUpdatePotentialArea: PropTypes.func,

		showPotential: PropTypes.bool.isRequired,
	};

	constructor(props) {
		super(props);

		this.state = {
			height: getASetting('miscParams', 'viewHeight'),
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
			this.mainEAvatar = space.mainEAvatar;
		})
		.catch(ex => {
			// eslint-disable-next-line no-ex-assign
			ex = interpretCppException(ex);
			console.error(ex.stack ?? ex.message ?? ex);
			//debugger;
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
		//if (this.resizing) {

			const viewHeight = ev.pageY + this.yOffset;
			if (this.state.height != viewHeight)
				this.setState({height: viewHeight});
			storeASetting('miscParams', 'viewHeight', viewHeight);
			if (traceDragCanvasHeight)
				console.info(`mouse drag ${ev.pageX} ${ev.pageY}  newheight=${ev.pageY + this.yOffset}`);

			ev.preventDefault();
			ev.stopPropagation();
		//}
	}

	mouseUp =
	ev => {
		//if (this.resizing) {
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

	//static whyDidYouRender = true;
	render() {
		const p = this.props;
		const s = this.state;

		let wholeRect = null;  // if null, not ready (first render, etc)
		if (this.element) {
			wholeRect = this.element.getBoundingClientRect();
		}

		// if c++ isn't initialized yet, we can assume the time and frame serial
		let elapsedTime = '0';
		let iterateSerial = '0';
		if (this.mainEAvatar) {
			// after qe has been initialized
			elapsedTime = thousands(p.elapsedTime.toFixed(4));
			iterateSerial = thousands(p.iterateSerial);
		}

		const spinner = qe.cppLoaded ? ''
			: <img className='spinner' alt='spinner' src='eclipseOnTransparent.gif' />;

		// voNorthWest/East are populated during iteration
		// Always generate the PotentialArea so it keeps its state, but it won't always draw
		return (<div className='WaveView'  ref={el => this.element = el} style={{height: s.height + 'px'}}>

			<GLView width={p.width} height={s.height}
				space={this.space} avatar={this.mainEAvatar}
				viewClassName={p.viewClassName} viewName={p.viewName} />

			<aside className='viewOverlay'
				style={{width: `${p.width}px`, height: `${s.height}px`}}>

				<div className='northWestWrapper'>
					<span className='voNorthWest'>{elapsedTime}</span> ps
				</div>
				<div className='northEastWrapper'>
					iteration <span className='voNorthEast'>{iterateSerial}</span>
				</div>

				<div className='sizeBox' onMouseDown={this.mouseDown} ref={el => this.sizeBox = el}>
					<div />
				</div>

				{spinner}
			</aside>

			<PotentialArea
				space={s.space} wholeRect={wholeRect}
				canvas={this.canvas}
				setUpdatePotentialArea={p.setUpdatePotentialArea}
				showPotential={p.showPotential}/>
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
