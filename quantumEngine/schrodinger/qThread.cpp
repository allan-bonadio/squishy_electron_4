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

int qThread::nRequestedThreads = 1;  // someday...
int qThread::nActiveThreads = 0;
std::atomic_flag qThread::changingActive = ATOMIC_FLAG_INIT;
//std::atomic_flag qThread::changingActive = ATOMIC_FLAG_INIT;


// an array of the qThread instances
qThread **qThread::threads = new qThread*[nRequestedThreads];

static void *qThread_threadStarts(void *qt) {
	qThread *qthread = (qThread *) qt;
	return qthread->threadStarts();
};


// object created in the main thread
qThread::qThread(int ser) {
	serial = ser;
	printf("🐴 qThread::qThread(%d) begins... wish me luck\n", serial);

	// you can stick attributes in instead of that NULL, cwd or multithread safe stuff
	// https://man7.org/linux/man-pages/man3/pthread_attr_init.3.html
	errorCode = pthread_create(&tid, NULL, &qThread_threadStarts, (void *) this);
	if (errorCode) {
		char buf[100];
		sprintf(buf, "🐴 pthread_create() for thread %d failed with error code %d", serial, errorCode);
		throw std::runtime_error(buf);
	}

	printf("🐴 qThread::qThread(%d) should be off and running\n", serial);
};

// must be called from inside the thread?  more likely, never.  Or, if so, join some other thread.
qThread::~qThread() {
	pthread_exit(0);
};

// each thread does this upon startup to show it's alive
void *qThread::threadStarts(void) {
	printf("🐴 threadStarts; this->serial=%d\n", serial);

	// I'm dong what Linus specifically says not to do: making my own spin lock.
	while (!emscripten_futex_wait(&qThread::changingActive, 1, 10))
		continue;

	// I've got the lock!  now I can change the data.  right?  as long as I'm really quick about it.
	qThread::nActiveThreads++;

	// then let go.  DO not confuse 'wait' with 'wake'... who came up with these confusing names!?!?!??!
	emscripten_futex_wake(&qThread::changingActive, 1);

	printf("🐴 pthread %d lives; %d threads alive\n", serial, qThread::nActiveThreads);
	return NULL;
};

void qThread::startAllThreads(void) {
	for (int t = 0; t < qThread::nRequestedThreads; t++) {
		qThread::threads[t] = new qThread(t);
	}
};

// called by JS
void thread_startAllThreads(int nThreads) {
	qThread::nRequestedThreads = nThreads;
	qThread::startAllThreads();
};
