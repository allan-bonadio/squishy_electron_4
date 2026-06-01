/*
** eFlick -- JS equivalent to a qFlick (roughly)
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

// There is no eBuffer or eSpectrum; C++ deals with those exclusively

import qeConsts from './qeConsts.js';
//import {cppObjectRegistry, prepForDirectAccessors} from '../utils/directAccessors.js';
import eObject from './eObject.js';
import eSpace from './eSpace.js';
import eCavity from './eCavity.js';

let traceSetFamiliarFlick = false;
let traceGaussian = false;
let traceFamiliarResult = false;
let traceAllocate = false;

const _ = num => num.toFixed(4).padStart(9);



// this is just a 1D wave.  someday...
class eFlick extends eCavity {
	// see how much we can freeload off of class qCavity.  All the direct accessor
	// variables are in different places!! but everything else should work ok.  i
	// think.  the eFlick constructor is called by the eGrinder constructor.  Analogously,
	// the qFlick constructor is called by the qGrinder constructor
	// label is optional and only JS side
	constructor(space, label = 'wave', pointer) {
		super();

		//space, label = 'wave', useThis32F, pointer
		this.space = space;
		if (!(space instanceof eSpace))
			throw new Error("new eCavity: space is not an eSpace")

		// no already created.  Figure this out later.  ???
		//let pointer = qeFuncs.flick_create(space._pointer_);
		this.setPointer(pointer);
		// had args: space, label, null, pointer

		// now for the buffer
		this.completeWave(null);

		this.label = label;
	}

	// finish the construction.  eFlick (the only one) is constructed by the space
	// with all its buffers.  No fussing.  useThis32F is null.  ._wave is pointer to the qcavity's wave.
	completeWave(useThis32F) {
		// always had the C++ buffer, need this too
		this.wave = new Float64Array(Module.HEAPF64.buffer, this._wave, 2 * this.space.nPoints);
	}

	// delete, except 'delete' is a reserved word.  Turn everything off.
	// null out all other JS objects and buffers it points to, so ref counting can recycle it all
	liquidate() {
		flick_delete(this._pointer_);
		this.space = this.wave = null;
	}

	/* *************************************    👽   👽    direct access */
	// these are different offsets from qCavity (? they were); therefore all of these
	// have to override qCavity's versions.

	get _wave() { return this._ints_[7]; }

	get nPoints() { return this._ints_[8]; }
	get start() { return this._ints_[9]; }
	get end() { return this._ints_[10]; }
	get continuum() { return this._ints_[11]; }

	/* ****************************    👽   👽    end of direct accessors */
	// hope everything else works!  All of qCavity's methods work on
	// buffer zero.
}

export default eFlick;

