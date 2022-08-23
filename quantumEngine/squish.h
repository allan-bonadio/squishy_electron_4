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

//?#include <string>
//?

#include "spaceWave/qCx.h"

// continuum values - same as in eSpace.js; pls synchronize them!
// also used in qBuffers and subclasses
// see now in genExports
#include "commonConstants.h"
//const int contDISCRETE = 0;
//const int contWELL = 1;
//const int contENDLESS = 2;

// return elapsed time since last page reload, in seconds
extern double getTimeDouble();

#endif
