/*
** eWave -- JS equivalent to a qWave (roughly)
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

// There is no eBuffer or eSpectrum; C++ deals with those exclusively

import {qe} from './qe';
import cxToRgb from '../view/cxToRgb';
import {cppObjectRegistry, prepForDirectAccessors} from '../utils/directAccessors';
import eSpace from './eSpace';

let traceSetFamiliarWave = false;
let traceSetFamiliarWaveResult = false;

// emscripten sabotages this?  the log & info, but not error & warn?
//const consoleLog = console.log.bind(console);

const _ = num => num.toFixed(4).padStart(9);
const atan2 = Math.atan2;
const abs = Math.abs;
const floor = Math.floor;
const π = Math.PI;

// generate string for this one cx value, w, at location ix
// rewritten from the c++ version in qBuffer::dumpRow()
// pls keep in sync!
// this should be moved to eWave!
function dumpRow(ix, re, im, prev, isBorder) {
	const mag = re * re + im * im;

	let phase = NaN;
	if (abs(im) + abs(re) > 1e-9)
		phase = atan2(im, re) * 180 / π;  // pos or neg

	// make sure diff is -180 ... +180
	let dPhase = (phase - prev.phase + 180) / 360;
	dPhase = (dPhase - floor(dPhase)) * 360 - 180;
	//let dPhase = phase - prev.phase + 360;  // so now its positive, right?
	//while (dPhase >= 360) dPhase -= 360;

	prev.phase = phase;

	// calculate inner product while we're at it, displayed on last line
	if (!isBorder) prev.innerProd += mag;

	return`[${ix}] (${_(re)} , ${_(im)}) | `+
		`${_(phase)} ${_(dPhase)}} ${_(mag * 1000)} m𝜓\n` ;
}


// Dump a wave buffer as a colored bargraph in the JS console
// this is also called by C++ so it's easier as a standalone function
// see also eWave method by same name (but different args)
export function rainbowDump(wave, start, end, nPoints, title) {
	let start2 = 2 * start;
	let end2 = 2 * end;
	if (isNaN(start2) || isNaN(end2))
		debugger;

// 	const wave = this.wave;
// 	const {start2, end2} = this.space.startEnd2;

	// maybe doesn't work when called from c++?
	console.log(`%c rainbowDump  🌊 |  ${title} `,
		`color: #222; background-color: #fff; font: 14px Palatino;`);
	//console.info(`${start2/2}...${end2/2}  🌊 with ${nPoints} pts`0;

	// autorange
	let maxi = 0;
	for (let ix2 = start2; ix2 < end2; ix2 += 2)
		maxi = Math.max(maxi, wave[ix2] ** 2 + wave[ix2 + 1] ** 2);
	let correction = 1000 / maxi;  // intended max width in console
	//console.info(`maxi=${maxi}  corr=${correction}`)

	for (let ix2 = start2; ix2 < end2; ix2 += 2) {
		let mag = (wave[ix2] ** 2 + wave[ix2 + 1] ** 2) * correction;
		//console.info(`mag=${mag}  mag pre corr=${mag / correction}`)

		let color = cxToRgb({re: wave[ix2], im: wave[ix2 + 1]});
		console.log(`%c `, `background-color: ${color}; padding-right: ${mag+5}px; `);
	}
}
window.rainbowDump = rainbowDump;  // so c++ can get to it

/* **************************************************************** eWave */

// this is just a 1D wave.  someday...
class eWave {
	// waveArg is one of these:
	// • a C++ wave/spectrum buffer ptr, ask any qBuffer to pass back its wave and it comes out as an integer
	// • a Float64Array[2*nPoints], with pairs being the real and im parts of psi.
	//       From any source, C++ or JS.
	// 	   (I bet you could pass it a JS array and some stuff would work)
	// • Or absent/null, in which case it's dynamially allocated to space.nPoints; JS only
	// pointer should be pointer to qWave in C++, otherwise leave it falsy.
	// If you use pointer, leave the waveArg null; it's ignpored
	constructor(space, waveArg, pointer) {
		prepForDirectAccessors(this, pointer);

		this.space = space;
		if (!(space instanceof eSpace))
			throw new Error("new eWave: space is not an eSpace")

		if (pointer) {
			this.pointer = pointer;  // a qWave
			waveArg = this._wave;
		}
		else {
			// a home brew wave, not from C++.  make a phony qWave for those ints to be
			this.pointer = new Int32Array(20);

//			// there MUST be a space  NO!  getters into C++
//			let {start, end, nPoints, continuum} = this.space.startEnd;
//			this.start = start;
//			this.end = end;
//			this.nPoints = nPoints;
//			this.continuum = continuum;
		}

		// now for the buffer
		if (!waveArg) {
			// zeroes.  if you're lucky.
			this.wave = new Float64Array(2 * space.nPoints);
		}
		else if (Array.isArray(waveArg) & 'Float64Array' == waveArg.constructor.name) {
			// an existing Float64Array, should be
			this.wave = waveArg;
		}
		else if (Number.isInteger(waveArg)) {
			// Mapped from C++; waveArg is integer offset from start of C++ space
			const wave = new Float64Array(window.Module.HEAPF64.buffer, waveArg, 2 * space.nPoints);
			//space.waveBuffer = qe.waveBuffer = wave;
			this.wave = wave;
			cppObjectRegistry[waveArg] = wave;

			// smoke test - the values a raw, freshly created qWave gets
			for (let j = 0; j < this.nPoints*2; j++)
				wave[j] = -99.;
			// qBuffer::allocateWave fills to -77 (if trace turned on); allocateZeroedWave() leaves all zeroes
		}
		else
			throw new Error(`call to construct eWave failed cuz bad waveArg=${waveArg}`);

	}

	/* **************************************************************** direct access */

	get _wave() { return this.ints[4]; }

	get nPoints() { return this.ints[5]; }
	get start() { return this.ints[6]; }
	get end() { return this.ints[7]; }
	get continuum() { return this.ints[8]; }

	/* **************************************************************** dumping */

	// dump any wave buffer according to that space.
	// RETURNS A STRING of the wave.
	dumpThat(wave) {
		if (this.nPoints <= 0) throw "🚀  eSpace::dumpThat	() with zero points";

		const {start2, end2, continuum} = this.space.startEnd2;
		let ix2 = 0;
		let prev = {phase: 0, innerProd: 0};
		let output = '';

		if (continuum)
			output += dumpRow(0, wave[0], wave[1], prev, true);

		for (ix2 = start2; ix2 < end2; ix2 += 2)
			output += dumpRow(ix2/2, wave[ix2], wave[ix2+1], prev);


		if (continuum)
			output += 'end '+ dumpRow(ix2/2, wave[end2], wave[end2+1], prev, true);

		return output.slice(0, -1) + ' innerProd=' + _(prev.innerProd) +'\n';
	}

	// dump out wave content.
	dump(title) {
		const avatarLabel = this.avatarLabel || '';
		console.log(`\n🌊 ==== eWave ${avatarLabel} | ${title} `+
			this.dumpThat(this.wave) +
			`\n🌊 ==== end of Wave ====\n\n`);
	}

	rainbowDump(title) {
		rainbowDump(this.wave, this.start, this.end, this.nPoints, title);
	}


	/* ********************************************************************** calculatons */

	// calculate ⟨𝜓 | 𝜓⟩  'inner product'.
	// See also C++ function of same name, that one's official.
	// is this calculating right?  I don't think so.
	innerProduct() {
		const wave = this.wave;
		const {start2, end2} = this.space.startEnd2;

		let tot = 0;
		for (let ix2 = start2; ix2 < end2; ix2 += 2) {
			let norm = wave[ix2] ** 2 + wave[ix2 + 1] ** 2;
			tot += norm;
		}
		return tot;
	}

	// now done in C++ so there's just 1 implementation
	// enforce ⟨𝜓 | 𝜓⟩ = 1 by dividing out the current value.  See also C++ func of same name.
	normalize() {
		const wave = this.wave;

		// now adjust it so the norm comes out 1
		let iProd = this.innerProduct();
		let factor = Math.pow(iProd, -.5);

		// treat ALL points, including border ones.
		let {nPoints2} = this.space.startEnd2;
		for (let ix2 = 0; ix2 < nPoints2; ix2 += 2) {
			wave[ix2] *= factor;
			wave[ix2+1] *= factor;
		}

		return iProd;  // unused
	}

	// I can't get this one to work...
	//normalize() {
	//	qe.wave_normalize(this.pointer);
	//}

	// refresh the wraparound points
	// modeled after fixThoseBoundaries() in C++ pls keep in sync!
	fixBoundaries() {
		if ( this.space.nPoints <= 0) throw "🚀  eWave::fixThoseBoundaries() with zero points";
		const {end2, continuum} = this.space.startEnd2;
		const w = this.wave;

		switch (continuum) {
		case qe.contDISCRETE:
			// no neighbor-to-neighbor crosstalk, well except...
			// I guess whatever the hamiltonion says.  Everybody's got a hamiltonian.
			break;

		case qe.contWELL:
			// the points on the end are ∞ potential, but the arithmetic goes bonkers
			// if I actually set the voltage to ∞.  Remember complex values 2 doubles
			w[0] = w[1] = w[end2] = w[end2+1] = 0;
			break;

		case qe.contENDLESS:
			// the points on the end get set to the opposite side.  Remember this is for complex, 2x floats
			w[0] = w[end2-2];
			w[1]  = w[end2-1];
			w[end2] = w[2];
			w[end2+1] = w[3];
			break;

		default: throw new Error(`🚀  bad continuum '${continuum}' in  eSpace.fixThoseBoundaries()`);
		}
	}

	/* ********************************************************************** set wave */

	// n is  number of cycles all the way across N points.
	// n 'should' be an integer to make it meet up on ends if endless
	// pass negative to make it go backward.
	// the first point here is like x=0 as far as the trig functions, and the last like x=-1
	setCircularWave(n) {
		//console.info(`setCircularWave(${n})`);
		const {start2, end2, N} = this.space.startEnd2;
		const dAngle = Math.PI / N * (+n) * 2;
		const wave = this.wave;

		for (let ix2 = start2; ix2 < end2; ix2 += 2) {
			const angle = dAngle * (ix2 - start2) / 2;
			wave[ix2] = Math.cos(angle);
			wave[ix2 + 1] = Math.sin(angle);
		}
	}


	// make a superposition of two waves in opposite directions.
	// n 'should' be an integer to make it meet up on ends if wraparound
	// oh yeah, the walls on the sides are nodes in this case so we'll split by N+2 in that case.
	// pass negative to make it upside down.
	setStandingWave(n) {
		let {start2, end2, N} = this.space.startEnd2;
		const wave = this.wave;

		// For a well, the boundary points ARE part of the wave, so do the whole thing
		let dAngle;
		if (this.space.continuum == qe.contWELL) {
			end2 += start2;
			start2 = 0;
			dAngle = Math.PI / (N + 2) * (+n);
		}
		else {
			dAngle = Math.PI / N * (+n);
		}

		for (let ix2 = start2; ix2 < end2; ix2 += 2) {
			const angle = dAngle * (ix2 - start2);
			wave[ix2] = Math.sin(angle);
			wave[ix2 + 1] = 0;
		}
	}

	// freq is just like circular, although as a fraction of the pulseWidth instead of N
	// 2stdDev is width of the packet, as percentage of N (0%...100%).
	// offset is how far along is the peak, as an integer X value (0...N).
	setGaussianWave(freqUi, pulseWidthUi, offsetUi) {
		const wave = this.wave;
		const {start2, end2, N} = this.space.startEnd2;
		let offset = offsetUi * N / 100;  // now in units of X
		let pulseWidth = pulseWidthUi * N / 100;  // now in units of X
		const freq = Math.round(freqUi);
		if (traceSetFamiliarWave) console.log(`🌊  setGaussianWave freq=${freqUi} => ${freq} `+
			`  offset=${offsetUi}% => ${offset}   pulseWidth=${pulseWidthUi}% => ${pulseWidth}`)

		// start with a circular wave
		this.setCircularWave(freq);

		// modulate with a gaussian, centered at the offset, with pulseWidth
		// tweak numbers to suit the ui
		const s2 = pulseWidth ** -2;  // 1/stddev**2 sortof
		for (let ix2 = start2; ix2 < end2; ix2 += 2) {
			let ix = ix2 / 2;
			const 𝜟 = (ix - offset) % N;
			const stretch = Math.exp(-𝜟 * 𝜟 * s2);
			wave[ix2] *= stretch;
			wave[ix2 + 1] *= stretch;
		}
	}

	// 2stdDev is width of the packet, as percentage of N (0%...100%).
	// offset is how far along is the peak, as an integer X value (0...N).
	setChordWave(freqUi, pulseWidthUi, offsetUi) {
		const wave = this.wave;
		const {start2, end2, N} = this.space.startEnd2;
		let offset2 = offsetUi * N / 100 * 2;  // now in units of X * 2

		let freq = Math.round(freqUi);

		// convert pulsewidth into fraction of half wave (cuz it;s on both sides)
		// but you can't have side freqs that go down to zero!
		let nSideFreqs = Math.round(100 / pulseWidthUi * N / 2);
		nSideFreqs = Math.min(nSideFreqs, Math.abs(freq) - 1)

		if (traceSetFamiliarWave)
			console.log(`🌊  setChordWave freq=${freqUi} => ${freq}  nSideFreqs=${nSideFreqs}`+
			`  offset=${offsetUi}% => ${offset2}`);

		//const dAngle = 4 * Math.PI / N;
		const dAngle = 1.0 * Math.PI / N;
// 		let freqLow = freq - 1.;  // could be zero!  but still works.
// 		let freqLowLow = freqLow - 1.;  // could be zero!  but still works.
// 		let freqHigh = freq + 1.;
// 		let freqHighHigh = freqHigh + 1.;

		const startFreq = freq - nSideFreqs;
		const lastFreq = startFreq + nSideFreqs

		for (let ix2 = start2; ix2 < end2; ix2 += 2) {
			const angle = dAngle * (ix2 - start2 - offset2) / 2;
			wave[ix2] = wave[ix2+1] = 0;

			for (let f = startFreq; f <= lastFreq; f++) {
				wave[ix2] += Math.cos(f * angle);  // r
				wave[ix2+1] += Math.sin(f * angle);  // im
			}
		}
	}

	// set one of the above canned waveforms, according to the waveParams object's values
	setFamiliarWave(waveParams) {
		waveParams.pulseWidth = Math.max(1, waveParams.pulseWidth);  // emergency!!  this gets really slow
		if (traceSetFamiliarWaveResult) {
			console.log(`setFamiliarWave() starts, wave params: `+
			`waveBreed=${waveParams.waveBreed}   `+
			`waveFrequency=${waveParams.waveFrequency.toFixed(2)}   `+
			`pulseWidth=${waveParams.pulseWidth.toFixed(2)}   `+
			`pulseOffset=${waveParams.pulseOffset.toFixed(2)}`);
		}

		switch (waveParams.waveBreed) {
		case 'circular':
			this.setCircularWave(+waveParams.waveFrequency);
			break;

		case 'standing':
			this.setStandingWave(+waveParams.waveFrequency);
			break;

		case 'gaussian':
			this.setGaussianWave(+waveParams.waveFrequency, +waveParams.pulseWidth, +waveParams.pulseOffset);
			break;

		case 'chord':
			this.setChordWave(+waveParams.waveFrequency, +waveParams.pulseWidth, +waveParams.pulseOffset);
			break;

		default:
			throw new Error(`bad waveParams.waveBreed=${waveParams.waveBreed} in setFamiliarWave()`);
		}

		this.normalize();
		this.fixBoundaries();

		if (traceSetFamiliarWaveResult) {
			this.dump(`eWave.setFamiliarWave(${waveParams.waveBreed}) done`);
			//this.rainbowDump(`eWave.setFamiliarWave(${waveParams.waveBreed}) done`);
		}
	}
}

window.eWave = eWave;  // debugging
export default eWave;

