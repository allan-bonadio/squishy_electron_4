/*
** grinder -- this manages the engine's stepping through time, threads, etc
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

//#include <string.h>
//
//#include <ctime>
//#include <limits>
//#include <cfenv>

// not sure what i'm using this file for ... probably should get rid of it in favor of qGrinder
// see qThread.cpp


#include "../spaceWave/qSpace.h"
#include "qAvatar.h"
#include "qGrinder.h"
//#include "../debroglie/qWave.h"
//#include "../fourier/qSpectrum.h"
//#include "../greiman/qViewBuffer.h"
//#include "../fourier/fftMain.h"
//#include "../directAccessors.h"



static bool traceIntegration = false;  //



// not really used rightr now; should get rid of it

