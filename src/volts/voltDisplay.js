/*
** volt display -- calculations for display of the voltage
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import qeConsts from '../engine/qeConsts.js';
import {scaleLinear} from 'd3-scale';
import {EFFECTIVE_VOLTS, VALLEY_FACTOR, TOO_MANY_VOLTS} from './voltConstants.js';
import {getAGroup, storeASetting} from '../utils/storeSettings.js';

let traceFamiliar = false;
let tracePathAttribute = false;
let tracePathIndividualPoints = false;

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
// NOT A COMPONENT; just an object
export class voltDisplay {
	// make it from given settings obj. Note we don't get the buffer from the space,
	// cuz the Voltage minigraph needs its own buffer
	constructor(label, start, end, continuum, voltageBuffer, settings) {
		// point-by-point voltage values, + start and end of voltage buffer, aligned with waves
		this.label = label;
		this.start = start;
		this.end = end;
		this.continuum = continuum;
		this.voltageBuffer = voltageBuffer;

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

	// create a voltDisplay the way the space needs it
	static newForSpace(space) {
		let vDisp = new voltDisplay('space',
			space.start, space.end, space.continuum,
//			space.start, space.end, space.continuum,
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

	/* ******************************************************* height and bottom calculations */

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

	/* ***************************************************************** Rendering */

 	// set our xScale and yScale according to the numbers passed in, and our own settings
	// used by VoltArea to plot potential.  X in units of dx, Y in units of volts
	// I think I call this too many times (?)
	setVoltScales(drawingLeft, drawingWidth, canvasHeight) {
		isOK(this.bottomVolts); isOK(this.heightVolts);
		isOK(drawingLeft); isOK(drawingWidth); isOK(canvasHeight);

		// these are used to draw the voltage path line in VoltArea
		this.yScale = scaleLinear(
			[this.bottomVolts, this.bottomVolts + this.heightVolts],
			[0, canvasHeight]);
		this.yUpsideDown = scaleLinear(
			[this.bottomVolts, this.bottomVolts + this.heightVolts],
			[canvasHeight, 0]);
		this.canvasHeight = canvasHeight;

		// the actual datapoints are on the edges between segments.
		// So, 8 states means nPoints=10 means 9 or 10 segments.  Sortof.
		// For contENDLESS, this means 9 segments drawn cuz it duplicates the
		//     boundary bar on each end.  Resonant wavelength is 8.
		// For contWELL, this means the data edges on each end are zero, with 8
		//     actual datapoints for the state.  10 segments drawn, although the
		//     outer 2 go off to infinity.  Resonant wavelength is 9.
		// no that's not  right....
		let most = this.end;
		//let most = (qeConsts.contENDLESS == this.continuum) ? this.end :  this.start + this.end;
		this.xScale = scaleLinear(
			[0, most],
			[drawingLeft, drawingLeft + drawingWidth]);

		if (traceVoltScales) {
			console.log(`⚡️ ⚡️   voltagearea.setVoltScales()  done
					X domain & range: `, this.xScale.domain(), this.xScale.range(), `
				Y domain & range: `, this.yScale.domain(),  this.yScale.range(), `
					Y UpsideDown: `, this.yUpsideDown.domain(),  this.yUpsideDown.range(), `
					Zero at: `, this.xScale(0),  this.yScale(0),  this.yUpsideDown(0));
		}
		return true;
	}

	// make the value for the 'd' attribute on an svg <path element
	// from start to end, on your space, using std volts array from WaveView
	// usedYScale is either yScale or yUpsideDown; your choice
	makeVoltagePathAttribute(usedYScale) {
		let start = this.start;
		let end = this.end;
		if (tracePathAttribute)
			console.log(`⚡️voltDisplay.makePathAttribute(${start}, ${end})`);

		// for tracing.  long decimal numbers are depresssing
		const tpip = (x, y, title = '') => {if (tracePathIndividualPoints)
			console.log(`    ⚡️${title} x=${x}  y=${y}`)};

		// yawn too early?
		if (! usedYScale) {
			if (tracePathAttribute)
				console.warn(`⚡️ 🧨  makePathAttribute(): no yScale so punting`);
			return `M0,0`;
		}

		const voltageBuffer = this.voltageBuffer;

		// array to collect small snippets of text like '371,226' or
		// 'L371,226'.  Avoid recreating array.
		if (!this.points)
			this.points = new Array(this.end + this.start);
		let points = this.points;
		let x, y, pt;

		if (tracePathIndividualPoints)
			console.log(`⚡️ makeVoltagePathAttribute pts `);

		// get ready to stop and start the path if needed
		let didMove = false, didLine = false;
		switch (this.continuum) {
		case qeConsts.contDISCRETE:
			throw new Error(`discrete continuum in makeVoltagePathAttribute`);

		case qeConsts.contWELL:
			// potential at the ends of the well are 'infinite'; therefore regular points run start ... end-1.
			// just do a line going up on each end.  skyHigh isn't ∞ but should get slanted line
			let skyHigh = usedYScale(this.bottomVolts + 5 * this.heightVolts).toFixed(1);

			x = this.xScale(0).toFixed(1);
			points[0] = `M${x},` + skyHigh;
			didMove = true;
			didLine = false;
			tpip(x, skyHigh, '️left bumper');

			// should I get rid of this if the point at end-1 is NAN?  probably.  unlikely, though
			x = this.xScale(end).toFixed(1);
			points[end] = `L${x},` + skyHigh;
			tpip(x, skyHigh, '️right bumper');
			break;

		case qeConsts.contENDLESS:
			// make the voltage buffer wraparound
			voltageBuffer[0] = voltageBuffer[end-1];
			voltageBuffer[end] = voltageBuffer[1];

			// we're doing the whole thing including the wraparound ends.  NO!  looks weird
			//start = 0;
			//end = this.start + this.end;
			didMove = false;
			didLine = false;
			break;

		default:
			debugger;
			throw new Error(`⚡️  bad continuum '${continuum}' in  makeVoltagePathAttribute()`);
		}

		for (let ix = start; ix < end; ix++) {
			x = this.xScale(ix);
			if ((x==null) || !isFinite(x))
				debugger;
			x = x.toFixed(1);

			// ±∞ come out as NaN.
			y = usedYScale(voltageBuffer[ix]);
			if (isNaN(y) || y < -TOO_MANY_VOLTS || y > TOO_MANY_VOLTS) {
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
		return final;
	}

	/* ******************************************************************* interaction */

	// called when user scrolls up or down.
	// frac = fraction of a height, 1=scrolled to top, one click.  -1=scrolled toward bottom, one click.
	// Other scroll mechanisms pass other proportional numbers
	scrollVoltHandler(frac) {
		let distance = this.heightVolts * frac / 4;

		this.setBottomVolts(this.bottomVolts + distance);

		if (traceScrolling)
			console.info(`userScroll(frac=${frac}) => bottomVolts=${this.bottomVolts}`);
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


	/* ******************************************************************* familiar voltage filling */

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
	// isn't this different for the well?
	canyonVoltageSetup(voltageParams) {
		const toIx = (this.end - this.start) / 100;  // how big is 1% of domain
		this.offset = voltageParams.voltageCenter * toIx;  // convert center to ix units
		this.halfN = (this.end - this.start) / 2;
	}

	canyonVoltage(ix, voltageParams) {
		let xm1_1 = (ix - this.offset) / this.halfN;  // x value to raise to the power for this ix value
		let y0_1 = Math.pow(abs(xm1_1), voltageParams.canyonPower);  // 0 ... +1

		if (!isFinite(y0_1)) {
			// needs correction
			console.warn(`voltage ${y0_1 * EFFECTIVE_VOLTS} not finite at x=${ix} `
			+`${JSON.stringify(voltageParams)}
				ix - offset=${ix - offset}
				x ** ${canyonPower}=${Math.pow(ix - offset, canyonPower)}
				x ** ${canyonPower} * ${canyonScale}=
				${Math.pow(ix - offset, canyonPower) * canyonScale}`);
		}
		return y0_1 * voltageParams.canyonScale;
	}

	// generate a canyon, flat etc voltage potential in the given array, according to params.
	setFamiliarVoltage(voltageParams) {
		let {voltageCenter, voltageBreed, canyonPower, canyonScale,
			slotScale, slotWidth} = voltageParams;
		if (canyonPower == undefined || canyonScale == undefined || slotScale == undefined
			|| voltageCenter == undefined) {
debugger;
			throw `bad Voltage params: slotScale=${slotScale}, canyonPower=${canyonPower},`
			+`canyonScale=${canyonScale}, voltageCenter=${voltageCenter}`;}

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

		// notice how we cheated  above?  tell react
		this.setAPoint?.(1, this.voltageBuffer[1]);

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
			// always, the max is one or the other end, or the zero point.
			this.canyonVoltageSetup(voltageParams);
			let startVal = this.canyonVoltage(this.start, voltageParams);
			let endVal = this.canyonVoltage(this.end-1, voltageParams);
			let zeroVal = this.canyonVoltage(this.offset, voltageParams);
			let highest = max(startVal, endVal, zeroVal);
			let lowest = min(startVal, endVal, zeroVal);

			// But autoscaling hides changes in scale so do this
			height =  (highest - lowest);
			bottom = lowest;
			let aBitExtra = MARGIN - height;
			//			if (aBitExtra > 0) {
			//				height = MARGIN
			//				bottom -= MARGIN / 2;
			//			}
			//height =  sqrt(abs(highest * EFFECTIVE_VOLTS)) + MARGIN;
			//bottom = -MARGIN / 2;
			break;

		default:
			console.warn(`setAppropriateRange: no breed`, voltageParams);
		}

		this.bottomVolts = bottom;
		this.heightVolts = height;
		if (traceFamiliar)
			this.dumpVoltDisplay(`setAppropriateRange(): `);
	}


}

export default voltDisplay;
