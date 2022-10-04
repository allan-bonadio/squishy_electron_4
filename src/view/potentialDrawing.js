/*
** potential drawing -- a drawing for the potential function for a 1d quantum wave
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import {abstractDrawing} from './abstractDrawing';
import qe from '../engine/qe';
import {viewUniform, viewAttribute} from './viewVariable';
//import SquishPanel from '../SquishPanel';
//import {eSpaceCreatedPromise} from '../engine/eEngine';

this is obsolete
!@#$%^&*()

/* ******************************************************* unit height management */

/*
** data format of attributes:  four column table of floats
** 𝜓.re  𝜓.im   potential    ...0?...
** uses gl_VertexID to figure out whether the y should be re^2+im^2  NO! opengl 2 only
** or zero
*/

let alsoDrawPoints = true;
let alsoDrawLines = false;
let traceGLSLCalc = true;
//alsoDrawLines =0;

let ps = alsoDrawPoints ? `gl_PointSize = 16.;` : '';

// make the line number for the start a multiple of 10
const vertexSrc = `
#line 122
attribute vec4 row;
uniform float barWidth;
uniform float unitHeight;

void main() {
	// figure out y
	float y = row.z * unitHeight;
	float hThickness = unitHeight * .03;
	int vertexSerial = int(row.w);
	if (vertexSerial / 2 * 2 < vertexSerial) {
		y += hThickness; // odd
	}
	else {
		y -= hThickness;  // even
	}

	// scale to -1...+1
	y = 2. * y - 1.;

	// figure out x, basically the point index
	float x;
	x = float(int(vertexSerial) / 2) * barWidth * 2. - 1.;

	// and here we are
	gl_Position = vec4(x, y, 0., 1.);

	// dot size, in pixels not clip units.  actually a square.
	${ps}
}
`;

const fragmentSrc = `
precision highp float;

void main() {
	gl_FragColor = vec4(1., 1., 1., .7);
}
`;


// the white line
export class potentialDrawing extends abstractDrawing {

	setShaders() {
		this.vertexShaderSrc = vertexSrc;
		this.fragmentShaderSrc = fragmentSrc;
		this.compileProgram();
		this.gl.useProgram(this.program);
	}


	setInputs() {
		let barWidthUniform = this.barWidthUniform = new viewUniform('barWidth', this);
		let nPoints = this.nPoints = this.space.nPoints;
		let barWidth = 1 / (nPoints - 1);
		barWidthUniform.setValue(barWidth, '1f');

		// note unit height for potential is different from unit potential for wave!
		let unitHeightUniform = this.unitHeightUniform = new viewUniform('unitHeight', this);
		this.unitHeight = .0125;
		unitHeightUniform.setValue(this.unitHeight, '1f');

		// this shares the view buf with wave, [re, im, potential, serial]
		// do we have to do this twice?!?!
		this.rowAttr = new viewAttribute('row', this);
		this.vertexCount = nPoints * 2;  // nPoints * vertsPerBar
		this.rowFloats = 4;
		this.rowAttr.attachArray(qe.space.mainVBuffer, this.rowFloats);




		if (traceGLSLCalc) {
			// try to recreate what the vertex shader does
			let vBuffer = qe.space.mainVBuffer;
			let ix;
			for (ix = 0; ix < nPoints*2; ix++) {

				let y = vBuffer[ix * 4 + 2] * this.unitHeight;
				let hThickness = this.unitHeight * .03;
				let vertexSerial = ix;
				if (Math.floor(vertexSerial / 2) * 2 < vertexSerial) {
					y += hThickness; // odd
				}
				else {
					y -= hThickness;  // even
				}

				// scale to -1...+1
				y = 2. * y - 1.;

				// figure out x, basically the point index
// 				let x;
// 				x = Math.floor(vertexSerial / 2) * barWidth * 2. - 1.;

// 				console.log(`row [${ix.toFixed(4) }]: ${x}  ${y.toFixed(4) } from `,
// 					vBuffer[ix * 4 + 0].toFixed(4) ,
// 					vBuffer[ix * 4 + 1].toFixed(4) ,
// 					vBuffer[ix * 4 + 2].toFixed(4) ,
// 					vBuffer[ix * 4 + 3].toFixed(4) ,
// 				);
			}
		}



	}


	draw() {
		const gl = this.gl;

		gl.useProgram(this.program);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexCount);

		if (alsoDrawLines) {
			gl.lineWidth(1);  // it's the only option anyway

			gl.drawArrays(gl.LINES, 0, this.vertexCount);
			//gl.drawArrays(gl.LINE_STRIP, 0, this.vertexCount);
		}

		if (alsoDrawPoints)
			gl.drawArrays(gl.POINTS, 0, this.vertexCount);
	}

	/* ************************************************************************  interactive */

	mouseCoords(ev) {
//		console.log(`mouse: `, ev.clientX, ev.clientY, ev.buttons.toString(16));
	}

	mouseDown(ev) {
		console.log(`mouseDown: from the canvas to the top:`)
// 		for (let here = ev.target; here; here = here.parentNode) {
// 			console.log(` ¬ element <${here.localName} id=${here.id} class=${here.className}`,
// 				here.offsetLeft, here.offsetTop, '>');}
	}

	mouseMove(ev) {
		this.mouseCoords(ev);
	}

	mouseUp(ev) {

	}

	mouseEnter(ev) {

	}

	mouseLeave(ev) {

	}

	domSetup(canvas) {
		// we dont use react event handlers here - this has nothing to do with React.
		canvas.addEventListener('mousedown', ev => this.mouseDown(ev), false);
		window.addEventListener('mousemove', ev => this.mouseMove(ev), false);
		window.addEventListener('mouseup', ev => this.mouseUp(ev), false);
		window.addEventListener('mouseEnter', ev => this.mouseEnter(ev), false);
		window.addEventListener('mouseLeave', ev => this.mouseLeave(ev), false);

	}
}

export default potentialDrawing;

