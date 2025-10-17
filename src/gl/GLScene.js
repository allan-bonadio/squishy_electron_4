/*
** GLScene -- a webgl image for the squish wave.  (not to be confused with other canvas wrappers)
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

// TODO: rename this GLScene => GLCanvas after the dust settles
// or something like 'main gl canvas' or something

// GLScene  wraps a canvas for display.  Via webgl.
// And the Drawing and Scene machinery mgmt.  General for all gl canvases.

import React, {useState, useRef, useEffect} from 'react';
import PropTypes from 'prop-types';

import {listOfSceneClasses} from './listOfSceneClasses.js';
import glAmbiance from './glAmbiance.js';

let traceSetup = false;
let traceGeometry = true;

// this one dumps large buffers
let traceTooEarly = false;
let traceViewBuffer = false;


function traceOnScreen(msg) {
	const traceOnScreen = document.querySelector('#traceOnScreen .A');
	if (traceOnScreen)
		traceOnScreen.innerHTML = msg;
}



function setPT() {
	GLScene.propTypes = {
		sceneClassName: PropTypes.string.isRequired,  // what to draw
		sceneName: PropTypes.string,  // name for debugging

		// Our caller gets these from eSpaceCreatedPromise; so it must be resolved by now.
		// Optional; omit if your scene is not affected by space.
		space: PropTypes.object,

		// sAnimator - reserved for sAnimator, but I guess you can make your own.
		// This object will get the glRepaint function attached.  Omit if your GLScene doesn't animate.
		animator: PropTypes.object,

 		// inner width & height of canvas
		// keep these separate  so any change will trigger render
		canvasInnerWidth: PropTypes.number.isRequired,
		canvasInnerHeight: PropTypes.number.isRequired,

		// object with specific values needed in drawing; for waveview= {bumperWidth}
		specialInfo: PropTypes.object,

		// a help msg, optional
		title: PropTypes.string,
	};
}

// 		// each canvas node (used for gl) has its own squish scene and glRepaint func
// 		// with

// For each GLScene, there's one:
// - canvas element, and one gl drawing context
// - one Scene that encloses one or more drawings
// - its own closure and variable values.
// for the main GLScene:
// Can NOT instantiate this until after the space promise has resolved
// TODO: split this into general gl canvas, and WaveCanvas
function GLScene(props) {
	cfpt(GLScene, props);
	const p = props;
	//console.log(`starting GLScene(render), sceneName=${p.sceneName}`);

	// we have to keep the canvas node, to get a gl context.
	// we need it in the state, to trigger rerender, once we've got one (2nd render)
	let [canvasNode2, setCanvasNode] = useState(null);

	// but this is how we get the canvas node originally, from this ref, from the canvas node.
	const canvasRef = useRef(null);
	let canvasNode = canvasRef.current;

	// also the gl and therefore the scene depend on the ambiance promise
	// so can't guarantee when they'll be around
	let [gl, setGl] = useState(null);
	let [squishScene, setSquishScene] = useState(null);

	// set up the squish Scene - collection of drawings to draw in one canvas.  Base classes
	// abstractDrawing and abstractScene must do this after the ambiance and canvas exists.  Once only.
	const initSceneClass = (ambiance) => {
		let sClass = listOfSceneClasses[p.sceneClassName];

		// for this situation, needs the space!  if they passed it to us
		squishScene = new sClass(p.sceneName, ambiance, p.space);
		setSquishScene(squishScene);
		//effSceneRef.current = squishScene;

		squishScene.space = p.space;
		squishScene.completeScene(p.specialInfo);

		squishScene.glRepaint = glRepaint;

		if (traceSetup) console.log(`🖼 GLScene ${p.sceneName}: `
			+` done with initSceneClass`);
	};

	// repaint whole GL image.  this is repainting a canvas with GL.
	// This is not 'render' as in React; react places the canvas element
	// and this function redraws on the canvas (with gl).
	const glRepaint =
	() => {
		if (! squishScene) {
			if (traceTooEarly)
				console.log(`🖼 GLScene too early for glRepaint. squishScene=`, squishScene);
			return null;  // too early
		}
		// if (traceViewBuffer)
		// p.avatar.ewave.dump(`🖼 GLScene ${p.sceneName}: got the ewave right here`);

		// copy from latest wave to view buffer (c++) & pick up highest
		//p.avatar.loadViewBuffer();
		// if (traceViewBuffer)
		//	 p.avatar.dumpViewBuffer(`🖼 GLScene ${p.sceneName}: loaded ViewBuffer`);

		// draw.  This won't set up an ∞ loop, right?
		squishScene.drawAllDrawings(canvasNode.width, canvasNode.height, p.specialInfo);
		//squishScene.drawAllDrawings(p.canvasInnerWidth, p.canvasInnerHeight, p.specialInfo);
		if (traceGeometry) {
			console.log(`🖼 GLScene finished glRepaint() ${p.sceneName}:	\n`
					+`canvasInnerWidth=${p.canvasInnerWidth}, canvasInnerHeight=${p.canvasInnerHeight}, `
					+`specialInfo=`, p.specialInfo);
		}
		return;
	}

// 	if (canvasNode) {
// 		// each canvas node (used for gl) has its own GLScene and squish scene and glRepaint func
// 		// with its own closure and variable values.
// 		canvasNode.glRepaint = glRepaint;
// 	}

	if (traceGeometry && 'mainWave' == p.sceneName) {
		console.log(`🖼 GLScene rend '${p.sceneName}': canvas=${canvasNode?.nodeName} `
			+`canv inner dims: w=${p.canvasInnerWidth} h=${p.canvasInnerHeight} `);
	}

	// now that we have a canvasNode, we can set up the gl & scene.
	// should be called only ONCE per GL canvas.
	// it'll take one+ ev loop, but when it does, triggers render with setGl().
	const setupGLContext = () => {
		const ambiance = new glAmbiance(canvasNode);
		ambiance.glProm
		.then(newGl => {
			if (newGl.canvas !== canvasNode)
				throw new Error(`newGl !== canvasNode`);
			gl = newGl;
			setGl(gl);
			if (gl.sceneName || canvasNode.squishSceneName || canvasNode.glRepaint)
				throw `GL already claimed: gl.sceneName=${gl.sceneName} `
				+` canvasNode.squishSceneName=${canvasNode.squishSceneName} `
				+` canvasNode.glRepaint:${canvasNode.glRepaint}`;
			gl.sceneName = p.sceneName;  // for my debugging
			//glRef.current = gl;
			// if (!p.setGlCanvas)  throw new Error(`no props.setGlCanvas`);

			initSceneClass(ambiance);
			if (props.animator)
				props.animator.glRepaint = glRepaint;

			if (traceSetup)
				console.log(`🖼 GLScene ${p.sceneName}: canvas ${canvasNode?.className}, gl, view&drawing done`);
		});
	}

	// repaint after each React render of the canvas.  This is an useEffect
	// Effect.
	// can't do much first rendering; no canvasNode cuz no canvasRef.current yet.
	// But, in the effect after the first render, this func will get the canvas node
	// from the ref and set everything up.  Renders should be infrequent,
	// only when dimensions of the canvas change or other big change.
	const effectRepaint = () => {
		if (!canvasNode) {
			if (!canvasRef.current)
				return;  // no canvas yet, nothing to draw on


			// new canvas — now we've got it
			canvasNode = canvasRef.current;
			setCanvasNode(canvasNode);
			setupGLContext();
		}
		if (canvasRef.current && canvasNode && canvasRef.current !== canvasNode)
			throw new Error('canvasRef.current !== canvasNode');

		glRepaint();

		if (traceSetup) {
			console.log(`🖼 GLScene ${p.sceneName}: effectRepaint(): completed, canvasNode=`,
				canvasNode);
		}
	}
	useEffect(effectRepaint);

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
		<canvas className={`GLScene ${p.sceneName}`}
			width={cWidth}
			height={cHeight}
			style={{width: cWidth + 'px', height: cHeight + 'px'}}
			ref={canvasRef}
			title={p.title}
		/>
	);
}

setPT();

export default GLScene;
