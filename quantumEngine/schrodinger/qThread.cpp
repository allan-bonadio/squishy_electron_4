/*
** qThread -- manage the thread(s) that are doing iteration
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

#include <ctime>
#include <pthread.h>
#include <emscripten/threading.h>
#include <stdexcept>
#include <atomic>

#include "../hilbert/qSpace.h"
#include "../debroglie/qWave.h"
#include "../greiman/qAvatar.h"
#include "qGrinder.h"
#include "qThread.h"

/* ********************************************************************************** threads */

// ok so this is pthreads

// NO!  use N_THREADS defined const int qThread::nThreads = N_THREADS;  // requested; set at compile time
int qThread::nCreatedThreads = 0;  // total created, dynamic
int qThread::nRunningThreads = 0;  // total confirmed, dynamic

// pointers to the qThread objects
qThread *list[MAX_THREADS];
qThread **qThread::threadsList = list;;

std::atomic_flag qThread::changingActive = ATOMIC_FLAG_INIT;
//std::atomic_flag qThread::changingActive = ATOMIC_FLAG_INIT;


// an array of the qThread instances
//qThread **qThread::threadsList = new qThread*[N_THREADS];

// each thread does this upon startup; runs in slave thread
// the function that runs the whole thread, executes in the thread thread
// argument in: it's own qtThread object
static void *tStart(void *qtx) {
	qThread *qt = (qThread *) qtx;
	qt->confirmThread();
	printf("🐴 qThread::ok im in a thread #%d, pass me a needle\n", qt->serial);
	return NULL;
};


// object created in the main thread.  THese all stay in C++ land;
// the browser thread never touches them.  (i think)
// runs in browser thread
qThread::qThread(int ser)
	: serial(ser), errorCode(0), halt(0), confirmed(false) {
	printf("🐴 qThread::qThread(%d) constructor... wish me luck\n", serial);

	//	dunno if we'll ever set any of these
	errorCode = pthread_attr_init(&attr);
	if (errorCode) {
		printf("🐴 Error in attr init: %d\n", errorCode);
		return;
	}

	// you can stick attributes in instead of that NULL, cwd or multithread safe stuff
	// https://man7.org/linux/man-pages/man3/pthread_attr_init.3.html
	errorCode = pthread_create(&this->tid, &this->attr, &tStart, (void *) this);
	if (errorCode) {
		printf("🐴 Error in create thread: %d\n", errorCode);
		return;
	}
// 	if (errorCode) {
// 		char buf[100];
// 		sprintf(buf, "🐴 pthread_create() for thread %d failed with error code %d", serial, errorCode);
// 		throw std::runtime_error(buf);
// 	}

	printf("🐴 qThread::qThread(%d) should be off and running\n", serial);
};

// must be called from inside the thread?  more likely, never.  Or, if so, join some other thread.
qThread::~qThread() {
	pthread_exit(0);
};

// each thread does this upon startup to show it's alive
// runs in slave thread
// void *qThread::threadStart(void) {
// 	printf("🐴 threadStart; this->serial=%d\n", serial);
//
// 	// I'm dong what Linus specifically says not to do: making my own spin lock.
// // 	while (!emscripten_futex_wait(&qThread::changingActive, 1, 10))
// // 		continue;
// //
// // 	// I've got the lock!  now I can change the data.  right?  as long as I'm really quick about it.
// //
// // 	// then let go.  DO not confuse 'wait' with 'wake'... who came up with these confusing names!?!?!??!
// // 	emscripten_futex_wake(&qThread::changingActive, 1);
//
// 	printf("🐴 pthread %d lives; %d threads alive\n", serial, qThread::nActiveThreads);
// 	return NULL;
// };

void qThread::confirmThread(void) {
	this->confirmed = true;

	// I won't have a race for this, right?
	qThread::nRunningThreads++;
}

// called by JS in browser thread
qThread *thread_createAThread(int serial) {

	if (serial > MAX_THREADS)
		throw std::runtime_error("One thread too many!");

	qThread *qt = qThread::threadsList[serial] = new qThread(serial);
	// actual pthread won't start till the next event loop i think

	qThread::nCreatedThreads++;
	printf("thread_createAThread(%d) created, total %d active, should be equal\n",
		serial, qThread::nCreatedThreads);

	return qt;
};

int thread_setupThreads(void) {

	return MAX_THREADS;
};
