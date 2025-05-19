/*
** GLScene -- a webgl image
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

// GLScene  wraps a canvas for display.  Via webgl.
// And the Drawing and Scene machinery mgmt.  General for all gl canvases.

import React, {useState, useRef, useEffect} from 'react';
import PropTypes from 'prop-types';

import {listOfSceneClasses} from './listOfSceneClasses.js';
import glAmbiance from './glAmbiance.js';

let traceSetup = false;
let traceGeometry = false;

// this one dumps large buffers
let traceViewBuffer = false;


function traceOnScreen(msg) {
	const traceOnScreen = document.querySelector('#traceOnScreen .A');
	if (traceOnScreen)
		traceOnScreen.innerHTML = msg;
}



function setPT() {
	GLScene.propTypes = {
		sceneClassName: PropTypes.string.isRequired,
		sceneName: PropTypes.string,

		// Our caller gets these from eSpaceCreatedPromise; so it must be resolved by now.
		// We can't just use the promise ourselves; we have to know which avatar
		avatar: PropTypes.object.isRequired,
		space: PropTypes.object.isRequired,

 		// inner width & height of canvas
		// keep these separate  so any change will trigger render
		canvasInnerWidth: PropTypes.number.isRequired,
		canvasInnerHeight: PropTypes.number.isRequired,

		// object with specific values needed in drawing; for waveview= {bumperWidth}
		specialInfo: PropTypes.object,

		// if our caller needs the canvas and gl ctx itself, otherwise undef
		setGlCanvas: PropTypes.func,

		// a help msg, optional
		title: PropTypes.string,
	};
}

// For each GLScene, there's one:
// - canvas, and one gl context
// - one viewdef that encloses one or more drawings
// Can NOT instantiate this until after the space promise has resolved
function GLScene(props) {
	PropTypes.checkPropTypes(GLScene.propTypes, props, 'prop', 'GLScene');
	const p = props;

	// we have to keep the canvas node, to get a gl context.  Then we need to render again.
	let [canvasNode, setCanvasNode] = useState(null);
	const canvasRef = useRef(null);

	let effSceneRef = useRef(null);
	let effectiveScene = effSceneRef.current;
	let glRef = useRef(null);
	let gl = glRef.current;

	// set up the view class - what kind of drawings it has.  Base classes
	// abstractDrawing and abstractScene must do this after the canvas AND the
	// space exist.
	const initSceneClass =
	(ambiance) => {
		let sClass = listOfSceneClasses[p.sceneClassName];

		// MUST use the props.avatar!  we can't get it from the space, cuz which one?
		effectiveScene = new sClass(p.sceneName, ambiance, p.space, p.avatar);
		effSceneRef.current = effectiveScene;

		effectiveScene.completeScene(p.specialInfo);

		// now that there's an avatar, we can set these functions so everybody can use them.
		p.avatar.doRepaint = doRepaint;
		// intrinsic to avatar p.avatar.reStartDrawing = reStartDrawing;
		//p.avatar.setGlViewport = setGlViewport;
		if (traceSetup) console.log(`🖼 GLScene ${p.sceneName} ${p.avatar.label}: `
			+` done with initSceneClass`);
	};

	// repaint whole GL image.  this is repainting a canvas with GL.
	// This is not 'render' as in React; react places the canvas element
	// and this function redraws on the canvas (with gl).
	const doRepaint =
	() => {
		if (! effectiveScene) {
			if (traceViewBuffer)
				console.log(`🖼 GLScene ${p.avatar.label}: too early for doRepaint  effectiveScene=${effectiveScene}`);
			return null;  // too early
		}
		if (traceViewBuffer)
			p.avatar.ewave.dump(`🖼 GLScene ${p.sceneName}: got the ewave right here`);

		// copy from latest wave to view buffer (c++) & pick up highest
		p.avatar.loadViewBuffer();
		if (traceViewBuffer)
			p.avatar.dumpViewBuffer(`🖼 GLScene ${p.sceneName}: loaded ViewBuffer`);

		// draw.  This won't set up an ∞ loop, right?
		effectiveScene.drawAllDrawings(canvasNode.width, canvasNode.height, p.specialInfo);
		//effectiveScene.drawAllDrawings(p.canvasInnerWidth, p.canvasInnerHeight, p.specialInfo);
		if (traceGeometry) {
			console.log(`🖼 GLScene done doRepaint ${p.sceneName} av=${p.avatar.label}:   \n`
					+`canvasInnerWidth=${p.canvasInnerWidth}, canvasInnerHeight=${p.canvasInnerHeight}, `
					+`specialInfo=${p.specialInfo}`);
		}
		return;
	}

	if (traceGeometry && 'mainWave' == p.sceneName) {
		console.log(`🖼 GLScene rend '${p.sceneName}': canvas=${canvasNode?.nodeName} `
			+`canv inner dims: w=${p.canvasInnerWidth} h=${p.canvasInnerHeight} `);
	}

	const setupGLContext = () => {
		const ambiance = new glAmbiance(canvasNode);
		ambiance.glProm
		.then(newGl => {
			gl = newGl;
			glRef.current = gl;
			p.setGlCanvas?.(gl);

			canvasNode.squishViewName = p.sceneName;
			initSceneClass(ambiance);

			if (traceSetup)
				console.log(`🖼 GLScene ${p.sceneName}: canvas, gl, view and the drawing done`);
		});
	}

	// can't do much first rendering; no canvasNode yet.  Second time, no gl
	// yet.  but otherwise, after each render.  Renders should be infrequent,
	// only when dimensions of the canvas change or other big change.
	const renderRepaint = () => {
		if (!canvasNode || canvasRef.current !== canvasNode) {
			if (!canvasRef.current)
				return;  // no canvas yet, nothing to draw on

			// new canvas or differnt canvas (how could this happen?!?)
			canvasNode = canvasRef.current;
			setCanvasNode(canvasNode);  // save for us

			setupGLContext();
		}

		// but when it happens, make sure to repaint again
		doRepaint();

		if (traceSetup) {
			console.log(`🖼 GLScene ${p.sceneName}: renderRepaint(): completed, canvasNode=`,
				canvasNode);
		}
	}
	useEffect(renderRepaint);

	// the canvas w&h attributes define its inner coord system (not element's
	// size) We want them to reflect actual pixels on the screen; should be same
	// as canv inner W&H outer W&H includes borders, 1px on all sides, fits
	// inside div.widgetArea, parent. wait i thought viewport did it?  Do that at
	// the same time as adjusting the canvas size so they happen at the same
	// time.

	// canvasNode might not be there yet... will this work?
	let cWidth = p.canvasInnerWidth;
	let cHeight = p.canvasInnerHeight;

	// style attribute needed to set canvas physical width/height.
	return (
		<canvas className='GLScene'
			width={cWidth}
			height={cHeight}
			style={{width: cWidth + 'px', height: cHeight + 'px'}}
			ref={canvasRef}
			title={p.title}
		/>
	);
}

export default GLScene;
