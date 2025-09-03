/*
** rainbow drawing -- draw a disc for the colors |u| = 1
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/

import * as THREE from 'three';

import {abstractDrawing} from './abstractDrawing.js';
import eAvatar from '../engine/eAvatar.js';
//import cx2rgb from './cx2rgb/cx2rgb.glsl.js';
//import {drawingUniform, drawingAttribute} from './drawingVariable.js';
import qeConsts from '../engine/qeConsts.js';
import qeFuncs from '../engine/qeFuncs.js';

let traceViewBufAfterDrawing = false;
let traceRainbowDrawing = true;

/* ************************************ rainbow drawing geometry */

// do I have to make a separate class out of it or can I wing it?  see how it goes
class RainbowGeometry extends THREE.BufferGeometry {
	constructor(width, height, widthBars) {
		super();

		this.type = 'RainbowGeo';
		this.parameters = {width, height, widthBars};
		const barWidth = width / widthBars;

		for (let ix = 0; ix < widthBars; ix++) {

		}
	}


}

/* ******************************************************* rainbow drawing */

/*
** data format of attributes:  four column table of floats
** 𝜓.re  𝜓.im   (voltage unused)    ...0?...
** uses gl_VertexID to figure out whether the y should be re^2+im^2  NO! opengl 2 only
** or zero
*/

// make the line number for the start correspond to this JS file line number - the NEXT line
//const vertexShader = `${cx2rgb}
//#line 32
//varying highp vec4 vColor;
//attribute vec4 row;
//uniform float barWidth;
//uniform float maxHeight;
//
//void main() {
//	// figure out y
//	float y;
//	int vertexSerial = int(row.w);
//	bool odd = int(vertexSerial) / 2 * 2 < vertexSerial;
//	if (odd) {
//		y = (row.x * row.x + row.y * row.y) / maxHeight;
//	}
//	else {
//		y = 0.;
//	}
//	y = 1. - 2. * y;
//
//	// figure out x, basically the point index; map to -1...+1
//	float x;
//	x = float(int(vertexSerial) / 2) * barWidth * 2. - 1.;
//
//	gl_Position = vec4(x, y, 0., 1.);
//
//	//  for the color, convert the complex values via this algorithm
//	vColor = vec4(cx2rgb(vec2(row.x, row.y)), 1.);
//	if (!odd)
//		vColor = vec4(vColor.r/2., vColor.g/2., vColor.b/2., vColor.a);
//	//vColor = vec4(.9, .9, .1, 1.);
//
//	// dot size, in pixels not clip units.  actually a square.
//	${pointSize}
//}
//`;
//
//const fragmentShader = `
//#line 69
//precision highp float;
//varying highp vec4 vColor;
//
//void main() {
//	gl_FragColor = vColor;
//}
//`;

const π = 3.141592653589793;

const RADIANS_PER_SEG = 10. / 180. * π;
const RADIUS  = 5;
//const RADIUS  = 25;

// whether we;re using 2 or 3 coords on position
const posWidth = 3;


// a piechart-like image of all the complex colors around |u| = 1
export class rainbowDrawing extends abstractDrawing {
	// constructor must create the Avatar, allocate all of its buffers,.
	// must create geometry, material and mesh.  And attach to three's Scene.
	// Sets this.avatar, .canvas, .geometry, .material, .mesh
	constructor(scene) {
		super(scene, 'Rainbow');


		console.log(` create geometry`);
		const fakeGeo = false;
		if (fakeGeo) {
			this.geometry = new THREE.BoxGeometry( 1, 1, 1 );
		}
		else {
			this.pinwheelGeometry();
		}
		console.log(`geometry just made: `, this.geometry);



		console.log(`now on to the material`);
		const fakeMat = false;
		if (fakeMat) {
			this.material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
			this.material.side = THREE.FrontSide;
			//  THREE.FrontSide   THREE.BackSide 	THREE.DoubleSide
		}
		else {
			this.material = this.pinwheelMaterial();
			this.material.side = THREE.DoubleSide;
		}
		console.log(`material just made: `, this.material);
		//debugger;  // check out the this.material


		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.scene.threeScene.add(this.mesh);

		// wait try this really quick
		let boxAlso = false;
		if (boxAlso) {
			let geo = new THREE.BoxGeometry( 1, 1, 1 );
			let me = new THREE.Mesh(geo, this.material);
			this.scene.threeScene.add(this.mesh);
		}

			//		this.material = new THREE.MeshBasicMaterial({color: 0xaabbcc})
			////		this.material = new THREE.RawShaderMaterial( {
			////			uniforms: {
			////				maxHeightUniform: { value: 1.0 }
			////			},
			////			vertexShader, fragmentShader,
			////		} );
			//
			////		this.vertexShaderSrc = vertexSrc;
			////		this.fragmentShaderSrc = fragmentSrc;
			//
			//		let nPoints = this.nPoints = this.space.nPoints;
			//
			//		// width, height, n segments
			//		this.geometry = new THREE.PlaneGeometry(nPoints, 1, nPoints - 1) ;
			//		//this.geometry = new THREE.BufferGeometry();
			//
			//		this.mesh = new THREE.Mesh(this.geometry, this.material);
	}

	/* ********************************** pinwheel geometry */

	pinwheelGeometry() {
		// 360° broken into 10° segments=36.
		let nSegs = 36;
		let nVerts = nSegs * 3;

		this.geometry = new THREE.BufferGeometry();
		this.startAvatar(nSegs, nVerts);  // create avatar and its buffers

		//this.avatar.loadViewBuffers(this.avatar.pointer, 4);
		this.populateAvatarUnindexed(nSegs, nVerts);

		this.avatar.dumpViewBuffers(3, `after populateAvatar in rainbowDrawing`);
		//this.avatar.dumpIndex(`index after populateAvatar in rainbowDrawing`);

		this.bufferifyAttrs();

	}

	// creates drawing-specific avatar and all its buffers, all empty
	startAvatar(nSegs, nVerts) {
		const av = this.avatar = eAvatar.createAvatar(
			qeConsts.avRAINBOW, 'rainbow');

		const pos = this.position = av.attachViewBuffer(0, null, posWidth, nVerts, 'position');
		const col = this.color = av.attachViewBuffer(1, null, 3, nVerts, 'color');

// 		const nor = this.normal = av.attachViewBuffer(2, null, 3, nVerts, 'normal');
// 		const uv = this.uv = av.attachViewBuffer(3, null, 2, nVerts, 'uv');

// 		const ind = this.indexBuffer = av.attachIndexBuffer(null, nSegs * 3);
	}

	// fills in buffers in avatar
	populateAvatarUnindexed(nSegs, nVerts) {
		const pos = this.position;
		const col = this.color;

		// all the segments
		for (let s = 0; s < nSegs; s++) {

			let angle0 = s * RADIANS_PER_SEG;
			let si0 = Math.sin(angle0);
			let co0 = Math.cos(angle0);
			console.log(`seg: ${s}  angle: ${angle0.toFixed(4)} `
				+` degrees: ${(angle0 * 180 / 3.1415926535898).toFixed(4)} `
				+` sine ${si0.toFixed(4)}   cosine ${co0.toFixed(4)}`);

			let angle1 = (s+1) * RADIANS_PER_SEG;
			let si1 = Math.sin(angle1);
			let co1 = Math.cos(angle1);

			let radius = RADIUS;
			let shoveX = 0;
			let shoveY = 0;
// 			let shoveX = RADIUS / 3;
// 			let shoveY = RADIUS / 3;
			if (s > 25 && s < 29) radius /= 2;

			let p = s * 3 * posWidth;
			if (2 == posWidth) {
				pos[p + 0] = radius * co0 + shoveX;
				pos[p + 1] = radius * si0 + shoveY;

				pos[p + 2] = radius * co1 + shoveX;
				pos[p + 3] = radius * si1 + shoveY;

				pos[p + 4] = shoveX;
				pos[p + 5] = RADIUS;
			}
			else {
				pos[p + 0] = radius * co0 + shoveX;
				pos[p + 1] = radius * si0 + shoveY;
				pos[p + 2] = 0;

				pos[p + 3] = radius * co1 + shoveX;
				pos[p + 4] = radius * si1 + shoveY;
				pos[p + 5] = 0;

				pos[p + 6] = shoveX;
				pos[p + 7] = shoveY;
				pos[p + 8] = 0;
			}

			let c = s * 9;
			col[c + 0] = .0;
			col[c + 1] = .0;
			col[c + 2] = 1.0;

			col[c + 3] = 1.0;
			col[c + 4] = .0;
			col[c + 5] = .0;

			col[c + 6] = 1.0;
			col[c + 7] = 1.0;
			col[c + 8] = 1.0;

			// complexToRYGB(&cx, colors[p]);
		}
	}

	// fills in buffers in avatar
	populateIndexAvatar(nSegs, nVerts) {

		throw "NOT the right version of populateAvatar()";


		const pos = this.position;
		const nor = this.normal;
		const uv = this.uv;

		// the hub vertex
		pos[0] = pos[1] = RADIUS;
		pos[2] = 0;
		nor[0] = pos[1] = 0;
		nor[2] = 1;
		uv[0] = uv[1] = 0;

		// all the others
		for (let p = 1; p < nVerts; p++) {
			let p3 = p * 3;
			let p2 = p * 2;

			let angle = p * RADIANS_PER_SEG;
			let si = Math.sin(angle);
			let co = Math.cos(angle);

			// two coords for each point plus z which is always zero
			pos[p3] = RADIUS * (co + 1);
			pos[p3 + 1] = RADIUS * (si + 1);
			pos[p3 + 2] = 0;

			// qCx cx = qCx(co, si);
			// complexToRYGB(&cx, colors[p]);

			// normals: 0 0 1 for all
			nor[p3] = nor[p3 + 1] = 0;
			nor[p3 + 2] = 1;

			// zigzag the uv coords ... i dunno.  There's no texture anyway!
			uv[p2] = (p & 1) ? 1. : 0.
			uv[p2+1] = (p & 1) ? 0. : 1.
			// qCx cx = qCx(co, si);
			// complexToRYGB(&cx, colors[p]);
		}

		// each of these represents a triangle?  Or just a point?
		let iBuf = this.indexBuffer;
		for (let s = 0; s < nSegs; s++) {
			let b = s * 3;
			iBuf[b] = 0;
			iBuf[b+1] = s + 1;
			iBuf[b+2] = s + 2;
		}

		// oh wait vertex 1 is same as the last one
		let q = 3 * nSegs - 1;
		iBuf[q] = 1;
		iBuf = new THREE.BufferAttribute(iBuf, 1);
		// someday try Uint16BufferAttribute
	}

	// wrap each of these typed arrays in THREE.BufferAttribute s.
	bufferifyAttrs() {

		//this.colAttr = new THREE.BufferAttribute(col, 3, false);

		//debugger;
		this.posAttr = new THREE.BufferAttribute(this.position, 3, false);
		//this.posAttr.setUsage(THREE.StaticDrawUsage);
		// or .DynamicDrawUsage or StreamDrawUsage
		this.geometry.setAttribute( 'position', this.posAttr );

		this.colAttr = new THREE.BufferAttribute(this.color, 3, false);
		//this.colAttr.setUsage(THREE.StaticDrawUsage);
		// or .DynamicDrawUsage or StreamDrawUsage
		this.geometry.setAttribute( 'color', this.colAttr );



		//this.geometry.setIndex(this.indexBuffer);
	}

	/* ********************************** pinwheel material */

// 	vertexShader = '';
// 	fragmentShader = '';

	vertexShader = `
		// provided by default attribute vec3 position;
		attribute vec3 color;
		varying vec3 colorVar;

		void main() {
			colorVar = color;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}
	`;

	fragmentShader = `
		varying vec3 colorVar;

		void main() {
			gl_FragColor = vec4(colorVar, 1);
		}
	`;

	pinwheelMaterial() {
		const matParams = {
			name: 'pinwheelMaterial',
			uniforms: {},
			vertexShader: this.vertexShader,
			fragmentShader: this.fragmentShader,
		};
		const material = new THREE.ShaderMaterial(matParams);
		return material;
	}

	/* ********************************** old */

	// defunct
	createVariables() {
//		this.setDrawing();

		if (traceRainbowDrawing)
			console.log(`  🌈🌈🌈 rainbowDrawing: creatingVariables... NOT`);

	}

}

export default rainbowDrawing;

