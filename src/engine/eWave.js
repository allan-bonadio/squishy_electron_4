/*
** eWave -- JS equivalent to a qWave (roughly)
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

// import {qeBasicSpace} from './eSpace';
import {qe} from './qe';
import cxToRgb from '../view/cxToRgb';
import {prepForDirectAccessors} from '../utils/directAccessors';

let traceSetWave = false;

// emscripten sabotages this?  the log & info, but not error & warn?
//const consoleLog = console.log.bind(console);

// Dump a wave buffer as a colored bargraph in the JS console
// this is also called by C++ so it's easier as a standalone function
// see also eWave method by same name (but different args)
export function rainbowDump(wave, start, end, nPoints) {
	let title = "temporary title eWave.js:17";
	start *= 2;
	end *= 2;
	if (isNaN(start) || isNaN(end))
		debugger;

// 	const wave = this.wave;
// 	const {start, end} = this.space.startEnd2;

	console.log(`%c rainbowDump    🌊   ${title}   ${start/2}...${end/2}  with ${nPoints} pts`,
		`font: times 16px italic; color: #222; background-color: #fff; padding-right: 70%; font: 14px Palatino;`);

	let tot = 0;  // always real
	for (let ix = start; ix < end; ix += 2) {
		let mag = (wave[ix] ** 2 + wave[ix + 1] ** 2) * 10000;


		tot += mag;
		let color = cxToRgb({re: wave[ix], im: wave[ix + 1]});

		console.log(`%c🌊  `, `background-color: ${color}; padding-right: ${mag+5}px; `);

		ix += 2;
		tot += mag;
		color = cxToRgb({re: wave[ix], im: wave[ix + 1]});

		// is this redundant!?!?!?
		//console.log doesn't work here, dunnowhy, unless you stick in either extra console.log()
// 		console.log(`%c rich `, "font-family: palatino");
// 		console.log(`%c🌊  `, `background-color: ${color}; padding-right: ${mag+5}px; `);
		console.log(`%c🌊  `, `background-color: ${color}; padding-right: ${mag+5}px; `);
		//console.log(`zitgoin purdy good`);
	}
	return tot;
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

		if (pointer) {
			this.pointer = pointer;  // a qWave
			waveArg = this._wave;
		}
		else {
			// a home brew wave, not from C++.  make a place for those ints to be
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

			// smoke test
			for (let j = 0; j < this.nPoints*2; j++)
				wave[j] = -99.;
		}
		else
			throw `call to construct eWave failed cuz bad waveArg=${waveArg}`;
	}

	/* **************************************************************** direct access */

	get _wave() { return this.ints[4]; }

	get nPoints() { return this.ints[5]; }
	get start() { return this.ints[6]; }
	get end() { return this.ints[7]; }
	get continuum() { return this.ints[8]; }

	get dynamicallyAllocated() { return this.bools[40]; }


	/* **************************************************************** dumping */

	// dump out wave content.
	dump(title) {
		console.log(`\n🌊 ==== Wave | ${title} `+
			this.space.dumpThat(this.wave) +
			`\n🌊 ==== end of Wave ====\n\n`);
	}

	rainbowDump(title) {
		rainbowDump(this.wave, this.start, this.end, this.nPoints, title);
	}


	/* ********************************************************************** calculatons */

	// calculate ⟨𝜓 | 𝜓⟩  'inner product'.
	// See also C++ function of same name, that one's official.
	innerProduct() {
		const wave = this.wave;
		const {start, end} = this.space.startEnd2;

		let tot = 0;
		for (let ix = start; ix < end; ix += 2) {
			let norm = wave[ix] ** 2 + wave[ix + 1] ** 2;
			tot += norm;
		}
		return tot;
	}

	// enforce ⟨𝜓 | 𝜓⟩ = 1 by dividing out the current value.  See also C++ func of same name.
	normalize() {
		const wave = this.wave;

		// now adjust it so the norm comes out 1
		let iProd = this.innerProduct();
		let factor = Math.pow(iProd, -.5);

		// treat ALL points, including border ones.
		// And real and imaginary, go by ones
		let {nPoints} = this.space.startEnd2;
		for (let ix = 0; ix < nPoints; ix++)
			wave[ix] *= factor;

		return iProd
	}

	/* ********************************************************************** set wave */

	// n is  number of cycles all the way across N points.
	// n 'should' be an integer to make it meet up on ends if endless
	// pass negative to make it go backward.
	// the first point here is like x=0 as far as the trig functions, and the last like x=-1
	setCircularWave(n) {
		//console.info(`setCircularWave(${n})`);
		const {start, end, N} = this.space.startEnd2;
		const dAngle = Math.PI / N * (+n) * 2;
		const wave = this.wave;

		for (let ix = start; ix < end; ix += 2) {
			const angle = dAngle * (ix - start) / 2;
			wave[ix] = Math.cos(angle);
			wave[ix + 1] = Math.sin(angle);
		}

		//this.dump('eWave.setCircularWave() done');
		//this.rainbowDump('🌊  eWave.setCircularWave() done');
	}


	// make a superposition of two waves in opposite directions.
	// n 'should' be an integer to make it meet up on ends if wraparound
	// oh yeah, the walls on the sides are nodes in this case so we'll split by N+2 in that case.
	// pass negative to make it upside down.
	setStandingWave(n) {
		const {start, end, N} = this.space.startEnd2;
		const dAngle = Math.PI / N * (+n);
		const wave = this.wave;

		// good idea or bad?
// 		if (this.space.continuum == qe.contWELL) {
// 			start--;
// 			end++;
// 		}

		for (let ix = start; ix < end; ix += 2) {
			const angle = dAngle * (ix - start);
			wave[ix] = Math.sin(angle);
			wave[ix + 1] = 0;
		}

		//this.dump('eWave.setStandingWave() done');
		//this.rainbowDump('🌊  eWave.setStandingWave() done');
	}

	// freq is just like circular, although as a fraction of the pulseWidth instead of N
	// 2stdDev is width of the packet, as percentage of N (0%...100%).
	// offset is how far along is the peak, as an integer X value (0...N).
	setPulseWave(freqUi, pulseWidthUi, offsetUi) {
		const wave = this.wave;
		const {start, end, N} = this.space.startEnd2;
		let offset = offsetUi * N / 100;  // now in units of X
		let pulseWidth = pulseWidthUi * N / 100;  // now in units of X
		const freq = Math.round(freqUi);
		if (traceSetWave) console.log(`🌊  setPulseWave freq=${freqUi} => ${freq} `+
			`  offset=${offsetUi}% => ${offset}   pulseWidth=${pulseWidthUi}% => ${pulseWidth}`)

		// start with a circular wave
		this.setCircularWave(freq);

		// modulate with a gaussian, centered at the offset, with pulseWidth
		// tweak numbers to suit the ui
		const s2 = pulseWidth ** -2;  // 1/stddev**2 sortof
		for (let twoix = start; twoix < end; twoix += 2) {
			let ix = twoix / 2;
			const 𝜟 = (ix - offset) % N;
			const stretch = Math.exp(-𝜟 * 𝜟 * s2);
			wave[ix] *= stretch;
			wave[ix + 1] *= stretch;
		}

		//this.dump('eWave.setPulseWave() done');
		//this.rainbowDump('eWave.setPulseWave() done');
	}

	// 2stdDev is width of the packet, as percentage of N (0%...100%).
	// offset is how far along is the peak, as an integer X value (0...N).
	setChordWave(freqUi, pulseWidthUi, offsetUi) {
		console.log(`setChordWave(${freqUi}, ${pulseWidthUi}, ${offsetUi})`);
		const wave = this.wave;
		const {start, end, N} = this.space.startEnd2;
		let offset = offsetUi * N / 100;  // now in units of X
		const nSideFreqs = Math.round(pulseWidthUi / 100 * N)
		const freq = Math.round(freqUi);
		if (traceSetWave)
			console.log(`🌊  setChordWave freq=${freqUi} => ${freq}  nSideFreqs=${nSideFreqs}`+
			`  offset=${offsetUi}% => ${offset}`)

		//const dAngle = 4 * Math.PI / N;
		const dAngle = 1.0 * Math.PI / N;
// 		let freqLow = freq - 1.;  // could be zero!  but still works.
// 		let freqLowLow = freqLow - 1.;  // could be zero!  but still works.
// 		let freqHigh = freq + 1.;
// 		let freqHighHigh = freqHigh + 1.;

		const startFreq = freqUi - nSideFreqs;
		const lastFreq = startFreq + nSideFreqs

		for (let ix = start; ix < end; ix += 2) {
			const angle = dAngle * (ix - start - offset);
			wave[ix] = wave[ix+1] = 0;

			for (let f = startFreq; f <= lastFreq; f++) {
				wave[ix] += Math.cos(f * angle);  // r
				wave[ix+1] += Math.sin(f * angle);  // im
			}
		}

		//		//this.dump('eWave.setPulseWave() done');
		//this.rainbowDump('eWave.setChordWave() done');
	}

	// set one of the above canned waveforms, according to the waveParams object's values
	setFamiliarWave(waveParams) {
		waveParams.pulseWidth = Math.max(1, waveParams.pulseWidth);  // emergency!!  this gets really slow

		// should the boundaries, normalize and dump be moved to the end of here?
		switch (waveParams.waveBreed) {
		case 'circular':
			this.setCircularWave(+waveParams.waveFrequency);
			break;

		case 'standing':
			this.setStandingWave(+waveParams.waveFrequency);
			break;

		case 'gaussian':
			this.setPulseWave(+waveParams.waveFrequency, +waveParams.pulseWidth, +waveParams.pulseOffset);
			break;

		case 'chord':
			this.setChordWave(+waveParams.waveFrequency, +waveParams.pulseWidth, +waveParams.pulseOffset);
			break;
		}

		qe.Avatar_normalize();
		//this.normalize();
		this.space.fixThoseBoundaries(this.wave);
	}
}

window.eWave = eWave;  // debugging
export default eWave;

