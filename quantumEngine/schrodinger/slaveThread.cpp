/*
** slaveThread -- one thread that's doing iteration
** Copyright (C) 2023-2024 Tactile Interactive, all rights reserved
*/


#include "qThread.h"
#include "qGrinder.h"
#include "slaveThread.h"


// lame threads don't do integration; extra threads on the end just for testing
static bool traceLameThreads = false;

static bool traceStart = false;
static bool traceRunner = false;
static bool traceFinish = false;

/* *********************************************** slave threads */

// indexed by thread serial, there may be gaps.
// for threads that AREN'T slaves
static slaveThread *sla[MAX_THREADS];
slaveThread **qGrinder::slaves = sla;

// only nonzero when we're changing the frame factor
int slaveThread::newFrameFactor = 0;

// wrapper for emscripten_request_animation_frame_loop() to call slaveWork()
//static void sRunner(void *arg) {
//	slaveThread *This = (slaveThread *) arg;
//	This->slaveWork();
//}

// wrapper for pthread to start the thread.  arg is the slaveThread ptr.  requestAnimationFrame.
static void *sStarter(void *arg) {
	printf("🔪 sStarter: starting\n");

	// runs forever never returns
	((slaveThread *) arg)->slaveLoop();

	return NULL;
}

/* ******************************************************************* slaveThread */
// initialize this as being idle, before starting an integration task.
// All the grinders are the same object; all the threads are differrent.
slaveThread::slaveThread(qGrinder *gr)
	: grinder(gr) {

	thread = new qThread(&sStarter, (void *) this);
	serial = thread->serial;
}
// no destructor - never freed

// do the work: integration
void slaveThread::slaveWork(void) {
	int nWas;

	if (traceRunner) speedyLog("🔪 slaveWork #%d starts cycle\n", serial);
	if (traceRunner)  {
		speedyLog("🔪              thread #%d: shouldBeIntegrating=%d  isIntegrating=%d.  "
			"nFinishedThreads=%d\n",
			serial, grinder->shouldBeIntegrating, grinder->isIntegrating,
			grinder->nFinishedThreads);
	}

	// Gonna do an integration frame.  set starting time, under lockf
	// wait this doesn't have to be under lock!  it's per-thread.
	startCalc = getTimeDouble();
//	pthread_mutex_lock(&grinder->finishMx);
//	pthread_mutex_unlock(&grinder->finishMx);

	//actually, doing the calculation
	grinder->oneFrame();

	// get endCalc and compare
	double endCalc = getTimeDouble();
	frameCalcTime = endCalc - startCalc;

	if (traceRunner) speedyLog("🔪 end of runner; shouldBeIntegrating=%d  isIntegrating=%d\n",
				grinder->shouldBeIntegrating, grinder->isIntegrating);
}

// repeatedly run the runner in a loop
void slaveThread::slaveLoop(void) {
	while (true) {
		try {
			int nWas;

			// this thread will freeze here until startMx is unlocked, at start of iteration.
			// All other slave threads will also be waiting for startMx.  When this one gets its chance,
			// it'll lock and unlock, then start its integration work.
			// so they all start at roughly the same time.
			pthread_mutex_lock(&grinder->startMx);
				nWas = ++grinder->nStartedThreads;

			// EXCEPT for the last one starting; it'll leave it locked for the next cycle.
			// NO IT's illegal to unlock a thread from a different thread than who set it.
			// Must use a semaphore to synch the threads!!!  This'll work if there's only 1 thread, for now.
			if (grinder->nStartedThreads < grinder->nSlaveThreads)
				pthread_mutex_unlock(&grinder->startMx);
			if (traceStart)
				speedyLog("🔪 start of work, nStarted=%d\n", grinder->nStartedThreads);


			slaveWork();


			// tell the boss we're done
			pthread_mutex_lock(&grinder->finishMx);
				nWas = ++grinder->nFinishedThreads;
			pthread_mutex_unlock(&grinder->finishMx);
			if (traceFinish)
				speedyLog("🔪 finishing work, nFinished=%d\n", grinder->nFinishedThreads);

			if (nWas >= grinder->nSlaveThreads) {
				// this must be the last thread to finish in this integration frame!
				grinder->threadsHaveFinished();
			}

			speedyFlush();
		} catch (std::runtime_error& ex) {
			//  typically divergence.  JS handles it
			grinder->integrationEx = ex;
		}
	}
}


// static; creates all slave threads; runs early
void slaveThread::createSlaves(qGrinder *grinder) {

	for (int t = 0; t < grinder->nSlaveThreads; t++) {
		// actual pthread won't start till the next event loop i think
		slaveThread *slave = new slaveThread(grinder);
		grinder->slaves[slave->thread->serial] = slave;
		printf("🔪  slaveThread::createSlaves() created A Slave(%d) \n", slave->serial);
	}

	printf("🔪  slaveThread created %d slaves \n", grinder->nSlaveThreads);
};



