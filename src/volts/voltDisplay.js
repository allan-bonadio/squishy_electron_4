/*
** volt display -- calculations for display of the voltage
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

import {scaleLinear} from 'd3-scale';
import {EFFECTIVE_VOLTS, VALLEY_FACTOR, TOO_MANY_VOLTS} from './voltConstants.js';
import {getAGroup, storeASetting} from '../utils/storeSettings.js';

let traceFamiliar = false;
let tracePathAttribute = false;

let traceVoltArithmetic = false;
let traceVoltScales = false;
let traceScrolling = false;
let traceZooming = false;


const min = Math.min;
const max = Math.max;
const abs = Math.abs;

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

		let txt = `⚡️ dumpVoltage buffer: ${title} `;
		for (let ix = this.start; ix < this.end; ix++) {
			txt += voltageArray[ix].toFixed(6).padStart(10);
			if (ix % skipAllButEvery == 0)
				txt += '\n';
		}
		console.log(`${txt}\n`);
	}

	// all of our tedious properties, but not the datapoints
	dumpVoltDisplay(title) {
		console.log(`⚡️ voltD: ${title}
			voltage range: ${this.measuredMinVolts} ... ${this.measuredMaxVolts},
			//scroll: ${this.minBottom}mnBot ... ${this.maxBottom}mxBot  ... ${this.maxTop}mxTop
			heightVolts: ${this.heightVolts}    bottomVolts: ${this.bottomVolts}`);
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

	// Adjust bottomVolts and heightVolts to the existing wave numbers, so it looks nice.
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

		// this.dumpVoltDisplay('decideBottomHeightVolts: set to defaults');
		// 	return;
		// }


		if (traceVoltArithmetic) {
			console.log(``);
			//dumpJsStack('decideBottomHeightVolts');
			this.dumpVoltDisplay('⚡️ ⚡️ decideBottomHeightVolts: ');
		}

		// check and adjust if out of bounds.
		// if (this.minBottom > almostMax ||  this.maxTop < almostMin) {
		// 	this.minBottom = this.measuredMinVolts;
		// 	this.heightVolts = max(this.heightVolts, (this.measuredMaxVolts - this.measuredMinVolts) / 2);
		// 	//this.setMaxMaxBottom();
		// 	this.dumpVoltDisplay('decideBottomHeightVolts: sorry had to adjust');
		// 	return;
		// }
	}

	// set our xScale and yScale according to the numbers passed in, and our own settings
	// used by VoltageArea to plot potential
	setVoltScales(canvasWidth, canvasHeight, nPoints) {
		isOK(this.bottomVolts); isOK(this.heightVolts); isOK(canvasHeight); isOK(canvasWidth);

		// these are used to draw the voltage path line in VoltageArea
		this.yScale = scaleLinear([this.bottomVolts, this.bottomVolts + this.heightVolts], [0, canvasHeight]);
		this.yUpsideDown = scaleLinear([this.bottomVolts, this.bottomVolts + this.heightVolts], [canvasHeight, 0]);
		this.xScale = scaleLinear([0, nPoints-1], [0, canvasWidth]);

		if (traceVoltScales) {
			console.log(
				`⚡️ ⚡️   voltagearea.setVoltScales():done, domains: x&y:\n       `,
				this.xScale.domain(), this.yScale.domain());
			console.log(`       ranges: x&y:`, this.xScale.range(), this.yScale.range());
		}
		return true;
	}


	// given measuredMinVolts & Max, and heightVolts,
	// user can see a voltage range of 2*heightVolts.  By scrolling, they can see 2x heightVolts.
	// Half above and half below middleVolts.  Scroller will end up with middleVolts in the middle.
	// bottomVolts is at the BOTTOM of the view, remember.
	// 	centerVariables(heightVolts) {
	// 		this.findVoltExtremes();
	//
	// 		// middleVolts should be the middle of the highest and lowest voltage in the buffer.
	// 		this.heightVolts = heightVolts;
	// 		let middleVolts = (this.measuredMinVolts + this.measuredMaxVolts) / 2;
	// 		//this.bottomVolts = middleVolts - .5 * heightVolts;  // near bottom of the visible area
	// 		//this.minBottom = middleVolts - heightVolts;
	// 		//this.setMaxMaxBottom();
	// 	}


	/* ******************************************************************* interaction */

	// called after user scrolls up or down.
	saveScroll() {
		storeASetting('voltageSettings', 'bottomVolts', +this.bottomVolts);
		storeASetting('voltageSettings', 'heightVolts', +this.heightVolts);
		//storeASetting('voltageSettings', 'minBottom', +this.minBottom);
	}

	// called when user scrolls up or down.
	// frac = 1=scrolled to top, 0=scrolled to bottom
	userScroll(frac) {
		this.bottomVolts = min(1, max(0, frac)) * this.heightVolts + this.minBottom;// ??
		//storeASetting('voltageSettings', 'bottomVolts', this.bottomVolts);
		if (traceScrolling)
			console.info(`userScroll(frac=${frac}) => bottomVolts=${this.bottomVolts}`);
		return this.bottomVolts;
	}

	// called when human zooms in or out.  pass +1 or -1.  heightVolts will
	// usually be an integer power of zoomFactor, x latest set from decideBottomHeightVolts() or zero.
	userZoom(upDown) {
		// keep looking at same place
		let midView = this.bottomVolts + this.heightVolts/2;

		// want to keep the scrollbar in the same place.
		//let scrollFraction = (this.bottomVolts - this.minBottom) / this.heightVolts;  // ??

		if (traceZooming)
			this.dumpVoltDisplay(`zoom START ${upDown}: old midView=${midView}  sFrac=${scrollFraction}`);

		// zoom in/out to int powers of ZoomFactor.
		// let newLogZoom = Math.log(this.heightVolts) / logZoomFactor;
		// newLogZoom = Math.round(newLogZoom - upDown);  // round off to integer power of ZoomFactor
		this.heightVolts *= zoomFactor ** upDown;

		// the rests of this is exactly the same no matter which direction
		this.bottomVolts = midView - this.heightVolts / 2;
		//this.minBottom = this.bottomVolts - scrollFraction * this.heightVolts;// ??

		//this.setMaxMax();

// 		if (traceZooming)
// 			this.dumpVoltDisplay(`zoom: DONE  ${upDown} new midView=${ this.bottomVolts + this.heightVolts/2}, scrollFraction=${(this.bottomVolts - this.minBottom) / this.heightVolts};`);

		this.saveScroll();
	}

	// for Block or Slot voltage: rectangular indentation or wall
	setSlotVoltage() {
	}

	// generate a canyon, flat etc voltage potential in the given array, according to params.
	setFamiliarVoltage(voltageParams) {
		this.bottomVolts = ('flat' == voltageParams.voltageBreed
				|| 0 == voltageParams.canyonScale)
			? -EFFECTIVE_VOLTS
			: 0;
		let {canyonPower, canyonScale, voltageSlide, voltageBreed} = voltageParams;
		if (canyonPower == undefined || canyonScale == undefined || voltageSlide == undefined)
			throw `bad Voltage params: canyonPower=${canyonPower}, canyonScale=${canyonScale},
				voltageSlide=${voltageSlide}`;

		if (traceFamiliar)
			console.log(`starting setFamiliarVoltage(`, voltageParams);
		const offset = voltageSlide / 100 * (this.end - this.start);
		if ('flat' == voltageBreed) {
			for (let ix = this.start; ix < this.end; ix++)
				this.voltageBuffer[ix] = 0;
		}
		else {
			// the actual formula is like y = x ** p, where 0 <= y <= 1 and -1 <= x <= 1
			let halfN = (this.end - this.start) / 2;
			let topVolts = (canyonScale * VALLEY_FACTOR);
			for (let ix = this.start; ix < this.end; ix++) {
				let x01 = (ix - offset - halfN) / halfN;
				let y01 = Math.pow(abs(x01), canyonPower)
				let pot = y01 * topVolts;

				if (isNaN(pot)) {
					console.warn(`voltage ${pot} not finite at x=${ix} ${JSON.stringify(voltageParams)}
						ix - offset=${ix - offset}
						x ** ${canyonPower}=${Math.pow(ix - offset, canyonPower)}
						x ** ${canyonPower} * ${canyonScale}=
						${Math.pow(ix - offset, canyonPower) * canyonScale}`);
				}
				this.voltageBuffer[ix] = pot;
			}
		}

		if (traceFamiliar)
			this.dumpVoltage(`done with setFamiliarVoltage()`);
	}

	// Rendering
	// make the value for the 'd' attribute on an svg <path element
	// from start to end, on your space, using std volts array from WaveView
	// usedYScale is either yScale or yUpsideDown; your choice
	makeVoltagePathAttribute(usedYScale) {
		let start = this.start;
		let end = this.end;
		if (tracePathAttribute)
			console.log(`⚡️ ⚡️ voltDisplay.makePathAttribute(${start}, ${end})`);

		// yawn too early?
		if (! usedYScale) {
			if (tracePathAttribute)
				console.log(`⚡️ ⚡️ makePathAttribute(): no yScale so punting`);
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
				else {
					// spaces between xy pairs make them easier to read, and they repeat L
					pt = ' ' + pt;
				}
			}
			points[ix] = pt;
		}

		let final = points.join('');
		if (tracePathAttribute) {
			console.log(`⚡️ ⚡️  voltDisplay.makePathAttribute: done`, final);
		}
		return final;
	}
}

export default voltDisplay;
