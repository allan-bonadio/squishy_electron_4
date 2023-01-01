/*
** qThread -- manage the thread(s) that are doing iteration
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

//#include "../debroglie/qWave.h"

struct qSpace;

// one for each html5 Worker
struct qThread {
	qThread();
	~qThread();
	static qThread *threads;

	void threadStarts();

};

// one for each qWave being worked on during grinding
struct qStage : public qWave {
	qStage(qSpace *space);
	~qStage();
	static qStage *stages;

	int onStage;
};

//extern qStage *stages;
//extern qThread *threads;
