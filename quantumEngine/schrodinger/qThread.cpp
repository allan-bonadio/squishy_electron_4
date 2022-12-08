/*
** qThread -- manage the thread(s) that are doing iteration
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

#include <ctime>

#include "../spaceWave/qSpace.h"
#include "qAvatar.h"
#include "../debroglie/qWave.h"




// each thread does this upon startup to show it's alive
void threadStarts() {

}

// start and run the iteration loop, that runs parallel to the heartbeat in squishPanel
void avatar_iterationLoop(qAvatar *avatar, int nStages) {
	// allocate the buffer stages

	// light it off (?)
}

// the JS timer (rAF) says it's a good time to start an iteration.
// tell whatever threads that it's time to do another iteration. they may
// already be in the middle of one, in which case they should start again
// immediately on the next.
bool qAvatar::pleaseIterate(void) {
	if (doingIteration) {
		needsIteration = true;
		return false;
	}
	else {
		needsIteration = false;
		oneIteration();
		return true;
	}
}

int avatar_pleaseIterate(qAvatar *avatar) {
	emscripten_debugger();
	return avatar->pleaseIterate();
}

