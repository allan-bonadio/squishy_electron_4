/*
** grinderThread -- one thread that's doing iteration
** Copyright (C) 2023-2024 Tactile Interactive, all rights reserved
*/


#include "qThread.h"
#include "qGrinder.h"
#include "grinderThread.h"

static bool traceStart = false;
static bool traceWork = false;
static bool traceFinish = false;
static bool traceSync = false;

/* *********************************************** grinderThread */

// indexed by thread serial, there may be gaps.
// for threads that AREN'T gThreads
static grinderThread *sla[MAX_THREADS];
grinderThread **qGrinder::gThreads = sla;

// do the work: integration
void grinderThread::gThreadWork(void) {
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

	//actually, doing the calculation, single  thread
	grinder->oneFrame();

	// get endCalc and compare
	double endCalc = getTimeDouble();
	frameCalcTime = endCalc - startCalc;

	if (traceWork) speedyLog("🔪 end of gThreadWork; shouldBeIntegrating=%d  isIntegrating=%d\n",
 				grinder->shouldBeIntegrating, grinder->isIntegrating);
}

// do the atomics and synchronization, and call gThreadWork().  runs repeatedly.
// Catches exceptions; copies them to grinder for the JS to pick up, continues.
void grinderThread::gThreadLoop(void) {
	while (true) {
		try {
			int nWas;

			// this thread will freeze here until startMx is unlocked, at start of iteration.
			// All other gThread threads will also be waiting for startMx.  When this one gets its chance,
			// it'll lock and unlock, then start its integration work.
			// so they all start at roughly the same time.
			#ifdef USING_ATOMICS
			if (traceSync) speedyLog("🏁 🔪 at Starting Gate in grinderThread::gThreadLoop- "
				"startAtomic=%d (stopped= -1, go=0) 🏁\n",
				grinder->startAtomic);
			speedyFlush();

			// wait forever to get notified, when startAtomic changes from -1 to zero
			int howEnded = emscripten_atomic_wait_u32(&grinder->startAtomic, -1, ATOMICS_WAIT_DURATION_INFINITE);
			if (traceSync) speedyLog("🔪 after atomic wait on startAtomic=%d (shdbe 0) and wait "
				"returned %d ok=0, ≠1, timeout=2\n",
				emscripten_atomic_load_u32(&grinder->startAtomic), howEnded);
			speedyFlush();

			// now we count each thread as it starts up
			nWas = emscripten_atomic_add_u32(&grinder->startAtomic, -1);
			nWas++;

// 			while (atomic_load(&grinder->startAtomic) < 0) ;
			if (traceSync) speedyLog("🔪 after atomic_add on startAtomic=%d (shdbe 0 or more)\n", nWas);
			//emscripten_debugger();

// 			nWas = atomic_fetch_add(&grinder->startAtomic, 1);  // returns number BEFORE incr
// 			nWas++;

			//speedyLog("after increment on startAtomic=%d (shdbe 1 or more)\n", nWas);

			#else

			pthread_mutex_lock(&grinder->startMx);
				nWas = ++grinder->nStartedThreads;
			pthread_mutex_unlock(&grinder->startMx);

			// upon last one started, lock the mutex again for next cycle
			if (nWas >= grinder->nGrinderThreads)
				pthread_mutex_lock(&grinder->startMx);

			#endif
			// I don't think we really need this counting for start....?
			if (traceStart)
				speedyLog("🔪 start of work, nStarted=%d\n", nWas);
			speedyFlush();


			gThreadWork();
			speedyFlush();


			// tell the boss we're done
			#ifdef USING_ATOMICS
			if (traceSync) speedyLog("🔪 before increment on finishAtomic=%d (shdbe 0)\n", grinder->finishAtomic);
			nWas = emscripten_atomic_add_u32(&grinder->finishAtomic, 1);  // returns number BEFORE incr
			nWas++;
			if (traceSync) speedyLog("🔪 after increment on finishAtomic=%d (shdbe 1 or more)\n", grinder->finishAtomic);

			#else

			pthread_mutex_lock(&grinder->finishMx);
				nWas = ++grinder->nFinishedThreads;
			pthread_mutex_unlock(&grinder->finishMx);
			#endif

			if (traceFinish) {
				speedyLog("🔪 finishing work on thread %d, nFinished=%d\n",
					serial, nWas);
			}

			if (nWas >= grinder->nGrinderThreads) {
				// this must be the last thread to finish in this integration frame!
				grinder->threadsHaveFinished();
			}
			speedyFlush();
		} catch (std::runtime_error& ex) {
			//  typically divergence.  JS handles it.  save whole exception
			grinder->reportException(&ex, "thrown");
			//integrationEx = ex;
			//strncpy(exceptionCode, "thrown", sizeof(exceptionCode));
			printf("🔪 Error (saved to grinder) during gThreadLoop: %s\n", ex.what());
		}
	}
}


/* *********************************************** creation and startup */

// wrapper for pthread to start the thread.  arg is the grinderThread ptr.  requestAnimationFrame.
static void *sStarter(void *st) {
	if (traceStart)
		speedyLog("🔪 grinderThread: starting\n");

	// runs forever. never returns.  catches its exceptions.
	((grinderThread *) st)->gThreadLoop();

	return NULL;
}


// initialize this as being idle, before starting an integration task.
// All the grinders are the same object; all the threads are differrent.
grinderThread::grinderThread(qGrinder *gr)
	: grinder(gr) {

	thread = new qThread(&sStarter, (void *) this);
	serial = thread->serial;
}
// no destructor - never freed




// static; creates all gThread threads; runs early
void grinderThread::createGrinderThreads(qGrinder *grinder) {

	for (int t = 0; t < grinder->nGrinderThreads; t++) {
		// actual pthread won't start till the next event loop i think
		grinderThread *gThread = new grinderThread(grinder);
		grinder->gThreads[gThread->thread->serial] = gThread;
		speedyLog("🔪  grinderThread::createGrinderThreads() created A GrinderThread(%d) \n", gThread->serial);
	}

	speedyLog("🔪  grinderThread created %d gThreads \n", grinder->nGrinderThreads);
};



