/*
** garlandDrawing -- main scene for 3d quantum in endless space
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import {mat4} from 'gl-matrix';

import abstractDrawing from './abstractDrawing.js';
import {drawingUniform, drawingAttribute} from './drawingVariable.js';
import cx2rygb from './cx2rygb/cx2rygb.glsl.js';
import qeFuncs from '../engine/qeFuncs.js';
import qeConsts from '../engine/qeConsts.js';
import {dump4x4} from './math3d.js';


let traceAvatarAfterDrawing = true;
let traceDrawing = true;
let traceViewport = true;
let traceReloadRow = true;
let traceMatrix = true;

// diagnostic purposes; draws more per vertex
let traceDrawPoints = true;
let traceDrawLines = true;

let pointSize = traceDrawPoints ? `gl_PointSize = 10.;` : '';

/* ******************************************************* garland drawing */
// The glsl sources for webgl drawing

/*
 data format of attributes:  four column table of floats
 𝜓.re  𝜓.im  (unused)   serial.
 uses gl_VertexID   NO! that's opengl 2 only
 use serial to figure out whether it's innie or outie:to figure
out whether the radius should be full or less
*/

/* Draws blades - quadrilatterals in a spiral pattern.  Each blade has a
/quadrilatteral on each side, each is two triangles.  Hopefully there's a little
/bit of thickness in the middle.  Colored by vertex just like the flat drawing.

The data and avatar loading is similar to with flat drawing - real and imag
parts of wave become the y (vertical) and z (backward) coordinates of the
garland point.  We then have to duplicate it all, rearranged?, to paint the
other side of each blade.

The Volume coordinates are what look like 3d coords in the view.  The unit is 1
cell in the x direction, and OUTER_FACTOR times psi in the real and imag
directions; hopefully those numbers are about 0.5 thru 5 or so.  The camera is
located at the origin?.
The points in the outer edge of the spiral follow this:
x = ix
y = OUTER_FACTOR * 𝜓_real
z = OUTER_FACTOR * 𝜓_imag
These are done in the GLSL code.

Use INNER_FACTOR for the inner edge of the spiral, or zero.  So (frst try) each
blade is two triangles */

// how much raw psi values should be multipled to be equivalent to x in volume
// space values that go from 0 to N.  Adjust to taste or to N.  These are
// inserted as numbers into the vert shader code.
const OUTER_FACTOR = '100.';
const INNER_FACTOR = '50.';

// make the line number for the start correspond to this JS file line number - the NEXT line
const vertexSrc = `// garlandDrawing vertex
${cx2rygb}
#line 68
// this does all the transformation we need.  precalculated for each repaint.
uniform mat4 matrix;

// the V shader calculates the color to use, and sets this so the frag shader can get it.
varying highp vec4 vColor;

// the one list of numbers input
attribute vec4 row;

void main() {
	int vertexSerial = int(row.w);  // use gl_VertexID & 1 with webgl2
	int ix = int(vertexSerial) / 2;
	bool odd = ix * 2 < vertexSerial;

	vec4 point;
	point.yz = row.xy;
	point *= odd ? ${INNER_FACTOR} : ${OUTER_FACTOR};
	point.x = float(ix);
	point.w = 1.;

	gl_Position = point * matrix;

	//  for the color, convert the complex values via this algorithm
	vColor.rgb = cx2rygb(row.xy);
	vColor.a = 1.;

	// make the colors darker toward zero (top)
//	if (!odd)
//		vColor = vec4(vColor.r/2., vColor.g/2., vColor.b/2., vColor.a);

	// dot size, in pixels not clip units.  actually a fuzzy square.
	gl_PointSize = 10.;
}
`;

const fragmentSrc = `// garlandDrawing frag
#line 105
precision highp float;
varying highp vec4 vColor;

void main() {
	gl_FragColor = vColor;
}
`;

// the original display that's worth watching: garland upside down hump graph
export class garlandDrawing extends abstractDrawing {
	constructor(scene) {
		super(scene, 'garlandDrawing');

		// each point in the wave results in two vertices, top and wave.
		// And each of those is four single floats going to the GPU
		this.avatar = scene.avatar;
		this.avatar.attachViewBuffer(0, null, 4, this.space.nPoints * 2, 'garland drawing');

		this.vertexShaderSrc = vertexSrc;
		this.fragmentShaderSrc = fragmentSrc;

		//console.log(`attachViewBuffer on scene ${scene.sceneName}`);
	}

	// loads view buffer from corresponding wave, calculates highest norm.
	// one time set up of variables for this drawing, every time canvas and scene is recreated
	createVariables() {
		this.setDrawing();
		if (traceDrawing)
			console.log(`🌀🌀🌀 garlandDrawing ${this.sceneName}: creatingVariables`);

		this.matrixUniform = new drawingUniform('matrix', this,
			() => {
				this.matrix = mat4.create();
				mat4.rotate(this.matrix, this.scene.origMatrix, 0, [0, 1, 0]);

				if (traceMatrix) {
					console.log(`🌀🌀🌀 garlandDrawing reloading matrix:  `,
						this.matrix);
					dump4x4(this.matrix, 'matrix as sent to GL');
				}
				return {value: this.matrix, type: 'Matrix4fv'};
			}
		);

		let nPoints = this.nPoints = this.space.nPoints;
		this.vertexCount = nPoints * 2;  // nPoints * vertsPerBar
		this.rowFloats = 4;
		this.rowAttr = new drawingAttribute('row', this, this.rowFloats, () => {
			//debugger;
			qeFuncs.avatar_avFlatLoader(this.avatar.pointer, 0, this.scene.inputInfo[0].pointer,
					nPoints);

			if (traceReloadRow) {
				console.log(`🌀🌀🌀 garlandDrawing  ${this.avatarLabel}: at row getViewBuffer() `
					+` loading to ${this.avatar.label}   this.vertexCount=${this.vertexCount} `
					+` total floats=${this.vertexCount * this.rowFloats}  double0=this.avatar.double0`);
			}

			return this.avatar.getViewBuffer(0);
		});

	}

	// called for each image frame on th canvas.  TODO: roll specialInfo into the input Data Arrays
	draw(width, height, inputInfo) {
		if (traceDrawing) {
			console.log(`🌀🌀🌀 garland Drawing  ${this.avatarLabel}: `
				+` width=${width}, height=${height}  drawing ${this.vertexCount/2} points `
				+` matrix=${this.matrix}`);
		}
		const gl = this.gl;
		this.setDrawing();

		//let bw = inputInfo[1];
		//gl.viewport(bw, 0, width - 2 * bw, height);
		//if (traceViewport) {
		//    console.log(`🌀🌀🌀 garlandDrawing set viewport on avatar=${this.avatarLabel}: `
		//        +` width-2bw=${width - 2 * bw}, height=${height}  `
		//        +` drawing ${this.vertexCount/2} points`);
		//}
		this.drawVariables.forEach(v => v.reloadVariable());
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexCount);
		if (traceDrawing) {
			console.log(`🌀🌀🌀just drewArays-garland on avatar ptr=${this.avatar.pointer} `
				+` this.avatar.label=${this.avatar.label}, `
				+` buffer label=${this.avatar.bufferNames[0]}`);
		}

		if (traceDrawLines) {
			gl.lineWidth(1);  // it's the only option anyway
			gl.drawArrays(gl.GL_LINE_STRIP, 0, this.vertexCount);
		}

		if (traceDrawPoints)
			gl.drawArrays(gl.POINTS, 0, this.vertexCount);

		// i think this is problematic
		if (traceAvatarAfterDrawing) {
			this.avatar.dumpComplexViewBuffer(0, this.nPoints,
				`🌀🌀🌀 finished drawing in garlandDrawing.js; drew buf:`);
			console.log(`🌀🌀🌀  matrixUniform=`, this.matrixUniform.reloadFunc());
		}
	}
}

export default garlandDrawing;

