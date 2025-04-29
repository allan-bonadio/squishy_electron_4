/*
** qAvatar -- the instance and simulation of a quantum mechanical wave in a space
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

// formerly called: Manifestation, Incarnation, Timeline, ... formerly part of qSpace
// see also JS eAvatar

struct qAvatar {
	qAvatar(qSpace *, const char *label);
	~qAvatar(void);
	void formatDirectOffsets(void);

	// print metadata
	void dumpObj(const char *title);

	// transcribes the complex double numbers (2x8 = 16by) in qwave
	// into dual rows of 4 single floats in vBuffer (2x4x4 = )
	float loadViewBuffer(void);

	// dump, boring table with 4 columns
	void dumpViewBuffer(const char *title = NULL);



	/* *********************************************** wave */

	int magic;
	qSpace *space;

	// our main qWave, either for the WaveView or the SetWave tab
	// this avatar OWNS the qWave & is responsible for deleting it
	struct qWave *qwave;

	// pointer grabbed from the space.  Same buffer as in space.
	double *voltage;

	// the gl buffer, not the qWave buffer.  always dynamically allocated.
	float *vBuffer;  // aligned by 4 for single floats, not 8

	// for alignment: put the rest of these last

	// mostly for debugging
	char label[MAX_LABEL_LEN + 1];

};

