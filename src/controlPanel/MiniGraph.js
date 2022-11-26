/*
** Mini Graph -- small rectangular graph showing user what kind of wave or potential they're asking for
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';
//import {scaleLinear} from 'd3-scale';
//import {path as d3path} from 'd3-path';

import {eSpace} from '../engine/eSpace.js';

//const π = Math.PI;
//const radsPerDeg = π / 180;

this file is no longer used
$%^&*(
let miniDebug = false;

function setPT() {
	MiniGraph.propTypes = {
		className: PropTypes.string.isRequired,

		// function that accepts x, and returns y, a real or eCx if isWave
		//yFunction: PropTypes.func,

		// pass the function that will return the svg elements to display, recipe(miniSpace, potentialParams)
		recipe: PropTypes.func.isRequired,

		// domain and range.
		// no; always zero  xMin: PropTypes.number,
// 		xMax: PropTypes.number,
// 		yMin: PropTypes.number,
// 		yMax: PropTypes.number,

		// outer size of graph, in pixels
		width: PropTypes.number.isRequired,
		height: PropTypes.number.isRequired,

		// variables decided by sliders; different for wave/potential
		familiarParams: PropTypes.object.isRequired,

		// the space that the mainstream is using - MiniGraph uses an adaptation of this one
		origSpace: PropTypes.instanceOf(eSpace).isRequired,
	};
	MiniGraph.defaultProps = {};
}

// use this in the potential tab.  Returns a <path element
// const potentialRecipe = {
// 	name: 'potentialRecipe',
//
// 	//  sets value for this pt. in values array.  returns magn.
// 	calcPoint(values, xPx, y) {
// 		values[xPx] = {x: xPx, y};
// 		return y;
// 	},
//
// 	genValues() {
//
// 	},
//
// 	// generate React nodes of svg objects, return them, like render
// 	// 0/max are sides of the graph; min/,maxY are autoranged based on data
// 	render(values, xMax, minY, maxY, height) {
// 		//absolute potential doesn't matter - just relative changes.  hence autorange.
// 		const yScale = scaleLinear(
// 			[minY - .2, maxY + .2],  // domain fits the data, plus a small margin at the edges
// 			[height, 0]);  // upside down to the screen space in the svg
//
// 		// generate points.  Really, we want to generate per-pixel or per-two-pixel
// 		let pathObj = d3path();
// 		let yyy = values[0];
// 		if (miniDebug) console.log('val 0: ', yyy);
// 		yyy = yyy.y;
// 		if (miniDebug) console.log(' . y: ', yyy);
// 		yyy = yScale(yyy);
// 		if (miniDebug) console.log('yscale: ', yyy);
// 		yyy = (yyy).toFixed(2);
// 		if (miniDebug) console.log('toFixed: ', yyy);
// 		pathObj.moveTo(0, (yScale(values[0].y)).toFixed(2));
// 		values.forEach((val, xPx) => {
// 			pathObj.lineTo(xPx, (yScale(val.y)).toFixed(2));
// 		});
// 		//	for (let xPx = 0; xPx <= p.width; xPx++) {
// 		//		let x = xScale.invert(xPx);
// 		//		let y = p.yFunction(x);
// 		//		y: Math.round(yScale(y) * 100) / 100
// 		//	}
// 		const d = pathObj.toString();
// 		return <path d={d} stroke='#fff' fill='none' />;
// 	}
//}




// the component.  We need a class component cuz we weant to save stuff on this?
//  I want this done by webgl, just like WaveView.  and change to a func component at the same time.
export class MiniGraph extends React.Component {
	constructor(props) {
		super(props);
		const p = props;

		// doesn't really need any state.
		this.state = {};

		// construct a copy of the origSpace, but with no more resolution than the minigraph
		const proxyDim = {...p.origSpace.dimensions[0]};
		proxyDim.N = Math.min(proxyDim.N, p.width);
		//this.miniSpace = new qeBasicSpace([proxyDim]);
		//if (miniDebug) console.log('this.miniSpace: ', this.miniSpace);

		// these never change for the life of the component (?)
		this.viewBox = `0 0 ${+p.width} ${+p.height}`;
		if (miniDebug) console.log('this.viewBox: ', this.viewBox);
	}





//
// 	// calculate all and find extents
// 	let maxi = -Infinity, mini = Infinity;
// 	let values = new Array(p.width);
// 	for (let xPx = 0; xPx <= +p.width; xPx++) {
// 		let x = xScale.invert(xPx);
// 		let y = p.yFunction(x);
//
// 		let magn = recipe.calcPoint(values, xPx, y);

//		let magn = y;
//		if (isisWave) {
//			values[xPx] = {x: xPx, ...y};
//			magn = y.re * y.re + y.im * y.im;  // y.norm()
//		}
//		else {
//			values[xPx] = {x: xPx, y};
//		}
// 		if (magn < mini) mini = magn;
// 		if (magn > maxi) maxi = magn;
// 	}
// 	if (p.yMin !== undefined) mini = +p.yMin;
// 	if (p.yMax !== undefined) maxi = +p.yMax;

	// in case you're all still infinity,
// 	if (! isFinite(mini)) mini = -1;
// 	if (! isFinite(maxi)) maxi = 1;
	// figure out the scaling -
//	const yScale = scaleLinear(
//		[mini - .2, maxi + .2],  // domain fits the data, plus a small margin at the edges
//		[p.height, 0]);  // upside down to the screen space in the svg
//
//
//
//	let colorScale = '#fff';  // if scalar
//	if (isisWave) {
//		colorScale = scaleLinear([0, 1, 2, 3, 4, 5, 6],
//					['#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f', '#f00']);
//	}
//

	// must be done before each render but not part of the render...
	precalc() {
	}

	render() {
		const p = this.props;
		//const {N} = this.miniSpace.startEnd;

		return <svg className={`MiniGraph ${p.className}`}
							viewBox={this.viewBox}
							width={p.width} height={p.height}
							preserveAspectRatio='none' >

			{this.gElement}

		</svg>;

	}
}

setPT();

export default MiniGraph;
