/*
** qThread -- manage the thread(s) that are doing iteration
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

#include <ctime>

#include "../hilbert/qSpace.h"
#include "../debroglie/qWave.h"
#include "../greiman/qAvatar.h"
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
// start and run the frame loop, that runs parallel to the heartbeat in squishPanel
//void qAvatar::initIntegrationLoop(int nThreads, int nStages) {
//
//	qFlick *stages = qFlick::flick = new qFlick(space, nStages);
//	threads = qThread::threads = new qThread[nThreads];
//	// allocate the buffer stages
//
//	// light it off (?)
//}
