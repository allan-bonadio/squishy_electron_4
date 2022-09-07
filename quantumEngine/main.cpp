/*
** Main -- top level source file for running Squishy Electron
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

#include "squish.h"
//#include <stdio.h>
//#include <cmath>

#include "spaceWave/qSpace.h"
#include "schrodinger/Avatar.h"
#include "fourier/fftMain.h"



// Emscripten magic: this c++ function will end up executing the JS enclosed.
// call this JS callback so JS knows we're up and ready.
// Hand it some sizes for the heck of it.
// somehow there's a race condition where this isn't set soon enough... sometimes
EM_JS(void, qeStarted, (int mDimensions, int mLabel),
{
	// maybe we can tighten this up a bit someday
	setTimeout(() => quantumEngineHasStarted(mDimensions, mLabel), 500);
}
);


// emscripten calls main() when the whole C++ is all set up.  Tell the JS guys.
int main() {
	printf("bonjour le monde! sizeof(qDimension) = %lx, sizeof(qSpace) = %lx\n",
		sizeof(qDimension), sizeof(qSpace));

	// call the above function with arbitrary numbers to keep everybody amused
	qeStarted(180, 18);


	printf("alignof(double) = %ld, alignof(int) = %ld, alignof(int *) = %ld, alignof(bool) = %ld\n",
		alignof(double), alignof(int), alignof(int *), alignof(bool));
	return 0;
}




/* ************************************************* error handling */

// wasm-ld: error: /var/folders/th/9674h0fx4hx2d7y751ln3g1r0000gn/T/emscripten_temp_nx3ony_i/main_0.o: undefined symbol: _embind_register_function

// now see exceptions.cpp
//#include "/dvl/emscripten/emsdk-main/upstream/emscripten/system/include/emscripten/bind.h"
//
//std::string getExceptionMessage(intptr_t exceptionPtr) {
//  return std::string(reinterpret_cast<std::exception *>(exceptionPtr)->what());
//}
//
//EMSCRIPTEN_BINDINGS(Bindings) {
//  emscripten::function("getExceptionMessage", &getExceptionMessage);
//};


