/*
** grWorker -- one thread that's doing iteration
** Copyright (C) 2023-2025 Tactile Interactive, all rights reserved
*/


#include "qThread.h"
#include "qGrinder.h"
#include "grWorker.h"

static bool traceStart = false;
static bool traceWork = false;
static bool traceFinish = false;
static bool traceSync = false;
static bool traceCreation = false;

static bool traceWorkOccasionally = true;
static int occasionally = 0;

/* *********************************************** grWorker */

// indexed by thread serial, there may be gaps.
// for threads that AREN'T grWorkers
static grWorker *sla[MAX_THREADS];
grWorker **qGrinder::grWorkers = sla;

// do the work: integration
void grWorker::gThreadWork(void) {
	int nWas;

	// this one generates a message every Frame.  GADS!  lots of output.
	if (traceWork)  {
		speedyLog("🔪        thread #%d: shouldBeIntegrating=%d  isIntegrating=%d.  "
			"nFinishedThreads=%d\n",
			serial, grinder->shouldBeIntegrating, grinder->isIntegrating,
			grinder->finishAtomic
		);
	}

	// this one, maybe every several seconds or less.  Feel free to adjust.
	if (traceWorkOccasionally && occasionally-- < 0) {
		speedyLog("🔪 grWorker working (occasionallly)...shouldBeIntegrating=%d startAtomic=%d\n",
			grinder->shouldBeIntegrating, grinder->startAtomic);
		occasionally = 100;
	}

	// Gonna do an integration frame.  set starting time, under lockf
	// wait this doesn't have to be under lock!  it's per-thread.
	startCalc = getTimeDouble();

	//actually, doing the calculation, single  thread
	grinder->oneFrame();

	// get endCalc and compare
	double endCalc = getTimeDouble();
	frameCalcTime = endCalc - startCalc;

	if (traceWork) speedyLog("🔪 end of gThreadWork; frame time=%8.4lf ms, "
		"shouldBeIntegrating=%d  isIntegrating=%d\n",
 			frameCalcTime, grinder->shouldBeIntegrating, grinder->isIntegrating);
}

// do the atomics and synchronization, and call gThreadWork().  runs repeatedly.
// Or blocked on startAtomic.
// Catches exceptions; copies them to grinder for the JS to pick up, continues.
void grWorker::gThreadLoop(void) {
	while (true) {
		try {
			int nWas;

			// this thread will freeze here until startMx is unlocked, at start of iteration.
			// All other gThread threads will also be waiting for startMx.  When this one gets its chance,
			// it'll lock and unlock, then start its integration work.
			// so they all start at roughly the same time.
			if (traceSync) {
				speedyLog("🏁 🔪 at Starting Gate in grWorker::gThreadLoop "
					"startAtomic=%d (stopped= -1, go=0) pointer: %p   size: %lu  🏁\n",
					grinder->startAtomic, &grinder->startAtomic, sizeof(grinder->startAtomic));
			}
			speedyFlush();

			// wait forever to get notified, when startAtomic changes from -1 to zero
			// emscripten_atomic_wait_u32() doesn't work here so use the futex call
			int howEnded = emscripten_futex_wait(&grinder->startAtomic, -1, 1e12);

			if (traceSync) {
				speedyLog("🏁 🔪 after atomic wait on startAtomic=%d (shdbe 0) and wait "
					"returned howEnded=%d ok=0, ≠1, timeout= ∞  🏁\n",
					emscripten_atomic_load_u32(&grinder->startAtomic), howEnded);
			}
			speedyFlush();

			// now we count each thread as it starts up
			nWas = emscripten_atomic_add_u32(&grinder->startAtomic, -1);
			nWas++;

// 			while (atomic_load(&grinder->startAtomic) < 0) ;
			if (traceSync) speedyLog("🔪 after atomic_add on startAtomic=%d (shdbe 0 or more)\n", nWas);
			//emscripten_debugger();

			//speedyLog("after increment on startAtomic=%d (shdbe 1 or more)\n", nWas);
			// I don't think we really need this counting for start....?
			if (traceStart)
				speedyLog("🔪 start of work, nStarted=%d\n", nWas);
			speedyFlush();

			gThreadWork();
			speedyFlush();

			// tell the boss we're done
			if (traceSync) speedyLog("🔪 before increment on finishAtomic=%d (shdbe 0)\n",
				grinder->finishAtomic);
			nWas = emscripten_atomic_add_u32(&grinder->finishAtomic, 1);  // returns number BEFORE incr
			nWas++;
			if (traceSync) speedyLog("🔪 after increment on finishAtomic=%d (shdbe 1 or more)\n",
				grinder->finishAtomic);

			if (traceFinish) {
				speedyLog("🔪 finishing work on thread %d, nFinished=%d\n",
					serial, nWas);
			}

			if (nWas >= grinder->nGrWorkers) {
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
	throw std::runtime_error("grWorker::gThreadLoop()  ∞ loop actually ending and returning");
}


/* *********************************************** creation and startup */

// wrapper for pthread to start the thread.  arg is the grWorker ptr.  requestAnimationFrame.
static void *sStarter(void *st) {
	if (traceStart)
		speedyLog("🔪 grWorker: starting\n");

	// runs forever. never returns.  catches its exceptions.
	((grWorker *) st)->gThreadLoop();

	return NULL;
}


// initialize this as being idle, before starting an integration task.
// All the grinders are the same object; all the threads are differrent.
grWorker::grWorker(qGrinder *gr)
	: grinder(gr) {

	thread = new qThread(&sStarter, (void *) this);
	serial = thread->serial;
}
// no destructor - never freed

// static; creates all gThread threads; runs early
void grWorker::createGrWorkers(qGrinder *grinder) {

	for (int t = 0; t < grinder->nGrWorkers; t++) {
		// actual pthread won't start till the next event loop i think
		grWorker *gThread = new grWorker(grinder);
		grinder->grWorkers[gThread->thread->serial] = gThread;
		if (traceCreation)
			speedyLog("🔪  grWorker::createGrWorkers() created A grWorker #%d\n",
				gThread->serial);
	}

	if (traceCreation)
		speedyLog("🔪  grWorker created %d grWorkers \n", grinder->nGrWorkers);
};
