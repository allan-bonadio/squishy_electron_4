/*
** cppu main -- all CPPUTest tests should include this file
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

// this allows CHECK_EQUAL() to do complex numbers
extern struct SimpleString StringFrom(const qCx value);


// make JUST a new qSpace() with minimal everything.  No buffers.
extern struct qSpace *makeBareSpace(int N, int continuum = contENDLESS);

// these labels are limited to 7 chars, see runner
#define MAKEBARESPACE_LABEL "makeBar"
#define MAKEBARE1DDIM_LABEL "makeDim"

// use the jsSpace functions to make a js-callable qSpace in theSpace,
// with all of the buffers allocated.
extern struct qSpace *makeFullSpace(int N);  // handy
#define MAKEFULLSPACE_LABEL "makeFul"

/* *************************************************** waves, buffers */

// make sure we own all the bytes in this buffer by reading and writing each byte
extern void proveItsMine(void *buf, size_t size);

// make sure they're equal, both the waves and the nPoints, start and end
extern void compareWaves(struct qBuffer *expected, struct qBuffer *actual);

extern bool isAllZeroesExceptFor(qBuffer *qwave,
	int except1 = -1, int except2 = -1);

/* *************************************************** rando generator */
// easier than looking up the latest whiz bang C++ random generator
extern double rando;

// a mediocre random number generator that's easy to type.  returns -.5 ... +.5
extern double nextRando(void);
