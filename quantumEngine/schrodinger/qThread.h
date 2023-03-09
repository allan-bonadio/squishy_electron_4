/*
** qThread -- manage the thread(s) that are doing iteration
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

struct qSpace;

#include <pthread.h>

// one for each html5 Worker
struct qThread {
	qThread(int ser);
	~qThread();

	pthread_t tid;
	int serial;
	int errorCode;

	// atomic to halt at starting pt  (no, I think we're using the one on qGrinder)
	 int halt;

	static qThread **threads;

	// the function that each thread runs.  and the thread dies when it returns.  so it should never return.
	void *threadStarts(void);

	// number of threads we want, number we've proven to be open/started
	static int nRequestedThreads;
	static int nActiveThreads;
	static std::atomic_flag changingActive;
	static qGrinder *grinder;

	static void startAllThreads(void);
};

// one for each qWave being worked on during grinding
struct qStage : public qWave {
	qStage(qSpace *space);
	~qStage();
	static qStage *stages;

	int onStage;
};

extern "C" void thread_startAllThreads(int nTheads);
