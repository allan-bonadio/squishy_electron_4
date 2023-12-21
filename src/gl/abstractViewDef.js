/*
** abstract View Def -- superclass for all the views, which live inside the WaveView
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

// should have one VAO per viewdef, or per drawing?
// per drawing seems to be the winner.
// But keep this so we can go back and forth.
let perDrawingVAO = true;   // false;


// Each abstractViewDef subclass is a definition of a kind of picture or view;
// one per each kind of view. Each drawing is a definition of a part of a view
// (usually drawn with 1 program).  A ViewDef has one or more drawings in it.  A
// WaveView hosts an instance of the ViewDef and is a React component enclosing
// the canvas.

/* ****************************************  */


// This is the superclass of all view defs; with common webgl and space plumbing.
// viewName is not the viewClassName, which is one of flatViewDef, garlandView, ...
// there should be ONE of these per canvas, so each WaveView should have 1.
export class abstractViewDef {

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

		this.perDrawingVAO = perDrawingVAO;

		if (!this.perDrawingVAO) {
			// vao for all drawings in this viewdef
			this.vao = this.gl.createVertexArray();
			this.tagObject(this.vao, `${this.constructor.name}-${avatar.label}-vao`);
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
			// skipDrawing really isn't important here cuz we're not drawing,
			// but a drawing's reloadVarable() methods might set it
			drawing.skipDrawing = false;
			drawing.createVariables();
		});
	}


	/* ************************************************** drawing */

	// this should be made pluggable at some point...
	drawBackground() {
		const gl = this.gl;

		// solid opaque black.  Erase for both 2d and 3d.
		// debugging ... gl.clearColor(.8, .6, .4, 1);
		gl.clearDepth(1);  // default anyway
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}

	drawAllDrawings() {
		// not specific to any drawing; I guess it's kindof a drawing itself
		this.drawBackground();

		this.drawings.forEach(drawing => {
			// individual uniforms (and others?) can abort drawing if they're like NaN etc
			drawing.skipDrawing = false;
			drawing.setDrawing();
			drawing.viewVariables.forEach(v => v.reloadVariable());

			if (!drawing.skipDrawing)
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

