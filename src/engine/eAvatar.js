/*
** eAvatar - the JS representations of the c++ Avatar object
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/
//import qe from './qe';
import {prepForDirectAccessors} from '../utils/directAccessors';

class eAvatar {
	// pointer is an integer pointing into the C++ address space, to the Avatar object.
	// We can then set and sample each of the member variables if we know the offset
	constructor(pointer, qewave) {
		prepForDirectAccessors(this, pointer);
		this.qewave = qewave;
	}

	/* ************************************************************************* Accessors */
	// see qAvatar.cpp to regenerate this.
	// Note these are all scalars; buffers are passed by pointer and you need to allocate them in JS
	get space() { return this.ints[1]; }
	set space(a) { this.ints[1] = a; }
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

	get potential() { return this.ints[11]; }
	set potential(a) { this.ints[11] = a; }
	get potentialFactor() { return this.doubles[6]; }
	set potentialFactor(a) { this.doubles[6] = a; }

	get scratchQWave() { return this.ints[14]; }
	set scratchQWave(a) { this.ints[14] = a; }

	get spect() { return this.ints[15]; }
	set spect(a) { this.ints[15] = a; }

	get qvBuffer() { return this.ints[16]; }
	set qvBuffer(a) { this.ints[16] = a; }}


export default eAvatar;

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
