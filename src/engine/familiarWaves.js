/*
** familiarWaves -- code to generate wave breeds given wave parameters
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/

import qeConsts from './qeConsts.js';

let traceGaussian = true;
let traceFamiliarResult = true;

const abs = Math.abs;
const sqrt = Math.sqrt;
const exp = Math.exp;
const π = Math.PI;
const sin = Math.sin;
const cos = Math.cos;


// ultimately, methods on eCavity
const familiarWaves = {
	// n is  number of cycles all the way across N points.
	// n 'should' be an integer to make it meet up on ends if endless
	// pass negative to make it go backward.
	// the first point here is like x=0 as far as the trig functions, and the last like x=-1
	setCircularWave(n) {
		const {start2, end2, N} = this.space.startEnd2;
		const dAngle = 2 * π / N * (+n);
		const wave = this.wave;

		for (let ix2 = start2; ix2 < end2; ix2 += 2) {
			const angle = dAngle * (ix2 - start2) / 2;
			wave[ix2] = cos(angle);
			wave[ix2 + 1] = sin(angle);
		}
	},

	// make a superposition of two waves in opposite directions.
	// frequency n 'should' be an integer to make it meet up on ends if wraparound
	// WELL: the walls on the sides are nodes so we'll split by N+1 in that case.
	// pass negative to make it backwards.
	setStandingWave(n) {
		let {start2, end2, N} = this.space.startEnd2;
		const wave = this.wave;
		let bias = 0;  // for when freq=0

		// For a well, the boundary points ARE part of the wave, so do the whole thing
		let dAngle;
		if (this.space.continuum == qeConsts.contWELL) {
			end2 += start2;
			start2 = 0;
			dAngle = π / (N + 1) * (+n);

			if (0 == n)
				bias = 1 / sqrt(N + 1)
		}
		else {
			dAngle = π / N * (+n);
			if (0 == n)
				bias = 1 / sqrt(N)
		}

		for (let ix2 = start2; ix2 < end2; ix2 += 2) {
			const angle = dAngle * (ix2 - start2);
			wave[ix2] = sin(angle) + bias;
			wave[ix2 + 1] = 0;
		}
	},

	// freq is just like circular, although as a fraction of the pulseWidth instead of N
	// pulseWidthUi is width of the packet, as percentage of N (0%...100%).
	// offset is how far is the peak from left edge, as an integer X value (0...N).
	setGaussianWave(freqUi, pulseWidthUi, offsetUi) {
		const {start, end, N} = this.space.startEnd;
		let pulseWidth = pulseWidthUi * N / 100;  // now in units of X; needn't be an integer
		let freq = freqUi;
		if (this.continuum == qeConsts.contENDLESS)
			freq = Math.round(freq);  // must be an integer if endless

		// must be half-odd-integer cuz the peak is between two integers..
		// EXCEPT make it point to the right side of the peak to keep it an int.
		let offset = Math.round(offsetUi * N / 100 + .5);  // now in units of X
		if (traceGaussian) console.log(`🌊  setGaussianWave freq=${freqUi} => ${freq} `+
			`  offset=${offsetUi}% => ${offset}   pulseWidth=${pulseWidthUi}% => ${pulseWidth.toFixed(4)}`)

		// first, make the gaussian.  For Endless, need to wrap it around.
		// Whether or not, make it 2 x nStates long, with the peak in the middle (at
		// edge between first N and second N).  But, real.
		let gaussian = new Float64Array(2 * N);
		const s2 = pulseWidth ** -2;  // 1/stddev**2 sortof
		for (let ix = 0; ix < 2 * N; ix++) {
			const delta = ix - N;
			gaussian[ix] = exp(-delta * delta * s2);
		}

		// there's a problem when you chop it off at the ends for Endless.  You
		// don't want to leave a sharp corner as that will dominate the whole
		// thing and mess it up.  For Well, it's OK.
		// I fitted a quadradic to hit points 1 and 2 at ±3/2 and ±5/2, then plugged in ±1/2.
		let first = (4 * gaussian[1] - gaussian[2]) / 3;
		gaussian[0] = first;

		if (traceGaussian) {
			// Float64Array.map() results in another Float64Array; we want Array
			console.log(`🌊 bare gaussian, before wraparound: `
				+ (Array.from(gaussian)).map(
					(val, ix) => `[${ix}]:${val.toFixed(4)}`
				).join('  '));
		}

		// wrap it around; convert 2N points to N
		for (let ix = 0; ix < N; ix++)
			gaussian[ix] += gaussian[ix + N];

		if (traceGaussian) {
			console.log(`🌊 bare gaussian, after wraparound: `
				+ (Array.from(gaussian))
					.filter((val, ix) => (ix < N/2))
					.map((val, ix) => `[${ix}]:${val.toFixed(4)}`).join('  '));
		}

		// then, take a circular wave
		this.setCircularWave(freq);

		// and modulate it by the gaussian, as offsetted
		const start2 = start * 2;
		let end2 = end * 2;
		const wave = this.wave;
		const oset = -offset + 2*N;  // avoid mod of a negative number problems
		for (let ix2 = start2, ix = 0; ix2 < end2; ix2 += 2, ix++) {
			let oix = (ix + oset) % N;
			wave[ix2] *= gaussian[oix];
			wave[ix2 + 1] *= gaussian[oix];
		}
	},

	// this is currently in trouble and disabled.  Goal is to make a wave packet
	//that resonates with the length of your space, so like frequency is
	//always a whole fraction of the length of the space.
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
		nSideFreqs = Math.min(nSideFreqs, abs(freq) - 1)

		if (traceGaussian)
			console.log(`🌊  setChordWave freq=${freqUi} => ${freq}  nSideFreqs=${nSideFreqs}`+
			`  offset=${offsetUi}% => ${offset2}`);

		//const dAngle = 4 * π / N;
		const dAngle = 1.0 * π / N;
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
				wave[ix2] += cos(f * angle);  // r
				wave[ix2+1] += sin(f * angle);  // im
			}
		}
	},

	// set one of the above canned waveforms, according to the waveParams object's values
	setFamiliarWave(waveParams) {
		waveParams = {...waveParams};

		  // emergency!!  this gets really slow if it's a small number.  And not useful.
		waveParams.pulseWidth = Math.max(1, waveParams.pulseWidth);
		if (traceFamiliarResult) {
			console.log(`🌊 setFamiliarWave() starts on ${this.label}, wave params: `+
			`waveBreed=${waveParams.waveBreed}   `+
			`waveFrequency UI=${waveParams.waveFrequency.toFixed(2)}/N   `+
			`pulseWidth UI=${waveParams.pulseWidth.toFixed(2)}%   `+
			`pulseCenter UI=${waveParams.pulseCenter.toFixed(2)}%`);
		}

		switch (waveParams.waveBreed) {
		case 'circular':
			this.setCircularWave(+waveParams.waveFrequency);
			break;

		case 'standing':
			this.setStandingWave(+waveParams.waveFrequency);
			break;

		case 'gaussian':
			this.setGaussianWave(+waveParams.waveFrequency, +waveParams.pulseWidth, +waveParams.pulseCenter);
			break;

		case 'chord':
			this.setChordWave(+waveParams.waveFrequency, +waveParams.pulseWidth, +waveParams.pulseCenter);
			break;

		default:
			debugger;
			throw new Error(`bad waveParams.waveBreed=${waveParams.waveBreed} in setFamiliarWave()`);
		}

		this.normalize();
		this.fixBoundaries();

		if (traceFamiliarResult)
			this.dump(`familiarResult of ${this.label}`);
			//this.rainbowDump(`eCavity.setFamiliarWave(${waveParams.waveBreed}) done`);
	}
};

export default familiarWaves;
