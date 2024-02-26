/*
** qAvatar -- the instance and simulation of a quantum mechanical wave in a space
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

// formerly called: Manifestation, Incarnation, Timeline, ... formerly part of qSpace
// see also JS eAvatar

struct qAvatar {
	qAvatar(qSpace *, const char *label);
	~qAvatar(void);
	void formatDirectOffsets(void);
	void dumpObj(const char *title);

	int magic;
	qSpace *space;


	/* *********************************************** wave */

	// our main qWave, either for the WaveView or the SetWave tab
	// this avatar OWNS the qWave & is responsible for deleting it
	struct qWave *qwave;

	// pointer grabbed from the space.  Same buffer as in space.
	double *voltage;
	double voltageFactor;  // aligned by 8

	// the qViewBuffer to be passed to webgl.  qAvatar is a visual thing after all.
	// Avatar owns the qViewBuffer
	struct qViewBuffer *qvBuffer;
	float *vBuffer;  // aligned by 4, not 8

	// rename to initThreadIntegration
	//void initIntegrationLoop(int xxx, int nThreads, int nStages);

	// for alignment: put the rest of these last

	// mostly for debugging
	char label[MAX_LABEL_LEN + 1];

};

