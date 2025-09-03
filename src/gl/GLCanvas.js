/*
** GLCanvas -- a webgl image in a React component
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

// GLCanvas  wraps an HTLM canvas for display.  Via webgl.
// And the Drawing and Scene machinery mgmt, for the whole squish Scene.

import React, {useState, useRef, useEffect} from 'react';
import PropTypes from 'prop-types';

import * as THREE from 'three';

import {listOfSceneClasses} from './listOfSceneClasses.js';
import qeFuncs from '../engine/qeFuncs.js';
import qeConsts from '../engine/qeConsts.js';

//import glAmbiance from './glAmbiance.js';

let traceSetup = true;
let traceGeometry = true;

// this one dumps large buffers
let traceViewBuffer = false;


function traceOnScreen(msg) {
	const traceOnScreen = document.querySelector('#traceOnScreen .A');
	if (traceOnScreen)
		traceOnScreen.innerHTML = msg;
}



function setPT() {
	GLCanvas.propTypes = {
	   // which kind of scene this draws, eg flatScene, etc
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

// For each GLCanvas, there's one:
// NO!  can use canvas for more than one scene!  - canvas, and one gl context
// - one subclass of abstractScene that encloses one or more drawings
// Can NOT instantiate this until after the space promise has resolved
function GLCanvas(props) {
	PropTypes.checkPropTypes(GLCanvas.propTypes, props, 'prop', 'GLCanvas');
	const p = props;

	const canvasRef = useRef(null);
	let canvasNode = canvasRef.current;

   // create the scene, and store it here for all the other requests
	let [effectiveScene, setEffectiveScene] = useState(null);

	// repaint whole GL image.  this is repainting a canvas with GL.
	// This is not 'render' as in React; react places the canvas element
	// and this function redraws on the canvas (with gl).
	const doRepaint =
	() => {
		if (!effectiveScene) {
			if (traceViewBuffer)
				console.log(`🖼 GLCanvas: too early for doRepaint`);
			return null;  // too early
		}

		console.log("Hey fix this TODO");
      if (traceViewBuffer)
         p.avatar.dumpViewBuffers(3, ` GLCanvas ${p.sceneName}: starting doRepaint() `);

      // 		copy from latest wave to view buffer (c++) & pick up highest
      // 		?? p.avatar.loadViewBuffers();
// 		if (traceViewBuffer) {
// 			p.avatar.dumpViewBuffers(0xF, ` 🖼 GLCanvas ${p.sceneName}: loaded ViewBuffer`);
// 			p.avatar.dumpIndex(` 🖼 GLCanvas ${p.sceneName}: loaded ViewBuffer`);
//       }

		// draw.  This won't set up an ∞ loop, right?
		effectiveScene.drawAllDrawings(canvasNode.width, canvasNode.height);
		//effectiveScene.drawAllDrawings(p.canvasInnerWidth, p.canvasInnerHeight);
		if (traceGeometry) {
			console.log(` 🖼 GLCanvas done doRepaint ${p.sceneName} av=${p.avatar.label}:   \n`
					+`canvasInnerWidth=${p.canvasInnerWidth}, `
					+` canvasInnerHeight=${p.canvasInnerHeight}, `
					+`specialInfo=${p.specialInfo}`);
		}
		return;
	}

	// set up the scene class - what kind of drawings it has.  Base classes
	// abstractDrawing and abstractScene must do this after the canvas AND the
	// space exist.
   function createScene() {
      try {
         let sClass = listOfSceneClasses[p.sceneClassName];

         // MUST use the props.avatar!  we can't get it from the space, cuz which one?
         effectiveScene = new sClass(p.sceneName, canvasNode, p.space, p.avatar);
         setEffectiveScene(effectiveScene);

         effectiveScene.completeScene(canvasNode);

         // now that there's an avatar, we can set these functions so everybody can use them.
         p.avatar.doRepaint = doRepaint;
         //p.avatar.setGlViewport = setGlViewport;
         if (traceSetup) console.log(`🖼 GLCanvas ${p.sceneName} ${p.avatar.label}: `
            +` done with initSceneClass`);
      }
      catch (ex) {
         excRespond(ex, `creating scene`);
         //console.error(`Error creating scene: `, ex.stack ?? ex.message ?? ex);
      }
	}

   // the first time, canvasNode won't be there.  Eventually it will.
   if (canvasNode && !effectiveScene)
      createScene();

	if (traceGeometry) {
		console.log(`🖼 GLCanvas rend '${p.sceneName}': canvas=${canvasNode?.nodeName} `
			+`canv inner dims: w=${p.canvasInnerWidth} h=${p.canvasInnerHeight} `);
	}

//	const setupGLContext = () => {
//		const ambiance = new glAmbiance(canvasNode);
//		ambiance.glProm
//		.then(newGl => {
//			gl = newGl;
//			glRef.current = gl;
//			p.setGlCanvas?.(gl);
//
//			canvasNode.squishViewName = p.sceneName;
//			initSceneClass(ambiance);
//
//			if (traceSetup)
//				console.log(`🖼 GLCanvas ${p.sceneName}: canvas, gl, view and the drawing done`);
//		});
//	}

   // The Repaint, as an effect.  After each render. can't do much first
   // rendering; no canvasNode yet. But otherwise,  Renders should be
   // infrequent, compared to the wave, only when dimensions of the canvas
   // change or other big change.
	const renderRepaint = () => {
//		if (!canvasNode || canvasRef.current !== canvasNode) {
//			if (!canvasRef.current)
//				return;  // no canvas yet, nothing to draw on
//
//			// new canvas or differnt canvas
//			canvasNode = canvasRef.current;
//			//setCanvasNode(canvasNode);  // save for us
//
//			//setupGLContext();
//		}

		// but when it happens, make sure to repaint again
		doRepaint();

		if (traceSetup) {
			console.log(`🖼 GLCanvas ${p.sceneName}: renderRepaint(): completed, canvasNode=`,
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
		<canvas className='GLCanvas'
			width={cWidth}
			height={cHeight}
			style={{width: cWidth + 'px', height: cHeight + 'px'}}
			ref={canvasRef}
			title={p.title}
		/>
	);
}

export default GLCanvas;
