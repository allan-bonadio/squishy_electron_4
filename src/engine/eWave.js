/*
** eWave -- JS equivalent to a qWave (roughly)
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

// There is no eBuffer or eSpectrum; C++ deals with those exclusively

import qeConsts from './qeConsts.js';
import {cppObjectRegistry, prepForDirectAccessors} from '../utils/directAccessors.js';
import eSpace from './eSpace.js';
import rainbowDump from '../utils/rainbowDump.js';

let traceSetFamiliarWave = false;
let traceGaussian = false;
let traceFamiliarResult = false;
let traceAllocate = false;

const _ = num => num.toFixed(4).padStart(9);
const abs = Math.abs;
const sqrt = Math.sqrt;
const exp = Math.exp;
const π = Math.PI;
const sin = Math.sin;
const cos = Math.cos;
const atan2 = Math.atan2;

// generate string for this one cx value, w, at location ix
// rewritten from the c++ version in qBuffer::dumpRow()
// pls keep in sync!
function dumpRow(ix, re, im, prev, isBorder) {
	const mag = re * re + im * im;

	let phase = NaN;
	if (abs(im) + abs(re) > 1e-9)
		phase = atan2(im, re) * 180 / π;  // pos or neg

	// make sure diff is -180 ... +180
	let dPhase = (phase - prev.phase + 180) / 360;
	if (dPhase <= -180) dPhase += 360;
	if (dPhase > 180) dPhase -= 360;

	prev.phase = phase;

	// calculate inner product while we're at it, displayed on last line
	if (!isBorder) prev.innerProd += mag;

	const index = String(ix).padStart(3);
	return`[${index}] (${_(re)} , ${_(im)}) | `+
		`${_(phase)} ${_(dPhase)}} ${_(mag * 1000)} m𝜓/nm\n` ;
}

/* ******************************************************* eWave */

// this is just a 1D wave.  Used typically for internal calculations with complex
// numbers.  Or use eFlick.
class eWave {
	// useThis32F is one of these:
	// • NO obsolete! (maybe still works but Float64Array() allocates its
	//       own buffer) a C++ wave/spectrum buffer ptr, integer
	// • a Float64Array[2*nPoints], with pairs being the real and im parts of psi.
	//       From C++ so bytes are in the emscripten heap
	// 		 (I bet you could pass it a JS array and some stuff would work)
	// • Or absent/null, in which case it's dynamially allocated to 2*space.nPoints size
	//        (JS only)
	// pointer should be pointer to qWave in C++, otherwise leave it falsy.
	// If you use pointer, leave the useThis32F null; it's ignored
	constructor(space, useThis32F, pointer) {
		this.space = space;
		if (!(space instanceof eSpace))
			throw new Error("new eWave: space is not an eSpace")

		if (pointer) {
			this.pointer = pointer;  // a qWave
			//?? waveArg = this._wave;
		}
		else {
			// make a new qWave
			//debugger;
			this.pointer = qeFuncs.wave_create(space.pointer, null);
		}
		prepForDirectAccessors(this, this.pointer);

		// now for the buffer
		this.completeWave(useThis32F);
	}

	// finish the construction.  eFlick has to do it differently.
	completeWave(useThis32F) {
		if (!useThis32F) {
			// _wave must be a pointer to the existing qWave's buffer
			if (this._wave < 256) {
				console.error(`this._wave pointer is too small ${this._wave}, but ok if just generating direct accessors`);
				let temp_wave = qeFuncs.buffer_allocateWave(this.space.nPoints * 2);
				this.wave = new Float64Array(Module.HEAPF64.buffer, temp_wave, 2 * this.space.nPoints );
			}
			else {
				this.wave = new Float64Array(window.Module.HEAPF64.buffer, this._wave, 2 * this.space.nPoints );
			}
		}
		else if (Array.isArray(useThis32F) & 'Float64Array' == useThis32F.constructor.name) {
			// an existing Float64Array, should be
			this.wave = useThis32F;
		}
		else if (Number.isInteger(useThis32F)) {
			// Mapped from C++; useThis32F is integer offset from start of C++ space
			debugger;
			const wave = this.wave = new Float64Array(window.Module.HEAPF64.buffer,
				useThis32F, 2 * space.nPoints);
			cppObjectRegistry[useThis32F] = wave;

			// smoke test - the values a raw, freshly created qWave gets
			if (traceAllocate) {
				for (let j = 0; j < this.nPoints*2; j++)
					wave[j] = -99.;
					// qBuffer::allocateWave() also fills to -77 (if trace turned on);
					//allocateZeroedWave() leaves all zeroes
			}
		}
		else {
			debugger;
			throw new Error(`call to construct eWave failed cuz bad useThis32F=${useThis32F}`);
		}
	}

	// delete, except 'delete' is a reserved word.  Turn everything off.
	// null out all other JS objects and buffers it points to, so ref counting
	// can recycle it all
	liquidate() {
		wave_delete(this.pointer);
		this.space = this.wave = null;
	}

	/* **************************************************** 🥽 direct access */

	get _wave() { return this.ints[3]; }

	get nPoints() { return this.ints[4]; }
	get start() { return this.ints[5]; }
	get end() { return this.ints[6]; }
	get continuum() { return this.ints[7]; }

	/* **************************** 🥽 end of direct accessors */

	/* ******************************************** dumping */

	// dump any wave buffer according to that space.
	// RETURNS A STRING of the wave.
	dumpThat(wave) {
		if (this.nPoints <= 0) throw Error("🚀  eSpace::dumpThat	() with zero points");

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
		console.log(`\n🌊 ≡≡≡≡≡ eWave ${avatarLabel} | ${title} `+
			this.dumpThat(this.wave) +
			`\n🌊 ≡≡≡≡≡ end of eWave ≡≡≡≡≡\n\n`);
	}

	rainbowDump(title) {
		rainbowDump(this.wave, this.start, this.end, this.nPoints, title);
	}


	/* ******************************************* calculatons */

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

		return iProd;
	}

	// refresh the wraparound points
	// modeled after fixThoseBoundaries() in C++ pls keep in sync!
	fixBoundaries() {
		if ( this.space.nPoints <= 0) throw Error("🚀  eWave::fixThoseBoundaries() with zero points");
		const {end2, continuum} = this.space.startEnd2;
		const w = this.wave;

		switch (continuum) {
		case qeConsts.contDISCRETE:
			// no neighbor-to-neighbor crosstalk, well except...
			// I guess whatever the hamiltonion says.  Everybody's got a hamiltonian.
			break;

		case qeConsts.contWELL:
			// the points on the end are ∞ voltage, but the arithmetic goes bonkers
			// if I actually set the voltage to ∞.  Remember complex values 2 doubles
			w[0] = w[1] = w[end2] = w[end2+1] = 0;
			break;

		case qeConsts.contENDLESS:
			// the points on the end get set to the opposite side.  Remember this is for complex, 2x floats
			w[0] = w[end2-2];
			w[1]  = w[end2-1];
			w[end2] = w[2];
			w[end2+1] = w[3];
			break;

		default:
			debugger;
			throw new Error(`🚀  bad continuum '${continuum}' in `
				+` eSpace.fixThoseBoundaries()`);
		}
	}

	/* **************************************************** familiar waves */

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
	}


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
	}

	// freq is just like circular, although as a fraction of the pulseWidth instead of N
	// pulseWidthUi is width of the packet, as percentage of N (0%...100%).
	// offset is how far along is the peak, as an integer X value (0...N).
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
		for (let ix2 = start2, ix = 0; ix2 < end2; ix2 += 2, ix++) {
			let oix = (ix - offset + N) % N;  // +N to avoid mod of a negative number problems
			wave[ix2] *= gaussian[oix];
			wave[ix2 + 1] *= gaussian[oix];
		}
	}

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
		nSideFreqs = Math.min(nSideFreqs, Math.abs(freq) - 1)

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
	}

	// set one of the above canned waveforms, according to the waveParams object's values
	setFamiliarWave(waveParams) {
		waveParams = {...waveParams};

		  // emergency!!  this gets really slow if it's a small number.  And not useful.
		waveParams.pulseWidth = Math.max(1, waveParams.pulseWidth);
		if (traceFamiliarResult) {
			console.log(`🌊 setFamiliarWave() starts, wave params: `+
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
			this.rainbowDump(`eWave.setFamiliarWave(${waveParams.waveBreed}) done`);
	}
}

window.eWave = eWave;  // debugging
export default eWave;

