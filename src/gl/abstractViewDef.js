/*
** abstract View Def -- superclass for all the views, which live inside the WaveView
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

//import {abstractDrawing} from './abstractDrawing.js';


// Each abstractViewDef subclass is a definition of a kind of view; one per each
// kind of view. A WaveView owns an instance of the def and is a React
// component enclosing the canvas.

/* ****************************************  */


// This is the superclass of all view defs; with common webgl and space plumbing.
// viewName is not the viewClassName, which is one of flatViewDef, garlandView, ...
// there should be ONE of these per canvas, so each WaveView should have 1.
export class abstractViewDef {
	static displayName = 'Abstract View';

	/* ************************************************** construction */
	// viewName: personal name for the viewDef instance, for error msgs
	// canvas: real <canvas> DOM element, after it's been created by React
	// class name from instance: vu.constructor.name   from class: vuClass.name
	constructor(viewName, glView, space, avatar) {
		this.viewName = viewName;
		this.canvas = glView.canvas;
		this.gl = glView.gl;
		this.tagObject = glView.tagObject;
		if (! this.canvas) throw new Error(`abstractViewDef: being created without canvas`);

		this.space = space;
		this.avatar = avatar;

		// should have one VAO per viewdef, or per drawing?  can't decide myself.
		// But keep this so we can go back and forth.
		//this.perDrawingVAO = false;
		this.perDrawingVAO = true;

		if (!this.perDrawingVAO) {
			// vao for all drawings in this viewdef
			this.vao = this.gl.createVertexArray();
			this.tagObject(this.vao, `${avatar.label}-${this.drawingName}-vao`);
		}

		// all of the drawings in this view
		// they get prepared, and drawn, in this same order
		this.drawings = [];
	}

	// the final call to set it up does all viewClassName-specific stuff
	// other subclassers override what they want
	completeView() {
		this.compileShadersOnDrawings();
		this.createVariablesOnDrawings();

		// call again if canvas outer dimensions change
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

		// kick it off by drawing it once
		this.drawAllDrawings();

		// and set up interactivity
		// maybe i should get rid of this
		this.domSetupForAllDrawings(this.canvas);

		// just for curiosity's sake, pretty cool
		// need to import {curioShader, curioProgram, curioParameter} from curiousity.js;
		//curioShader(this.gl, this.vertexShader);
		//curioShader(this.gl, this.fragmentShader);
		//curioProgram(this.gl, this.program);
		//curioParameter(this.gl);
	}

	/* ****************************************** Shader s */
	// this does shaders and inputs, integrating thru the list of drawings
	// see abstractDrawing
	// drawings have their glsl scripts in their constructors
	compileShadersOnDrawings() {
		this.drawings.forEach(drawing => {
			drawing.compileProgram();
		});
	}

	/* ************************************************** buffers & variables */

	// go and call createVariables on each of the drawings.
	// Should be done ONCE when canvas & avatar are created, or recreated.
	// NOT upon every repaint!!
	createVariablesOnDrawings() {
		this.drawings.forEach(drawing => {
			drawing.createVariables();
		});
	}

	// reload ALL the variables on this view
	// should be done once before every repaint
//	reloadAllVariables() {
//		this.drawings.forEach(drawing => {
//			drawing.setDrawing();
////			gl.useProgram(drawing.program);
////			gl.bindVertexArray(drawing.vao);
//			drawing.viewVariables.forEach(v => v.reloadVariable());
//		});
//	}

	/* ************************************************** Geometry and transformations */
	// Synch the gl viewport to the canvvas size.  call this every time the canvas resizes.
	// do we really need to do this!?!?
	//setGlViewport() {
	//	this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
	//}

	/* ************************************************** drawing */

	// this should be made pluggable at some point...
	drawBackground() {
		const gl = this.gl;

		// solid opaque black.  Erase for both 2d and 3d.
		// debugging ... gl.clearColor(.8, .6, .4, 1);
		gl.clearDepth(1);  // default anyway
		gl.clearColor(0, 0, 0, 1);
		//gl.clear(gl.COLOR_BUFFER_BIT);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}

	drawAllDrawings() {
		// not specific to any drawing; I guess it's kindof a drawing itself
		this.drawBackground();

		this.drawings.forEach(drawing => {
			drawing.setDrawing();
			drawing.viewVariables.forEach(v => v.reloadVariable());

			drawing.draw();
		});
	}

	/* ************************************************** dom interactivity */
	// maybe i should get rid of this
	domSetupForAllDrawings(canvas) {
		this.drawings.forEach(drawing => {
			if (drawing.domSetup)
				drawing.domSetup(canvas);
		});

	}
}
export default abstractViewDef;

