/*
** squish.h -- common defines for the C++ part of squishyelectron
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
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

// Tolerance for ==.  Absolute, not relative, we're comparing 𝜓 values here.
// all values are |𝜓| <1, and typically |𝜓| > roundoff error
// these are not really the radius, it's more rectangular, but pretty much the same idea
#define ERROR_RADIUS  1e-12

#ifdef qDEV_VERSION
	extern void qCheck(qCx aCx, const char *where = "", int index = -999999999);
#else
	#define qCheck(where, ...)
#endif

// use this for tracing without needing the debugger.
#define FOOTPRINT  printf("FOOTPRINT 🦶 %s() in %s:%d\n", __FUNCTION__, __FILE__, __LINE__);


#endif
