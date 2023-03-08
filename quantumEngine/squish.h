/*
** squish.h -- common defines for the C++ part of squishyelectron
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

// include this in almost all C++ sources
#ifndef __SQUISH_H__
#define __SQUISH_H__

#include <cstdio>
#include <cmath>
#include <stdexcept>

#include "debroglie/qCx.h"

#include "commonConstants.h"

// return elapsed time since last page reload, in seconds
extern double getTimeDouble(void);

#ifdef qDEV_VERSION
	extern void qCheck(qCx aCx, const char *where = "", int index = -999999999);
	extern void qCheckReset(void);
#else
	#define qCheck(where, ...)
	#define qCheckReset(where, ...)
#endif

// use this for tracing without needing the debugger.
#define FOOTPRINT  printf("🦶 FOOTPRINT 🦶 %s() in %s:%d 🦶\n", __FUNCTION__, __FILE__, __LINE__);

#endif

