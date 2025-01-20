/*
** GLView -- a webgl image
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

// GLView  wraps a canvas for display.  Via webgl.
// And the Drawing and Scene machinery mgmt.  General for all gl canvases.

import React, {useState, useRef, useEffect} from 'react';
import PropTypes from 'prop-types';

import {listOfViewClasses} from './listOfViewClasses.js';
import glAmbiance from './glAmbiance.js';

let traceSetup = true;
let traceGeometry = true;

// this one dumps large buffers
let tracePainting = false;

const whType = PropTypes.shape({
	width: PropTypes.number,
	height: PropTypes.number
});

function setPT() {
	GLView.propTypes = {
		viewClassName: PropTypes.string.isRequired,
		sceneName: PropTypes.string,

		// the width and height dictated from above by user's resizing
		selectedOuterDims: whType,

 		// the width and height we measure; should be inner width & height of canvas
		canvasInnerDims: whType,
		setCanvasInnerDims: PropTypes.func.isRequired,


		// object with specific values needed in drawing; for waveview= {bumperWidth}
		specialInfo: PropTypes.object,

		// Our caller gets these from eSpaceCreatedPromise; so it must be resolved by now.
		// We can't just use the promise ourselves; we have to know which avatar
		avatar: PropTypes.object.isRequired,
		space: PropTypes.object.isRequired,

		// if our caller needs the gl ctx itself, otherwise undef
		setGl: PropTypes.func,

	};
}


// For each GLView, there's one:
// - canvas, and one gl context
// - one viewdef that encloses one or more drawings
// Can NOT instantiate this until after the space promise has resolved
function GLView(props) {
	const p = props;

	if (traceGeometry)
		console.log(`GLView: props:`,  props);

	// static propTypes = {
	// 	viewClassName: PropTypes.string.isRequired,
	// 	sceneName: PropTypes.string,
	//
	// 	// lets try this with plain old CSS and let the containers dictate sizes
	// 	width: PropTypes.number,
	// 	height: PropTypes.number,
	// 	//left: PropTypes.number,  // offset on left side
	//
	// 	// Our caller gets these from eSpaceCreatedPromise; so it must be resolved by now.
	// 	// We can't jut use the promise ourselves; we have to know which avatar
	// 	avatar: PropTypes.object.isRequired,
	// 	space: PropTypes.object.isRequired,
	//
	// 	// if our caller needs the gl ctx itself
	// 	setGl: PropTypes.func,
	//
	// 	// the width and height we measure; should be width & height of canvas
	// 	canvasInnerDims: PropTypes.object.isRequired,
	// 	setCanvasInnerDims: PropTypes.func.isRequired,
	// }
	// static defaultProps = {
	// 	sceneName: 'gl view',
	// }

	// we have to get the canvas node, to get a gl context.  Then we need to render again.
	let [canvasNode, setCanvasNode] = useState(null);
	const canvasRef = useRef(null);
	let effViewRef = useRef(null);
	let effectiveView = effViewRef.current;

	// set up the view class - what kind of drawings it has.  Base classes abstractDrawing and abstractScene
	// must do this after the canvas AND the space exist.
	const initViewClass =
	(ambiance) => {
		let vClass = listOfViewClasses[p.viewClassName];

		// MUST use the props.avatar!  we can't get it from the space, cuz which one?
		effectiveView = new vClass(p.sceneName, ambiance, p.space, p.avatar);
		effViewRef.current = effectiveView;

		effectiveView.completeView();

		// now that there's an avatar, we can set these functions so everybody can use them.
		p.avatar.doRepaint = doRepaint;
		// intrinsic to avatar p.avatar.reStartDrawing = reStartDrawing;
		//p.avatar.setGlViewport = setGlViewport;
		if (traceSetup) console.log(`🖼 GLView ${p.sceneName} ${p.avatar.label}: done with initViewClass`);
	}

	// repaint whole GL image.  this is repainting a canvas with GL.
	// This is not 'render' as in React; react places the canvas element
	// and this function redraws on the canvas (with gl).
	const doRepaint =
	() => {
		if (tracePainting)
			console.log(`🖼 GLView ${p.sceneName} ${p.avatar.label}: start doRepaint  effectiveView=${effectiveView}`);
		if (! effectiveView)
			return null;  // too early

		if (tracePainting)
			p.avatar.ewave.dump(`🖼 GLView ${p.sceneName}: got the ewave right here`);

		// copy from latest wave to view buffer (c++) & pick up highest
		p.avatar.loadViewBuffer();
		if (tracePainting)
			p.avatar.dumpViewBuffer(`🖼 GLView ${p.sceneName}: loaded ViewBuffer`);

		// draw
		effectiveView.drawAllDrawings();
		if (tracePainting)
			console.log(`🖼 GLView ${p.sceneName} ${p.avatar.label}: doRepaint done drawing`);

		return; //{endReloadVarsNBuffer, endDrawTime};
	}

	if (traceGeometry) {
		let cid = p.canvasInnerDims;
		let cwid = canvasNode?.parentNode?.clientWidth ?? 'no canv yet';
		console.log(`🖼 GLView rend '${p.sceneName}': canvas=${canvasNode?.nodeName}
			inner width: ${cid.width}      inner height: ${cid.height}`);
		console.log(`     widths:  canvas parent clientWidth: ${cwid}`);

		// cid are filled in in componentDidUpdate() so the first render, there's none.
		// Soon in componentDidUpdate() the canvas cid will be updated.
		console.log(`🖼 GLView final canvas width: ${cid.width} `
			+`final innerHeight: ${cid.height}`);
	}

	const setupGLContext = () => {
		const ambiance = new glAmbiance(canvasNode);
		ambiance.glProm
		.then(gl => {
			//this.gl = gl;
			p.setGl?.(gl);  // setGl should always be there
			gl.viewport(0, 0, canvasNode.clientWidth, canvasNode.clientHeight);

			//this.tagObject = this.glAmbiance.tagObject;
			//canvasNode.glview = this;

			canvasNode.squishViewName = p.sceneName;
			initViewClass(ambiance);

			if (traceSetup)
				console.log(`🖼 GLView ${p.sceneName}: canvas, gl, view and the drawing done`);
		});
	}

	// can't do these first time around.
	const canvasFollowup = () => {
		if (!canvasNode || canvasRef.current !== canvasNode) {
			if (!canvasRef.current)
				return;  // no canvas yet, nothing to draw on

			// new canvas or differnt canvas (how could this happen?!?)
			setCanvasNode(canvasRef.current);
			canvasNode = canvasRef.current;

			setupGLContext();
		}

		// no canvas node, nothing much to do
		if (canvasNode) {
			p.setCanvasInnerDims(canvasNode.clientWidth, canvasNode.clientHeight);
			doRepaint();
		}

		if (traceSetup) {
			console.log(`🖼 GLView ${p.sceneName}: canvasFollowup(): completed, canvasNode=`,
				canvasNode);
		}
	}
	useEffect(canvasFollowup);

	// the canvas w&h attributes define its inner coord system (not element's size)
	// We want them to reflect actual pixels on the screen; should be same as canv inner W&H
	// outer W&H includes borders, 1px on all sides, fits inside div.viewArea, parent.
	// Shouldn't need css to set size.
	return (
		<canvas className='GLView'
			width={props.selectedOuterDims.width - 2} height={props.selectedOuterDims.height - 2}
			ref={canvasRef}
		/>
	)
}

export default GLView;

