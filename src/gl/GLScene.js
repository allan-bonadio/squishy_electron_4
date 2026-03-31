/*
** GLScene -- a webgl image for the squish wave.  (not to be confused with other canvas wrappers)
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

// TODO: rename this GLScene => GLCanvas after the dust settles
// or something like 'main gl canvas' or something

// GLScene	wraps a canvas for display.	 Via webgl.
// And the Drawing and Scene machinery mgmt.  General for all gl canvases.

import React, {useState, useRef, useEffect} from 'react';
import PropTypes from 'prop-types';

import {listOfSceneClasses} from './listOfSceneClasses.js';
import glAmbiance from './glAmbiance.js';

let traceSetup = false;
let traceGeometry = false;

// turn this off by setting it to '' or just turn off the booleans above; automated resetting won't touch it
// but that turns off all the tracing... hmmm...
let traceOnlyScene = 'mainWave3d';

// this one dumps large buffers
let traceTooEarly = false;
let traceViewBuffer = false;


function traceOnScreen(msg) {
	const traceOnScreen = document.querySelector('#traceOnScreen .A');
	if (traceOnScreen)
		traceOnScreen.innerHTML = msg;
}


const propTypes = {
   sceneClassName: PropTypes.string.isRequired,  // what to draw
   sceneName: PropTypes.string,  // name for debugging

   // Array of eCavity(s) or other buffers to draw or any data.  passed blindly to avatar
   inputInfo: PropTypes.array.isRequired,

   // Our caller gets these from eSpaceCreatedPromise; so it must be resolved by now.
   // Optional; omit if your scene is not affected by space.
   space: PropTypes.object,

   // sAnimator - reserved for sAnimator, but I guess you
   // can make your own. Or, blow it off.  This object will get the
   // glRepaint function attached. Omit if your GLScene
   // doesn't animate.
   animator: PropTypes.object,

   // inner width & height of canvas
   // keep these separate	so any change will trigger render
   canvasInnerWidth: PropTypes.number.isRequired,
   canvasInnerHeight: PropTypes.number.isRequired,
   show: PropTypes.bool.isRequired,

  // if the caller needs the repaint function for this canvas, pass a func to pick it up
   setGLRepaint: PropTypes.func,

   // a help msg, optional
   title: PropTypes.string,
};


// Wraps a DOM canvas to do webgl.	All webgl rectangles should use this.
// For each GLScene, there's one:
// - canvas element, and one gl drawing context
// - one Scene that encloses one or more drawings
// - its own closure and variable values.
// for the main GLScene:
// Can NOT instantiate this until after the space promise has resolved
// TODO: split this into general gl canvas, and WaveCanvas
function GLScene(props) {
	cfpt(propTypes, props);
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

	// set up the squish Scene - collection of drawings to draw in one canvas.	Base classes
	// abstractDrawing and abstractScene must do this after the ambiance and canvas exists.	 Once only.
	const initSceneClass = (ambiance) => {
		let sClass = listOfSceneClasses[p.sceneClassName];

		// for this situation, needs the space!	 if they passed it to us
		squishScene = new sClass(p.sceneName, ambiance, p.inputInfo, p.space);
		setSquishScene(squishScene);
		//effSceneRef.current = squishScene;

		squishScene.space = p.space;
		squishScene.completeScene(p.inputInfo);

		squishScene.glRepaint = glRepaint;

		if (traceSetup && traceOnlyScene == p.sceneName)
			console.log(`🖼 GLScene ${p.sceneName}:  done with initSceneClass`);
	};

	// repaint whole GL image.	this is repainting a canvas with GL.
	// This is not 'render' as in React; react places the canvas element
	// and this function redraws on the canvas (with gl).
	const glRepaint =
	() => {
		// if not showing, nothing to paint.  Still needs to render the canvas, even though disp none
		if (!p.show)
			return;

		// make sure we have this cuz this func gets called from all over
		const scene = squishScene;
		const node = canvasNode;
		const inputInfo = p.inputInfo;
		if (! scene) {
			if (traceTooEarly)
				console.log(`🖼 GLScene too early for glRepaint. squishScene=`, scene);
			return null;  // too early
		}
		// if (traceViewBuffer)
		// p.avatar.cavity.dump(`🖼 GLScene ${p.sceneName}: got the cavity right here`);

		// draw.  This won't set up an ∞ loop, right?
		scene.drawAllDrawings(node.width, node.height, inputInfo);
		//scene.drawAllDrawings(p.canvasInnerWidth, p.canvasInnerHeight, info);
		if (traceGeometry && traceOnlyScene == p.sceneName) {
			console.log(`🖼 GLScene finished glRepaint() ${p.sceneName}:	\n`
					+`canvasInnerWidth=${p.canvasInnerWidth}, canvasInnerHeight=${p.canvasInnerHeight}, `
					+`inputInfo=`, inputInfo);
		}
		return;
	}
	props.setGLRepaint?.(glRepaint);

//	if (canvasNode) {
//		// each canvas node (used for gl) has its own GLScene and squish scene and glRepaint func
//		// with its own closure and variable values.
//		canvasNode.glRepaint = glRepaint;
//	}

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
			gl.sceneName = p.sceneName;	 // for my debugging
			//glRef.current = gl;
			// if (!p.setGlCanvas)	throw new Error(`no props.setGlCanvas`);

			initSceneClass(ambiance);
			if (props.animator)
				props.animator.glRepaint = glRepaint;

			if (traceSetup && traceOnlyScene == p.sceneName)
				console.log(`🖼 GLScene ${p.sceneName}: canvas ${canvasNode?.className}, gl, view&drawing done`);
		});
	}

	// repaint after each React render of the canvas.  This is an useEffect
	// Effect.
	// can't do much first rendering; no canvasNode cuz no canvasRef.current yet.
	// But, in the effect after the first render, this func will get the canvas node
	// from the ref and set everything up.	Renders: should be mostly identical,
	//     - when dimensions of the canvas change
	//     - every dam time you start or stop main animation cuz that flag is in the context
	const effectRepaint = () => {
		if (!canvasNode) {
			if (!canvasRef.current)
				return;	 // no canvas yet, nothing to draw on


			// new canvas — now we've got it
			canvasNode = canvasRef.current;
			setCanvasNode(canvasNode);
			setupGLContext();
		}
		if (canvasRef.current && canvasNode && canvasRef.current !== canvasNode)
			throw new Error('canvasRef.current !== canvasNode');

		glRepaint();

		if (traceSetup && traceOnlyScene == p.sceneName) {
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
			style={{width: cWidth + 'px', height: cHeight + 'px',
					display: p.show ? 'block' : 'none'}}
			ref={canvasRef}
			title={p.title}
		/>
	);
}



export default GLScene;


/* *************************************************** capturing frames
from MDN:

HTMLCanvasElement: toBlob() method
Baseline Widely available
The HTMLCanvasElement.toBlob() method creates a Blob object representing the image contained in the canvas [png or other formats]. This file may be cached on the disk or stored in memory at the discretion of the user agent.

The desired file format and image quality may be specified. If the file format is not specified, or if the given format is not supported, then the data will be exported as image/png. Browsers are required to support image/png; many will support additional formats including image/jpeg and image/webp.

The created image will have a resolution of 96dpi for file formats that support encoding resolution metadata.

Syntax
js

Copy
toBlob(callback)
toBlob(callback, type)
toBlob(callback, type, quality)
Parameters
callback
A callback function with the resulting Blob object as a single argument. null may be passed if the image cannot be created for any reason.

type Optional
A string indicating the image format. The default type is image/png; that type is also used if the given type isn't supported.

quality Optional
A Number between 0 and 1 indicating the image quality to be used when creating images using file formats that support lossy compression (such as image/jpeg or image/webp). A user agent will use its default quality value if this option is not specified, or if the number is outside the allowed range.

Return value
None (undefined).

Exceptions
SecurityError
The canvas's bitmap is not origin-clean; at least some of its contents have or may have been loaded from a site other than the one from which the document itself was loaded.

*/
/* *************************************************** capturing video

from MDN:

HTMLCanvasElement: captureStream() method
Baseline Widely available
The captureStream() method of the HTMLCanvasElement interface returns a MediaStream which includes a CanvasCaptureMediaStreamTrack containing a real-time video capture of the canvas's contents.


CanvasCaptureMediaStreamTrack
Limited availability
The CanvasCaptureMediaStreamTrack interface of the Media Capture and Streams API represents the video track contained in a MediaStream being generated from a <canvas> following a call to HTMLCanvasElement.captureStream().

This interface inherits the properties of its parent, MediaStreamTrack.

CanvasCaptureMediaStreamTrack.canvas Read only
Returns the HTMLCanvasElement object whose surface is captured in real-time.

Instance methods
This interface inherits the methods of its parent, MediaStreamTrack.

CanvasCaptureMediaStreamTrack.requestFrame()
Manually forces a frame to be captured and sent to the stream. This lets applications that wish to specify the frame capture times directly do so, if they specified a frameRate of 0 when calling captureStream().
*/
