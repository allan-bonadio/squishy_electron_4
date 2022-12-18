/*
** quantum Wave -- an organized wave and space pointer &tc that represents a QM state
**            This file also has qFlick  in it
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

#ifndef __QWAVE_H__
#define __QWAVE_H__

#include "qBuffer.h"


struct qWave : public virtual qBuffer {

	// create a qWave, dynamically allocated or hand in a buffer to use
	qWave(qSpace *space, qCx *useThisBuffer = NULL);

	virtual ~qWave();

	// used for low pass; need general buffer for arithmetic.  obsolete.
	// and qWave::nyquistFilter().  See scratchQWave in avatar
	qCx *scratchBuffer;

	// never even tried any of these
	void forEachPoint(void (*callback)(qCx, int));
	void forEachState(void (*callback)(qCx, int));

	void prune(void);
	//void lowPassFilter(double dilution = 0.01);
	//void nyquistFilter(void);

	void formatDirectOffsets(void);
};




// (maybe obsolete...  might use this for MP)

// for JS to call
extern "C" {
	// js thinks it's a qWave but we know it's really a qBuf cuz that's where
	// the method is.  Maybe I shouldn't be doing this?
	void wave_normalize(qWave *qw);
}

#endif
