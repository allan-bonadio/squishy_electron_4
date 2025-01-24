/*
** GLView -- a webgl image
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

// GLView  wraps a canvas for display.  Via webgl.
// And the Drawing and Scene machinery mgmt.  General for all gl canvases.

import React, {useState, useRef, useEffect} from 'react';
import PropTypes from 'prop-types';

// TODO should rename this listOfSceneClasses
import {listOfViewClasses} from './listOfViewClasses.js';
import glAmbiance from './glAmbiance.js';

let traceSetup = true;
let traceGeometry = true;

function traceOnScreen(msg) {
	document.querySelector('#traceOnScreen').innerHTML = msg;
}


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

		// Our caller gets these from eSpaceCreatedPromise; so it must be resolved by now.
		// We can't just use the promise ourselves; we have to know which avatar
		avatar: PropTypes.object.isRequired,
		space: PropTypes.object.isRequired,

		// the width and height dictated from above by user's resizing
		selectedOuterDims: whType.isRequired,

 		// the width and height we measure; should be inner width & height of canvas
		canvasInnerDims: whType.isRequired,
		setCanvasInnerDims: PropTypes.func,

		// omits bumpers, in flatDrawing
		canvasDrawingRegion: PropTypes.shape({
			x: PropTypes.number, y: PropTypes.number,
			width: PropTypes.number, height: PropTypes.number
		}),

		// object with specific values needed in drawing; for waveview= {bumperWidth}
		specialInfo: PropTypes.object,

		// if our caller needs the gl ctx itself, otherwise undef
		setGl: PropTypes.func,
	};
}

// For each GLView, there's one:
// - canvas, and one gl context
// - one viewdef that encloses one or more drawings
// Can NOT instantiate this until after the space promise has resolved
function GLView(props) {
	PropTypes.checkPropTypes(GLView.propTypes, props, 'prop', 'GLView');
	const p = props;

	//if (traceGeometry && 'mainWave' == p.sceneName)
	//	console.log(`GLView: props:`,  props);

	// optional; defaults to canvasInnerDims
	const canvasDrawingRegion = p.canvasDrawingRegion
		?? {x: 0, y: 0, ...p.canvasInnerDims};

	// we have to get the canvas node, to get a gl context.  Then we need to render again.
	let [canvasNode, setCanvasNode] = useState(null);
	const canvasRef = useRef(null);

	// TODO: should rename viewRef into sceneRef
	let effViewRef = useRef(null);
	let effectiveView = effViewRef.current;
	let glRef = useRef(null);
	let gl = glRef.current;

	// set up the view class - what kind of drawings it has.  Base classes
	// abstractDrawing and abstractScene must do this after the canvas AND the
	// space exist.  TODO: rename this to initSceneClass
	const initViewClass =
	(ambiance) => {
		// TODO: rename these to sceneClass  listOfSceneClasses   p.sceneClassName
		let vClass = listOfViewClasses[p.viewClassName];

		// MUST use the props.avatar!  we can't get it from the space, cuz which one?
		effectiveView = new vClass(p.sceneName, ambiance, p.space, p.avatar);
		effViewRef.current = effectiveView;

		effectiveView.completeView();

		// now that there's an avatar, we can set these functions so everybody can use them.
		p.avatar.doRepaint = doRepaint;
		// intrinsic to avatar p.avatar.reStartDrawing = reStartDrawing;
		//p.avatar.setGlViewport = setGlViewport;
		if (traceSetup) console.log(`🖼 GLView ${p.sceneName} ${p.avatar.label}: `
			+` done with initViewClass`);
	};

	// GL needs this to know where on canvas to draw
	const setViewport = () => {
		gl.viewport(canvasDrawingRegion.x, canvasDrawingRegion.y,
			canvasDrawingRegion.width, canvasDrawingRegion.height);

		if (traceGeometry && 'mainWave' == p.sceneName) {
			let cdr = canvasDrawingRegion;
			traceOnScreen(`🖼 GLView.setViewport for ${p.sceneName}, set `
				+` draw region: x=${cdr.x} y=${cdr.y} w=${cdr.width} h=${cdr.height} `);
		}
	}

	// repaint whole GL image.  this is repainting a canvas with GL.
	// This is not 'render' as in React; react places the canvas element
	// and this function redraws on the canvas (with gl).
	const doRepaint =
	() => {
		if (! effectiveView) {
			if (tracePainting)
				console.log(`🖼 GLView ${p.avatar.label}: too early for doRepaint  effectiveView=${effectiveView}`);
			return null;  // too early
		}
		if (tracePainting)
			p.avatar.ewave.dump(`🖼 GLView ${p.sceneName}: got the ewave right here`);

		//setViewport(effectiveView.gl);

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

	if (traceGeometry && 'mainWave' == p.sceneName) {
		let cid = p.canvasInnerDims;
		let cdr = canvasDrawingRegion;
		console.log(`🖼 GLView rend '${p.sceneName}': canvas=${canvasNode?.nodeName}
			inner width: ${cid.width}      inner height: ${cid.height}
			draw reg: x=${cdr.x} y=${cdr.y} w=${cdr.width} h=${cdr.height} `);
	}

	const setupGLContext = () => {
		const ambiance = new glAmbiance(canvasNode);
		ambiance.glProm
		.then(newGl => {
			gl = newGl;
			glRef.current = gl;
			p.setGl?.(gl);

			canvasNode.squishViewName = p.sceneName;
			initViewClass(ambiance);
			setViewport(gl);  // just upon init

			if (traceSetup)
				console.log(`🖼 GLView ${p.sceneName}: canvas, gl, view and the drawing done`);
		});
	}

	// can't do much first rendering; no canvasNode yet.  Second time, no gl
	// yet.  but otherwise, after each render
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
			p.setCanvasInnerDims?.(canvasNode.clientWidth, canvasNode.clientHeight);
			doRepaint();
		}

		if (traceSetup) {
			console.log(`🖼 GLView ${p.sceneName}: canvasFollowup(): completed, canvasNode=`,
				canvasNode);
		}
	}
	useEffect(canvasFollowup);

	// the canvas w&h attributes define its inner coord system (not element's
	// size) We want them to reflect actual pixels on the screen; should be same
	// as canv inner W&H outer W&H includes borders, 1px on all sides, fits
	// inside div.viewArea, parent. wait i thought viewport did it?  Do that at
	// the same time as adjusting the canvas size so they happen at the same
	// time.
	setViewport(gl);

	// Shouldn't need css to set size.
	return (
		<canvas className='GLView'
			width={props.selectedOuterDims.width - 2}
			height={props.selectedOuterDims.height - 2}
			ref={canvasRef}
		/>
	)
}

export default GLView;

