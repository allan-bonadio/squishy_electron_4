/*
** volt display -- calculations for display of the voltage
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

import qeConsts from '../engine/qeConsts.js';
import {EFFECTIVE_VOLTS, TOO_MANY_VOLTS, LOW_VOLTS} from './voltConstants.js';
import {getAGroup, getASetting, storeASetting} from '../utils/storeSettings.js';
import * as d3 from 'd3';
import familiarVolts from './familiarVolts.js';

let traceFamiliar = false;
let traceScales = true;
let tracePathAttribute = false;
let tracePathIndividualPoints = false;

let traceVoltArithmetic = false;
let traceVoltScales = true;
let traceScrolling = false;
let traceZooming = false;


const {min, max, abs, round, sqrt, cbrt, log10} = Math;

// does optimizer eliminate this, leading to errors downstream?  this fixes it
const qe_Consts = qeConsts;

// zooming in or out, changes the heightVolts by this factor either way.
const zoomFactor = Math.sqrt(2);
const logZoomFactor = Math.log(zoomFactor);

const isOK = (c) => {
	if (c == null || !isFinite(c)) {
		console.error(`bad value`, c);
		debugger;
	}
}

// this contains the voltage scrolling and zooming numbers and what's
// visible. NOT A COMPONENT; just an object that components use to
// manage voltage numbers and buffers.
export class voltDisplay {
	// make it from given voltSettings obj. Note we don't get the buffer from the space,
	// cuz the Voltage minigraph needs its own buffer
	// viewCanvasHeight, height ONLY of view canvas
	constructor(label, space, voltageBuffer, voltSettings, viewCanvasHeight) {
		// point-by-point voltage values, + start and end of voltage buffer, aligned with waves
		this.label = label;
		this.space = space;
		//this.drawDesc2D = new drawDesc2D(space);
		//Object.assign(this, this.drawDesc2D);
		this.voltageBuffer = voltageBuffer;

		this.continuum = space.continuum;
		if (space.continuum == qeConsts.contENDLESS) {
			// eg for N=8, 8 segments and segment 0===8 and 1===9
			this.barWidth = 1 / space.nStates;
			this.start = space.start;
			this.end = space.end;
		}
		else if (space.continuum == qeConsts.contWELL) {
			// eg for N=8, 8 segments plus two on ends that go to ∞,
			// so segment 0 === 9 = ∞
			this.barWidth = 1 / space.nPoints;
			this.start = 0;
			this.end = space.nPoints;
		}
		else {
			throw `bad space continuum ${space.continuum}`;
		}

		if (!voltSettings) throw `no voltSettings for ${this.label} voltDisplay`;

		// only applies and only needed for the 2d view
		this.viewCanvasHeight = viewCanvasHeight ?? getASetting('miscSettings', 'viewHeight');

		// adjust the range over which the user can slide the bottomVolts,
		// in case the numbers are crazy
		this.decideBottomHeightVolts();
	}

	// the user dragged the view canvas (2d) up or down so adjust.
	// Or, initially.
	updateViewHeight(viewCanvasHeight) {
		this.viewCanvasHeight = viewCanvasHeight ?? getASetting('miscSettings', 'viewHeight');
		this.addYScales(voltSettings.bottomVolts,
			voltSettings.bottomVolts + voltSettings.heightVolts,
			viewCanvasHeight);

	}

	// set ANY field, from the 'from' argument, into this
	// from = {aField: aValue, anotherField: anotherValue}
	// does anybody use this?>!?  TODO
	setSettings(from) {
		Object.assign(this, from);
	}

	// create a voltDisplay the way the space needs it.  Also the view canvas.
	static newForSpace(space, viewCanvasHeight) {
		let vDisp = new voltDisplay('mainWave', space, space.voltageBuffer,
			getAGroup('voltageSettings'), viewCanvasHeight);
		vDisp.space = space;
		return vDisp;
	}

	// straight clone (does not do boundaries?)
	// does anybody use this?>!?  TODO
	static copyVolts(toArray, fromArray) {
		for (let ix = this.start; ix < this.end; ix++)
			toArray[ix] = fromArray[ix];
	}

	// take the dr disc from the space (fairly sparse) and add some more things like scalers
	// get drawDesc2D() {
	// 	let drawDesc2D = this.drawDesc2D = this.space.drawDesc2D;
	//
	// 	drawDesc2D.xScale = d3.scaleLinear(
	// 		[this.start, this.end],
	// 		[drawingLeft, drawingLeft + drawingWidth]);
	// 	drawDesc2D.yScale = d3.scaleLinear(
	// 		[this.bottomVolts, this.bottomVolts + this.heightVolts],
	// 		[0, viewCanvasHeight]);
	// 	drawDesc2D.yUpsideDown = d3.scaleLinear(
	// 		[this.bottomVolts, this.bottomVolts + this.heightVolts],
	// 		[viewCanvasHeight, 0]);
	// 	drawDesc2D.viewCanvasHeight = viewCanvasHeight;
	//
	// 	return drawDesc2D;
	// }

	// all of our properties, but not the datapoints.  Optional: pass voltage params
	dumpVoltDisplay(title, voltageParams) {
		this.findVoltExtremes();
		console.log(`⚡️ voltD.${this.label}: ${title} @ ${this.voltageBuffer.byteOffset},
			bottomVolts: ${this.bottomVolts}   heightVolts: ${this.heightVolts.toFixed(0)} `
				+`  (top volts: ${(this.bottomVolts + this.heightVolts).toFixed(0)})
			measured voltage range: ${this.measuredMinVolts.toFixed(0)} ... ${this.measuredMaxVolts.toFixed(0)}`);
		if (voltageParams)
			console.log(`    `, voltageParams);
	}

	// dumps this.voltageBuffer
	dumpVoltage(title, nPerRow = 8, skipAllButEvery = 1) {
		this.dumpVoltDisplay(title);
		const voltageBuffer = this.voltageBuffer;
		let N = this.end - this.start;
		skipAllButEvery = Math.max(skipAllButEvery, 1);
		nPerRow =  Math.max(nPerRow, 1);
		let stride = nPerRow * skipAllButEvery;
		let txt = new Array((this.end - this.start) * 2);
		for (let rowStart = this.start; rowStart < this.end; rowStart += stride) {
			txt.push(`[${String(rowStart).padStart(4)}]  `);
			for (let ix = rowStart; ix < rowStart + stride; ix += skipAllButEvery)
				txt.push(voltageBuffer[ix].toFixed(0).padStart(10));
			txt.push('\n');
		}
		console.log(txt.join(''));
	}

	/* ***************************** height and bottom (volt) calculations */

	// actually measure the current voltage signal, get min & max
	findVoltExtremes() {
		let voltageBuffer = this.voltageBuffer;
		let mini = Infinity, maxi = -Infinity;
		for (let ix = this.start; ix < this.end; ix++) {
			mini = min(voltageBuffer[ix], mini);
			maxi = max(voltageBuffer[ix], maxi)
		}
		this.measuredMinVolts = mini;
		this.measuredMaxVolts = maxi;
	}

	// THIS IS PERFECT, don't change it!!
	// Adjust bottomVolts and heightVolts to the existing potential numbers, so it looks nice.
	// call this after changing the volts buffer, by the familiar settings.
	decideBottomHeightVolts() {
		// make sure some part of the current voltage is visible somewhere - adjust bottomVolts if needed
		this.findVoltExtremes();

		// if this doesn't include zero, include it
		let mini = min(this.measuredMinVolts, 0);
		let maxi = max(this.measuredMaxVolts, 0);
		// toss in some arbitrary padding that won't be zero
		mini -= LOW_VOLTS * 5;
		maxi += LOW_VOLTS * 5;

		// and that's it!
		this.bottomVolts = mini;
		this.heightVolts = maxi - mini;
	}

	/* *********************************************** scales */
	// once you figure out where you're drawing (drawingLeft,
	// drawingRight), call this. You could use it for any variable
	// that varies linearly from left to right by ix, science coordinate.
	addXScales(drawingLeft, drawingRight) {
		if (!this.xScale) {
			this.xScale = d3.scaleLinear(
				[this.start, this.end],
				[drawingLeft, drawingRight]);
		}
	}

	// once you figure out voltage limits to display, and the pixel height
	// here, y can be any kind of value that varies continuously from
	// bottom to top of whatever
	addYScales(bottomValue, topValue, viewCanvasHeight) {
		if (!this.yScale) {
			this.yScale = d3.scaleLinear(
				[bottomValue, topValue],
				[0, viewCanvasHeight]);
			this.yUpsideDown = d3.scaleLinear(
				[bottomValue, topValue],
				[viewCanvasHeight, 0]);
			this.viewCanvasHeight = viewCanvasHeight;
		}
	}

 	// set our xScale and yScale according to the geom numbers passed
 	// in, and our own settings.  Used by VoltArea to plot potential.
 	//  X in, in units of dx, Y in, in units of volts
	setVoltScales(drawingLeft, drawingWidth, viewCanvasHeight) {
		isOK(drawingLeft); isOK(drawingWidth);
		isOK(this.bottomVolts); isOK(this.heightVolts);

		this.drawingLeft = drawingLeft;
		this.drawingWidth = drawingWidth;
		this.addXScales(drawingLeft, drawingLeft + drawingWidth);

		this.addYScales(this.bottomVolts, this.bottomVolts + this.heightVolts, viewCanvasHeight);

		//Object.assign(this, this.drawDesc2D);  // copies it all over this obj

		if (traceScales)
			console.log(`${this.label}: bottomVolts=${this.bottomVolts} `
				+` heightVolts=${this.heightVolts}   viewCanvasHeight=${viewCanvasHeight}`);

		if (traceVoltScales) {
			console.log(`⚡️ ⚡️   voltagearea.setVoltScales()  done
				X domain & range: `, this.xScale.domain(), this.xScale.range(), `
				Y domain & range: `, this.yScale.domain(),  this.yScale.range(), `
				Y UpsideDown: `, this.yUpsideDown.domain(),  this.yUpsideDown.range(),
				`Zero on: xscale, yscale, upsdown:`,
						this.xScale(0),  this.yScale(0),  this.yUpsideDown(0));
		}
		return true;
	}

	/* **************************************************** Rendering */

	// make the value for the 'd' attribute on an svg <path element
	// from start to end, on your space, using std volts array from WaveView
	// usedYScale is either yScale or yUpsideDown; your choice
	// want the syntax to be easy to debug
	makeVoltagePathAttribute(usedYScale) {
		let {barWidth, start, end} = this;

		if (tracePathAttribute || tracePathIndividualPoints)
			console.group(`makeVoltagePathAttribute pts for ${this.label} for x=${start}.. ${end}`)

		const tpip = (x, y, title = '') => {
			if (tracePathIndividualPoints)
				console.log(`    ⚡️${title} x=${x}  y=${y}`)
		};

		// yawn too early?
		if (! usedYScale) {
			if (tracePathAttribute)
				console.warn(`⚡️ 🧨  makePathAttribute(): no yScale so punting`);
			return `M0,0`;
		}

		const voltageBuffer = this.voltageBuffer;
		//this.dumpVoltage('vb, pathcons');

		// array to collect small snippets of text like '371,226' or
		// 'L371,226'.  Avoid recreating array.
		// TODO  uncomment this if (!this.points)
		this.points = new Array(this.end + this.start);
		let points = this.points;
		let x, y, pt;

		if (tracePathIndividualPoints)
			console.log(`⚡️ makeVoltagePathAttribute begin case `);

		// get ready to stop and start the pathline if needed
		let didMove = false, didLine = false;
		switch (this.continuum) {
		case qe_Consts.contDISCRETE:
			throw new Error(`discrete continuum in makeVoltagePathAttribute`);

		case qe_Consts.contWELL:
			// potential at the ends of the well are 'infinite'; therefore regular points run start ... end-1.
			// just do a line going up on each end.  skyHigh isn't ∞ but should get slanted line
			let skyHigh = usedYScale(this.bottomVolts + 5 * this.heightVolts).toFixed(1);

			x = this.xScale(0).toFixed(1);
			points[0] = `M${x},` + skyHigh;
			didMove = true;
			didLine = false;
			start++;  // don't overwrite the first one we just made
			tpip(x, skyHigh, '️left bumper');

			// should I get rid of this if the point at end-1 is NAN?  probably.  unlikely, though
			//end += 1;
			x = this.xScale(end).toFixed(1);
			points[end] = `L${x},` + skyHigh;
			end--;  // don't overwrite the last one we just made
			tpip(x, skyHigh, '️right bumper');
			break;

		case qe_Consts.contENDLESS:
			// make the voltage buffer wraparound
			voltageBuffer[0] = voltageBuffer[end-1];
			voltageBuffer[end+start] = voltageBuffer[1];
			didMove = false;
			didLine = false;
			break;

		default:
			debugger;
			throw new Error(`⚡️  bad continuum '${this.continuum}' in  makeVoltagePathAttribute()`);
		}

		for (let ix = start; ix <= end; ix++) {
			x = this.xScale(ix);
			if ((x==null) || !isFinite(x))
				debugger;

			// for debugging.  long decimal numbers are depresssing
			x = x.toFixed(1);

			// ±∞ come out as NaN.
			y = usedYScale(voltageBuffer[ix]);
			if (!isFinite(y) || y < -TOO_MANY_VOLTS || y > TOO_MANY_VOLTS) {
				// Absent.  the line ends here, for this pt and maybe a few more; just omit it
				didMove = didLine = false;
				pt = '';
			}
			else {
				y = y.toFixed(1);
				tpip(x, y, ix);

				// didLine is there because  you can say M3,4 L5,6 7,8 9,10
				// you don't have to repeat the L every segment..
				pt = `${x},${y}`;
				if (!didMove) {
					pt = 'M' + pt;
					didMove = true;
				}
				else if (!didLine) {
					pt = 'L' + pt;
					didLine = true;
				}
			}
			points[ix] = pt;
		}

		// spaces between xy pairs make them easier to read, and they repeat L
		let final = points.join(' ');
		if (tracePathAttribute)
			console.log(`final path attribute`, final);
		if (tracePathIndividualPoints)
			console.groupEnd(`makeVoltagePathAttribute pts`)
		return final;
	}

	/* ************************************************* interaction */

	// called when user scrolls up or down.
	// frac = fraction of a height, 1=scrolled to top, one click.  -1=scrolled toward bottom, one click.
	// Other scroll mechanisms pass other proportional numbers
	scrollVoltHandler(frac) {
		let distance = this.heightVolts * frac / 4;

		this.setBottomVolts(this.bottomVolts + distance);

		if (traceScrolling)
			console.log(`userScroll(frac=${frac}) => bottomVolts=${this.bottomVolts}`);
	}

	// called when human zooms in or out.  pass +1 or -1.  heightVolts expands
	// or contracts a fixed  factor up and down.
	zoomVoltHandler(inOut) {
		// keep looking at same place
		let midView = this.bottomVolts + this.heightVolts/2;

		if (traceZooming)
			this.dumpVoltDisplay(`zoom START ${inOut}: old midView=${midView}`);

		// zoom in/out to int powers of ZoomFactor.
		let h = this.heightVolts * zoomFactor ** inOut;
		this.setHeightVolts(h);
		this.setBottomVolts(midView - h / 2);
	}



	// measure voltage buffer and set volt scales to accommodate.  Use
	// after any non-familiar change to volts. and adjust scales.  Must
	// have already set drawingWidth, drawingLeft and viewCanvasHeight from
	// setVoltScales()
	setAutoRange() {
		this.decideBottomHeightVolts();

		this.setVoltScales(this.drawingLeft, this.drawingWidth, this.viewCanvasHeight);
	}
}

// more methods
Object.assign(voltDisplay, familiarVolts);

export default voltDisplay;
