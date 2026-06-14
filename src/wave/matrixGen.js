/*
** Matrix Generator -- construct the matrix for 3d webgl displays
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import {mat4} from 'gl-matrix';

const d2r = Math.PI / 180;

// how to use (give or take):
//	mg = new matrixGen(this.orient);
//	do other funcs in this class
//	paintingNeeds = { unifiedMatrix: mg.unifyMatrices() };

let traceOrientation= false;
let traceRotMatrix = true;
let traceProjMatrix = false;
let traceOffMatrix = true;


// the rule in this class is to always keep the intermediate matrix in this.matrix.
// then, you can rearrange teh functions in unifyMatrices()
export class matrixGen {
	// orient has all the vars needed to construct the matrix
	constructor(orient) {
		this.orient = orient;
		this.newMatrix();
	}

	// start over
	newMatrix() {
		this.matrix = mat4.create();
	}

	// recalculate the perspective matrix, given changed canvas
	// geometry/numbers. Must have canvasInnerWidth/Height from
	// updateInnerDims() already calculated. offsetMatrix() next
	// makes the offMatrix - the starting point for different
	// rotations. Must be done before first repaint.
	projectMatrix = () => {
		let matrix = this.matrix;

		// make the projection matrix.. never changes. Well, if you change
		// the FOV, you have to recalculate this.  Oh and if the window or the
		// vista height changes.  Or ... if ...
		const aspect = this.canvasInnerWidth / this.canvasInnerHeight;

		// hfov = horizontal field of view; default for glMatrix is vertical
		const horizontalFieldOfView = d2r * this.orient.hfoView; // in radians

		// these need to be, REALLY, the closest stuff, and the farthest stuff.
		// Approximately.  Maps to the depth buffer.
		const zNear = 1;
		const zFar = this.space.nPoints;


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

	regularMatrix = () => {
		// start with identity matrix at 30% size
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

		// probably call rotateMatrix() after this
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

		//this.rotatedMatrix =
		this.matrix = matrix;
		if (traceRotMatrix)
			dump4x4('vista after rotate:', matrix);
		if (!isFinite(matrix[0])) debugger;
		//return matrix;
	}

	// this theoretically builds THE matrix I use to txform vertices.
	// Based on orient passed in
	// sets this.unifiedMatrix, and returns it
	unifyMatrices() {
		this.newMatrix();

		// one of these for starters
		this.regularMatrix();
		//this.projectMatrix();

		// these mostly work as advertised and as controlled by Orient3d
		this.rotateMatrix();
		this.offsetMatrix();
		this.unifiedMatrix = this.matrix;

		  if (!isFinite(this.matrix[0])) debugger;
		return this.unifiedMatrix;
	}

}


export default matrixGen;
