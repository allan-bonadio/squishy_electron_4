/*
** voltage utils -- since there's no wrapper class, some code to do useful things
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import {scaleLinear} from 'd3-scale';

//import qe from '../engine/qe.js';
//import {getASetting} from '../utils/storeSettings.js';
import {getAGroup, storeASetting} from '../utils/storeSettings.js';

let traceFamiliar = true;
let tracePathAttribute = false;

let traceVoltArithmetic = false;
let traceVoltScales = false;
let traceScrolling = false;

// raw numbers ~ 100 are way too big and throw it all into chaos
const VALLEY_FACTOR = .001;

const TOO_MANY_VOLTS = 1e30;

// zooming in or out, changes the heightVolts by this factor either way.
// If it's not an even power, it'll round off to the nearest integer power.
const zoomFactor = Math.sqrt(2);
const logZoomFactor = Math.log(zoomFactor);

const isOK = (c) => {
	if (c == null || !isFinite(c)) {
		console.error(`bad value`, c);
		debugger;
	}
}

// this contains the voltage scrolling and zooming numbers and what's visible
export class voltDisplay {
	// make it from given settings obj. Note we don't get the buffer from the space,
	// cuz the Voltage minigraph needs its own buffer
	constructor(start, end, voltageBuffer, settings) {
		// actual voltage buffer, min & max
		//this.voltMin = 0, this.voltMax = 0,

		// point-by-point voltage values, + start and end of voltage buffer, aligned with waves
		this.voltageBuffer = voltageBuffer;
		this.start = start;
		this.end = end;

		this.scrollMin = settings.scrollMin;

		// how many volts higher the top edge of the view is from bottomVolts.
		// Zoom increases/decreases this.
		this.heightVolts = settings.heightVolts;
		this.setMaxMax();

		// where the bottom of the viewable voltage window is.  in volts.
		// Scrolling changes this.
		this.bottomVolts = settings.bottomVolts;

		// adjust the range over which the user can slide the bottomVolts, and
		// therefore the view, up and down. These also are recalculated when
		// zooming, but not when scrolling. scrollMin is the lowest the
		// bottomVolts can be.  scrollMax is the highest.
		this.adjustScrollBounds();
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
	dumpVoltage(title, voltageArray = this.voltageBuffer, nPerRow = 1, skipAllButEvery = 1) {
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

	// all of our tedious properties
	dumpVoltDisplay(title) {
		console.log(`⚡️ dumpVoltDisplay: ${title}
			voltage range: ${this.voltMin} ... ${this.voltMax},
			scroll: ${this.scrollMin}sm ... ${this.scrollMax}sm  ... ${this.actualMax}am
			heightVolts: ${this.heightVolts}    bottomVolts: ${this.bottomVolts}`);
	}

	// actually measure the voltage signal, get min & max
	findVoltExtremes() {
		let voltageBuffer = this.voltageBuffer;
		let mini = Infinity, maxi = -Infinity;
		for (let ix = this.start; ix < this.end; ix++) {
			mini = Math.min(voltageBuffer[ix], mini);
			maxi = Math.max(voltageBuffer[ix], maxi)
		}
		this.voltMin = mini;
		this.voltMax = maxi;
	}

	// given totally new scrollMin and height, figure out the other maxes
	setMaxMax() {
		this.scrollMax = this.scrollMin + this.heightVolts;
		this.actualMax = this.scrollMax + this.heightVolts;
	}

	// given totally new scrollMin and height, figure out all the rest, to center the scroll
	setMaxMaxBottom() {
		this.setMaxMax();
		this.bottomVolts = this.scrollMin + this.heightVolts / 4;
	}


	// make sure mins an maxes enclose at least part of the existing voltage - redo if not
	adjustScrollBounds() {
		// make sure some part of the current voltage is visible somewhere - adjust bottomVolts if needed
		this.findVoltExtremes();

		// this would be trouble, so come up with something
		if (this.heightVolts == 0) {
			// these will change... first, decide a heightVolts
			let approx = Math.abs(this.voltMin) + Math.abs(this.voltMax);
			this.heightVolts = (approx || 8) / 8;
			// (also, make sure that a zero potential results in the voltageSettings defaults)

			// this is bs... guessing at numbers that could be anywhere
			this.scrollMin = this.voltMin - this.heightVolts/2;
			this.setMaxMaxBottom();
			this.dumpVoltDisplay('adjustScrollBounds: set to defaults');
			return;
		}

		// if it's not 5% inside min and max, then normalize it to existing extremes
		let almostMax = (19 * this.voltMax + this.voltMin) / 20;
		let almostMin = (this.voltMax + 19 * this.voltMin) / 20;

		if (traceVoltArithmetic) {
			console.log(`⚡️ ⚡️ adjustScrollBounds: almostMin=${almostMin} almostMax=${almostMax}`);
			//dumpJsStack('adjustScrollBounds');
			this.dumpVoltDisplay('before adjustment, if any, @adjustScrollBounds');
		}

		// check and adjust if out of bounds.
		if (this.scrollMin > almostMax ||  this.actualMax < almostMin) {
			this.scrollMin = this.voltMin;
			this.heightVolts = Math.max(this.heightVolts, (this.voltMax - this.voltMin) / 2);
			this.setMaxMaxBottom();
			this.dumpVoltDisplay('adjustScrollBounds: sorry had to adjust');
			return;
		}
	}

	// set our xScale and yScale according to the numbers passed in, and our own settings
	// used by VoltageArea to plot potential
	setVoltScales(canvasWidth, canvasHeight, nPoints) {
		isOK(this.bottomVolts); isOK(this.heightVolts); isOK(canvasHeight); isOK(canvasWidth);

		// these are used to draw the voltage path line in VoltageArea
		this.yScale = scaleLinear([this.bottomVolts, this.bottomVolts + this.heightVolts], [0, canvasHeight]);
		this.xScale = scaleLinear([0, nPoints-1], [0, canvasWidth]);

		if (traceVoltScales) {
			console.log(
				`⚡️ ⚡️   voltagearea.setVoltScales():done, domains: x&y:\n       `,
				this.xScale.domain(), this.yScale.domain());
			console.log(`       ranges: x&y:`, this.xScale.range(), this.yScale.range());
		}
		return true;
	}

	// given voltMin & Max, and heightVolts,
	// user can see a voltage range of 2*heightVolts.  By scrolling, they can see 2x heightVolts.
	// Half above and half below middleVolts.  Scroller will end up with middleVolts in the middle.
	// bottomVolts is at the BOTTOM of the view, remember.
	centerVariables(heightVolts) {
		this.findVoltExtremes();

		// middleVolts should be the middle of the highest and lowest voltage in the buffer.
		this.heightVolts = heightVolts;
		let middleVolts = (this.voltMin + this.voltMax) / 2;
		this.bottomVolts = middleVolts - .5 * heightVolts;  // bottom of the visible area
		this.scrollMin = middleVolts - heightVolts;
		this.setMaxMaxBottom();
	}

	// called when user scrolls up or down.  can't get past the mins/maxes
	saveScroll() {
		storeASetting('voltageSettings', 'bottomVolts', +this.bottomVolts);
		storeASetting('voltageSettings', 'heightVolts', +this.heightVolts);
		storeASetting('voltageSettings', 'scrollMin', +this.scrollMin);
	}

	// called when user scrolls up or down.  can't get past the mins/maxes
	// frac = 1=scrolled to top, 0=scrolled to bottom
	changeScroll(frac) {
		this.bottomVolts = Math.min(1, Math.max(0, frac)) * this.heightVolts + this.scrollMin;
		storeASetting('voltageSettings', 'bottomVolts', this.bottomVolts);
		if (traceScrolling)
			console.info(`changeScroll(frac=${frac}) => bottomVolts=${this.bottomVolts}`);
		return this.bottomVolts;
	}

	// called when human zooms in or out.  pass +1 or -1.  heightVolts will usually be an integer power of zoomFactor.
	changeZoom(upDown) {
		let newLogZoom = Math.log(this.heightVolts) / logZoomFactor;
		newLogZoom = Math.round(newLogZoom - upDown);  // round off to integer power of zoom Factor
		let heightVolts = zoomFactor ** newLogZoom;

		this.centerVariables(heightVolts);
		this.saveScroll();
	}

	// set a canyon, flat or double voltage potential in the given array, according to params.
	// No space needed.
	setFamiliarVoltage(voltageParams) {
		//const {start, end, N} = space.startEnd;
		let {canyonPower, canyonScale, canyonOffset, voltageBreed} = voltageParams;
		if (canyonPower == undefined || canyonScale == undefined || canyonOffset == undefined)
			throw `bad Voltage params: canyonPower=${canyonPower}, canyonScale=${canyonScale},
				canyonOffset=${canyonOffset}`;

		if (traceFamiliar)
			console.log(`starting setFamiliarVoltage(`, voltageParams);
		const offset = canyonOffset * (this.end - this.start) / 100;
		if ('flat' == voltageBreed) {
			for (let ix = this.start; ix < this.end; ix++)
				this.voltageBuffer[ix] = 0;
		}
		else {
			for (let ix = this.start; ix < this.end; ix++) {
				let pot = Math.pow(Math.abs(ix - offset), canyonPower) * (canyonScale * VALLEY_FACTOR);  // * VALLEY_FACTOR);

				if (isNaN(pot)) {
					// wait i know this situation - pow generates NaN when it should generate ±∞
					if (canyonPower < 0)
						pot = Infinity * canyonScale;
					else {
						console.warn(`voltage ${pot} not finite at x=${ix} ${JSON.stringify(voltageParams)}
							ix - offset=${ix - offset}
							x ** ${canyonPower}=${Math.pow(ix - offset, canyonPower)}
							x ** ${canyonPower} * ${canyonScale}=
							${Math.pow(ix - offset, canyonPower) * canyonScale}`);
					}
				}
				this.voltageBuffer[ix] = pot;
			}
		}

		if (traceFamiliar)
			this.dumpVoltage(`done with setFamiliarVoltage()`);
	}

	// make the value for the 'd' attribute on a <path element
	// from start to end, on your space, using std volts array from WaveView
	makeVoltagePathAttribute() {
		let start = this.start;
		let end = this.end;
		if (tracePathAttribute)
			console.log(`⚡️ ⚡️ voltDisplay.makePathAttribute(${start}, ${end})`);

		// yawn too early?
		if (! this.yScale) {
			if (tracePathAttribute)
				console.log(`⚡️ ⚡️ makePathAttribute(): no yScale so punting`);
			return `M0,0`;
		}

		const voltageBuffer = this.voltageBuffer;

		// array to collect small snippets of text.  Try to avoid recreating it all the time.
		this.points ??= new Array(this.end + this.start);
		let points = this.points;
		let x, y, pt;

		//let y = this.yScale(voltageBuffer[start]);  //qe.get1DVoltage(dim.start);
		//let x = this.xScale(start);
		if (start) points[0] = points[end] = '';

		// get ready to stop and start the path if needed
		let didMove = false, didLine = false;
		for (let ix = start; ix < end; ix++) {
			//console.time('🧑‍🚀makeVoltagePathAttribute');
			x = this.xScale(ix);
			if ((x==null) || !isFinite(x))
				debugger;

			// ±∞ come out as NaN.
			y = this.yScale(voltageBuffer[ix]);
			if (isNaN(y) || y < -TOO_MANY_VOLTS || y > TOO_MANY_VOLTS) {
				didMove = didLine = false;
				pt = '';
				// the line ends here, for this pt and maybe a few more; just omit it
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
					// spaces make them easier to read, and they repeat L
					pt = ' ' + pt;
				}
			}
			points[ix] = pt;
			//console.timeEnd('🧑‍🚀makeVoltagePathAttribute');
		}

		let final = points.join('');
		if (tracePathAttribute) {
			console.log(`⚡️ ⚡️  voltDisplay.makePathAttribute: done`, final);
		}
		return final;
	}
}

export default voltDisplay;

//			if ((x==null) || !isFinite(x) || (y==null) || !isFinite(y))
//				debugger;
