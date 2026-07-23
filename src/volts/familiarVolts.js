/*
** familiar volts -- patterns of potential that user sets in Volts tab
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

import qeConsts from '../engine/qeConsts.js';
//import {scaleLinear} from 'd3-scale';
import {EFFECTIVE_VOLTS, TOO_MANY_VOLTS, LOW_VOLTS} from './voltConstants.js';
import {getAGroup, storeASetting} from '../utils/storeSettings.js';



// this is an add-on for voltDispay object
const familiarVolts = {
	// fill the buffer with a constant from A to B
	fillVoltage(fillWith, start = this.start, end = this.end) {
		for (let ix = start; ix < end; ix++)
			this.voltageBuffer[ix] = fillWith;
	},

	// pre-calc X horiz variables needed for evaluating the voltage familiarly
	preCalcFamiliarWidth(voltageParams) {
		const {voltageCenter, blockWidth} = voltageParams;
		const toIx = (this.end - this.start) / 100;  // converts 0...100 across to  0...N
		this.offset = voltageCenter * toIx;
		this.halfN = (this.end - this.start) / 2;

		if ('block' == voltageParams.voltageBreed) {
			const halfBlockWidth = blockWidth * toIx / 2;
			// edgeStart/End only used with block breed!
			this.edgeStart = round(this.offset - halfBlockWidth);
			this.edgeEnd = round(this.offset + halfBlockWidth);
		}
	},

	// pre-calc variables needed for evaluating the voltage familiarly
	// isn't this different for the well?
	// canyonVoltageSetup(voltageParams) {
	// 	const toIx = (this.end - this.start) / 100;  // how big is 1% of domain
	// 	this.offset = voltageParams.voltageCenter * toIx;  // convert center to ix units
	// 	this.halfN = (this.end - this.start) / 2;
	// }

	canyonVoltage(ix, voltageParams) {
		// x value to raise to the power for this ix value
		let xm1_1 = (ix - this.offset) / this.halfN;
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
	},

	// generate a canyon, flat etc voltage potential in this.voltageBuffer, according to params.
	// And set the height and bottom.  I don't think this works well.  Avoid.
	setFamiliarVoltage(voltageParams) {
		let {voltageCenter, voltageBreed, canyonPower, canyonScale,
			blockScale, flatScale, blockWidth} = voltageParams;
		if (canyonPower == undefined || canyonScale == undefined || blockScale == undefined
				|| flatScale == undefined || voltageCenter == undefined) {
			debugger;
			throw `bad Voltage params: blockScale=${blockScale}, canyonPower=${canyonPower},`
			+`canyonScale=${canyonScale}, voltageCenter=${voltageCenter}`;}

		if (traceFamiliar)
			console.log(`⚡️ starting setFamiliarVoltage(`, voltageParams);

		// prep the x variables
		this.preCalcFamiliarWidth(voltageParams);

		// fill the buffer according to the params.
		switch (voltageBreed) {
		case 'flat':
			//this.preCalcFamiliarWidth(voltageParams);
			this.fillVoltage(flatScale);
			//this.setFamiliarDomain(voltageParams, 0, flatScale);
			break;

		// case 'slot':
		// 	this.preCalcFamiliarWidth(voltageParams);
		// 	this.fillVoltage(0);
		// 	this.fillVoltage(-slotScale, this.edgeStart, this.edgeEnd)
		// 	this.setFamiliarDomain(voltageParams);
		// 	break;

		case 'block':
			//this.preCalcFamiliarWidth(voltageParams);
			this.fillVoltage(0);
			this.fillVoltage(blockScale, this.edgeStart, this.edgeEnd)
			break;

		case 'canyon':
			// the actual formula is like y = x ** p, where 0 <= y <= 1 and -1 <= x <= 1
			//this.preCalcFamiliarWidth(voltageParams);

			for (let ix = this.start; ix < this.end; ix++) {
				this.voltageBuffer[ix] = this.canyonVoltage(ix, voltageParams);
			}
			break;

		default:
			console.warn(`setFamiliarVoltage: no breed`, voltageParams);
		}

		// notice how we cheated  above?  didn't say we changed the data.  tell react
		this.setAPoint?.(1, this.voltageBuffer[1]);

		if (traceFamiliar)
			this.dumpVoltage(`done with setFamiliarVoltage()`);
	},

	// set bottomVolts and heightVolts to the results of setFamiliarVolts()
	// and adjust scales.  Not sure if this is useful...  TODO
	setFamiliarDomain(voltageParams, vWidth, vHeight) {

		if (traceFamiliar)
			console.log(`⚡️ starting setFamiliarDomain(`, voltageParams);

		const MARGIN = EFFECTIVE_VOLTS / 2;
		let bottom, height;

		switch (voltageParams.voltageBreed) {
		case 'flat':
			height = abs(voltageParams.flatScale) + 2 * MARGIN;
			bottom = -MARGIN;
			break;

		// case 'slot':
		// 	height = abs(voltageParams.slotScale) + 2*MARGIN;
		// 	bottom = -abs(voltageParams.slotScale) - MARGIN;
		// 	break;

		case 'block':
			height = abs(voltageParams.blockScale) + 2*MARGIN
			bottom = -MARGIN;
			break;

		case 'canyon':
			// always, the max is one or the other end, or the zero point.
			this.canyonVoltageSetup(voltageParams);
			let startVal = this.canyonVoltage(this.start, voltageParams);
			let endVal = this.canyonVoltage(this.end-1, voltageParams);
			let centerVal = this.canyonVoltage(this.offset, voltageParams);
			let highest = max(startVal, endVal, centerVal);
			let lowest = min(startVal, endVal, centerVal);

			// But autoscaling hides changes in scale so do this
			height =  (highest - lowest);
			bottom = lowest;
			let aBitExtra = MARGIN - height;
			//  	if (aBitExtra > 0) {
			//  		height = MARGIN
			//  		bottom -= MARGIN / 2;
			//  	}
			//height =  sqrt(abs(highest * EFFECTIVE_VOLTS)) + MARGIN;
			//bottom = -MARGIN / 2;
			break;

		default:
			console.warn(`setFamiliarDomain: no breed`, voltageParams);
		}

		this.bottomVolts = bottom;
		this.heightVolts = height;
		this.setVoltScales(0, vWidth, vHeight);
		if (traceFamiliar)
			this.dumpVoltDisplay(`end of setFamiliarDomain(): `);
	},
}

export default familiarVolts;
