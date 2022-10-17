/*
** GLView -- a webgl image
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

// GLView  wraps a canvas for display.  Via webgl.
// And the Drawing and ViewDef machinery mgmt

import React from 'react';
import PropTypes from 'prop-types';

//import qe from '../engine/qe';
//import {abstractViewDef} from './abstractViewDef';
//import flatDrawingViewDef from './flatDrawingViewDef';
//import {getASetting, storeASetting} from '../utils/storeSettings';

import eAvatar from '../engine/eAvatar';
import {listOfViewClasses} from './listOfViewClasses';
//import {eSpaceCreatedPromise} from '../engine/eEngine';

let traceGLView = false;


class GLView extends React.Component {
	static propTypes = {
		viewClassName: PropTypes.string.isRequired,
		viewName: PropTypes.string,
		//returnGLFuncs: PropTypes.func.isRequired,

		width: PropTypes.number.isRequired,
		height: PropTypes.number.isRequired,

		avatar: PropTypes.instanceOf(eAvatar),  // undefined early on
		space: PropTypes.object,
	}
	static defaultProps = {
		viewName: 'gl view',
	}

	constructor(props) {
		super(props);
		this.state = {canvas: null};

		if (traceGLView) console.log(`🖼 🖼 GLView:${props.viewName} : constructor done`);
	}

	// When you know <canvas element, pass it here.
	// Called every time canvas is created (or recreated) in a render
	setGLCanvas =
	(canvas) => {
		if (!canvas) return;  // i have no idea why this happens but we can't use the canvas

		const p = this.props;
		//const s = this.state;
		if (this.canvas === canvas)
			return;  // already done

		this.setState({canvas}, () => traceGLView &&
			console.log(`🖼 🖼 GLView:${p.viewName} : setGLCanvas set state completed`));
		this.canvas = canvas;  // immediately available

		canvas.GLView = this;
		canvas.viewName = p.viewName;

		if (traceGLView) console.log(`🖼 🖼 GLView:${p.viewName} : setGLCanvas done`);
	}

	// must do this after the canvas AND the space exist.
	initViewClass =
	() => {
		const p = this.props;
		//const s = this.state;

		//let vClass = listOfViewClasses['abstractViewDef'];
		let vClass = listOfViewClasses[p.viewClassName];

		// MUST use the props.avatar!  we can't get it from the space, cuz which one?
		this.effectiveView = new vClass(p.viewName, this.canvas, p.space, p.avatar);
		this.effectiveView.completeView();

		// Make sure you call the new view's domSetup method.
		// i think this is redundant - completeView() also does this...
		this.effectiveView.domSetupForAllDrawings(this.canvas);

		// now that there's an avatar, we can set these functions so everybody can use them.
		p.avatar.doRepaint = this.doRepaint;
		p.avatar.resetWave = this.resetWave;
		p.avatar.setGeometry = this.setGeometry;
		if (traceGLView) console.log(`🖼 🖼 GLView:${p.viewName} : done with initViewClass`);
	}

	// Tell the GLView & its view(s) that the wave contents have changed dramatically;
	// essentiially refilled with different numbers.  In practice, just resets
	// the avgHighest.  Passed up to a higher Component.
	resetWave =
	() => {
		if (this.effectiveView) {
			//this.effectiveView.resetAvgHighest();
			//const curView = this.effectiveView || this.state.effectiveView;
			this.effectiveView.drawings.forEach(dr =>  dr.resetAvgHighest());
			if (traceGLView) console.log(`🖼 🖼 GLView:${this.props.viewName} : did resetWave`);
		}
	}

	// repaint whole GL image.  This is not 'render' as in React;
	// this is repainting a canvas with GL.   returns an object with perf stats.
	// Returns null if it couldn't do it (eSpace promise hasn't resolved)
	setGeometry =
	() => {
		if (this.effectiveView) {
			this.effectiveView.setGeometry();
			if (traceGLView) console.log(`🖼 🖼 GLView:${this.props.viewName} did setGeometry`);
		}
	}

	// repaint whole GL image.  This is not 'render' as in React;
	// this is repainting a canvas with GL.   returns an object with perf stats.
	// Returns null if it couldn't do it (eSpace promise hasn't resolved)
	doRepaint =
	() => {
		let p = this.props;
		if (traceGLView) console.log(`🖼 🖼 GLView:${p.viewName} : starting doRepaint`);
		if (! this.effectiveView)
			return null;  // at least the render will crate the canvas

		this.effectiveView.reloadAllVariables();

		// copy from latest wave to view buffer (c++)  .. hey where does this go!??!?!?!?!
		this.highest = p.avatar.loadViewBuffer()
		//p.avatar.getViewBuffer();

		let endReloadVarsNBuffer = performance.now();

		this.effectiveView.setInputsOnDrawings();
		let endReloadInputs = performance.now();

		// draw
		this.effectiveView.drawAllDrawings();
		let endDraw = performance.now();
		if (traceGLView) console.log(`🖼 🖼 GLView:${p.viewName} : : doRepaint done`);

		return {endReloadVarsNBuffer, endReloadInputs, endDraw};
	}

	// this just creates the canvas
	render() {
		const p = this.props;
		//const s = this.state;
		if (traceGLView) console.log(`🖼 🖼 GLView:${p.viewName} : : about to render`);

		return (
			<canvas className='GLView'
				width={p.width} height={p.height}
				ref={ canvas => this.setGLCanvas(canvas) }
				style={{width: `${p.width}px`, height: `${p.height}px`}}
			/>
		)
	}

	componentDidMount() {
		this.componentDidUpdate();
	}

	componentDidUpdate() {
		const p = this.props;
		//const s = this.state;

		// a one-time initialization.  but upon page load, neither the avatar,
		// space or canvas are there yet.  Don't worry, when the space comes in,
		// we'll all initViewClass.
		if (p.avatar && p.space && this.canvas && !this.effectiveView) {
			this.initViewClass();
		}
		if (traceGLView) console.log(`🖼 🖼 GLView:${p.viewName} : initViewClass done`, this);
	}
}

export default GLView;

