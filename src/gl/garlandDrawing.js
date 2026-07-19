/*
** garlandDrawing -- main scene for 3d quantum in endless space
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import abstractDrawing from './abstractDrawing.js';
import {drawingUniform, drawingAttribute} from './drawingVariable.js';
import cx2rygb from './cx2rygb/cx2rygb.glsl.js';
import qeFuncs from '../engine/qeFuncs.js';
import qeConsts from '../engine/qeConsts.js';
import {dump4x4} from './helpers3D.js';
import {vec4, mat4} from 'gl-matrix';


let traceAvatarAfterDrawing = false;
let traceSimulateGL = false;
let traceDrawing = false;
let traceReloadRow = false;
let traceMatrix = true;
let traceUColor = false;

// diagnostic purposes; draws more per vertex
let traceDontDrawTriangles=	 false;
let traceDrawPoints = false;
let traceDrawLines = false;

/* *********************************************** garland drawing */
// The glsl sources for webgl drawing

/*
 data format of attributes:	 four column table of floats
 𝜓.re	𝜓.im  (unused)	  serial.
 uses gl_VertexID	NO! that's opengl 2 only
 use serial to figure out whether it's innie or outie:to figure
out whether the radius should be full or less
*/

/* Draws blades - quadrilatterals in a spiral pattern. Each blade has a
quadrilatteral on each side, each is two triangles.  Hopefully there's a little
bit of thickness in the middle.  Colored by vertex just like the flat drawing.

The data and avatar loading is similar to with flat drawing - real and imag
parts of wave become the y (vertical) and z (forward) coordinates of the
garland point. (We then have to duplicate it all, rearranged?, to paint the
other side of each blade.  someday.)

The Volume coordinates are what look like 3d coords in the view.  The unit is 1
cell in the x direction, and OUTER_FACTOR times psi in the real and imag
directions; hopefully those numbers are about 0.5 thru 5 or so.  The camera is
located at the origin?.
The points in the outer edge of the spiral follow this:
x = ix
y = OUTER_FACTOR * N * 𝜓_real
z = OUTER_FACTOR * N * 𝜓_imag

Use INNER_FACTOR for the inner edge of the spiral, or zero.  So (first try) each
blade is two triangles */

// how much raw psi values should be multipled to be equivalent to x in volume
// space values that go from 0 to N.  Adjust to taste or to N. These are
// inserted as numbers into the vert shader code.
const OUTER_FACTOR = '5.0';
const INNER_FACTOR = '1.';

// make the line number for the start correspond to this JS file line number - the NEXT line
const vertexShaderSrc = `// garlandDrawing vertex
${cx2rygb}
#line 69
// this does all the transformation we need.  precalculated for each repaint.
uniform mat4 matrix;
uniform ivec4 mode;

//uniform float fudge;  // kindof like the zoom factor
uniform float nStates;	 // N

// the V shader calculates the color to use, and sets this so the frag
// shader can get the varying.
uniform highp vec4 uColor;
varying highp vec4 vColor;

// the one list of numbers input
attribute vec4 row;

void main() {
	int vertexSerial = int(row.w);

	int ix = int(vertexSerial) / 2;
	float factor;
	if ((ix * 2) < vertexSerial)
		factor = (mode[0] > 0) ? ${OUTER_FACTOR} : ${INNER_FACTOR};
	else
		factor = (mode[1] > 0) ? ${OUTER_FACTOR} : ${INNER_FACTOR};

	//bool odd = (ix * 2) < vertexSerial;
	//float factor = odd ? ${INNER_FACTOR} : ${OUTER_FACTOR};

	// so the actual z coord goes to divide x and y, below..
	// But, glPosition wants it remapped to 0...1
	vec4 point;
	point.yz = row.xy * factor;
	//point.yz = row.xy * factor * nStates;
	point.x = (float(ix) - nStates/2.) * .05;

	vec4 pointM = point * matrix;
	float zPers = 2.0 + pointM.z;  // for perspective

	// z for depth buffer -  remap to 0...1
	// (z - near) / (far - near)
	float zDepth = (pointM.z - nStates / 2.) / nStates;

	gl_Position.xy = pointM.xy / zPers;
	gl_Position.z = zDepth;
	gl_Position.w = 1.;

	//	for the wave color, convert the complex values via this algorithm
	// or use the uColor constant color handed in
	if (uColor.r < 0.0) {
		vColor.rgb = cx2rygb(row.xy);
		vColor.a = 1.;	// uColor.a	 TODO
	}
	else {
		vColor = uColor;
	}

	// dot size, in pixels not clip units. actually a fuzzy square.
	gl_PointSize = 10.;
}
`;

const fragmentShaderSrc = `// garlandDrawing frag
#line 132
precision highp float;
varying highp vec4 vColor;

void main() {
	gl_FragColor = vColor;
}
`;

// the original display that's worth watching: garland
export class garlandDrawing extends abstractDrawing {
	constructor(scene) {
		super(scene, 'garlandDrawing');

		// this says what to draw each time.
		// mode[0] = true to draw inside (odd ix) strip border on large side
		// mode[1] = true to draw outside (even ix) strip border on large side
		this.mode = new Int32Array(4);

		this.uColor = [0,0,0,0];

		// each point in the wave results in two vertices, inner and outer.
		// And each of those is four single floats going to the GPU
		this.nPoints = this.space.nPoints;
		this.avatar = scene.avatar;
		this.avatar.attachViewBuffer(this.scene.garlandAvatarID, null, 4, this.nPoints * 2, 'garland drawing');

		this.vertexShaderSrc = vertexShaderSrc;
		this.fragmentShaderSrc = fragmentShaderSrc;
	}

	// loads view buffer from corresponding wave, calculates highest norm.
	// one time set up of variables for this drawing, every time canvas and scene is recreated
	createVariables() {
		this.gl.useProgram(this.program);
		if (traceDrawing)
			dblog(`🌀🌀🌀 garlandDrawing ${this.sceneName}: creatingVariables`);


		this.modeUniform = new drawingUniform('mode', this,
			() => {
				return {value: this.mode, type: '4iv'};
			}
		);
		this.matrixUniform = new drawingUniform('matrix', this,
			() => {
				let matrix = this.scene.paintingNeeds.unifiedMatrix;
				if (!matrix)
					matrix = mat4.create();  // starting up only
				if (!isFinite(matrix[0])) debugger;

				if (traceMatrix) {
					dump4x4('🌀🌀🌀 garlandDrawing reloading', matrix);
				}
				return {value: matrix, type: 'Matrix4fv'};
			}
		);

		this.uColorUniform = new drawingUniform('uColor', this,
			() => {
				if (traceUColor) {
					dblog('🌀🌀🌀 garlandDrawing uColor', this.uColor);
				}
				return {value: this.uColor, type: '4f'};
			}
		);

		//this.fudgeUniform = new drawingUniform('fudge', this,
		//	() => ({value: this.scene.paintingNeeds.fudge, type: '1f'}));

		let nStates = this.space.nStates;
		this.NUniform = new drawingUniform('nStates', this,
			() => ({value: nStates, type: '1f'}));

		this.vertexCount = nStates * 2;	 // nStates * vertsPerState
		this.rowFloats = 4;
		this.rowAttr = new drawingAttribute('row', this, this.rowFloats,
			() => {
			//debugger;
			// retrieve GL rows from the cavity, including the bounds
			qeFuncs.avatar_avFlatLoader(this.avatar._pointer_, 0,
					this.scene.paintingNeeds.cavity._pointer_, this.nPoints);

			if (traceReloadRow) {
				dblog(`🌀🌀🌀 garlandDrawing  ${this.avatarLabel}: `
					+` at row getViewBuffer() `
					+` loading to ${this.avatar.label} `
					+`	this.vertexCount=${this.vertexCount} `
					+` total floats=${this.vertexCount * this.rowFloats} `
					+` double0=${this.avatar.double0}`);
			}

			return this.avatar.getViewBuffer(this.scene.garlandAvatarID);
		});

	}

	/* **************************************** repeat drawing 1 */
	// multi-draw: really I need to redraw with the same input variables, several times
	// 2x front and back of blade?
	// 1x ladder rung separators between blades in garland
	// 2x ladder sides on panels

	// ok so have operations:
	// bool even is outer, else inner
	// bool outside is outer, else inner
	// byte drawarrays opcode — draw triangles, line strips, etc
	// 		no, that's JS-side.  don't put that in the uniform.
	// color scheme: cx, all one color..  uColor does this already


	/* **************************************** repeat drawing 2 */

	// take advantage of the fact that the same data works for all the decorations we use.
	drawOnce(gl, verb, first, count, inner, outer, color) {
		this.uColor = color;
		this.uColorUniform.reloadVariable();

		this.mode[0] = inner;
		this.mode[1] = outer;
		this.modeUniform.reloadVariable();

		gl.drawArrays(verb, first, count);


		// dblog(`🌀🌀🌀just drewArrays-garland on avatar `
		// 	+` ptr=${this.avatar._pointer_} `
		// 	+` this.avatar.label=${this.avatar.label}, `
		// 	+` buffer label= `
		// 	+` ${this.avatar.bufferNames[this.scene.garlandAvatarID]}`);
	}

	// draw all the Onces for the whole drawing
	drawWhole(first, count) {
		const gl = this.gl;

		// the color strip
		this.drawOnce(gl, gl.TRIANGLE_STRIP, first, count, 0, 1, [-1, 0, 0, 1]);  // rainbow from cx

		// rungs of the ladder
		//this.drawOnce(gl, gl.LINES, first, count, 0, 1, [0.7, 0.7, 0.7, 1]);

		// side edges of the ladder
		// this.drawOnce(gl, gl.LINE_STRIP, first, count, 0, 0, [0.7, 0.7, 0.7, 1]);
		// this.drawOnce(gl, gl.LINE_STRIP, first, count, 1, 1, [0.7, 0.7, 0.7, 1]);


		if (traceDrawLines) {
			// this.uColor = [0.9, 0.9, 0.9, 1];
			// this.uColorUniform.reloadVariable();
			// gl.drawArrays(gl.LINES, first, count);
			this.drawOnce(gl, gl.LINE_STRIP, first, count, 0, 1, [1, .5, 1, 1]);
			//gl.drawArrays(gl.LINE_STRIP, first, count);
		}
	}

	// called for each image frame on th canvas.
	draw(width, height, paintingNeeds) {
		const gl = this.gl;
		if (traceDrawing) {
			dblog(`🌀🌀🌀 garland Drawing  ${this.avatarLabel}: `
				+` width=${width}, height=${height}	 drawing ${this.vertexCount/2} points `
				+` matrix=${paintingNeeds.unifiedMatrix}`);
		}
		gl.lineWidth(1);  // it's the only option anyway

		let startEnd2 = this.space.startEnd2;
		let first = startEnd2.start2;
		let count = startEnd2.end2 - startEnd2.start2;

		if (!paintingNeeds.unifiedMatrix)
			paintingNeeds.unifiedMatrix = mat4.create();  // too soon after startup
		if (!isFinite(paintingNeeds.unifiedMatrix[0])) debugger;

		this.drawWhole(first, count);

		//this.drawVariables.forEach(v => v.reloadVariable());
		//this.theAttribute.reloadVariable();

		//this.drawVariables.forEach(v => v.reloadVariable());


		if (traceDrawPoints)
			gl.drawArrays(gl.POINTS, first, count);

		// i think this is problematic
		if (traceAvatarAfterDrawing) {
			let mat = this.matrixUniform.reloadFunc().value;
			this.avatar.dumpComplexViewBuffer(this.scene.garlandAvatarID,
				this.nPoints,
				`🌀🌀🌀 finished drawing in garlandDrawing.js; drew buf:`);
			dump4x4(`🌀🌀🌀	 AvatarAfterDrawing `, mat);
		}
		if (traceSimulateGL) {
			this.simulateGL();
			let mat = this.matrixUniform.reloadFunc().value;
			dump4x4(`🌀🌀🌀	 matrixUni after draw=`, mat);
		}
	}

	/* ****************************** simulate GL for testing */
	simulateRowIteration() {

	}

	// simulate and calculate what WebGL would calculate, and dump that.
	// give or take fidelity of the below.
	simulateGL() {
	console.error(`maybe garland simulateGL() not working now`)
		let startEnd2 = this.space.startEnd2;
		let first = startEnd2.start2;
		let count = startEnd2.end2 - startEnd2.start2;
		let nStates = this.space.nStates;
		// indexed by float, not by row like gl uses it
		let rows4 = this.avatar.getViewBuffer(this.scene.garlandAvatarID);
		let gl_Position = vec4.create();
		if (!isFinite(this.scene.paintingNeeds.unifiedMatrix[0])) debugger;
		let row = vec4.create();
		const _ = c => (gl_Position[c]).toFixed(8).padStart(11);

		'';	 // collect these otherwise the console merges dup lines
		let text = ` 🌀🌀 what the GPU calculates,	the `
			+`${count} vertices\n`;

		for (let i = 0; i < count; i++) {
			// the body of this loop should replicate the vector
			// shader above, like GL calls this function for each row
			// of the attr
			let vertexSerial = first + i;
			let rs = vertexSerial * 4;
			let row = vec4.fromValues(rows4[rs], rows4[rs+1],
				rows4[rs+2], rows4[rs+3]);
			const __ = c => (row[c]).toFixed(8).padStart(11);
			text += ` 🌀 `
				+` ${__(0)} +i	${__(1)}   `;

			let ix = Math.floor(vertexSerial / 2);
			let outside = (ix * 2) < vertexSerial;
			let point = vec4.create();
			let factor = outside ? INNER_FACTOR : OUTER_FACTOR;

			point[1] = row[0] * factor;  // real => y coord
			point[2] = row[1] * factor;  // imag => z coord
			point[0] = ix;
			point[3] = 1;

			// point * matrix;
			let pointM = vec4.create();
			vec4.transformMat4(pointM, point,
				this.scene.paintingNeeds.unifiedMatrix);
			let zPers = 1.0 + pointM[2];  // for perspective

			// (z - near) / (far - near)
			let zDepth = (pointM[2] - nStates / 2.) / nStates;  // for depth 0...1

			//let gl_Position = vec4.create();
			//gl_Position = pointM / zPers;
			let gl_Position = vec4.fromValues(point[0]/zPers, point[1]/zPers,
					zDepth, 1);

			text += ` [${String(ix).padStart(3)}] `
				+` ${_(0)}	 ${_(1)}   ${_(2)}	 ${_(3)}  \n`;
		}
		dblog(text + `	🌀🌀 `);
	}

}
// dump4x4('🌀🌀🌀 GL simulation matrix',
// 		this.scene.paintingNeeds.unifiedMatrix);

export default garlandDrawing;

