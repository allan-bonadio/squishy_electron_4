/*
** eFlick -- JS equivalent to a qFlick (roughly)
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

// There is no eBuffer or eSpectrum; C++ deals with those exclusively

import qeConsts from './qeConsts.js';
import {cppObjectRegistry, prepForDirectAccessors} from '../utils/directAccessors.js';
import eSpace from './eSpace.js';
import eWave from './eWave.js';

let traceSetFamiliarFlick = false;
let traceGaussian = false;
let traceFamiliarResult = false;
let traceAllocate = false;

const _ = num => num.toFixed(4).padStart(9);



// this is just a 1D wave.  someday...
class eFlick extends eWave {
	// see how much we can freeload off of class qWave.  All the direct accessor
	// variables are in different places!! but everything else should work ok.  i
	// think.  Only available constructor is with pointer and no typed array buffer.
	// cuz there's multiple waves.
	// label is optional and only JS side
	constructor(space, label, pointer) {
		super(space, label, null, pointer);

		// no already created.  Figure this out later.  qeFuncs.flick_create(space.pointer);
	}

	// finish the construction.  eFlick (the only one) is constructed by the space
	// with all its buffers.  No fussing.  useThis32F is null.  ._wave is pointer to the qwave's wave.
	completeWave(useThis32F) {
		// always had the C++ buffer, need this too
		this.wave = new Float64Array(Module.HEAPF64.buffer, this._wave, 2 * this.space.nPoints);
	}

	// delete, except 'delete' is a reserved word.  Turn everything off.
	// null out all other JS objects and buffers it points to, so ref counting can recycle it all
	liquidate() {
		flick_delete(this.pointer);
		this.space = this.wave = null;
	}

	/* ************************************* 🥽 direct access */
	// these are different offsets from qWave; therefore all of these
	// have to override qWave's versions.  But the constructor for eWave calls
	// prepForDirectAccessors() for us, and it works the same.

	get _wave() { return this.ints[7]; }

	get nPoints() { return this.ints[8]; }
	get start() { return this.ints[9]; }
	get end() { return this.ints[10]; }
	get continuum() { return this.ints[11]; }

	/* **************************** 🥽 end of direct accessors */
	// hope everything else works!  All of qWave's methods work on
	// buffer zero.
}

export default eFlick;

