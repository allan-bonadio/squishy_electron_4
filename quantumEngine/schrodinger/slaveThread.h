/*
** slave thread -- info for a thread that does real integration crunching
** Copyright (C) 2023-2024 Tactile Interactive, all rights reserved
*/

/*
	grinder.isIntegrating and grinder.startMx and .finishMx mutexes synchronize all the slaveThreads.

	Start of cycle:
	If grinder.isIntegrating is false, no iteration, nothing happens.
	trigger func returns w/o triggering.  Threads stay waiting for startMx.
	If grinder.isIntegrating is true, JS  trigger func unlocks startMx.
	All threads start (roughly) all at once when grinder.startMx is unlocked.
	Each slave thread, who have all requested a lock of the startMx, each
	get to lock it, add one to grinder.nStartedThreads, and immediately unlock
	it, and proceed to integration.  Locking is by startMx.

	Maybe I have to use semaphores:
	sem_t sem;
	sem_init(&sem, 0, initiaqlCount)
	sem_wait(&sem) - try to decrement, sleeps if zero
	sem_post(&sem) - adds one; wakes one up
	hun, maybe not if I get Grinder on the main thread to lock the mutex...

	When nStartedThreads gets to nThreads, the last thread leaves startMx locked, anticipating next frame synch.

	Threads, when they finish, count down with grinder.nFinishedThreads locked with finishMx.
	When it gets to zero, that means that all threads have finished,
	so that last thread calls grinder.threadsHaveFinished(), which cleans up.

	At finishing, grinder.shouldBeIntegrating is copied to grinder.isIntegrating so every thread is on the same page.
*/


struct slaveThread {
	qThread *thread;  // points to corresponding thread
	qGrinder *grinder;  // all point to the same grinder
	int serial;  // same as thread serial
	//bool isDone;  // false while still working

	// makes its own qThread
	slaveThread(qGrinder *gr);

	// creates all threads, etc
	static void createSlaves(qGrinder *grinder);

	// actually gets called each frame.  Not strictly synchronized inter-thread, but runs from
	// requestAnimationFrame()
	void slaveWork(void);

	void slaveLoop(void);

	// timing of the most recent integration; startCalc and endCalc sampled when
	// they're stored, beginning and end of integration frame
	double startCalc;
	double frameCalcTime;

// obsolete 	static int frameFactor;
};

