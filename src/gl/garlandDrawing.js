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
let traceGLAfterDrawing = false;
let traceDrawing = false;
let traceReloadRow = false;
let traceMatrix = false;

// diagnostic purposes; draws more per vertex
let traceDrawPoints = true;
let traceDrawLines = false;

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
quadrilatteral on each side, each is two triangles.  Hopefully there's a little
bit of thickness in the middle.  Colored by vertex just like the flat drawing.

The data and avatar loading is similar to with flat drawing - real and imag
parts of wave become the y (vertical) and z (forward) coordinates of the
garland point.  (We then have to duplicate it all, rearranged?, to paint the
other side of each blade.  someday.)

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
const OUTER_FACTOR = '1.0';
const INNER_FACTOR = '.5';

// make the line number for the start correspond to this JS file line number - the NEXT line
const vertexSrc = `// garlandDrawing vertex
${cx2rygb}
#line 70
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

	point *= matrix;
	float d = point.z + 2.;
	gl_Position = vec4(point.x / d, point.y / d, d, 1);
	//gl_Position = point / (point.z + 2.);

	//  for the color, convert the complex values via this algorithm
	vColor.rgb = cx2rygb(row.xy);
	vColor.a = 1.;

	// dot size, in pixels not clip units.  actually a fuzzy square.
	gl_PointSize = 10.;
}
`;

const fragmentSrc = `// garlandDrawing frag
#line 106
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

		//dblog(`attachViewBuffer on scene ${scene.sceneName}`);
	}

	// loads view buffer from corresponding wave, calculates highest norm.
	// one time set up of variables for this drawing, every time canvas and scene is recreated
	createVariables() {
		this.setDrawing();
		if (traceDrawing)
			dblog(`🌀🌀🌀 garlandDrawing ${this.sceneName}: creatingVariables`);

		this.matrixUniform = new drawingUniform('matrix', this,
			() => {
				let matrix = this.scene.paintingNeeds.rotMatrix;

				if (traceMatrix) {
					dump4x4(matrix, '🌀🌀🌀 garlandDrawing reloading');
				}
				return {value: matrix, type: 'Matrix4fv'};
			}
		);

		let nPoints = this.nPoints = this.space.nPoints;
		let nStates = this.nStates = this.space.nStates;
		this.vertexCount = nStates * 2;  // nStates * vertsPerState
		this.rowFloats = 4;
		this.rowAttr = new drawingAttribute('row', this, this.rowFloats, () => {
		    //debugger;
			// retrieve GL rows from the cavity, including the bounds
			qeFuncs.avatar_avFlatLoader(this.avatar.pointer, 0,
			        this.scene.paintingNeeds.cavity.pointer, nPoints);

			if (traceReloadRow) {
				dblog(`🌀🌀🌀 garlandDrawing  ${this.avatarLabel}: at row getViewBuffer() `
					+` loading to ${this.avatar.label}   this.vertexCount=${this.vertexCount} `
					+` total floats=${this.vertexCount * this.rowFloats}  double0=${this.avatar.double0}`);
			}

			return this.avatar.getViewBuffer(0);
		});

	}

	// called for each image frame on th canvas.  TODO: roll specialInfo into the input Data Arrays
	draw(width, height, paintingNeeds) {
		if (traceDrawing) {
			dblog(`🌀🌀🌀 garland Drawing  ${this.avatarLabel}: `
				+` width=${width}, height=${height}  drawing ${this.vertexCount/2} points `
				+` matrix=${this.matrix}`);
		}
		const gl = this.gl;
		this.setDrawing();

		this.drawVariables.forEach(v => v.reloadVariable());

        dblog(`🌀 context attributes we're operating under:`, gl.getContextAttributes());

		let startEnd2 = this.space.startEnd2;
		let first = startEnd2.start2;
		let count = startEnd2.end2 - startEnd2.start2;
		gl.drawArrays(gl.TRIANGLE_STRIP, first, count);
		if (traceDrawing) {
			dblog(`🌀🌀🌀just drewArays-garland on avatar ptr=${this.avatar.pointer} `
				+` this.avatar.label=${this.avatar.label}, `
				+` buffer label=${this.avatar.bufferNames[0]}`);
		}

		if (traceDrawLines) {
			gl.lineWidth(1);  // it's the only option anyway
			gl.drawArrays(gl.GL_LINE_STRIP, first, count);
		}

		if (traceDrawPoints)
			gl.drawArrays(gl.POINTS, first, count);

		// i think this is problematic
		if (traceAvatarAfterDrawing) {
			this.avatar.dumpComplexViewBuffer(0, this.nPoints,
				`🌀🌀🌀 finished drawing in garlandDrawing.js; drew buf:`);
			dblog(`🌀🌀🌀  matrixUniform=`, this.matrixUniform.reloadFunc());
		}
		if (traceGLAfterDrawing) {
			this.simulateGL(0, this.nPoints,
				`🌀🌀🌀 finished drawing in garlandDrawing.js; drew buf:`);
			dblog(`🌀🌀🌀  matrixUniform=`, this.matrixUniform.reloadFunc());
		}
	}

    // simulate and calculate what WebGL would calculate, and dump that.
    // give or take fidelity of the below.
    simulateGL(vBuf) {
        let startEnd2 = this.space.startEnd2;
		let first = startEnd2.start2;
		let count = startEnd2.end2 - startEnd2.start2;
        let vertexSerial, ix, point, odd, factor, row;
        let rows = this.avatar.getViewBuffer(0);
        let gl_Position = vec4.create();

        const _ = c => (gl_Position[c] / gl_Position[3]).toFixed(4).padStart(7);
        //const _ = c => (gl_Position[c]).toFixed(1).padStart(9);

		'';  // collect these otherwise the console merges dup lines
        let text = ` 🌀🌀 what the GPU calculates, only the `
			+`${count} vertices, not the points:`;

        for (let i = 0; i < count; i++) {
            //  so this simulates the vertex shader.
        	vertexSerial = first + i;
            let rs = vertexSerial * 4;
            row = vec4.fromValues(rows[rs], rows[rs+1], rows[rs+2], rows[rs+3]);
            ix = Math.floor(vertexSerial / 2);
            point = vec4.create();
            odd = (ix & 1);
            factor = odd ? INNER_FACTOR : OUTER_FACTOR;
            point[0] = row[0] * factor;
            point[1] = row[1] * factor;
            point[2] = 0;
            point[3] = vertexSerial;

            // point * matrix;
            vec4.transformMat4(gl_Position, point, this.scene.paintingNeeds.rotMatrix);
            text += ` 🌀🌀${(ix + '').padStart(3)} `
				+` ${_(0)}   ${_(1)}   ${_(2)}  \n`;
            //dblog(` 🌀🌀${_(0)}   ${_(1)}   ${_(2)}   ${_(3)}  `);
        }
        dblog(text + `  🌀🌀 `);
    }

}

export default garlandDrawing;

