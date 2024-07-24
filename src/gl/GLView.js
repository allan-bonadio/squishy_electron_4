/*
** GLView -- a webgl image
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

// GLView  wraps a canvas for display.  Via webgl.
// And the Drawing and ViewDef machinery mgmt

import React, {useState, useRef, useEffect} from 'react';
import PropTypes from 'prop-types';

import {listOfViewClasses} from './listOfViewClasses.js';
import ctxFactory from './ctxFactory.js';

let traceSetup = false;
let traceGeometry = false;

// this one dumps large buffers
let tracePainting = false;

function setPT() {
	GLView.propTypes = {
		viewClassName: PropTypes.string.isRequired,
		viewName: PropTypes.string,

		// lets try this with plain old CSS and let the containers dictate sizes
		innerHeight: PropTypes.number,
		height: PropTypes.number,

		// Our caller gets these from eSpaceCreatedPromise; so it must be resolved by now.
		// We can't jut use the promise ourselves; we have to know which avatar
		avatar: PropTypes.object.isRequired,
		space: PropTypes.object.isRequired,

		// if our caller needs the gl ctx itself, otherwise undef
		setGl: PropTypes.func,

		// the width and height we measure; should be inner width & height of canvas
		canvasInnerDims: PropTypes.object.isRequired,
		setCanvasInnerDims: PropTypes.func.isRequired,
	};
}


// For each GLView, there's one:
// - canvas, and one gl context
// - one viewdef that encloses one or more drawings
// Can NOT instantiate this until after the space promise has resolved
function GLView(props) {
	const p = props;

	// static propTypes = {
	// 	viewClassName: PropTypes.string.isRequired,
	// 	viewName: PropTypes.string,
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
	// 	viewName: 'gl view',
	// }

	// we have to get the canvas node, to get a gl context.  Then we need to render again.
	const [canvasNode, setCanvasNode] = useState(null);
	const canvasRef = useRef(null);
	let effViewRef = useRef(null);
	let effectiveView = effViewRef.current;

	// set up the view class - what kind of drawings it has.  Base classes abstractDrawing and abstractViewDef
	// must do this after the canvas AND the space exist.
	const initViewClass =
	(ambiance) => {
		let vClass = listOfViewClasses[p.viewClassName];

		// MUST use the props.avatar!  we can't get it from the space, cuz which one?
		effectiveView = new vClass(p.viewName, ambiance, p.space, p.avatar);
		effViewRef.current = effectiveView;

		effectiveView.completeView();

		// now that there's an avatar, we can set these functions so everybody can use them.
		p.avatar.doRepaint = doRepaint;
		// intrinsic to avatar p.avatar.reStartDrawing = reStartDrawing;
		//p.avatar.setGlViewport = setGlViewport;
		if (traceSetup) console.log(`🖼 GLView ${p.viewName} ${p.avatar.label}: done with initViewClass`);
	}

	// repaint whole GL image.  this is repainting a canvas with GL.
	// This is not 'render' as in React; react places the canvas element
	// and this function redraws on the canvas (with gl).
	const doRepaint =
	() => {
		if (tracePainting)
			console.log(`🖼 GLView ${p.viewName} ${p.avatar.label}: start doRepaint  effectiveView=${effectiveView}`);
		if (! effectiveView)
			return null;  // too early

		if (tracePainting)
			p.avatar.ewave.dump(`🖼 GLView ${p.viewName}: got the ewave right here`);

		// copy from latest wave to view buffer (c++) & pick up highest
		p.avatar.loadViewBuffer();
		if (tracePainting)
			p.avatar.dumpViewBuffer(`🖼 GLView ${p.viewName}: loaded ViewBuffer`);

		// draw
		effectiveView.drawAllDrawings();
		if (tracePainting)
			console.log(`🖼 GLView ${p.viewName} ${p.avatar.label}: doRepaint done drawing`);

		return; //{endReloadVarsNBuffer, endDrawTime};
	}

	if (traceGeometry) {
		let facts = p.canvasInnerDims;
		console.log(`🖼 GLView rend '${p.viewName}': canvas=${canvasNode?.nodeName}
			Facts.w: ${facts.width}      Facts.h: ${facts.height}`);
		console.log(`     widths:  canvas parent clientWidth: ${canvasNode?.parentNode?.clientWidth ?? 'no canv'}`);

		// facts are filled in in componentDidUpdate() so the first render, there's none.
		// Soon in componentDidUpdate() the canvas facts will be updated.
		console.log(`🖼 GLView final canvas width: ${p.innerWidth}      final innerHeight: ${p.innerHeight}
			Facts.width: ${facts.width}      Facts.innerHeight: ${facts.height}`);
	}

	//let cWidth = p.innerHeight - 2, cHeight = p.innerHeight - 2;
	// if (canvasNode) {
	// 	cWidth = canvasNode.clientWidth;
	// 	p.innerHeight = canvasNode.clientHeight;

	// this is meant to run after each render
	useEffect(() => {
			let canvasNode2 = canvasNode;  // I need to use it immediately
			if (canvasRef.current) {
				if (!canvasNode2) {
					// note this is only good within this useEffect callback
					canvasNode2 = canvasRef.current;
					setCanvasNode(canvasNode2);
				}
			}
			else
				return;

			p.setCanvasInnerDims(canvasNode2.clientWidth, canvasNode2.clientHeight);

			// the rest of this is first-time stuff, not needed in repeat renders (typically for resizes)
			if (canvasNode == canvasRef.current)
				return;

			if (traceSetup)
				console.log(`🖼 GLView ${p.viewName}: setCanvasNode completed`,
					canvasNode2);

			// now set up gl context
			const ambiance = new ctxFactory(canvasNode2);
			ambiance.glProm
			.then(gl => {
				//this.gl = gl;
				p.setGl?.(gl);  // setGl should always be there
				gl.viewport(0, 0, canvasNode2.clientWidth, canvasNode2.clientHeight);

				//this.tagObject = this.ctxFactory.tagObject;
				//canvasNode.glview = this;

				canvasNode2.viewName = p.viewName;
				initViewClass(ambiance);

				if (traceSetup)
					console.log(`🖼 GLView ${p.viewName}: canvas, gl, view and the drawing done`);
			});

		},
		[canvasRef.current, canvasNode?.clientWidth, canvasNode?.clientHeight]
	);


	// how did you tell if the canvas resized?  It aways gets a render.  so should gl paint.
	// I can abbreviate this.  Make sure its called after the above, for the first time (?)
	useEffect(() => {
		doRepaint();

		// this wil alert everybody if the user changed the canvas dims
		// the first time, the gl ctx might not be there yet
		// be careful with this, if the height changes, this will make it rerender for ever
// 		if (gl)
// 			props.setCanvasInnerDims(canvas.clientWidth, canvas.clientHeight);
// 		const p = props;
// 		p.canvasInnerDims.width = canvas.clientWidth;
// 		p.canvasInnerDims.height = canvas.clientHeight;
	});

	// the canvas w&h attributes define its inner coord system
	// We want them to reflect actual pixels on the screen; should be same as client W&H
	// outer W&H includes borders, 1px on all sides
	return (
		<canvas className='GLView'
			width={(p.innerWidth + 2) + 'px'} height={(p.innerHeight + 2) + 'px'}
			ref={canvasRef}
		/>
	)
	// took out style={{width: `${p.width}px`, height: `${p.height}px`}}
	// took out style={{left: p.left +'px'}}
}

export default GLView;

