/*
** flat drawing -- draw a 1d quantum wave as a 2d bargraph (band across top)
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

import abstractDrawing from './abstractDrawing.js';
import {drawingUniform, drawingAttribute} from './drawingVariable.js';
import cx2rygb from './cx2rygb/cx2rygb.glsl.js';
import qeFuncs from '../engine/qeFuncs.js';
import qeConsts from '../engine/qeConsts.js';

let traceAvatarAfterDrawing = true;
let traceMaxHeight = false;
let traceFlatDrawing = false;
let traceViewport = false;
let traceReloadRow = false;

// diagnostic purposes; draws more per vertex
let traceDrawPoints = false;
let traceDrawLines = false;

let displayWrapEdges = false;  // soon to be a pref

/* ******************************************************* flat drawing */
// The glsl sources for webgl drawing

/*
** data format of attributes:  four column table of floats
** 𝜓.re  𝜓.im   (unused)   serial.
** uses gl_VertexID   NO! that's opengl 2 only
** to figure out whether the y should be re^2+im^2 or zero
*/

// make the line number for the start correspond to this JS file line number - the NEXT line
const vertexSrc = `// flat drawing vertex
${cx2rygb}
#line 32
varying highp vec4 vColor;
attribute vec4 row;
uniform float barWidth;
uniform float maxHeight;

void main() {
	int vertexSerial = int(row.w);
	bool odd = int(vertexSerial) / 2 * 2 < vertexSerial;

	// figure out y
	float y;
	if (odd) {
		y = (row.x * row.x + row.y * row.y) / maxHeight;
	}
	else {
		y = 0.;  // top of the screen
	}
	y = 1. - 2. * y;

	// figure out x, basically the point index; map to -1...+1
	float x;
	x = float(int(vertexSerial) / 2) * barWidth * 2. - 1.;

	gl_Position = vec4(x, y, 0., 1.);

	//  for the color, convert the complex values via this algorithm
	vColor.rgb = cx2rygb(row.xy);
	//vColor.rgb = cx2rygb(vec2(row.x, row.y));
	vColor.a = 1.;
	//vColor = vec4(cx2rygb(vec2(row.x, row.y)), 1.);

	// make the colors darker toward zero (top)
	if (!odd)
		vColor = vec4(vColor.r/2., vColor.g/2., vColor.b/2., vColor.a);

	// dot size, in pixels not clip units.  actually a fuzzy square.
	gl_PointSize = 10.;
}
`;

const fragmentSrc = `// flat drawing frag
#line 69
precision highp float;
varying highp vec4 vColor;

void main() {
	gl_FragColor = vColor;
}
`;

// the original display that's worth watching: flat upside down hump graph
export class flatDrawing extends abstractDrawing {
	constructor(scene) {
		super(scene, 'flatDrawing');

		//this.space = space;

		// each point in the wave results in two vertices, top and wave.
		// And each of those is four single floats going to the GPU
		this.avatar = scene.avatar;
		this.avatar.attachViewBuffer(0, null, 4, this.space.nPoints * 2, 'flat drawing');

		this.vertexShaderSrc = vertexSrc;
		this.fragmentShaderSrc = fragmentSrc;

		//console.log(`attachViewBuffer on scene ${scene.sceneName}`);
	}

	// loads view buffer from corresponding wave, calculates highest norm.
	// one time set up of variables for this drawing, every time canvas and scene is recreated
	createVariables() {
		this.setDrawing();
		if (traceFlatDrawing)
			console.log(`♭♭♭ flatDrawing ${this.sceneName}: creatingVariables`);

		// normally autoranging would put the highest peak at the exact bottom.
		// but we want some extra space.  not much.
		const PADDING_ON_BOTTOM = 1.02;

		this.maxHeightUniform = new drawingUniform('maxHeight', this,
			() => {
				// fresh out of the loader, maxHeight wobbles up and down.  Smooth it.
				if (!this.maxHeight)  // ??
					this.maxHeight = this.avatar.double0;
				else {
					// relax changes.  how  quickly?
					this.maxHeight = this.avatar.double0;
					//this.maxHeight = (this.maxHeight * 3 + this.avatar.double0) / 4;
				}

				if (traceMaxHeight)
					console.log(`♭♭♭ flatDrawing reloading outer:  `
						+` maxHeight=${this.avatar.double0.toFixed(5)} `);

				return {value: this.maxHeight * PADDING_ON_BOTTOM, type: '1f'};
			}
		);


		// WELL continuum:  potential at the ends of the well are infinite; so
		// psi on the border points is zero. These are the boundary datapoints,
		// so for N=8, 10 edges between 9 bars, 7 between and 2 on ends.

		// for ENDLESS, we wrap around one bar, so if N=8, there's two border bar at 0 and 8.
		// there's 7 bars between.  9 bars total, 10 edges, matching the 10 = nPoints
		// So, the same for WELL and ENDLESS

		// barWidth: width of each bargraph bar
		let nPoints = this.nPoints = this.space.nPoints;
		let barWidth;
		this.barWidthUniform = new drawingUniform('barWidth', this,
			() => {
				barWidth = 1 / (nPoints - 1)
				return { value: barWidth, type: '1f' };
			}
		);
		if (traceFlatDrawing) console.log(`♭♭♭ barWidth= ${barWidth}`);

		this.vertexCount = nPoints * 2;  // nPoints * vertsPerBar
		this.rowFloats = 4;
		this.rowAttr = new drawingAttribute('row', this, this.rowFloats, () => {
			//debugger;
			qeFuncs.avatar_avFlatLoader(this.avatar.pointer, 0, this.scene.inputInfo[0].pointer,
					nPoints);

			if (traceReloadRow) {
				console.log(`♭♭♭ flatDrawing  ${this.avatarLabel}: at row getViewBuffer() `
					+` loading to ${this.avatar.label}   this.vertexCount=${this.vertexCount} `
					+` total floats=${this.vertexCount * this.rowFloats}  double0=this.avatar.double0`);
			}

			return this.avatar.getViewBuffer(0);
		});

	}

	draw(width, height) {
		if (traceFlatDrawing) {
			console.log(`♭♭♭ flat Drawing  ${this.avatarLabel}: `
				+` width=${width}, height=${height}  drawing ${this.vertexCount/2} points `
				+` maxHeight=${this.maxHeight}`);
		}
		const gl = this.gl;
		this.setDrawing();

		let bw = this.scene.inputInfo[1];
		gl.viewport(bw, 0, width - 2 * bw, height);
		if (traceViewport) {
			console.log(`♭♭♭ flatDrawing set viewport on avatar=${this.avatarLabel}: `
				+` width-2bw=${width - 2 * bw}, height=${height}  `
				+` drawing ${this.vertexCount/2} points`);
		}
		this.drawVariables.forEach(v => v.reloadVariable());
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexCount);
		if (traceFlatDrawing) {
			console.log(`♭♭♭just drewArays-flat on avatar ptr=${this.avatar.pointer} `
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
					`♭♭♭ finished drawing in flatDrawing.js`);
			console.log(`♭♭♭ barWidthUniform=`, this.barWidthUniform.reloadFunc(),
				+` maxHeightUniform=`, this.maxHeightUniform.reloadFunc());
		}
	}
}

export default flatDrawing;

