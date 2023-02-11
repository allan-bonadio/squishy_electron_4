/*
** abacus -- a sequence of waves, each representing a step in integration of the PDE
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

// abacus: a matrix-like device used for calculation

#include <atomic>

#include "../hilbert/qSpace.h"
#include "qGrinder.h"
#include "../debroglie/qFlick.h"
#include "abacus.h"

// see if this vomits...  no, it compiles!
#include <emscripten/threading.h>

void tryAFunc(int ix) {
	byte aLock = 3;

	byte gotOne = emscripten_atomic_exchange_u8(&aLock, 7);

}

static bool traceConstruction = false;

/* loop must look kinda like this, per thread:

## Integrate step
1) quickly integrate edge points, and set doneLo and doneHi, so neighboring threads can proceed
	- realStep lowest 2 points, behind->hi->border, border+1
	- realStep highest 2 points, ahead->lo->border-2, border-1

	- imagStep lowest point, , behind->hi->border, then set hiDone in behind edge
	- imagStep highest point, ahead->lo->border-1, then set loDone in ahead edge

	- correctly handle cases where boundaries are <4 apart
	:: need stepOneReal(), stepOneImaginary(), and integrateEdgePoints() for a thread

2) do the rest of integration
	- realStep all the points in between, behind->border+2 thru ahead->lo->border-3
	- imagStep all the points in between, behind->hi->border+1 thru ahead->lo->border-2
	:: need integrateInnerPoints() to do this

3) Claim edges in next generation/wave
	- if this-gen behind->loDone, set next-gen behind->border to this-gen behind-border
		unless already set
	- else, set next-gen behind->border to this-gen behind-border + 1
	- if this-gen ahead->hiDone, set next-gen ahead->border to this-gen behind-border
		unless already set
	- else, set next-gen ahead->border to this-gen ahead-border - 1
	:: need claimBehind() and claimAhead()

## Midpoint:
Actually, need to make some distinctions between different generations for midpoint method.
A) integrate generation G, hamiltonian at G, to product G+1
B) integrate generation G, hamiltonian at G+1, to product G+2
C) average G+1 and G+2 into G+3.  Can't reuse G+2 cuz neighboring threads need originals.
	part C should be exactly same boundaries as part B, should be ready to go (?)

## etc
- number of waves may or may not be stepsPerFrame so the whole buffer does one frame
- if nWaves are shorter than stepsPerFrame, need a mechanism to loop around to 0-th wave again
- need to call qFlick::reset upon start of frame
- need mechanism to stop threads when they finish their last generation
- need mechanism to stop a thread if its boundaries shrink the segment to 1 or 0 length,
	then restart it when others pass it.

*/



/* ************************************************************ edges */

// no constructor/destructor cuz always created as part of array

// set to 'not yet encountered'
void edge::init(abacus *aba, int ser) {
	abac = aba;
	serial = ser;
}

// before every frame, reset ALL the edges
void edge::reset(void) {
	lock = UNLOCKED;
	border = UNDECIDED;
	loDone = hiDone = false;
	isFixed = false;
}

// 'this' cannot be null; language prevents it
void edge::dump(void) {
	printf("edge %p: abac=%p #%d -- |%d| %s %s %s\n", this, abac, serial, border,
		isFixed ? "fixed" : "", loDone ? "lo" : "", hiDone ? "hi" : "");
}

int edge::claim(void) {
	return 0;
}

void edge::iterate(void) {
}

void spinLock(void) {
	byte stillLocked = true;

	while (stillLocked)
		stillLocked = emscripten_atomic_exchange_u8(&lock, true);
	// so for a microsecond, stillLocked became false so now we have the lock.
	// And, now we have locked it for ourselves instantly.
}

void spinUnock(void) {
	emscripten_atomic_store_u8(&lock, false);
}

/* ************************************************************ thread Progress */

// no constructor/destructor cuz always created as part of array

// upon creation
void progress::init(abacus *aba, int ser)  {
	abac = aba;
	serial = ser;
}

// start of every frame, reset all of these, called by abacus::reset()
// pass the behind and ahead edge for each.
void progress::reset(edge *b, edge *a) {
	behind = b;
	ahead = a;
}

// 'this' cannot be null; language prevents it
void progress::dump(void) {
	printf("progress %p: abac%p #%d\n", this, abac, serial);

	printf("\t");
	if (behind)
		behind->dump();
	else
		printf("null behind ptr\n");

	printf("\t");
	if (ahead)
		ahead->dump();
	else
		printf("null ahead ptr\n");
}

// quickly integrate the points right against the borders and set the flags so
void integrateEdges() {
	int gap = (ahead->border - behind->border) & abac->statesMask;
	if (gap < 3) {
		// short - just do them all
		for (int ix = behind->border; ix < ahead->border; ix++) {
			abac->stepOneReal(ix, nextWave, thisWave, thisWave)
		}
	}
	else {
		// do the behind, do the ahead
		abac->stepOneReal(behind->border, nextWave, thisWave, thisWave)
		abac->stepOneReal(ahead->border, nextWave, thisWave, thisWave)
	}
}

void progress::next(void) {
	// since I'm done with this wave, the edge->border has been set on both edges,
	// so I can read them without locking.

	edge *nextBehind = behind + abac->nThreads;
	edge *nextAhead = ahead + abac->nThreads;

	// SPIN-LOCK nextBehind lock
	if (nextBehind->border == UNDECIDED) {
		// critical section!  gotta do this before the other guy does it!
		if (behind->loDone) {
			// ready to do the same border, so pull up one
			nextBehind->border = behind->border;
		}
		else {
			// not ready to do the same border, so pull up one
			// in order for this border to go -1, the other guy has to do it cuz I didn't do my end
			nextBehind->border = behind->border + 1;
		}

	}
	// SPIN_LOCK nextBehind released

	// SPIN-LOCK nextAhead lock
	if (nextAhead->border == UNDECIDED) {
		// critical section!  gotta do this before the other guy does it!
		if (ahead->hiDone) {
			// ready to do the same border, so pull up one
			nextAhead->border = ahead->border;
		}
		else {
			// aren't those two conditions sortof the same?!!?!  no, different generations
			// not ready to do the same border, so pull up one
			// in order for this border to go +1, the other guy has to do it cuz I didn't do my end
			nextAhead->border = ahead->border - 1;
		}
	}
	// SPIN_LOCK nextAhead released


	behind = nextBehind;
	ahead = nextAhead;
}


/* ************************************************************ birth & death & basics */

// each buffer is initialized to zero bytes therefore 0.0 everywhere
abacus::abacus(qSpace *sp, qGrinder *gr, int nW, int nThr)
	: space(sp), qgrinder(gr), nWaves(nW), nThreads(nThr) {
	if (! space)
		throw std::runtime_error("abacus::abacus null space");
	if (nWaves < 2) throw std::runtime_error("nWaves must be at least 2");
	if (nWaves > 200) throw std::runtime_error("nWaves is too big, sure you want that?");
	if (nThreads > MAX_THREADS) throw std::runtime_error("nWaves is too big, sure you want that?");

	magic = 'Abac';

	qflick = qgrinder->qflick;
	waves = qflick->waves;
	qflick->setNWaves(nWaves);

	// all the edges, in big arrays
	nEdges = nThreads * nWaves;
	edges = new edge[nEdges];
	endEdge = edges + nEdges;
	for (int e = 0; e < nEdges; e++) {
		edges[e].init(this, e);
	}

	// and all the progresses, so they point to the first row of edges
	progresses = new progress[nThreads];

	for (int w = 0; w < nThreads; w++)
		progresses[w].init(this, w);

	statesMask = space->nStates - 1;
}


abacus::~abacus() {
	if (traceConstruction)
		printf("start the abacus instance destructor...\n");

	// the joys of continuous block allocation
	delete[] edges;
	delete[] progresses;

	// we'll have to do this eventually when we allocate real/imag buffers.
	//for (int i = 0; i < nWaves; i++) {
	//	freeWave(waves[i]);
	//	waves[i] = NULL;
	//}
	//delete waves;
	//if (traceConstruction)
	//	printf("    freed the wave buffers...\n");
	//
	//waves = NULL;
	//if (traceConstruction)
	//	printf("    freed waves array..done with abacus destructor..\n");
}

/* ************************************************************ integration on the qflick */

// set up our edges and progresses to get ready for a new integration
void abacus::reset(void) {

	for (int b = 0; b < nEdges; b++)
		edges[b].reset();

	// for WELL dimensions, fix the 0-th edge for each wave
	if (contWELL == space->dimensions[0].continuum) {
		for (edge *e = edges; e < endEdge; e += nThreads)
			e->isFixed = true;
	}

	// the progresses all point to the edges that concern them
	// edges for the 0-th wave
	for (int w = 0; w < nThreads; w++) {
		progresses[w].reset(&edges[w], &edges[w + 1]);

		// this should span the wave with roughly equal segments.  for starters.
		edges[w].border =  w * space->nStates / nThreads;
	}
	progresses[nThreads-1].ahead = &edges[0];  // edges[0] wraparound
}

void abacus::dumpEdges(int start, int end) {
	printf("📏 📏 📏 edges: total %d\n", nEdges);
	if (end > nEdges)
		end = nEdges;
	for (int e = 0; e < nEdges; e++)
		edges[e].dump();
}

// dump ALL of them, plus their current edges
void abacus::dumpProgress(void) {
	printf("🧵 🧵 🧵 threads: total %d\n", nThreads);
	for (int w = 0; w < nThreads; w++)
		progresses[w].dump();

}

