/*
** slaveThread -- one thread that's doing iteration
** Copyright (C) 2023-2024 Tactile Interactive, all rights reserved
*/


#include "qThread.h"
#include "qGrinder.h"
#include "slaveThread.h"
#include <emscripten/html5.h>
#include <emscripten/emscripten.h>
#include <stdarg.h>

// lame threads don't do integration; extra threads on the end just for testing
static bool traceLameThreads = false;

static bool traceRunner = false;

static bool traceNewPeriod = false;


/* *********************************************** speedyLogging */
// for extra-fast logging of timing for these threads.  On the honor system, don't overfill!
#define MAX_BUF_LEN  16000
static char speedyBuf[MAX_BUF_LEN];
static int speedyCursor = 0;



//#define SCT speedyCursor += snprintf(speedyBuf+speedyCursor, 100, "%12.3f ", emscripten_performance_now())
//#define SLF(format, ...)  speedyCursor += snprintf(speedyBuf+speedyCursor, 100, format, __VA_OPT__(,) __VA_ARGS__)
//#define speedyLog(format, ...)   SCT; SLF(format, __VA_OPT__(,) __VA_ARGS__); speedyBuf[speedyCursor++] = '\n'
static void speedyLog(const char* format, ...) {
    va_list args;
    va_start(args, format);

 	// first the time, then the message, and supply a newline to make it easier
	speedyCursor += sprintf(speedyBuf+speedyCursor, "%13.3f ", emscripten_performance_now());
	speedyCursor +=  vsnprintf(speedyBuf+speedyCursor, 400, format, args);
	//speedyBuf[speedyCursor++] = '\n';

    va_end(args);
}

void speedyDump(void) {
	printf("%s", speedyBuf);
	speedyCursor = 0;
}

/* *********************************************** slave threads */

// indexed by thread serial, there may be gaps.
// for threads that AREN'T slaves
static slaveThread *sla[MAX_THREADS];
slaveThread **qGrinder::slaves = sla;

// only nonzero when we're changing the frame factor
int slaveThread::newFrameFactor = 0;

// wrapper for emscripten_request_animation_frame_loop() to call slaveRunner()
static void sRunner(void *arg) {
	slaveThread *This = (slaveThread *) arg;
	This->slaveRunner();
}

// wrapper for pthread to start the thread.  arg is the slaveThread ptr.  requestAnimationFrame.
static void *sStarter(void *arg) {
	printf("🔪 sStarter: starting\n");

	// true on the end does that throwing thing, so this function never returns, only the runner keeps repeating.
	emscripten_set_main_loop_arg(&sRunner, arg, -1, true);

	printf("🔪 sStarter: main_loop_arg() returned\n");
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

// runs repeatedly, either does integration or not depending on grinder flag
void slaveThread::slaveRunner(void) {
	int nWas;

	if (traceRunner) speedyLog("🔪 slaveRunner #%d starts cycle\n", serial);
	if (slaveThread::newFrameFactor) {
		// change to new integration frame period.  Here so all threads get it at the same time.
		// threadsHaveFinished() will reset it to zero.
		emscripten_set_main_loop_timing(EM_TIMING_RAF, slaveThread::newFrameFactor);
	}

	if (traceRunner)  {
		speedyLog("🔪              thread #%d: shouldBeIntegrating=%d  isIntegrating=%d.  "
			"nIntegratingThreads=%d\n",
			serial, grinder->shouldBeIntegrating, grinder->isIntegrating,
			grinder->nIntegratingThreads);
	}

	// maybe we shouldn't do it?
	if ( !grinder->isIntegrating) {
		// STILL have to sync in case user turned integration on.
		// note we don't touch the frameCalcTime
		pthread_mutex_lock(&grinder->integratingMx);
			nWas = --grinder->nIntegratingThreads;
		pthread_mutex_unlock(&grinder->integratingMx);

		if (nWas <= 0) {
			if (traceRunner)  {
				speedyLog("🔪 slaveRunner: last thread is #%d.\n", serial);
				speedyLog("🔪              shouldBeIntegrating=%d  isIntegrating=%d \n",
					grinder->shouldBeIntegrating, grinder->isIntegrating);
			}
			threadsHaveFinished();
			//grinder->isIntegrating = grinder->shouldBeIntegrating;
		}
		return;
	}

	// Gonna do an integration frame.  set starting time, under lock
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
		grinder->aggregateCalcTime();

		// this must be the last thread to finish in this integration frame!
		threadsHaveFinished();

		// single step (or a few steps): are we done yet?
		if (grinder->justNFrames) {
			--grinder->justNFrames;
			if (0 >= grinder->justNFrames)
				grinder->shouldBeIntegrating = false;
		}

	}
	if (traceRunner) speedyLog("🔪 end of runner; shouldBeIntegrating=%d  isIntegrating=%d\n",
				grinder->shouldBeIntegrating, grinder->isIntegrating);
	return;
}


// runs in the thread loop, only in the last thread per integration frame.
// maybe this should be a grinder method!?!
void slaveThread::threadsHaveFinished() {

	// at the beginning of this cycle, all the threads set their frame factor from
	// slaveThread::newFrameFactor .  So now we can reset it.
	if (slaveThread::newFrameFactor) {
		 grinder->frameFactor = slaveThread::newFrameFactor;

		if (traceNewPeriod)  {
			speedyLog("🔪 threadsHaveFinished: absorbing slaveThread::newFrameFactor to zero, was %d\n",
				slaveThread::newFrameFactor);
		}
		slaveThread::newFrameFactor = 0;  // its been used by now
	}

	if (grinder->newFrameFactor) {
		// slaveThread::newFrameFactor tells each thread they have to change themselves.
		// It must be set at the same time for all threads - hence here.
		// Whereas, grinder->newFrameFactor can be set any old time.

		// do we even use newIntegrationFP?  only for reporting on integration tab
		if (traceNewPeriod) speedyLog("🔪  threadsHaveFinished- setting newFrameFactor to %d, from "
			"grinder->newFrameFactor=%d\n",
			slaveThread::newFrameFactor, grinder->newFrameFactor);

		// slaveThread::newFrameFactor is where each thread will get its frame factor from, all threads at same time
		slaveThread::newFrameFactor = grinder->newFrameFactor;
		grinder->newFrameFactor = grinder->newIntegrationFP = 0;  // cuz it's passed on
	}

		if (traceRunner)  {
			speedyLog("🔪                ...in threadsHaveFinished().  justNFrames=%d and shouldBeIntegrating=%d\n",
					grinder->justNFrames, grinder->shouldBeIntegrating);
		}

	// set isIntegrating here so all threads get it at the same time
	grinder->isIntegrating = grinder->shouldBeIntegrating;

	// ready for new frame
	grinder->nIntegratingThreads = grinder->nSlaveThreads;

	speedyDump();
}

// creates all slave threads; runs early
void slaveThread::createSlaves(qGrinder *grinder) {

	for (int t = 0; t < grinder->nSlaveThreads; t++) {
		// actual pthread won't start till the next event loop i think
		slaveThread *slave = new slaveThread(grinder);
		grinder->slaves[slave->thread->serial] = slave;
		printf("🔪  slaveThread::createSlaves() created A Slave(%d) \n", slave->serial);
	}

	printf("🔪  slaveThread created %d slaves \n", grinder->nSlaveThreads);
};



