/*
** Matrix Generator -- construct the matrix for 3d webgl displays
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import {mat4} from 'gl-matrix';
import {dump4x4} from '../gl/helpers3D.js';

const d2r = Math.PI / 180;

// how to use (give or take):
//	mg = new matrixGen(this.orient);
//	do other funcs in this class
//	paintingNeeds = { unifiedMatrix: mg.unifyMatrices() };

let traceOrientation= false;
let traceRotMatrix = false;
let traceProjMatrix = false;
let traceOffMatrix = false;



// the rule in this class is to always keep the intermediate matrix in this.matrix
// then, you can rearrange teh functions in unifyMatrices()
export class matrixGen {
	// orient has all the vars needed to construct the matrix
	constructor(orient, nPoints, canvasInnerWidth, canvasInnerHeight) {
		this.orient = orient;
		this.newMatrix();
		this.nPoints = nPoints;
		this.canvasInnerWidth = canvasInnerWidth;
		this.canvasInnerHeight = canvasInnerHeight;
		this.aspect = canvasInnerWidth / canvasInnerHeight;
	}

	// minimal matrix that'll work sortof
	newMatrix() {
		this.matrix = mat4.create();
	}

	// this perspective matrix just seemed to make a mess out of everything.
	// I took it out and suddenly stuff works.
	// recalculate the perspective matrix, given changed canvas
	// geometry/numbers. Must have canvasInnerWidth/Height from
	// updateInnerDims() already calculated. offsetMatrix() next
	// makes the offMatrix - the starting point for different
	// rotations.
	projectMatrix = () => {
		let matrix = this.matrix;

		// make the projection matrix.. never changes. Well, if you change
		// the FOV, you have to recalculate this.  Oh and if the window or the
		// vista height changes.  Or ... if ...
		//const aspect = this.canvasInnerWidth / this.canvasInnerHeight;

		// hfov = horizontal field of view; default for glMatrix is vertical
		const horizontalFieldOfView = d2r * this.orient.hfoView; // in radians

		// these need to be, REALLY, the closest stuff, and the farthest stuff.
		// Approximately.  Maps to the depth buffer.
		const zNear = 1;
		const zFar = this.nPoints;


		// multiply by aspect?	I would think it should divide by aspect?  TODO
		mat4.perspectiveNO(matrix, horizontalFieldOfView * aspect,
					aspect, zNear, zFar);
		if (traceProjMatrix) {
			dblog(`️🏔️ projection: aspect=${aspect} `
				+`	hFOV=${horizontalFieldOfView*180/3.14159} `
				+` zNear=${zNear}	zFar=${zFar}  `);
			dump4x4('vista projMatrix', matrix);
		}
	  if (!isFinite(matrix[0])) debugger;
	  this.matrix = this.projMatrix = matrix;
	}

	// so gregman says:
	// "It turns out WebGL takes the x,y,z,w value we assign to
	// gl_Position in our vertex shader and divides it by w
	// automatically."
	// So, w should get the real-space distance, and z should get the
	// clipspace number.  Ecept we don't want the clipspace z getting
	// divided by the distance z.

	regularMatrix = () => {

		let matrix = this.matrix;
		mat4.scale(matrix, matrix, [.3, .3, .3, .3, ]);
		this.matrix = matrix;
	}

	// set up offMatrix only when wave vista created, or reshaped
	// the original matrix that rotations get appended onto.
	// (most of the mat4 functions have the dest as the first argument.)
	offsetMatrix = () => {
		let matrix = mat4.clone(this.matrix);
		// const matrix = mat4.create();

		mat4.translate(matrix, matrix,
				[this.orient.xPos, this.orient.yPos, this.orient.zPos]);
		if (traceOrientation) {
			let o = this.orient;
			dblog(`️🏔️ offfsets xyz: ${o.xPos}	 ${o.yPos}	${o.zPos}  `);
		}

		if (traceOffMatrix)
			dump4x4('vista matrix after translate:', matrix);
		if (!isFinite(matrix[0])) debugger;
		this.matrix = matrix;
		//this.offMatrix =
	}

	// Take the matrix , and add on the rotations along z y x.
	// called when user rotates image to get a new matrix for the new rotation
	// uses this.orient.* for the angles to rotate, so make sure they're in place
	rotateMatrix = () => {
		let matrix = mat4.clone(this.matrix);

		mat4.rotateZ(matrix, matrix, d2r * this.orient.zAng);
		mat4.rotateY(matrix, matrix, d2r * this.orient.yAng);
		mat4.rotateX(matrix, matrix, d2r * this.orient.xAng);

		if (traceOrientation) {
			dblog(`️🏔️ rotating z y x rotation: z${this.orient.zAng}° y${this.orient.yAng}° `
				+` x${this.orient.xAng}°`);
			dump4x4('end of rotateMatrix()', matrix);
		}

		this.matrix = matrix;
		if (traceRotMatrix)
			dump4x4('vista after rotate:', matrix);
		if (!isFinite(matrix[0])) debugger;
	}

	fixForScreen() {
		mat4.scale(this.matrix, this.matrix,
			[1, this.aspect, 1, 1]);
	}

	// final assembly
	// Based on orient passed in
	// sets this.unifiedMatrix, and returns it
	unifyMatrices() {
		this.newMatrix();

		//this.fixForScreen();  // here?

		// one of these for starters
		this.regularMatrix();
		//this.projectMatrix();




		// these mostly work as advertised and as controlled by Orient3d
		// keep interchanging offsetMatrix() and rotateMatrix()
		this.rotateMatrix();
		this.offsetMatrix();

		this.fixForScreen();  // here?


		this.unifiedMatrix = this.matrix;
		if (!isFinite(this.matrix[0])) debugger;
		return this.unifiedMatrix;
	}

}


export default matrixGen;

/* ***************************************************** just screwing around */

dblog(`just screwing around`);
let aa = [3,4,5,6];
let bb = [13,14,15,16];
let cc = [23,24,25,26];
let matrix;

matrix = mat4.create();
mat4.frustum(matrix, -5, 5, -3, 3, 1, 10);
dump4x4('frustum:', matrix);

matrix = mat4.create();
let eye=[0, 0, 6];
let center=[0, 0, 0];
let up = [0, 10, 0];
mat4.lookAt(matrix, eye, center, up);
dump4x4('lookAt:', matrix);

