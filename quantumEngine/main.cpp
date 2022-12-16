/*
** Main -- top level source file for running Squishy Electron
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

#include "squish.h"
//#include <stdio.h>
//#include <cmath>


#include "spaceWave/qSpace.h"
#include "schrodinger/qAvatar.h"
#include "schrodinger/qGrinder.h"
#include "fourier/fftMain.h"



// Emscripten magic: this c++ function will end up executing the JS enclosed.
// call this JS callback so JS knows we're up and ready.
// Hand it some numbers from the builder script.
// somehow there's a race condition where this isn't set soon enough... sometimes
EM_JS(int, qeStarted, (int max_dimensions, int max_label_len),
{
	// maybe we can tighten this up a bit someday
	setTimeout(() =>{
		if (window.quantumEngineHasStarted)
			window.quantumEngineHasStarted(max_dimensions, max_label_len);
		else
			location = location;  // restart the page cuz hotreloading sabotaged me again
	}, 50);
	return navigator.hardwareConcurrency;
}
);


// emscripten calls main() when the whole C++ is all set up.  Tell the JS guys.
int main() {
	printf(" 🌞 bonjour le monde!\n");

	// returns 1.  pfft.  std::thread::hardware_concurrency();

	int hardwareConcurrency = qeStarted(MAX_DIMENSIONS, MAX_LABEL_LEN);
	printf("hardwareConcurrency=%d  \n", hardwareConcurrency);
	//printf("alignof(double) = %ld, alignof(int) = %ld, alignof(int *) = %ld, alignof(bool) = %ld\n",
	//	alignof(double), alignof(int), alignof(int *), alignof(bool));
	return 0;
}

