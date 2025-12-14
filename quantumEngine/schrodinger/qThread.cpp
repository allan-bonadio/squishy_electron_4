/*
** qThread -- manage the thread(s) that are doing iteration
** Copyright (C) 2023-2025 Tactile Interactive, all rights reserved
*/

#include <stdexcept>
#include <pthread.h>

#include "../hilbert/qSpace.h"
#include "../greiman/qAvatar.h"
#include "qGrinder.h"
#include "qThread.h"

bool traceThreads = false;

/* ********************************************************************************** threads */

// each thread does this upon startup; runs this func
// the function that runs the whole thread, executes in the thread thread
// argument in: it's own qtThread object.  Makes main loop for thread,
// then calls hte handler
static void *tStart(void *qtx) {
	// MY qThread object
	qThread *qt = (qThread *) qtx;
	qt->confirmThread();

	// since this is the thread execcuting, it should show up in its log in the debugger?
	if (traceThreads) qt->dumpAThread("thread starting up()");

	(*qt->handler)(qt->arg);

	// wait,np this ends the thread....
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

