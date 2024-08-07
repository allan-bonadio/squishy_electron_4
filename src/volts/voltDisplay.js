/*
** volt display -- calculations for display of the voltage
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

import {scaleLinear} from 'd3-scale';
import {EFFECTIVE_VOLTS, VALLEY_FACTOR, TOO_MANY_VOLTS} from './voltConstants.js';
import {getAGroup, storeASetting} from '../utils/storeSettings.js';

let traceFamiliar = false;
let tracePathAttribute = false;
let tracePathIndividualPoints = false

let traceVoltArithmetic = false;
let traceVoltScales = false;
let traceScrolling = false;
let traceZooming = false;


const {min, max, abs, round, sqrt, cbrt} = Math;

// zooming in or out, changes the heightVolts by this factor either way.
const zoomFactor = Math.sqrt(2);
const logZoomFactor = Math.log(zoomFactor);

const isOK = (c) => {
	if (c == null || !isFinite(c)) {
		console.error(`bad value`, c);
		debugger;
	}
}

// this contains the voltage scrolling and zooming numbers and what's visible.
// Not a component; just an object
export class voltDisplay {
	// make it from given settings obj. Note we don't get the buffer from the space,
	// cuz the Voltage minigraph needs its own buffer
	constructor(start, end, voltageBuffer, settings) {
		// point-by-point voltage values, + start and end of voltage buffer, aligned with waves
		this.voltageBuffer = voltageBuffer;
		this.start = start;
		this.end = end;

		if (settings) {
			// voltage from top of box to bottom
			this.heightVolts = settings.heightVolts;

			// where the bottom of the viewable voltage window is.  in volts.
			// Scrolling changes this.
			this.bottomVolts = settings.bottomVolts;

			// adjust the range over which the user can slide the bottomVolts,
			// in case the numbers are crazy
			this.decideBottomHeightVolts();
		}
	}

	// set ANY field, from the 'from' argument, into this
	setSettings(from) {
		Object.assign(this, from);
	}

	// create a voltDisplay the way the app needs it
	static newForSpace(space) {
		let vDisp = new voltDisplay(
			space.start, space.end,
			space.voltageBuffer,
			getAGroup('voltageSettings')
		);
		vDisp.space = space;
		return vDisp;
	}

	// straight clone (does not do boundaries that are unused anyway)
	static copyVolts(toArray, fromArray) {
		for (let ix = this.start; ix < this.end; ix++)
			toArray[ix] = fromArray[ix];
	}

	// dumps voltageArray
	dumpVoltage(title, voltageArray = this.voltageBuffer, nPerRow = 8, skipAllButEvery = 1) {
		this.dumpVoltDisplay(title);
		let N = this.end - this.start;
		if (! skipAllButEvery)
			skipAllButEvery = Math.ceil(N / 40);
		if (! nPerRow)
			nPerRow =  Math.ceil(N / 10);
		let stride = nPerRow * skipAllButEvery;
		let txt = `⚡️ dumpVoltage buffer: ${title}\n`;
		for (let rowStart = this.start; rowStart < this.end; rowStart += stride) {
			txt += `[${String(rowStart).padStart(4)}]  `;
			for (let ix = rowStart; ix < rowStart + stride; ix += skipAllButEvery)
				txt += voltageArray[ix].toFixed(0).padStart(10);
			txt += '\n';
		}
		console.log(`${txt}\n`);
	}

	// all of our properties, but not the datapoints.  Optional: pass voltage params
	dumpVoltDisplay(title, voltageParams) {
		this.findVoltExtremes();
		console.log(`⚡️ voltD: ${title},
			bottomVolts: ${this.bottomVolts}   heightVolts: ${this.heightVolts}   (top volts: ${this.bottomVolts + this.heightVolts})
			measured voltage range: ${this.measuredMinVolts} ... ${this.measuredMaxVolts}`);
		if (voltageParams)
			console.log(`    `, voltageParams);
	}

	/* ******************************************************************* height and bottom calculations */

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

	// given totally new minBottom and height, figure out the other maxes
	// setMaxMax() {
	// 	this.maxBottom = this.minBottom + this.heightVolts;
	// 	this.maxTop = this.maxBottom + this.heightVolts;
	// }

	// given totally new minBottom and height, figure out all the rest, to set the scroll
	// soo avg bottomVolts is 1/4 up from the bottom
// 	setMaxMaxBottom() {
// 		// this.setMaxMax();
// 		// this.bottomVolts = this.minBottom + this.heightVolts / 4;
// 	}

	// Adjust bottomVolts and heightVolts to the existing potential numbers, so it looks nice.
	// call this after loading these settings from somewhere, if you're not confident about them.
	decideBottomHeightVolts() {
		// make sure some part of the current voltage is visible somewhere - adjust bottomVolts if needed
		this.findVoltExtremes();

		// first, decide a heightVolts.  Potential might be zero
		// everywhere, therefore zero difference.  Potential might have
		// some range to it, if so, enclose that.
		let measuredHeight = abs(this.measuredMaxVolts - this.measuredMinVolts);

		if (measuredHeight > 1e-10) {
			this.heightVolts = measuredHeight * 1.1;
			this.bottomVolts = this.measuredMinVolts - measuredHeight * .05;

			// add 5% margin on top and bottom
			let pastMax = (19 * this.measuredMaxVolts + this.measuredMinVolts) / 20;
			let pastMin = (this.measuredMaxVolts + 19 * this.measuredMinVolts) / 20;
		}
		else {
			// make sure that a zero potential (or constant) results in the voltageSettings defaults)
			this.heightVolts = 2 * EFFECTIVE_VOLTS;
			this.bottomVolts = this.measuredMinVolts - EFFECTIVE_VOLTS;
		}

		if (traceVoltArithmetic) {
			this.dumpVoltDisplay('⚡️ ⚡️ decideBottomHeightVolts: ');
		}
	}

	// set our xScale and yScale according to the numbers passed in, and our own settings
	// used by VoltArea to plot potential
	setVoltScales(canvasWidth, canvasHeight, nPoints) {
		isOK(this.bottomVolts); isOK(this.heightVolts); isOK(canvasHeight); isOK(canvasWidth);

		// these are used to draw the voltage path line in VoltArea
		this.yScale = scaleLinear([this.bottomVolts, this.bottomVolts + this.heightVolts], [0, canvasHeight]);
		this.yUpsideDown = scaleLinear([this.bottomVolts, this.bottomVolts + this.heightVolts], [canvasHeight, 0]);
		this.xScale = scaleLinear([0, nPoints-1], [0, canvasWidth]);

		if (traceVoltScales) {
			console.log(`⚡️ ⚡️   voltagearea.setVoltScales()  done\n X domain & range: `);
			console.log(`    X domain & range: `, this.xScale.domain(), this.xScale.range());
			console.log(`    Y domain & range: `, this.yScale.domain(),  this.yScale.range());
			console.log(`    Y UpsideDown: `, this.yUpsideDown.domain(),  this.yUpsideDown.range());
			console.log(`    Zero at: `, this.xScale(0),  this.yScale(0),  this.yUpsideDown(0));
		}
		return true;
	}


	/* ******************************************************************* interaction */

	// called after user changed bottom and/or  height (zoomed or scrolled).
	saveScroll() {
		storeASetting('voltageSettings', 'bottomVolts', +this.bottomVolts);
		storeASetting('voltageSettings', 'heightVolts', +this.heightVolts);
		//storeASetting('voltageSettings', 'minBottom', +this.minBottom);

		// this function is set in the VoltArea constructor
		//this.updateVoltageArea();
	}

	// called when user scrolls up or down.
	// frac = 1=scrolled to top, one click.  -1=scrolled toward bottom, one click.
	// Other schromll mechanisms pass other proprtional numbers
	scrollVoltHandler(frac) {
		let distance = this.heightVolts * frac / 4;

		this.bottomVolts += distance;

		//storeASetting('voltageSettings', 'bottomVolts', this.bottomVolts);
		if (traceScrolling)
			console.info(`userScroll(frac=${frac}) => bottomVolts=${this.bottomVolts}`);
		this.saveScroll();
	}

	// called when human zooms in or out.  pass +1 or -1.  heightVolts expands or contracts a fixed  factor up and down.
	zoomVoltHandler(inOut) {
		// keep looking at same place
		let midView = this.bottomVolts + this.heightVolts/2;

		if (traceZooming)
			this.dumpVoltDisplay(`zoom START ${inOut}: old midView=${midView}  sFrac=${scrollFraction}`);

		// zoom in/out to int powers of ZoomFactor.
		// let newLogZoom = Math.log(this.heightVolts) / logZoomFactor;
		// newLogZoom = Math.round(newLogZoom - inOut);  // round off to integer power of ZoomFactor
		this.heightVolts *= zoomFactor ** inOut;

		// the rests of this is exactly the same no matter which direction
		this.bottomVolts = midView - this.heightVolts / 2;

		this.saveScroll();
	}


	/* ******************************************************************* familiar potential filling */

	// fill the buffer with a constant from A to B
	fillVoltage(fillWith, start = this.start, end = this.end) {
		for (let ix = start; ix < end; ix++)
			this.voltageBuffer[ix] = fillWith;
	}

	// pre-calc variables needed for evaluating the voltage familiarly
	slotVoltageSetup(voltageParams) {
		const {voltageCenter, slotWidth} = voltageParams;
		const toIx = (this.end - this.start) / 100;  // converts 0...100 across to  0...N
		this.offset = voltageCenter * toIx;

		const halfSlotWidth = slotWidth * toIx / 2;
		this.edgeStart = round(this.offset - halfSlotWidth);
		this.edgeEnd = round(this.offset + halfSlotWidth);
	}

	// pre-calc variables needed for evaluating the voltage familiarly
	canyonVoltageSetup(voltageParams) {
		const {voltageCenter, slotWidth} = voltageParams;

		const toIx = (this.end - this.start) / 100;  // converts 0...100 across to  0...N
		this.halfN = (this.end - this.start) / 2;
		this.offset = voltageCenter * toIx;
	}

	canyonVoltage(ix, voltageParams) {
		let xm1_1 = (ix - this.offset) / this.halfN;  // -1...+1
		let y0_1 = Math.pow(abs(xm1_1), voltageParams.canyonPower);  // 0 ... +1

		if (!isFinite(y0_1)) {
			// needs correction
			console.warn(`voltage ${y0_1 * EFFECTIVE_VOLTS} not finite at x=${ix} ${JSON.stringify(voltageParams)}
				ix - offset=${ix - offset}
				x ** ${canyonPower}=${Math.pow(ix - offset, canyonPower)}
				x ** ${canyonPower} * ${canyonScale}=
				${Math.pow(ix - offset, canyonPower) * canyonScale}`);
		}
		return y0_1 * voltageParams.canyonScale;
	}

	// generate a canyon, flat etc voltage potential in the given array, according to params.
	setFamiliarVoltage(voltageParams) {
		let {voltageCenter, voltageBreed, canyonPower, canyonScale, slotScale, slotWidth} = voltageParams;
		if (canyonPower == undefined || canyonScale == undefined || slotScale == undefined || voltageCenter == undefined)
			throw `bad Voltage params: slotScale=${slotScale}, canyonPower=${canyonPower}, canyonScale=${canyonScale},
				voltageCenter=${voltageCenter}`;

		if (traceFamiliar)
			console.log(`⚡️ starting setFamiliarVoltage(`, voltageParams);

		// figure out these ixs from percents
		switch (voltageBreed) {
		case 'flat':
			this.fillVoltage(0);
			break;

		case 'slot':
			this.slotVoltageSetup(voltageParams);
			this.fillVoltage(0);
			this.fillVoltage(-slotScale, this.edgeStart, this.edgeEnd)
			break;

		case 'block':
			this.slotVoltageSetup(voltageParams);
			this.fillVoltage(0);
			this.fillVoltage(slotScale, this.edgeStart, this.edgeEnd)
			break;

		case 'canyon':
			// the actual formula is like y = x ** p, where 0 <= y <= 1 and -1 <= x <= 1
			// 	let halfN = (this.end - this.start) / 2;
			// 	let topVolts = (canyonScale * VALLEY_FACTOR);  // ??
			this.canyonVoltageSetup(voltageParams);

			for (let ix = this.start; ix < this.end; ix++) {
				this.voltageBuffer[ix] = this.canyonVoltage(ix, voltageParams);
			}
			break;

		default:
			console.warn(`setFamiliarVoltage: no breed`, voltageParams);
		}

		if (traceFamiliar)
			this.dumpVoltage(`done with setFamiliarVoltage()`);
	}

	// set bottomVolts and heightVolts to see the results of setFamiliarVolts()
	setAppropriateRange(voltageParams) {

		if (traceFamiliar)
			console.log(`⚡️ starting setAppropriateRange(`, voltageParams);

		const MARGIN = EFFECTIVE_VOLTS / 2;
		let bottom, height;

		switch (voltageParams.voltageBreed) {
		case 'flat':
			bottom = -MARGIN;
			height = 2 * MARGIN;
			break;

		case 'slot':
			height = voltageParams.slotScale + 2*MARGIN;
			//height = 5 * sqrt(EFFECTIVE_VOLTS * voltageParams.slotScale ** 2 ) + 2*MARGIN
			bottom = -height + MARGIN;
			break;

		case 'block':
			height = voltageParams.slotScale + 2*MARGIN
			//height = 5 * sqrt(EFFECTIVE_VOLTS * voltageParams.slotScale ** 2 ) + 2*MARGIN
			bottom = - MARGIN;
			break;

		case 'canyon':
			// always, the max is one or the other end.
			this.canyonVoltageSetup(voltageParams);
			let startVal = this.canyonVoltage(this.start, voltageParams);
			let endVal = this.canyonVoltage(this.end-1, voltageParams);
			let highest = max(startVal, endVal);

			// But autoscaling hides changes in scale so do this
			height =  sqrt(highest * EFFECTIVE_VOLTS) + MARGIN;
			bottom = -MARGIN / 2;
			break;

		default:
			console.warn(`setAppropriateRange: no breed`, voltageParams);
 		}

		this.bottomVolts = bottom;
		this.heightVolts = height;
		if (traceFamiliar)
			this.dumpVoltDisplay(`setAppropriateRange(): `);
	}

	/* **************************************************************************** Rendering */
	// make the value for the 'd' attribute on an svg <path element
	// from start to end, on your space, using std volts array from WaveView
	// usedYScale is either yScale or yUpsideDown; your choice
	makeVoltagePathAttribute(usedYScale) {
		let start = this.start;
		let end = this.end;
		if (tracePathAttribute)
			console.log(`⚡️voltDisplay.makePathAttribute(${start}, ${end})`);

		// yawn too early?
		if (! usedYScale) {
			if (tracePathAttribute)
				console.warn(`⚡️ 🧨  makePathAttribute(): no yScale so punting`);
			return `M0,0`;
		}

		const voltageBuffer = this.voltageBuffer;

		// array to collect small snippets of text.  Try to avoid recreating it all the time.
		this.points ??= new Array(this.end + this.start);
		let points = this.points;
		let x, y, pt;

		//let y = usedYScale(voltageBuffer[start]);  //qe.get1DVoltage(dim.start);
		//let x = this.xScale(start);
		if (start) points[0] = points[end] = '';

		// get ready to stop and start the path if needed
		let didMove = false, didLine = false;
		for (let ix = start; ix < end; ix++) {
			x = this.xScale(ix);
			if ((x==null) || !isFinite(x))
				debugger;

			// ±∞ come out as NaN.
			y = usedYScale(voltageBuffer[ix]);
			if (tracePathIndividualPoints)
				console.log(`⚡️    x=${x}  y=${y}`);
			if (isNaN(y) || y < -TOO_MANY_VOLTS || y > TOO_MANY_VOLTS) {
				// Absent.  the line ends here, for this pt and maybe a few more; just omit it
				didMove = didLine = false;
				pt = '';
			}
			else {
				pt = `${x.toFixed(1)},${y.toFixed(1)}`;
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
		return final;
	}
}

export default voltDisplay;
