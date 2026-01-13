/*
** quantum Wave Cavity -- an organized container for a wave
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

#ifndef __QWAVE_H__
#define __QWAVE_H__

#include "qBuffer.h"

// this used to be called qWave, but the inner wave was also named 'wave' and everything got confused.  So this is now a cavity, a place for a wave.
struct qCavity : public virtual qBuffer {

	// create a qCavity, dynamically allocated or hand in a buffer to use
	qCavity(qSpace *space, qCx *useThisBuffer = NULL);

	virtual ~qCavity();


	void formatDirectOffsets(void);

	// never even tried any of these
	void forEachPoint(void (*callback)(qCx, int));
	void forEachState(void (*callback)(qCx, int));

	void prune(void);
};

// for JS to call
extern "C" {
	// create the qCavity, without the rest of eCavity.  Depends on if you already have a qCavity.
	qCavity *cavity_create(qSpace *space, qCx *useThisBuffer);

	void cavity_delete(qCavity *qcavity);

	//   JS isn't using this, some problem..?
	void cavity_normalize(qCavity *qw);

}

#endif
