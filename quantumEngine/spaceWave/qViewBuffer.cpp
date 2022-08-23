/*
** view Buffer -- interface data buffer to webGL
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/


#include "qSpace.h"
#include "../schrodinger/Avatar.h"
#include "qWave.h"
#include "qViewBuffer.h"

static const bool debugViewBuffer = false;
static const bool debugInDetail = false;

// August Ferdinand Möbius invented homogenous coordinates

qViewBuffer::qViewBuffer(qSpace *space, Avatar *av)
	: magic('View'), space(space), avatar(av) {
	if (! space)
		throw std::runtime_error("qViewBuffer::qViewBuffer null space");

	// 4 floats per vertex, two verts per point
	vBuffer = new float[space->nPoints * 8];
	if (debugViewBuffer) printf("📺 qvBuffer(): vBuffer ptr %p \n",
		vBuffer);
	//printf("📺 qViewBuffer constructor done: this=%p   vBuffer=%p\n",
	//this, vBuffer);
	// done in completeNewSpace    theQViewBuffer = this;
}

qViewBuffer::~qViewBuffer() {
	delete[] vBuffer;
}

// copy the numbers in our Avatar's qWave into vBuffer
// one row per vertex, two rows per wave datapoint.
// each row of 4 floats looks like this:
//     real   imaginary    potential    serial
// Two vertices per datapoint: bottom then top, same data.
// also converts from doubles to floats for GL.
float qViewBuffer::loadViewBuffer(void) {
	if (debugViewBuffer) printf("📺 loadViewBuffer() starts: vBuffer = %p \n",
		vBuffer);
//	printf("qViewBuffer::loadViewBuffer space ptr %p\n", space);
//	printf("qViewBuffer::loadViewBuffer mainQWave ptr %p\n", avatar->mainQWave);
	qWave *mainQWave = avatar->mainQWave;
//	printf("qViewBuffer::loadViewBuffer latestWave ptr %p\n", avatar->mainQWave->wave);
	qCx *latestWave = mainQWave->wave;

//	printf("qViewBuffer::loadViewBuffer space->nPoints %d\n", space->nPoints);
	int nPoints = space->nPoints;
	double highest = 0;
	double tiny = 1e-8;

	if (debugInDetail) {
		printf("loadViewBuffer(P): thePotential=%p\n",
			thePotential);
		printf("loadViewBuffer(B): avatar->mainQWave->wave=%p->%p->%p->%p\n",
			this,
			space,
			avatar->mainQWave,
			avatar->mainQWave->wave);
		printf("loadViewBuffer(vb,lqw): vBuffer %p and avatar->mainQWave->wave=%p\n",
			vBuffer, latestWave);
		mainQWave->dump("📺 at start of loadViewBuffer()");
	}

	// this is index into the complex point, which translates to 2 GL points
//	printf("qViewBuffer::loadViewBuffer about to do all the pts\n");
	for (int pointNum = 0; pointNum < nPoints; pointNum++) {
		if (debugInDetail) {
			printf("📺 qViewBuffer::loadViewBuffer vBuffer %p\n",
				vBuffer);
			printf("📺 qViewBuffer::loadViewBuffer vBuffer + pointNum * 8=%p\n",
				vBuffer + pointNum * 8);
		}
		float *twoRowPtr = vBuffer + pointNum * 8;
		if (debugInDetail)
			printf("📺 qViewBuffer::loadViewBuffer twoRowPtr =%p\n", twoRowPtr);
		qCx *wavePtr = latestWave + pointNum;
		if (debugInDetail)
			printf("📺 qViewBuffer::loadViewBuffer wavePtr =%p\n", wavePtr);

		if (debugInDetail) printf("📺 loadViewBuffer(pointNum=%d): twoRowPtr =%p and wavePtr=%p\n",
			pointNum, twoRowPtr, wavePtr);

		if (debugInDetail)
			printf("📺 qViewBuffer::loadViewBuffer thePotential=%p\n", theSpace->potential);
		double *potPtr = theSpace->potential + pointNum;
		if (!potPtr) throw std::runtime_error("📺 qViewBuffer::loadViewBuffer potPtr is null");
		if (debugInDetail)
			printf("📺 qViewBuffer::loadViewBuffer potPtr=%p\n", potPtr);
		double re = wavePtr->re;
		double im = wavePtr->im;

		if (debugInDetail) printf("📺 loadViewBuffer(pointNum:%d): re=%lf im=%lf tiny=%lf\n",
			pointNum, re, im, tiny);

		twoRowPtr[0] = re * tiny;
		twoRowPtr[1] = im * tiny;

		twoRowPtr[2] = potPtr[0];  // this isn't going to be used yet
		twoRowPtr[3] = pointNum * 2.;  // vertexSerial: at zero

		twoRowPtr[4] = re;
		twoRowPtr[5] = im;
		twoRowPtr[6] = potPtr[0];
		twoRowPtr[7] = pointNum * 2. + 1.;  // at magnitude, top

		if (debugInDetail) printf("📺 loadViewBuffer(8:%d): %lf %lf %lf %lf %lf %lf %lf %lf\n",
			pointNum, twoRowPtr[0], twoRowPtr[1], twoRowPtr[2], twoRowPtr[3],
				twoRowPtr[4], twoRowPtr[5], twoRowPtr[6], twoRowPtr[7]);

		// while we're here, collect the highest point (obsolete i think)
		double height = re * re + im * im;
		if (height > highest)
			highest = height;
	}

	if (debugViewBuffer) {
		printf("    qViewBuffer::at end of loadViewBuffer this=%p  vBuffer=%p\n",
				this, vBuffer);
		//printf("  ===  📺  vBuffer.cpp done, as written to view vBuffer:\n");
		//dumpViewBuffer("loadViewBuffer done");
	}

	return highest;
}

// dump the view buffer just before it heads off to webgl.
void qViewBuffer::dumpViewBuffer(const char *title) {
//	printf("dumpViewBuffer theSpace %p\n", theSpace);
//	printf("dumpViewBuffer qViewBuffer ptr %p\n", theSpace->qViewBuffer);
//	printf("dumpViewBuffer vBuffer %p\n", theSpace->qvBuffer->vBuffer);
	//float *vBuffer = avatar->qvBuffer->vBuffer;
	printf("📺 The vBuffer = %p\n", vBuffer);
	double prevRe = vBuffer[0];
	double prevIm = vBuffer[1];

	if (!title) title = "";
	printf("==== 📺 dump vBuffer | %s\n", title);
	printf("   ix  |    re      im     pot    serial  |   phase    magn\n");
	for (int i = 0; i < space->nPoints*2; i++) {
		double re = vBuffer[i*4];
		double im = vBuffer[i*4+1];
		if (i & 1) {
			double dRe = re - prevRe;
			double dIm = im - prevIm;
			double phase = 0.;
			double magn = 0.;
			phase = atan2(im, re) * 180 / PI;
			magn = im * im + re * re;
			printf("%6d |  %6.3f  %6.3f  %6.3f  %6.3f  |  %6.3f  %6.3f\n",
				i,
				re, im, vBuffer[i*4+2], vBuffer[i*4+3],
				phase, magn);

			prevRe = re;
			prevIm = im;
		}
		else {
			printf("%6d |  %6.3f  %6.3f  %6.3f  %6.3f \n",
				i,
				re, im, vBuffer[i*4+2], vBuffer[i*4+3]);
		}
	}
	printf("    qViewBuffer::at end of dumpViewBuffer qViewBuffer=%p  qViewBuffer->vBuffer=%p\n",
			this, vBuffer);
}


// for the JS side
extern "C" {
	void qViewBuffer_dumpViewBuffer(const char *title) {
		theAvatar->qvBuffer->dumpViewBuffer(title);
	}

	// return the vbuffer, raw floats
	float *qViewBuffer_getViewBuffer(void) {
//		printf("📺 qViewBuffer_getViewBuffer: theQViewBuffer=%p \n",
//			theQViewBuffer);
//		printf("📺                    theQViewBuffer->vBuffer=%p\n",
//			theQViewBuffer ? theQViewBuffer->vBuffer : 0);
		if (! theQViewBuffer) return NULL;
		return theQViewBuffer->vBuffer;
	}

	// returns the highest height of norm of wave entries
	double qViewBuffer_loadViewBuffer(void) {
		if (debugViewBuffer)
			printf("📺 qViewBuffer_getViewBuffer... theQViewBuffer=%p\n", theQViewBuffer);
		return theQViewBuffer->loadViewBuffer();
	}
}

