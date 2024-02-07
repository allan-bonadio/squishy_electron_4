/*
** qThread -- manage the thread(s) that are doing iteration
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

struct qSpace;
struct qThread;

#include <pthread.h>

// N_THREADS defined in buildCommon.sh
// from emscripten docs for pthreads:  For web security purposes, there exists a
// fixed limit (by default 20) of threads that can be spawned when running in
// Firefox Nightly. #1052398. To adjust the limit, navigate to about:config and
// change the value of the pref “dom.workers.maxPerDomain”.
#define MAX_THREADS 20

// pointers to qThread objects in serial order


// one for each pthread.  Each is created from JS with thread_createAThread()
struct qThread {
	qThread(void *(*handler)(void *), void *arg);

	~qThread();

	void dumpAThread(const char *title);

	// how long this thread spent doing its iteration, the last time
	double frameCalcTime;

	// pthread's ID for this thread
	pthread_t tid;

	void *(*moses)(void *);
	//void *(*)(void *);
	//void *(valley*)(void *);
	//void *argon(*)(void *);



	int serial;  // 0, 1, ... among all qThreads

	// errno for the last operation that failed, or zero if all ok
	int errorCode;

	 // handler to call in loop; see slaveThread.h/cpp
	 // like this void *(*)(void *)
	 void *(*handler)(void *);
	 //void (*handler)(void *);
	 void *arg;

	 // set true when thread actually starts running after creation
	 bool confirmed;
	 void confirmThread(void);

	// the code that each thread runs.  and the thread dies when it returns.
	// so it should never return.
	//void threadStart(void);

	// how many have actually been created
	static int nCreatedThreads;
	static int nRunningThreads;
	static qThread **threadsList;

	//static std::atomic_flag changingActive;

};


extern "C" {
	int thread_setupThreads(void);
	//qThread * thread_createAThread(int serial, qGrinder *grinder);
}


