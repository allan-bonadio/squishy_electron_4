/*
** squish.h -- common defines for the C++ part of squishyelectron
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

// include this in almost all C++ sources
#ifndef __SQUISH_H__
#define __SQUISH_H__

#include <cstdio>
//#include <cstdlib>
#include <cmath>
#include <stdexcept>

#include "debroglie/qCx.h"

#include "commonConstants.h"

// return elapsed time since last page reload, in seconds
extern double getTimeDouble(void);

#ifdef qDEV_VERSION
	extern void qCheck(qCx aCx, const char *where = "", int index = -999999999);
#else
	#define qCheck(where, ...)
#endif

// use this for tracing without needing the debugger.
#define FOOTPRINT  printf("FOOTPRINT 🦶 %s() in %s:%d\n", __FUNCTION__, __FILE__, __LINE__);

// Uncomment only the first line below, for normal operation.
// When you change some field arrangements or sizes for the major objects
// proxied in JS, uncomment only the second line, below, to re-do the offsets, so all constructors
// print out JS code. Then run in the browser (not C++ cppu tests, they use
// 64bit ptrs), and take the generated JS and paste it into the corresponding JS
// files, in src/engine, where indicated. Remove the line numbers that the browsers stick in!
#define FORMAT_DIRECT_OFFSETS
//#define FORMAT_DIRECT_OFFSETS  formatDirectOffsets()

#endif
