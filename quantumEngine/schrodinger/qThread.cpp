/*
** qThread -- manage the thread(s) that are doing iteration
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

#include <ctime>

#include "../spaceWave/qSpace.h"
#include "../debroglie/qWave.h"
#include "qAvatar.h"
#include "qGrinder.h"
#include "qThread.h"

/* ********************************************************************************** threads */

qThread *qThread::threads;

qThread::qThread() {

}

qThread::~qThread() {

}


// each thread does this upon startup to show it's alive
void qThread::threadStarts() {

}



/* ********************************************************************************** misc */

// init up the whole thing.  Called once upon app startup.
// start and run the iteration loop, that runs parallel to the heartbeat in squishPanel
//void qAvatar::initIterationLoop(int nThreads, int nStages) {
//
//	qFlick *stages = qFlick::flick = new qFlick(space, nStages);
//	threads = qThread::threads = new qThread[nThreads];
//	// allocate the buffer stages
//
//	// light it off (?)
//}

// no!  this has to be in JS
// the JS timer (rAF) says it's a good time to start an iteration.
// tell whatever threads that it's time to do another iteration. they may
// already be in the middle of one, in which case they should start again
// immediately on the next.
//bool qAvatar::pleaseIterate(void) {
//	if (doingIteration) {
//		needsIteration = true;
//		return false;
//	}
//	else {
//		needsIteration = false;
//		oneIteration();
//		return true;
//	}
//}

//extern "C" void avatar_initIterationLoop(qAvatar *avatar, int nThreads, int nStages) {
//	emscripten_debugger();
//	avatar->initIterationLoop(nThreads, nStages);
//}

// no!  this has to be in JS
//extern "C" int avatar_pleaseIterate(qAvatar *avatar) {
//	emscripten_debugger();
//	return avatar->pleaseIterate();
//}

