/*
** quantum Wave -- an organized wave and space pointer &tc that represents a QM state
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

#ifndef __QWAVE_H__
#define __QWAVE_H__

#include "qBuffer.h"


struct qWave : public virtual qBuffer {

	// create a qWave, dynamically allocated or hand in a buffer to use
	qWave(qSpace *space, qCx *useThisBuffer = NULL);

	virtual ~qWave();


	void formatDirectOffsets(void);

	// never even tried any of these
	void forEachPoint(void (*callback)(qCx, int));
	void forEachState(void (*callback)(qCx, int));

	void prune(void);
};




// (maybe obsolete...  might use this for MP)

// for JS to call
extern "C" {
	// js thinks it's a qWave but we know it's really a qBuf cuz that's where
	// the method is.  JS isn't using this, some problem..?
	void wave_normalize(qWave *qw);

	// create the qWave, without the rest of eWave.  Depends on if you already have a qWave.
	qWave *qwave_create(qSpace *space, qCx *useThisBuffer);
}

#endif
