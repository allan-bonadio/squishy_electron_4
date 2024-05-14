/*
** qThread -- manage the thread(s) that are doing iteration
** Copyright (C) 2023-2024 Tactile Interactive, all rights reserved
*/

//#include <ctime>
#include <stdexcept>
//#include <stdarg.h>

//#include <stdatomic.h>
#include <pthread.h>

#include "../hilbert/qSpace.h"
#include "../debroglie/qWave.h"
#include "../greiman/qAvatar.h"
#include "qGrinder.h"
#include "qThread.h"

bool traceThreads = false;

/* ********************************************************************************** threads */

// ok so this is pthreads


// the function called in each thread-specific main loop, 60x/sec
// NO see grinderThread
//static void mainLooper(void *arg) {
//	qThread *thread = (qThread *) arg;
//	//printf("🐴  mainLooper entered with qthread=%p\n", thread);
//	thread->dumpAThread("mainLooper entered");
//	//printf("mainLooper entered with qthread=%p,  qt-handler=%p\n",
//	//	 thread->handler);
//	//qGrinder *grinder = (qGrinder *) qt->handle;
//
//
//	(*thread->handler)(thread->arg);
//}

// each thread does this upon startup; runs this func
// the function that runs the whole thread, executes in the thread thread
// argument in: it's own qtThread object.  Makes main loop for thread,
// then calls hte handler
static void *tStart(void *qtx) {
	// MY qThread object
	qThread *qt = (qThread *) qtx;
	qt->confirmThread();
	//printf("🐴 qThread::ok confirmed in tStart #%d!\n", qt->serial);

	// since this is the thread execcuting, it should show up in its log in the debugger?
	qt->dumpAThread("thread starting up()");

	(*qt->handler)(qt->arg);

//	emscripten_set_main_loop_arg(
//		&mainLooper,
//		qt,  // argument
//		-1,   // fps, or -1 to run off of Req Ani Frame
//		false);
//	// so does that ever return?  Tryna prevent the thread going away
//
//	// I guess we don't get here until ... I dunno
//	printf("🦒  💥 🌪 emscripten_set_main_loop_arg() finished ️"
//		"I guess we don't get here until ... I dunno\n");

	// wait, this ends the thread....
	return NULL;
};


// object created in the main thread.  THese all stay in C++ land;
// the browser thread never touches them.
// runs in browser thread.  gr = qGrider pointer from eGrinder.pointer
// we can't pass the qThread without going through a few void* pointers.
qThread::qThread(void *(*hand)(void *), void *ar)
	: errorCode(0), handler(hand), arg(ar), confirmed(false) {

	if (traceThreads)
		printf("🐴 qThread::qThread(%d) constructor...hand=%p   ar=%p\n",
			serial, hand, ar);

	//qThread();

	//	dunno if we'll ever get any
	if (errorCode) {
		printf("🐴 Error in attr init: %d\n", errorCode);
		return;
	}

	// runs tStart() and passes it this qThread instance
	errorCode = pthread_create(&this->tid, NULL, &tStart, (void *) this);
	if (errorCode) {
		printf("🐴 Error in create thread: %d\n", errorCode);
		return;
	}
	qThread::threadsList[qThread::nCreatedThreads] = this;
	serial = qThread::nCreatedThreads;
	qThread::nCreatedThreads++;

	// this should show up in the UI thread console
	if (traceThreads)
		dumpAThread("thread freshly launched");
};

// must be called from inside the thread?  more likely, never.  Or, if so, join some other thread.
qThread::~qThread(void) {
	pthread_exit(0);
};

// print out 'everything' in the thread
void qThread::dumpAThread(const char *title) {
	printf("🐴 qThread::qThread(%d) %s: \n"
		"errorCode=%d handler=%p arg=%p confirmed=%b \n"
		"nCreatedThreads=%d   nRunningThreads=%d   threadsList=%p\n",
		serial, title, errorCode, handler, arg, confirmed,
		qThread::nCreatedThreads, qThread::nRunningThreads, qThread::threadsList);
}

// js runs this in the beginning
int thread_setupThreads(void) {

	return MAX_THREADS;
};


void qThread::confirmThread(void) {
	this->confirmed = true;

	// I won't have a race for this, right?
	qThread::nRunningThreads++;
}

int qThread::nCreatedThreads = 0;  // total created, dynamic
int qThread::nRunningThreads = 0;  // total confirmed, dynamic

// pointers to the qThread objects
qThread *list[MAX_THREADS];
qThread **qThread::threadsList = list;

// I'll need to lookup thread IDs someday...
//int lookupThread()

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

