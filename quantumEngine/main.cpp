/*
** Main -- top level source file for running Squishy Electron
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

#include "hilbert/qSpace.h"
#include "greiman/qAvatar.h"
#include "schrodinger/qGrinder.h"
#include "fourier/fftMain.h"



// Emscripten magic: this c++ function will end up executing the JS enclosed.
// call this JS callback so JS knows we're up and ready.
// Hand it some numbers from the builder script.
// somehow there's a race condition where this isn't set soon enough... sometimes
EM_JS(int, qeStarted, (int max_dimensions, int max_label_len),
{
	document.addEventListener('DOMContentLoaded', ev => {
		if (!window.quantumEngineHasStarted) {
			debugger;
			throw(" 🐣 quantumEngineHasStarted() not available on startup!      🙄  👿 🤢 😵 🤬 😭 😠");
		}

		window.quantumEngineHasStarted(max_dimensions, max_label_len);
	});
	return navigator.hardwareConcurrency;
}
);


// emscripten calls main() when the whole C++ is all set up.  Tell the JS guys.
int main() {
	printf(" 🐣 bonjour le monde!\n");

	// returns 1.  pfft.  std::thread::hardware_concurrency();

	int hardwareConcurrency = qeStarted(MAX_DIMENSIONS, MAX_LABEL_LEN);
	printf(" 🐣 hardwareConcurrency=%d  \n", hardwareConcurrency);
	return 0;
}

