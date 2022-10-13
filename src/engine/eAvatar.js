/*
** eAvatar - the JS representations of the c++ Avatar object
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/
//import qe from './qe';
import {cppObjectRegistry, prepForDirectAccessors} from '../utils/directAccessors';
import eWave from './eWave';
//import eSpace from './eSpace';
import qe from './qe';



// a qAvatar manages iteration of a wave, and display on a GLView. I keep
// thinking that I should separate the functions, but what will you do with an itration
// if you're not going to view it in GL?
class eAvatar {
	// space is the eSpace we're in (note eSpace constructor constructs 2 Avatars
	// and they're the only ones who know nPoints etc)
	// pointer is an integer pointing into the C++ address space, to the Avatar object.
	// We can then set and sample each of the member variables if we know the offset
	// Give us the pointer, we'll reach in and make an eWave from mainQWave, and
	// a vBuffer from _qvBuffer. the q objects must be in place.
	// this way we can't get the wrong wave in the wrong avatar.
	constructor(pointer, space) {
		prepForDirectAccessors(this, pointer);
		this.space = space;
		this.eWave = new eWave(this.space, null, this.mainQWave);
		this.vBuffer = new Float32Array(window.Module.HEAPF32.buffer, this._qvBuffer,
				this.space.nPoints * 8); // two vec4 s per point

		this.label = window.Module.UTF8ArrayToString(this._label);

	}

	/* ************************************************************************* Direct Accessors */
	// see qAvatar.cpp to regenerate this. Note these are all scalars; buffers
	// are passed by pointer and you need to allocate them in JS (eg see
	// eAvatar.constructor)

	get _space() { return this.ints[1]; }

	get elapsedTime() { return this.doubles[1]; }
	set elapsedTime(a) { this.doubles[1] = a; }
	get iterateSerial() { return this.doubles[2]; }
	set iterateSerial(a) { this.doubles[2] = a; }

	get isIterating() { return this.bools[68]; }
	set isIterating(a) { this.bools[68] = a; }
	get pleaseFFT() { return this.bools[69]; }
	set pleaseFFT(a) { this.bools[69] = a; }

	get dt() { return this.doubles[3]; }
	set dt(a) { this.doubles[3] = a; }
	get lowPassFilter() { return this.ints[8]; }
	set lowPassFilter(a) { this.ints[8] = a; }
	get stepsPerIteration() { return this.ints[9]; }
	set stepsPerIteration(a) { this.ints[9] = a; }

	get mainQWave() { return this.ints[10]; }
	set mainQWave(a) { this.ints[10] = a; }

	get _potential() { return this.ints[11]; }
	get potentialFactor() { return this.doubles[6]; }
	set potentialFactor(a) { this.doubles[6] = a; }

	get _scratchQWave() { return this.ints[14]; }

	get _spect() { return this.ints[15]; }
	get _qvBuffer() { return this.ints[16]; }
	get _label() { return this.pointer + 70; }


	// wire them up

	// wait this just gets the pointer to the view buffer...
	getViewBuffer() {
		return cppObjectRegistry[qe.avatar_getViewBuffer(this.pointer)];
	}

	dumpViewBuffer(title) { qe.avatar_dumpViewBuffer(this.pointer, title) }
	loadViewBuffer() { return qe.avatar_loadViewBuffer(this.pointer) }
	oneIteration() { return qe.avatar_oneIteration(this.pointer) }
	askForFFT() { qe.avatar_askForFFT(this.pointer) }
	normalize() { qe.avatar_normalize(this.pointer) }

	// delete the eAvatar and qAvatar and its owned buffers
	deleteAvatar() {
		qe.avatar_delete(this.pointer);
	}
}


window.eAvatar = eAvatar;  // debugging
export default eAvatar;

