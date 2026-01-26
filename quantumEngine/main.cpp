/*
** Main -- top level source file for running Squishy Electron
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

#include "hilbert/qSpace.h"
#include "greiman/qAvatar.h"
#include "schrodinger/qGrinder.h"
#include "fourier/fftMain.h"



// Emscripten magic: this c++ function will end up executing the JS enclosed.
// it'll end up in quantumEngine.js
// call this JS callback so JS knows we're up and ready.
// Hand it some numbers from the builder script.
// all these param names must be lower case for some reason.
EM_JS(int, qeStarted, (int max_dimensions, int n_threads, int sqdevel), {
	// sometimes these things start in the wrong order
	let inter = setInterval(() => {
		if (window.startUpFromCpp) {
			clearInterval(inter);

			// this function in src/engine/eEngine.js
			window.startUpFromCpp(max_dimensions, n_threads, sqdevel);
		}
		else {
			console.log(`try again later, see if cpp set up yet`);
		}
	}, 100);
});


// emscripten calls main() when the whole C++ is all set up.  Tell the JS guys.
int main() {
	printf(" 🐣 bonjour le monde!\n");

	qeStarted(MAX_DIMENSIONS, N_THREADS, sqDEVEL);
	return 0;
}


