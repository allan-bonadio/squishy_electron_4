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

