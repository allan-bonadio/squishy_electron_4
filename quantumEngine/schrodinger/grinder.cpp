/*
** grinder -- this manages the engine's stepping through time, threads, etc
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

//#include <string.h>
//
//#include <ctime>
//#include <limits>
//#include <cfenv>

not sure what i'm using this for ... see qThread.cpp


#include "../spaceWave/qSpace.h"
#include "qAvatar.h"
//#include "../debroglie/qWave.h"
//#include "../fourier/qSpectrum.h"
//#include "../spaceWave/qViewBuffer.h"
//#include "../fourier/fftMain.h"
//#include "../directAccessors.h"



static bool traceIteration = false;  //



// some old APII as seen on thiis old page:
//
//void run_in_worker()
//{
//	printf("Hello from wasm worker!\n");
//}
//
//int main()
//{
//	// this is the stack size.  prob not enough
//	emscripten_wasm_worker_t worker = emscripten_malloc_wasm_worker(1024);
//
//	emscripten_wasm_worker_post_function_v(worker, run_in_worker);
//}
