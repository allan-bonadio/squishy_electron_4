/*
** jsAvatar - the JS representations of the c++ Avatar object
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/
//import qe from './qe';

class jsAvatar {
	// pointer is an integer pointing into the C++ address space, to the Avatar object.
	// We can then set and sample each of the member variables if we know the offset
	constructor(pointer, qewave) {
		// we directly access fields in this C++ object,
		// cuz the overhead from each js-C++ call is kindof large
		this.pointer = pointer;
		this.doubles = new Float64Array(window.Module.HEAPF64.buffer, pointer);
		this.ints = new Uint32Array(window.Module.HEAPU32.buffer, pointer);
		this.bools = new Uint8Array(window.Module.HEAPU8.buffer, pointer);

		this.qewave = qewave;
	}

	/* ************************************************************************* Accessors */

	get space() { return this.ints[1]; }
	set space(a) { this.ints[1] = a; }
	get elapsedTime() { return this.doubles[1]; }
	set elapsedTime(a) { this.doubles[1] = a; }
	get iterateSerial() { return this.doubles[2]; }
	set iterateSerial(a) { this.doubles[2] = a; }
	get isIterating() { return this.bools[24]; }
	set isIterating(a) { this.bools[24] = a; }
	get pleaseFFT() { return this.bools[25]; }
	set pleaseFFT(a) { this.bools[25] = a; }
	get dt() { return this.doubles[4]; }
	set dt(a) { this.doubles[4] = a; }
	get lowPassFilter() { return this.ints[10]; }
	set lowPassFilter(a) { this.ints[10] = a; }
	get stepsPerIteration() { return this.ints[11]; }
	set stepsPerIteration(a) { this.ints[11] = a; }
	get mainQWave() { return this.ints[12]; }
	set mainQWave(a) { this.ints[12] = a; }
	get potential() { return this.ints[13]; }
	set potential(a) { this.ints[13] = a; }
	get potentialFactor() { return this.doubles[7]; }
	set potentialFactor(a) { this.doubles[7] = a; }
	get scratchQWave() { return this.ints[16]; }
	set scratchQWave(a) { this.ints[16] = a; }
	get spect() { return this.ints[17]; }
	set spect(a) { this.ints[17] = a; }
	get qvBuffer() { return this.ints[18]; }
	set qvBuffer(a) { this.ints[18] = a; }
}


export default jsAvatar;

/* just thinking out loud here... about automating this:
	input to the mapper:
	{name: 'elapsedTime', type: 'double', offset: 8},
	{name: 'stepsPerIteration', type: 'int', offset: 40},
	{name: 'pleaseFFT', type: 'bool', offset: 45},

	or even better, hand in to JS:
	['elapsedTime',  'stepsPerIteration',  'pleaseFFT', ...]
	that gets compiled to C++ code that generates:
	{name: 'elapsedTime', type: 'double', size: 8, offset: 8},
	{name: 'stepsPerIteration', type: 'int', size: 4, offset: 40},
	{name: 'pleaseFFT', type: 'bool', size: 1, offset: 45},
	that goes thru some JS that does Object.defineOwnProperty() calls to make the JS objects with accessors.

	cool.  Maybe after I become independently wealthy...
*/
