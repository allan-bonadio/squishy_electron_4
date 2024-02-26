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
// all these param names must be lower case for some reason.
EM_JS(int, qeStarted, (int max_dimensions, int max_label_len, int n_threads),
{
	// sometimes these things start in the wrong order
	let inter = setInterval(() => {
		if (window.startUpFromCpp) {
			window.startUpFromCpp(max_dimensions, max_label_len, n_threads);
			clearInterval(inter);
		}
	}, 100);

	// worthless i think
	return navigator.hardwareConcurrency;
}
);


// emscripten calls main() when the whole C++ is all set up.  Tell the JS guys.
int main() {
	printf(" 🐣 bonjour le monde!\n");

	qeStarted(MAX_DIMENSIONS, MAX_LABEL_LEN, N_THREADS);
	return 0;
}

