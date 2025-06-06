/*
** View Buffer -- a wrapped buffer of float32s meant to be sent to webgl and the gpu
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

// obsolete... right?

// always dynamically allocated.  use name qvBuffer for the qViewBuffer instance
struct qViewBuffer {
	uint32_t magic;

	// always dynamically allocated.  use name vBuffer for this instance everywhere.
	float *vBuffer;

	qSpace *space;
	qAvatar *avatar;

	qViewBuffer(qSpace *space, qAvatar *avatar);

	~qViewBuffer();

	// copy the numbers in wave or qwave into this->viewBuffer
	// also converts from doubles to floats.
	float loadViewBuffer(void);

	// dump, boring table with 4 columns
	void dumpViewBuffer(const char *title = NULL);
};

// JS interface
extern "C" {
	void avatar_dumpViewBuffer(qAvatar *avatar, const char *title = NULL);
	float *avatar_getViewBuffer(qAvatar *avatar);
	double avatar_loadViewBuffer(qAvatar *avatar);
}

