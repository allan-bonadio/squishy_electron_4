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
import {thousands} from '../utils/formatNumber';
import qe from '../engine/qe';
import './view.scss';
// import {abstractViewDef} from './abstractViewDef';
// import flatDrawingViewDef from './flatDrawingViewDef';
import {getASetting, storeASetting} from '../utils/storeSettings';
import PotentialArea from './PotentialArea';

//const listOfViewClasses = import('./listOfViewClasses');
import {listOfViewClasses} from './listOfViewClasses';

/* **************************************** actual canvas wrapper */



export class WaveView extends React.Component {
	static propTypes = {
		// the class itself.  Not the instance! the class, the type of view, with drawings baked in.
		// not the class!  just the class name.
		viewClassName: PropTypes.string,

		// the title of the view
		viewName: PropTypes.string,

		width: PropTypes.number,  // handed in, depends on window width

		// tells us when the space exists.  From the SquishPanel, or just pass something resolved.
		createdSpacePromise: PropTypes.instanceOf(Promise),

		setUpdatePotentialArea: PropTypes.func,
	};

	static created = 0;
	constructor(props) {
		super(props);

		WaveView.created++;
		console.info(`WaveView created ${WaveView.created} times`);

		// why is this called so many times!?!?!?!?!  console.log(`WaveView(...`, props, (new Error()).stack);
		this.state = {
			height: getASetting('miscParams', 'viewHeight'),
			space: null,  // set when promise comes in
		}

		// will be resolved when the canvas has been nailed down; result will be canvas dom obj
		this.createdCanvasPromise = new Promise((succeed, fail) => {
			this.createdCanvas = succeed;
			console.info(`qeStartPromise created:`, succeed, fail);
		});

		this.formerWidth = props.width;
		this.formerHeight = props.defaultHeight;
	}

	// the canvas per panel, one panel per canvas.
	// Only called when canvas is created (or recreated, someday)
	static setGLCanvasAgain = 0;
	setGLCanvas(canvas) {
		const p = this.props;
		if (this.state.space && this.canvas)
			return;  // already done
		this.setGLCanvasAgain++;
		console.log(`for the ${this.setGLCanvasAgain}th time, WaveView.setGLCanvas(...`, canvas);

		// why do i have to do this?  Old version of CHrome??!?!?!  preposterous
		if (canvas) {
			this.canvas = canvas;
			canvas.WaveView = this;
		}

		// we need the space AND the canvas to make the views
		p.createdSpacePromise.then(space => {
			// now create the draw view class instance as described by the space
			// this is the flatDrawingViewDef class for webgl, not a CSS class or React class component
			// do we do this EVERY RENDER?  probably not needed.
			console.log(`setGLCanvas.then(...`, space);

			this.setState({space});

			let vClass = listOfViewClasses[p.viewClassName];
			this.effectiveView = new vClass(p.viewName, this.canvas, space);
			this.effectiveView.completeView();

			// ??? use this.currentView rather than state.currentView - we just set it
			// and it takes a while.
			// Make sure you call the new view's domSetup method.
			this.effectiveView.domSetupForAllDrawings(this.canvas);

			// thsi will kick the WaveView to render.  Is this too intricate?
			p.setEffectiveView(this.effectiveView);

			console.info(`WaveView.compDidMount promise done`);

		}).catch(ex => {
			console.error(`error in WaveView createdSpacePromise.then():`, ex.stack || ex.message || ex);
			debugger;
		});

	}

	/* ************************************************************************ resizing */

	// these are for resizing the WaveView ONLY.
	mouseDown =
	ev => {
		this.resizing = true;
		this.yOffset = this.state.height - ev.pageY;
		console.info(`mouse down ${ev.pageX} ${ev.pageY} offset=${this.yOffset}`);
		const b = document.body;
		b.addEventListener('mousemove', this.mouseMove);
		b.addEventListener('mouseup', this.mouseUp);
		b.addEventListener('mouseleave', this.mouseUp);

		ev.preventDefault();
		ev.stopPropagation();
	}

	mouseMove =
	ev => {
		//if (this.resizing) {

			const viewHeight = ev.pageY + this.yOffset;
			this.setState({height: viewHeight});
			storeASetting('miscParams', 'viewHeight', viewHeight);
			// console.info(`mouse drag ${ev.pageX} ${ev.pageY}  newheight=${ev.pageY + this.yOffset}`);

			ev.preventDefault();
			ev.stopPropagation();
		//}
	}

	mouseUp =
	ev => {
		//if (this.resizing) {
			console.info(`mouse up ${ev.pageX} ${ev.pageY}`);
			this.resizing = false;

			const b = document.body;
			b.removeEventListener('mousemove', this.mouseMove);
			b.removeEventListener('mouseup', this.mouseUp);
			b.removeEventListener('mouseleave', this.mouseUp);


			ev.preventDefault();
			ev.stopPropagation();
		//}
	}

	/* ************************************************************************ render */

	componentDidUpdate() {
		const p = this.props;
		const s = this.state;

		// only need this when the canvas outer dims change
		if (this.effectiveView && (this.formerWidth != p.width || this.formerHeight != s.height)) {
			this.effectiveView.setGeometry();
			this.formerWidth = p.width;
			this.formerHeight = s.height;
		}
	}

	static whyDidYouRender = true;
	static rendered = 0;
	render() {
		const p = this.props;
		const s = this.state;

		WaveView.rendered++;
		console.info(`WaveView rendered ${WaveView.rendered} times`);

		let wholeRect = null;  // if null, not ready (first render, etc)
		if (this.element) {
			wholeRect = this.element.getBoundingClientRect();
		}

		// if c++ isn't initialized yet, we can assume the time and frame serial
		let et = '0';
		let iser = '0';
		if (qe.getElapsedTime) {
			// after qe has been initialized
			et = thousands(qe.getElapsedTime().toFixed(4));
			iser = thousands(qe.Avatar_getIterateSerial());
		}

		//let nPoints = s.space && s.space.nPoints;
		//debugger;

		const spinner = qe.cppLoaded ? ''
			: <img className='spinner' alt='spinner' src='eclipseOnTransparent.gif' />;

		// voNorthWest/East are populated during drawing
		return (<div className='WaveView'  ref={el => this.element = el}>
			<canvas className='squishCanvas'
				width={p.width} height={s.height}
				ref={canvas => this.setGLCanvas(canvas)}
				style={{width: `${p.width}px`, height: `${s.height}px`}} />

			<aside className='viewOverlay'
				style={{width: `${p.width}px`, height: `${s.height}px`}}>

				<div className='northWestWrapper'>
					<span className='voNorthWest'>{et}</span> ps
				</div>
				<div className='northEastWrapper'>
					iteration <span className='voNorthEast'>{iser}</span>
				</div>

				<div className='sizeBox' onMouseDown={this.mouseDown} />

				{spinner}
			</aside>


			<PotentialArea width={p.width} height={s.height}
				space={s.space} wholeRect={wholeRect}
				setUpdatePotentialArea={p.setUpdatePotentialArea}/>
		</div>);
	}
}

export default WaveView;

