/*
** slaveThread -- one thread that's doing iteration
** Copyright (C) 2023-2024 Tactile Interactive, all rights reserved
*/


#include "qThread.h"
#include "qGrinder.h"
#include "slaveThread.h"

static bool traceStart = false;
static bool traceWork = false;
static bool traceFinish = false;

/* *********************************************** slave threads */

// indexed by thread serial, there may be gaps.
// for threads that AREN'T slaves
static slaveThread *sla[MAX_THREADS];
slaveThread **qGrinder::slaves = sla;

// only nonzero when we're changing the frame factor
// obsolete int slaveThread::frameFactor = 0;

// wrapper for emscripten_request_animation_frame_loop() to call slaveWork()
//static void sRunner(void *arg) {
//	slaveThread *This = (slaveThread *) arg;
//	This->slaveWork();
//}

// wrapper for pthread to start the thread.  arg is the slaveThread ptr.  requestAnimationFrame.
static void *sStarter(void *arg) {
	speedyLog("🔪 slaveThread: starting\n");

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

	if (traceWork)  {
		speedyLog("🔪              thread #%d: shouldBeIntegrating=%d  isIntegrating=%d.  "
			"nFinishedThreads=%d\n",
			serial, grinder->shouldBeIntegrating, grinder->isIntegrating,
			#ifdef USING_ATOMICS
			grinder->finishAtomic
			#else
			grinder->nFinishedThreads
			#endif
			);
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

	if (traceWork) speedyLog("🔪 end of slaveWork; shouldBeIntegrating=%d  isIntegrating=%d\n",
 				grinder->shouldBeIntegrating, grinder->isIntegrating);
}

// do the atomics and synchronization, and call slaveWork().  runs repeatedly
void slaveThread::slaveLoop(void) {
	while (true) {
		try {
			int nWas;

			// this thread will freeze here until startMx is unlocked, at start of iteration.
			// All other slave threads will also be waiting for startMx.  When this one gets its chance,
			// it'll lock and unlock, then start its integration work.
			// so they all start at roughly the same time.
			#ifdef USING_ATOMICS
			speedyLog("🏁 🔪 Starting Gate in slaveThread::slaveLoop- startAtomic=%d (shdbe -1) 🏁\n",
				grinder->startAtomic);
			speedyFlush();

			// wait forever to get notified, when startAtomic changes from -1 to zero
			int howEnded = emscripten_atomic_wait_u32(&grinder->startAtomic, -1, ATOMICS_WAIT_DURATION_INFINITE);
			speedyLog("🔪 after atomic wait on startAtomic=%d (shdbe 0) and wait returned %d ok=0, ≠1, timeout=2\n",
				emscripten_atomic_load_u32(&grinder->startAtomic), howEnded);
			speedyFlush();

			// now we count each thread as it starts up
			nWas = emscripten_atomic_add_u32(&grinder->startAtomic, -1);
			nWas++;

// 			while (atomic_load(&grinder->startAtomic) < 0) ;
			speedyLog("🔪 after atomic_add on startAtomic=%d (shdbe 0 or more)\n", nWas);
			//emscripten_debugger();

// 			nWas = atomic_fetch_add(&grinder->startAtomic, 1);  // returns number BEFORE incr
// 			nWas++;

			//speedyLog("after increment on startAtomic=%d (shdbe 1 or more)\n", nWas);

			#else

			pthread_mutex_lock(&grinder->startMx);
				nWas = ++grinder->nStartedThreads;
			pthread_mutex_unlock(&grinder->startMx);

			// upon last one started, lock the mutex again for next cycle
			if (nWas >= grinder->nSlaveThreads)
				pthread_mutex_lock(&grinder->startMx);

			#endif
			// I don't think we really need this counting for start....?
			if (traceStart)
				speedyLog("🔪 start of work, nStarted=%d\n", nWas);
			speedyFlush();


			slaveWork();
			speedyFlush();


			// tell the boss we're done
			#ifdef USING_ATOMICS
			speedyLog("🔪 before increment on finishAtomic=%d (shdbe 0)\n", grinder->finishAtomic);
			nWas = emscripten_atomic_add_u32(&grinder->finishAtomic, 1);  // returns number BEFORE incr
			nWas++;
			speedyLog("🔪 after increment on finishAtomic=%d (shdbe 1 or more)\n", grinder->finishAtomic);

			#else

			pthread_mutex_lock(&grinder->finishMx);
				nWas = ++grinder->nFinishedThreads;
			pthread_mutex_unlock(&grinder->finishMx);
			#endif

			if (traceFinish) {
				speedyLog("🔪 finishing work on thread %d, nFinished=%d\n",
					serial, nWas);
			}

			if (nWas >= grinder->nSlaveThreads) {
				// this must be the last thread to finish in this integration frame!
				grinder->threadsHaveFinished();
			}
			speedyFlush();
		} catch (std::runtime_error& ex) {
			//  typically divergence.  JS handles it.  save whole exception
			grinder->integrationEx = ex;
			printf("🔪 Error (saved to grinder) during slaveLoop: %s\n", ex.what());
		}
	}
}


// static; creates all slave threads; runs early
void slaveThread::createSlaves(qGrinder *grinder) {

	for (int t = 0; t < grinder->nSlaveThreads; t++) {
		// actual pthread won't start till the next event loop i think
		slaveThread *slave = new slaveThread(grinder);
		grinder->slaves[slave->thread->serial] = slave;
		speedyLog("🔪  slaveThread::createSlaves() created A Slave(%d) \n", slave->serial);
	}

	speedyLog("🔪  slaveThread created %d slaves \n", grinder->nSlaveThreads);
};



