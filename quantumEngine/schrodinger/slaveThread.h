/*
** slave thread -- info for a thread that does real integration crunching
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
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

	// actually gets called each frame.  Not strictly synchronized inter-thread
	void slaveRunner(void);

	// timing of the most recent integration; startCalc and endCalc sampled when
	// they're stored, beginning and end of integration frame
	double startCalc;
	double frameCalcTime;
};

