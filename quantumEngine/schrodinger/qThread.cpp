/*
** qThread -- manage the thread(s) that are doing iteration
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

#include <ctime>
#include <stdexcept>

//#include <stdatomic.h>
#include <pthread.h>

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

//std::atomic_flag qThread::changingActive = ATOMIC_FLAG_INIT;
//std::atomic_flag qThread::changingActive = ATOMIC_FLAG_INIT;


// an array of the qThread instances
//qThread **qThread::threadsList = new qThread*[N_THREADS];

// each thread does this upon startup; runs in slave thread
// the function that runs the whole thread, executes in the thread thread
// argument in: it's own qtThread object
static void *tStart(void *qtx) {
	// MY qThread object
	qThread *qt = (qThread *) qtx;
	qt->confirmThread();
	printf("🐴 qThread::ok im in a thread #%d, pass me a needle!\n", qt->serial);

	// get to work!  after this semaphore is released
	qGrinder *grinder = qt->grinder;
	// cough just a sec...atomic_wait(grinder->startAll)

	return NULL;
};


// object created in the main thread.  THese all stay in C++ land;
// the browser thread never touches them.  (i think)
// runs in browser thread
qThread::qThread(int ser, qGrinder *gr)
	: serial(ser), errorCode(0), halt(0), grinder(gr), confirmed(false) {
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

int thread_setupThreads(void) {

	return MAX_THREADS;
};


void qThread::confirmThread(void) {
	this->confirmed = true;

	// I won't have a race for this, right?
	qThread::nRunningThreads++;
}

// called by JS in browser thread
qThread *thread_createAThread(int serial, qGrinder *grinder) {

	if (serial > MAX_THREADS)
		throw std::runtime_error("One thread too many!");

	qThread *qt = qThread::threadsList[serial] = new qThread(serial, grinder);
	// actual pthread won't start till the next event loop i think

	qThread::nCreatedThreads++;
	printf("thread_createAThread(%d) created, total %d active, should be equal\n",
		serial, qThread::nCreatedThreads);

	return qt;
};


/* ************************************************ what sync can I use? */

/* I couldn't figure out what pthreads synchronization primitives were
available.  They're all documented - somewhere.  Didn't know which
header files each was in, didn't know what functions could get thru
the compiler.  So I tried everything that I was interested in.  That I could find.
Anything that's commented out wouldn't get thru the compiler.
Stuff that isn't, got thru the compiler and linker (although the code is contrived and pointless). 12/24/2023,

Emscripten version 3.1.49 (#1300)
Date: Tue Nov 14 09:35:29 2023 -0800 */

static void tryOutSyncPrimitives(void) {
	// these compile wtih #include <pthread.h>

	// mutex: fundamental.  thank god I've got that much
	pthread_mutex_t mu;
	pthread_mutex_lock(&mu);
	pthread_mutex_lock(&mu);
	// pthread_mutex_trylock(&mu) == 0; ??
	pthread_mutex_unlock(&mu);
	pthread_mutex_destroy(&mu);

	// futex seems to have vanished
	// try this int emscripten_futex_wait(volatile void/*uint32_t*/ *addr, uint32_t val, double maxWaitMilliseconds);
// 	void *fu;
// 	int val;
// 	emscripten_futex_wait(fu, val, 5000.);


	// condition variables: all this gets thru compiler
	pthread_cond_t con;
	pthread_mutex_t muu;
	struct timespec ts;
	pthread_cond_signal(&con);
	pthread_cond_broadcast(&con);
	pthread_cond_wait(&con, &muu);
	pthread_cond_timedwait(&con, &muu, &ts);
	pthread_cond_destroy(&con);



	// these compile with #include <stdatomic.h> but not much to work with
// 		atomic_flag fla;
// 		bool boo;
// 		// nope atomic_flag_test(&fla);
// 		atomic_flag_test_and_set(&fla);
// 		atomic_flag_clear(&fla);

		// all the rest of these, can't figure out how to get to them
// 	atomic_flag_wait(&fla, boo);
// 	atomic_flag_notify_one(&fla);
// 	atomic_flag_notify_all(&fla);

// 	atomic_wait(&fla);
// 	atomic_notify_one(&fla);
// 	atomic_notify_all(&fla);

// 	atomic_flag_wait();
// 	atomic_flag_notify_all();
// 	atomic_flag_test();
// 	atomic_flag_wait();

}

