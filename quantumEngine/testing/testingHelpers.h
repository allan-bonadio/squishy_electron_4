/*
** testing helpers -- utilities for testing with cppuTest or otherwise
** Copyright (C) 2023-2024 Tactile Interactive, all rights reserved
*/

#include "../hilbert/qSpace.h"

/* *************************************************** space */

// make JUST a new qSpace() with minimal everything.  No buffers.
extern struct qSpace *makeBareSpace(int N, int continuum = contENDLESS);

// these labels are limited to 7 chars, see runner
#define MAKEBARESPACE_LABEL "makeBar"
#define MAKEBARE1DDIM_LABEL "makeDim"

// use the jsSpace functions to make a js-callable qSpace,
// with all of the buffers allocated.
extern struct qSpace *makeFullSpace(int N);  // handy
#define MAKEFULLSPACE_LABEL "makeFul"

/* *************************************************** waves, buffers */

// make sure we own all the bytes in this buffer by reading and writing each byte
extern void proveItsMine(void *buf, size_t size);

extern void dumpWaveInitializer(const char *varName, qCx *psi, int nPoints);

/* *************************************************** rando generator */
// easier than looking up the latest whiz bang C++ random generator
extern double rando;

// a mediocre random number generator that's easy to type.  returns -.5 ... +.5
extern double nextRando(void);
