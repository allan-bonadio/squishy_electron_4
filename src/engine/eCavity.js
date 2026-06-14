/*
** eCavity -- JS equivalent to a qCavity (roughly)
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

// There is no eBuffer or eSpectrum; C++ deals with those exclusively

import eObject from './eObject.js';
import qeConsts from './qeConsts.js';
//import {cppObjectRegistry, prepForDirectAccessors} from '../utils/directAccessors.js';
import eSpace from './eSpace.js';
import rainbowDump from '../utils/rainbowDump.js';
import familiarWaves from './familiarWaves.js';

let traceAllocate = false;

const _ = num => num.toFixed(4).padStart(9);
const abs = Math.abs;
const π = Math.PI;
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

/* ******************************************************* eCavity */

// this is just a 1D wave. Used typically for internal calculations with complex
// numbers.  Or use eFlick.
class eCavity extends eObject {
	constructor() {
		super();
	}

	// useThis32F is one of these:
	// • a Float64Array[2*nPoints], with pairs being the real and im parts of psi.
	//   From C++ so bytes are in the emscripten heap
	//   (I bet you could pass it a JS array and some stuff would work)
	// • Or absent/null, in which case it's dynamially allocated to 2*space.nPoints size
	//    (JS only)
	// pointer should be pointer to qCavity in C++, otherwise leave it falsy.
	// If you use pointer, leave the useThis32F null; it's ignored
	// label is optional and only JS side
	// this is NOT called by subclass eFlick.  Long story.
	postConstructor(space, label = 'wave', useThis32F, pointer)
	{
		this.space = space;
		if (!(space instanceof eSpace))
			throw new Error("new eCavity: space is not an eSpace")

		if (pointer) {
			//this._pointer_ = pointer;	 // a qCavity
			//?? waveArg = this._wave;
		}
		else {
			// make a new qCavity
			//debugger;
			pointer = qeFuncs.cavity_create(space._pointer_, null);
		}
		this.setPointer(pointer);
		this.label = label;

		// now for the buffer
		this.completeWave(useThis32F);
	}

	// finish the construction.  eFlick has to do it differently.
	completeWave(useThis32F) {
		if (!useThis32F) {
			// _wave must be a pointer to the existing qCavity's buffer
			if (this._wave < 256) {
				console.error(`this._wave pointer seems to be too low, probably null: `
					+` ${this._wave}, (but ok if just generating directAccessors)`);
				let temp_wave = qeFuncs.buffer_allocateWave(this.space.nPoints * 2);
				this.wave = new Float64Array(Module.HEAPF64.buffer, temp_wave,
						2 * this.space.nPoints );
			}
			else {
				this.wave = new Float64Array(window.Module.HEAPF64.buffer, this._wave,
						2 * this.space.nPoints );
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

			// smoke test - the values a raw, freshly created qCavity gets
			if (traceAllocate) {
				for (let j = 0; j < this.nPoints*2; j++)
					wave[j] = -99.;
					// qBuffer::allocateWave() also fills to -77 (if trace turned on);
					//allocateZeroedWave() leaves all zeroes
			}
		}
		else {
			throw new Error(`call to construct eCavity failed cuz bad useThis32F=${useThis32F}`);
			debugger;
		}
	}

	// delete, except 'delete' is a reserved word. Turn everything off.
	// null out all other JS objects and buffers it points to, so ref counting
	// can recycle it all
	liquidate() {
		wave_delete(this._pointer_);
		this.space = this.wave = null;
	}

	/* *******************************************	  👽   👽	 direct access */
	// compare with eFlick, which should be a subclass, right?	Well,
	// the offsets are different.  Sometimes.  No idea why; but I do
	// the directAccessors separately. grr.

	get _wave() { return this._ints_[3]; }

	get nPoints() { return this._ints_[4]; }
	get start() { return this._ints_[5]; }
	get end() { return this._ints_[6]; }
	get continuum() { return this._ints_[7]; }

	/* ****************************	   👽	👽	  end of direct accessors */

	/* ******************************************** dumping */

	// dump any wave buffer according to that space.
	// RETURNS A STRING of the wave.
	dumpThat(wave) {
		if (this.nPoints <= 0) throw Error("🚀	eSpace::dumpThat	() with zero points");

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

	// e-z dump out wave content.
	dump(title = 'a wave') {
		console.log(`\n🌊 ≡≡≡≡≡ eCavity ${this.label ?? ''} | ${title} `+
			this.dumpThat(this.wave) +
			`\n🌊 ≡≡≡≡≡ end of eCavity ${title} ≡≡≡≡≡\n\n`);
	}

	rainbowDump(title) {
		rainbowDump(this.wave, this.start, this.end, this.nPoints, title);
	}


	/* ******************************************* calculatons */

	// calculate ⟨𝜓 | 𝜓⟩	'inner product'.
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
		if ( this.space.nPoints <= 0) throw Error("🚀  eCavity::fixThoseBoundaries() with zero points");
		const {end2, continuum} = this.space.startEnd2;
		const w = this.wave;

		switch (continuum) {
		case qeConsts.contDISCRETE:
			// no neighbor-to-neighbor crosstalk, well except...
			// I guess whatever the hamiltonion says.  Everybody's got a hamiltonian.
			break;

		case qeConsts.contWELL:
			// the points on the end are ∞ voltage, but the arithmetic goes bonkers
			// if I actually set the voltage to ∞. Remember complex values 2 doubles
			w[0] = w[1] = w[end2] = w[end2+1] = 0;
			break;

		case qeConsts.contENDLESS:
			// the points on the end get set to the opposite side. Remember this is for complex, 2x floats
			w[0] = w[end2-2];
			w[1]  = w[end2-1];
			w[end2] = w[2];
			w[end2+1] = w[3];
			break;

		default:
			debugger;
			throw new Error(`🚀	 bad continuum '${continuum}' in `
				+` eSpace.fixThoseBoundaries()`);
		}
	}

}

// methods that didn't fit into this file
Object.assign(eCavity.prototype, familiarWaves);

window.eCavity = eCavity;  // debugging
export default eCavity;

