/*
** math 3 dimensions -- 3d playground for Squish
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import {mat4} from 'gl-matrix';

import abstractScene from './abstractScene.js';
import garlandDrawing from './garlandDrawing.js';
import wGarlandDrawing from './wGarlandDrawing.js';
import eAvatar from '../engine/eAvatar.js';

const _ = (n) => (n.toFixed(4).padStart(9, ' '));

export function dump4x4(matrix, title) {
	dblog(`dump of matrix: `+ title);
	dblog(_(matrix[0]) + _(matrix[1]) + _(matrix[2]) + _(matrix[3]) );
	dblog(_(matrix[4]) + _(matrix[5]) + _(matrix[6]) + _(matrix[7]) );
	dblog(_(matrix[8]) + _(matrix[9]) + _(matrix[10]) + _(matrix[11]) );
	dblog(_(matrix[12]) + _(matrix[13]) + _(matrix[14]) + _(matrix[15]) );
}






		//  Create a perspective matrix, a special matrix
		// that is used to simulate the distortion of perspective in a camera.
		// our field of view is 45 degre4s, with a width/height ratio
		// that matches the display size of the canvas.
		// also, we only what to see objects between 0.1 units
		// and 100 units away from the camera.

//		const fieldOfView = (45 * Math.PI) / 180; // in radians
//		const aspect = 700 / 500;
//		const zNear = 0.1;
//		const zFar = 100.0;
//		const projectionMatrix = mat4.create();
//
//		//   note: glmatrix.js always has the first argument as the destination to recieve result.
//		mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
//



		//dblog(`math 3d`)




		// set drawing position to 'identity' point, the center of the scene
		//const modelViewMatrix = mat4.create();

		//   Move the drawing position a bit to where I want to start the square
//let cubeRotation=1;
//
//		mat4.translate(
//			modelViewMatrix, // destination matrix
//			modelViewMatrix, // matrix to translate
//			[-0.0, 0.0, -6.0]
//		); // amout to translate
//
//		mat4.rotate(
//			modelViewMatrix, //destination matrix
//			modelViewMatrix, //matrix to rotate
//			cubeRotation, //amount to rotate in radians
//			[0, 0, 1]
//		); //axis to rotate around (z)
//
//		mat4.rotate(
//			modelViewMatrix, //destination matrix
//			modelViewMatrix, //matrix to rotate
//			cubeRotation * 0.7, //amount to rotate in radians
//			[0, 1, 0]
//		); //axis to rotate around (x)








//
//  const vsSource = `
//    attribute vec4 aVertexPosition;
//    attribute vec4 aVertexColor;
//
//    uniform mat4 uModelViewMatrix;
//    uniform mat4 uProjectionMatrix;
//
//    varying lowp vec4 vColor;
//
//void main(void) {
//  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
//  vColor = aVertexColor;
//}
//`;
//
//
//
//
//
//
//
//  const fsSource = `
//  varying lowp vec4 vColor;
//
//   void main(void) {
//     gl_FragColor = vColor;
//   }
//`;


//   const programInfo = {
//     program: shaderProgram,
//     attribLocations: {
//       vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
//       vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor")
//     },
//     uniformLocations: {
//       projectionMatrix: gl.getUniformLocation(
//         shaderProgram,
//         "uProjectionMatrix"
//       ),
//       modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")
//     }
//   };





