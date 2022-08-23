/*
** View Buffer -- a wrapped buffer of float32s meant to be sent to webgl and the gpu
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/


// always dynamically allocated.  use name qvBuffer for the qViewBuffer instance
struct qViewBuffer {
	uint32_t magic;

	// always dynamically allocated.  use name vBuffer for this instance everywhere.
	float *vBuffer;

	qSpace *space;
	Avatar *avatar;

	qViewBuffer(qSpace *space, Avatar *avatar);

	~qViewBuffer();

	// copy the numbers in wave or mainQWave into this->viewBuffer
	// also converts from doubles to floats.
	float loadViewBuffer(void);

	// dump, boring table with 4 columns
	void dumpViewBuffer(const char *title = NULL);
};

// 'the' being the only one sometimes
extern qViewBuffer *theQViewBuffer;

// JS interface
extern "C" {
	void qViewBuffer_dumpViewBuffer(const char *title = NULL);
	float *qViewBuffer_getViewBuffer(void);
	double qViewBuffer_loadViewBuffer(void);
}

