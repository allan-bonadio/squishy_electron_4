/*
** slaveThread -- one thread that's doing iteration
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/


#include "qThread.h"
#include "qGrinder.h"
#include "slaveThread.h"
#include <emscripten/html5.h>
#include <emscripten/emscripten.h>

// wrapper for emscripten_request_animation_frame_loop() to call slaveRunner()
static void sRunner(void *arg) {
	slaveThread *This = (slaveThread *) arg;
	This->slaveRunner();
}

// wrapper for pthread to start the thread.  arg is the slaveThread ptr.  requestAnimationFrame.
static void *sStarter(void *arg) {
	emscripten_set_main_loop_arg(&sRunner, arg, -1, false);
	return NULL;
}


// indexed by thread serial, there may be gaps.
// for threads that AREN'T slaves
static slaveThread *sla[MAX_THREADS];
slaveThread **qGrinder::slaves = sla;


// initialize this as being idle, before starting an integration task.
// All the grinders are the same object; all the threads are differrent.
slaveThread::slaveThread(qGrinder *gr)
	: grinder(gr) {

	thread = new qThread(&sStarter, (void *) this);
	serial = thread->serial;
}
// no destructor - never freed


// runs repeatedly, either does integration or not depending on grinder flag
// arg = same arg passed to qGrinder constructor, in this case, grinder
void slaveThread::slaveRunner(void) {
	int nWas;

	printf("🔪 slaveRunner: isIntegrating =%d.  nIntegratingThreads=%d\n",
		grinder->isIntegrating, grinder->nIntegratingThreads);

	// if we're not doing it, don't do it
	if (! grinder->isIntegrating) {
		// STILL have to sync in case user turned integration on.
		// note we don't touch the frameCalcTime
		pthread_mutex_lock(&grinder->integratingMx);
			nWas = --grinder->nIntegratingThreads;
		pthread_mutex_unlock(&grinder->integratingMx);

		if (nWas <= 0) {
			printf("🔪 slaveRunner: !isIntegrating and last thread.  setting isIntegrating to shouldBeIntegrating=%d\n",
				grinder->shouldBeIntegrating);
			grinder->isIntegrating = grinder->shouldBeIntegrating;
		}
		return;
	}

	// set starting time, under lock
	double now = emscripten_performance_now();
	pthread_mutex_lock(&grinder->integratingMx);
	startCalc = now;
	pthread_mutex_unlock(&grinder->integratingMx);

	//actually, doing the calculation
	grinder->oneFrame();

	double endCalc = emscripten_performance_now();
	pthread_mutex_lock(&grinder->integratingMx);
		// get endCalc and compare
		frameCalcTime = endCalc - startCalc;

		// tell the boss we're done
		nWas = --grinder->nIntegratingThreads;
	pthread_mutex_unlock(&grinder->integratingMx);

	if (nWas <= 0) {
		// this must be the last thread to finish!
		grinder->aggregateCalcTime();

		printf("🔪 slaveRunner: isIntegrating and last thread.  justNFrames=%d and shouldBeIntegrating=%d\n",
			grinder->justNFrames, grinder->shouldBeIntegrating);

		if (grinder->justNFrames) {
			--grinder->justNFrames;
			if (0 == grinder->justNFrames)
				grinder->shouldBeIntegrating = false;
		}

		grinder->isIntegrating = grinder->shouldBeIntegrating;
		printf("🔪 slaveRunner: integrating and last thread.  isIntegrating now =%d  and frameCalcTime=%12.4lf\n",
			grinder->isIntegrating, grinder->frameCalcTime);
	}
	return;
}




// creates all slave threads; runs early
void slaveThread::createSlaves(qGrinder *grinder) {

	for (int t = 0; t < grinder->nSlaveThreads; t++) {
		// actual pthread won't start till the next event loop i think
		slaveThread *slave = new slaveThread(grinder);
		grinder->slaves[slave->thread->serial] = slave;
		printf("🔪  slaveThread::createSlaves created A Slave(%d) \n", slave->serial);
	}



	printf("🔪  grinder_created %d slaves \n", grinder->nSlaveThreads);
};

// called from control panel when user futzes with start/stop button
//void startStop(bool toStart) {
//
//}


