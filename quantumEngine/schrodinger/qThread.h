/*
** qThread -- manage the thread(s) that are doing iteration
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

struct qSpace;

#include <pthread.h>

// one for each pthread.  Each is created from the boss thread thread_createAThread()
struct qThread {
	qThread(int ser);
	~qThread();

	// i have no idea how long this is
	pthread_t tid;

	// nor this
	pthread_attr_t attr;

	int serial;  // 0, 1, ...

	int errorCode;

	// atomic to halt at starting pt  (no, I think we're using the one on qGrinder)
	 int halt;


	static qThread **threads;

	// the function that each thread runs.  and the thread dies when it returns.
	// so it should never return.
	void *threadStart(void);

	// number of threads requested at compile time
	static int nThreads;

	// how many have been created
	static int nActiveThreads;

	static qThread **threadList;

	static std::atomic_flag changingActive;
	static qGrinder *grinder;
};

// // one for each qWave being worked on during grinding
// struct qStage : public qWave {
// 	qStage(qSpace *space);
// 	~qStage();
// 	static qStage *stages;
//
// 	int onStage;
// };

extern "C" void thread_createAThread(int serial);


