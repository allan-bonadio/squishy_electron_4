/*
** grinder worker -- info for a thread that does real integration crunching
** Copyright (C) 2023-2026 Tactile Interactive, all rights reserved
*/

/*
	grinder.isIntegrating and grinder.startAtom and .finishAtom
	synchronize all the gThreadThreads.  (This discussion isn't entirely
	accurate, read the code.)

	Start of cycle:
	All grinderThreads are halted, waiting on startAtomic, where -1
	means locked, and >=0 means unlocked. isIntegrating should be false,
	as that indicates not active.

	To start integration, qGrinder::triggerIteration() is called
	(however), which calls Atomic.notify is called from JS.
	Either way, .startAtomic is atomically set to zero, isIntegrating is
	set to true, and a notify is done on startAtomic.  All of the
	grinderThreads launch all together (hopefully simultaneously).  They all run
	this algorithm that prefers them to start simultaneously, and to
	pause upon ending so the latest version of the wave can be copied
	out.

	[Not implemented yet; not sure if we need it — Upon notification and
	activation, each grWorker, atomically add one to
	grinder.startAtomic, and immediately proceed to integration. When
	startAtomic gets to nGrWorkers, that last thread locks startAtom
	again, anticipating next lap synch.  Yeah, I think we need this;
	works fine now cuz there's just one thread.  We also need that extra
	tail thread to run threadsHaveFinished().]


	Threads, when they finish, count up, atomically incrementing with grinder.finishAtomic, one per thread.
	When it gets to nGrWorkers, that means that all threads have finished,
	so that last thread calls grinder.threadsHaveFinished(), which cleans up.
	[OR starts in the tail thread by notifying its atomic]

	As part of finishing, grinder.shouldBeIntegrating is copied to
	grinder.isIntegrating.  If true, the startAtomic is unlocked again
	to trigger the next cycle.
*/


struct grWorker {
	qThread *thread;  // points to corresponding thread
	qGrinder *grinder;  // all point to the same grinder
	int serial;  // same as thread serial

	// makes its own qThread
	grWorker(qGrinder *gr);

	// creates all threads, etc
	static void createGrWorkers(qGrinder *grinder);

	// actually gets called each lap.  Not strictly synchronized inter-thread, but runs from
	// requestAnimationFrame()
	void gThreadWork(void);

	void gThreadLoop(void);

	// timing of the most recent integration; startCalc and endCalc sampled when
	// they're stored, beginning and end of integration lap.  ms.
	double startCalc;
	double lapCalcTime;
};

