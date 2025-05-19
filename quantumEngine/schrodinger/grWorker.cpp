/*
** grWorker -- one thread that's doing iteration
** Copyright (C) 2023-2025 Tactile Interactive, all rights reserved
*/


#include "qThread.h"
#include "qGrinder.h"
#include "grWorker.h"

static bool traceStart = false;
static bool traceFinish = false;
static bool traceSync = false;
static bool traceCreation = false;

static bool traceWork = false;
static bool traceWorkOccasionally = false;
static int occasionally = 0;

/* *********************************************** grWorker */

// indexed by thread serial, there may be gaps.
// for threads that AREN'T grWorkers
static grWorker *sla[MAX_THREADS];
grWorker **qGrinder::grWorkers = sla;

// do the work: integration
void grWorker::gThreadWork(void) {
	// traceWork generates a message every Frame.  GADS!
	// traceWorkOccasionally, maybe every several seconds or less.  Feel free to adjust.
	if (traceWork || (traceWorkOccasionally && occasionally-- < 0)) {
		speedyLog("🦫 grWorker working ...shouldBeIntegrating=%d  isIntegrating=%d "
				"startAtomic=%d  finishAtomic=%d\n",
				grinder->shouldBeIntegrating, grinder->isIntegrating,
				grinder->startAtomic, grinder->finishAtomic);
		occasionally = 100;
	}

	// Gonna do an integration frame.  set starting time, under lockf
	// wait this doesn't have to be under lock!  it's per-thread.
	startCalc = getTimeDouble();

	// actually, doing the calculation, single  thread
	grinder->oneFrame();

	// get endCalc and compare
	double endCalc = getTimeDouble();
	frameCalcTime = endCalc - startCalc;

	if (traceWork) speedyLog("🦫 end of gThreadWork; frame time=%8.4lf ms, "
				"shouldBeIntegrating=%d  isIntegrating=%d "
				"startAtomic=%d  finishAtomic=%d\n",
				frameCalcTime, grinder->shouldBeIntegrating, grinder->isIntegrating,
				grinder->startAtomic, grinder->finishAtomic);
}


// do the atomics and synchronization, and call gThreadWork().  runs repeatedly.
// Or blocked on startAtomic.
// Catches exceptions; copies them to grinder for the JS to pick up, continues.
void grWorker::gThreadLoop(void) {
	while (true) {
		try {

			// this thread will freeze here until startAtomic is unlocked, at start of
			// iteration. All other worker threads will also be waiting for
			// startAtomic.  When it's time to do another iteration, it'll be
			// unlocked, then all worker threads start integration work. so they all
			// start at roughly the same time.
			if (traceSync) {
				speedyLog("🏁 🦫 wait at startAtomic,  in grWorker::gThreadLoop "
					"startAtomic=%d (stopped= -1, go>=0) pointer: %p   atomic size: %lu  🏁\n",
					grinder->startAtomic, &grinder->startAtomic, sizeof(grinder->startAtomic));
				speedyFlush();
			}

			// this wait will end when notify is sent to it.
			// eGrinder.triggerIteration() or qeFuncs.grinder_triggerIteration
			// this is what I want but it's only in u32 form.
			int formerStartAtomic = grinder->startAtomic;
			int waitCode = emscripten_atomic_wait_u32(&grinder->startAtomic, -1,
					ATOMICS_WAIT_DURATION_INFINITE);
			if (waitCode != ATOMICS_WAIT_OK) {
				const char *msg = "unknown wait status";
				if (ATOMICS_WAIT_NOT_EQUAL == waitCode)
					msg = "ATOMICS_WAIT_NOT_EQUAL";
				else if (ATOMICS_WAIT_TIMED_OUT == waitCode)
					msg = "ATOMICS_WAIT_TIMED_OUT";
				printf("😵‍ emscripten_atomic_wait_u32() didn't return OK: "
						" waitCode=%d msg=%s formerStartAtomic=%d\n",
						waitCode, msg, formerStartAtomic);
			}

			// now we count each thread as it starts up
			// nStarted=number of threads started before this one
			int nStarted = emscripten_atomic_add_u32(&grinder->startAtomic, 1);
			nStarted++;
			if (traceSync) speedyLog("🦫 after atomic_add on startAtomic nStarted =%d "
					" (shdbe 0 or more)  startAtomic=%d\n", nStarted, grinder->startAtomic);
			if (nStarted >= grinder->nGrWorkers) {
				// everybody's started, so now's a good time to set this back for next time.
				emscripten_atomic_store_u32(&grinder->startAtomic, -1);
			}


			gThreadWork();  // actually DO SOME WORK
			speedyFlush();

			// tell the boss we're done
			if (traceSync) speedyLog("🦫 done, before increment on finishAtomic=%d (shdbe 0)\n",
				grinder->finishAtomic);
			int nFinished = emscripten_atomic_add_u32(&grinder->finishAtomic, 1);
			nFinished++;
			if (traceSync || traceFinish) {
					speedyLog("🦫 after increment on finishAtomic=%d (shdbe 1 or more) "
					"thread %d, nFinished=%d \n",
					grinder->finishAtomic, serial, nFinished);
			}
			if (nFinished >= grinder->nGrWorkers) {
				// this must be the last thread to finish in this integration frame!
				grinder->threadsHaveFinished();
			}
			speedyFlush();
		} catch (std::runtime_error& ex) {
			//  typically divergence.  JS handles it.  save whole exception
			grinder->reportException(&ex, "thrown");
			printf("🦫 Error (saved to grinder) during gThreadLoop: %s\n", ex.what());
		}
	}
	throw std::runtime_error("grWorker::gThreadLoop()  ∞ loop actually ending and returning");
}


/* *********************************************** creation and startup */

// wrapper for pthread to start the thread.  arg is the grWorker ptr.  .
static void *sStarter(void *st) {
	if (traceStart)
		speedyLog("🦫 grWorker: starting\n");

	// runs forever. never returns.  catches its exceptions.
	((grWorker *) st)->gThreadLoop();

	return NULL;
}


// initialize this as being idle, before starting an integration task.
// All the grinders are the same object; all the threads are per-thread.
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
		grinder->grWorkers[gThread->serial] = gThread;
		if (traceCreation)
			speedyLog("🦫  grWorker::createGrWorkers() created A grWorker #%d\n",
				gThread->serial);
	}

	if (traceCreation)
		speedyLog("🦫  grWorker::createGrWorkers() created %d grWorkers \n",
				grinder->nGrWorkers);
};
