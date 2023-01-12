/*
** Main -- top level source file for running Squishy Electron
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

//#include "squish.h"
//#include <stdio.h>
//#include <cmath>


#include "spaceWave/qSpace.h"
#include "greiman/qAvatar.h"
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
		else {
			console.log(" ☀️ restart the page cuz hot-reloading sabotaged me again      🙄  👿 🤢 😵 🤬 😭 😠");
			setTimeout(() => location = location, 1000);
		}
	}, 50);
	return navigator.hardwareConcurrency;
}
);


// emscripten calls main() when the whole C++ is all set up.  Tell the JS guys.
int main() {
	printf(" ☀️ bonjour le monde!\n");

	// returns 1.  pfft.  std::thread::hardware_concurrency();

	int hardwareConcurrency = qeStarted(MAX_DIMENSIONS, MAX_LABEL_LEN);
	printf("hardwareConcurrency=%d  \n", hardwareConcurrency);
	return 0;
}

