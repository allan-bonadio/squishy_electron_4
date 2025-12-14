/*
** squish.h -- common defines for the C++ part of squishyelectron
** Copyright (C) 2022-2025 Tactile Interactive, all rights reserved
*/

// include this in almost all C++ sources
#ifndef __SQUISH_H__
#define __SQUISH_H__

#include <cstdio>
#include <cmath>
#include <stdexcept>

#include "debroglie/qCx.h"

#include "commonConstants.h"

// return elapsed time since last page reload, in Milliseconds
extern double getTimeDouble(void);

extern const double ℏ;  //  = 105.4571817 pfg nm^2 / ps, Plank's reduced
extern const double m_e;  //  = .91093837015 pico femto grams, mass of electron

// these two are used directly in Schrodinger's - the equ we integrate is all / ℏ
extern const double ℏOver2m_e;  // = ℏ / (2 * m_e)  units nm^2 / ps
extern const double inverseℏ;  //  = 1 / ℏ;  // units ps / pfg nm^2

extern const double NaN;

#ifdef qDEV_VERSION
	extern void qCheck(qCx aCx, const char *where = "", int index = -999999999);
	extern void qCheckReset(void);
#else
	#define qCheck(where, ...)
	#define qCheckReset(where, ...)
#endif

// use speedyLog() just like printf(), then call speedyFlush() to print out
// everything logged
extern void speedyLog(const char* format, ...);
extern void speedyFlush(void);

#define MAGIC_FORMAT "%c%c%c%c"
#define MAGIC_ARGS magic >> 24, magic >> 16, magic >> 8, magic

// dynamically allocated but [MAX_LABEL_LEN + 1]
extern char *cppLabelText;

#endif

