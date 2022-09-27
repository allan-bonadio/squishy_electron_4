/*
** GLView -- a webgl image
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

// GLView  wraps a canvas for display.  Via webgl.
// And the Drawing and ViewDef machinery mgmt

import React from 'react';
import PropTypes from 'prop-types';
import qe from '../engine/qe';
// import {abstractViewDef} from './abstractViewDef';
// import flatDrawingViewDef from './flatDrawingViewDef';
import {getASetting, storeASetting} from '../utils/storeSettings';

//const listOfViewClasses = import('./listOfViewClasses');
import {listOfViewClasses} from './listOfViewClasses';

let traceGLView = true;


class GLView extends React.Component {
	static propTypes = {
		viewClassName: PropTypes.string.isRequired,
		viewName: PropTypes.string,
		returnGLFuncs: PropTypes.func.isRequired,

		// tells us when the space exists, and returns eSpace as a result.  From the SquishPanel
		createdSpacePromise: PropTypes.instanceOf(Promise).isRequired,

		width: PropTypes.number.isRequired,
		height: PropTypes.number.isRequired,
	}
	static defaultProps = {
		viewName: 'gl view',
	}

	constructor(props) {
		super(props);
		this.state = {};
		props.returnGLFuncs(this.doRepaint);
	}

	// the canvas per panel, one panel per canvas.
	// Only called when canvas is created (or recreated, someday)
	static setGLCanvasAgain = 0;
	setGLCanvas =
	(canvas) => {
		const p = this.props;
		if (this.space && this.canvas === canvas)
			return;  // already done

		GLView.setGLCanvasAgain++;
		if (GLView.setGLCanvasAgain > 10) debugger;
		if (traceGLView) {
			console.log(`for the ${GLView.setGLCanvasAgain}th time, GLView.setGLCanvas(...`, canvas);
		}

		if (canvas) {
			this.canvas = canvas;
			canvas.GLView = this;
		}

		// we need the space AND the canvas to make the views
		// space is handed in thru this promise instead of by props
		p.createdSpacePromise.then(space => {
			// now create the draw view class instance as described by the space
			// this is the flatDrawingViewDef class for webgl, not a CSS class or React class component
			// do we do this EVERY RENDER?  probably not needed.

			if (traceGLView) console.log(`setGLCanvas.then(...`, space);

			this.space = space;
			this.initViewClass();

//			let vClass = listOfViewClasses[p.viewClassName];
//			this.effectiveView = new vClass(p.viewName, this.canvas, space);
//			this.effectiveView.completeView();
//
//			// ??? use this.currentView rather than state.currentView - we just set it
//			// and it takes a while.
//			// Make sure you call the new view's domSetup method.
//			// maybe i should get rid of domSetup
//			this.effectiveView.domSetupForAllDrawings(this.canvas);
//
//			// thsi will kick the WaveView to render.  Is this too intricate?
//			p.setEffectiveView(this.effectiveView);

			if (traceGLView) console.info(`GLView.compDidMount promise done`);

		}).catch(ex => {
			console.error(`error in GLView createdSpacePromise.then():`, ex.stack || ex.message || ex);
			debugger;
		});

	}

	// must do this after the canvas AND the space exist.
	initViewClass =
	() => {
		const p = this.props;
		let vClass = listOfViewClasses[p.viewClassName];
		this.effectiveView = new vClass(p.viewName, this.canvas, this.space);
		this.effectiveView.completeView();

		// ??? use this.currentView rather than state.currentView - we just set it
		// and it takes a while.
		// Make sure you call the new view's domSetup method.
		// maybe i should get rid of domSetup
		this.effectiveView.domSetupForAllDrawings(this.canvas);

		// this will kick the GLView to render.  Is this too intricate?
		// the guys upstairs need to know the effective view.
		// not sure about this... p.setEffectiveView(this.effectiveView);
	}

	// repaint whole GL image.  This is not 'render' as in React;
	// this is repainting a canvas.   returns an object with perf stats.
	// Returns null if it couldn't do it (promise hasn't resolved)
	doRepaint =
	() => {
		if (! this.effectiveView)
			return null;

		this.effectiveView.reloadAllVariables();

		// copy from latest wave to view buffer (c++)
		qe.qViewBuffer_getViewBuffer();
		let endReloadVarsNBuffer = performance.now();

		this.effectiveView.setInputsOnDrawings();
		let endReloadInputs = performance.now();

		// draw
		this.effectiveView.drawAllDrawings();
		let endDraw = performance.now();

		return {endReloadVarsNBuffer, endReloadInputs, endDraw};
	}

	// this just creates the canvas
	render() {
		const p = this.props;
		const s = this.state;

		return (
			<canvas className='squishCanvas'
				width={p.width} height={p.height}
				ref={
					canvas => {  // tighten this up someday
						if (canvas)
							this.setGLCanvas(canvas);
					}
				}
				style={{width: `${p.width}px`, height: `${p.height}px`}}
			/>
		);

	}
}

export default GLView;

