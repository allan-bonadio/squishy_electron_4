/*
** qThread -- manage the thread(s) that are doing iteration
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

struct qSpace;
struct qThread;

#include <pthread.h>

// N_THREADS defined in buildCommon.sh
#define MAX_THREADS 4*N_THREADS

// pointers to qThread objects in serial order
qThread *threadsList[MAX_THREADS];


// one for each pthread.  Each is created from JS with thread_createAThread()
struct qThread {
	qThread(int ser);
	~qThread();

	// pthread's ID for this thread
	pthread_t tid;

	// set preferences in this if you want
	pthread_attr_t attr;

	int serial;  // 0, 1, ...

	// errno for the last operation that failed, or zero if all ok
	int errorCode;

	// atomic to halt at starting pt  (no, I think we're using the one on qGrinder)
	 int halt;

	 // set true when thread actually starts running
	 bool confirmed;

	 void confirmThread();

	// the code that each thread runs.  and the thread dies when it returns.
	// so it should never return.
	//void threadStart(void);

	// how many have actually been created
	static int nCreatedThreads;
	static int nRunningThreads;
	static qThread **threadsList;

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

extern "C" int thread_setupThreads(void);
extern "C" qThread * thread_createAThread(int serial);


