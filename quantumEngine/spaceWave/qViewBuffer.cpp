/*
** view Buffer -- interface data buffer to webGL
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/


#include "qSpace.h"
#include "../schrodinger/qAvatar.h"
#include "qWave.h"
#include "qViewBuffer.h"

static const bool debugViewBuffer = false;
static const bool debugInDetail = false;

// August Ferdinand Möbius invented homogenous coordinates

qViewBuffer::qViewBuffer(qSpace *space, qAvatar *av)
	: magic('View'), space(space), avatar(av) {
	if (! space)
		throw std::runtime_error("qViewBuffer::qViewBuffer null space");

	// 4 floats per vertex, two verts per point
	vBuffer = new float[space->nPoints * 8];
	if (debugViewBuffer) printf("📺 new qvBuffer(): vBuffer ptr %p \n",
		vBuffer);
	//printf("📺 qViewBuffer constructor done: this=%p   vBuffer=%p\n",
	//this, vBuffer);
	// done in completeNewSpace    theQViewBuffer = this;
}

qViewBuffer::~qViewBuffer() {
	delete[] vBuffer;
}

// dump the view buffer just before it heads off to webgl.
void qViewBuffer::dumpViewBuffer(const char *title) {
	float *vBuffer = avatar->qvBuffer->vBuffer;
	float prevPhase =0;
	#define FORMAT_BASE      "%6d.1 |  %6.3f  %6.3f  %6.3g  %6.3g"
	#define FORMAT_SUFFIX  " |  %6.3f  %6.3f  %6.3f  m𝜓\n"

	if (!title) title = "";
	printf("==== 📺 dump vBuffer %p->%p | %s\n", this, vBuffer, title);
	printf("   ix  |    re      im     ---    serial  |      𝜃        d 𝜃      magn\n");
	for (int i = 0; i < space->nPoints; i++) {

		// first three should be all zero
		float *row = vBuffer + i * 8;
		printf(FORMAT_BASE "\n",
			i,
			row[0], row[1], row[2], row[3]);


		//float dRe = re - prevRe;
		//float dIm = im - prevIm;
		float re = row[4];
		float im = row[5];
		float phase = atan2(im, re) * 180 / PI;
		float dPhase = fmod(phase - prevPhase + 180, 360) - 180;
		float magn = im * im + re * re;
		printf(FORMAT_BASE FORMAT_SUFFIX,
			i,
			re, im, row[6], row[7],
			phase, dPhase, magn);

		prevPhase = phase;

		//double re = vBuffer[i*4];
		//double im = vBuffer[i*4+1];
		//if (i & 1) {
		//	double dRe = re - prevRe;
		//	double dIm = im - prevIm;
		//	double phase = 0.;
		//	double magn = 0.;
		//	phase = atan2(im, re) * 180 / PI;
		//	magn = im * im + re * re;
		//	printf("%6d |  %6.3f  %6.3f  %6.3f  %6.3f  |  %6.3f  %6.3f\n",
		//		i,
		//		re, im, vBuffer[i*4+2], vBuffer[i*4+3],
		//		phase, magn);
		//
		//	prevRe = re;
		//	prevIm = im;
		//}
		//else {
		//	printf("%6d |  %6.3f  %6.3f  %6.3f  %6.3f \n",
		//		i,
		//		re, im, vBuffer[i*4+2], vBuffer[i*4+3]);
	}
	printf("    📺  qViewBuffer::at end of dumpViewBuffer qViewBuffer=%p  qViewBuffer->vBuffer=%p\n\n",
			this, vBuffer);
}


// copy the numbers in our qAvatar's qWave into this vBuffer
// one row per vertex, two rows per wave datapoint.
// each row of 4 floats looks like this:
//     real   imaginary    potential    serial
// Two vertices per datapoint: bottom then top, same data.
// also converts from doubles to floats for GL.
float qViewBuffer::loadViewBuffer(void) {
	if (debugViewBuffer) printf("\n📺 qViewBuffer::loadViewBuffer(%s) starts: vBuffer = %p \n",
		avatar->label, vBuffer);
	qWave *qwave = avatar->qwave;
	qCx *wave = qwave->wave;

	int nPoints = space->nPoints;
	double highest = 0;
	double tiny = 1;
	//double tiny = 0;
	//double tiny = 1e-8;

	if (debugInDetail) {
		//printf("loadViewBuffer(P): thePotential=%p\n",
		//thePotential);
		printf("loadViewBuffer(B): qViewBuffer->avatar->qwave->wave=%p->%p->%p->%p\n",
			this,
			avatar,
			avatar->qwave,
			avatar->qwave->wave);
		printf("loadViewBuffer(vb,lqw): qViewBuffer->vBuffer %p\n",
			vBuffer);
		qwave->dump("📺 at start of loadViewBuffer()");
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
		qCx *wavePtr = wave + pointNum;
		if (debugInDetail)
			printf("📺 qViewBuffer::loadViewBuffer wavePtr =%p\n", wavePtr);

		if (debugInDetail) printf("📺 loadViewBuffer(pointNum=%d): twoRowPtr =%p and wavePtr=%p\n",
			pointNum, twoRowPtr, wavePtr);

		double re = wavePtr->re;
		double im = wavePtr->im;

		if (debugInDetail) printf("📺 loadViewBuffer(pointNum:%d): re=%lf im=%lf tiny=%lf\n",
			pointNum, re, im, tiny);

		twoRowPtr[0] = re * tiny;
		twoRowPtr[1] = im * tiny;

		twoRowPtr[2] = 0;
		twoRowPtr[3] = pointNum * 2.;  // vertexSerial: at zero

		twoRowPtr[4] = re;
		twoRowPtr[5] = im;
		twoRowPtr[6] = 0;
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
		printf("    qViewBuffer::at end of loadViewBuffer this=%p  vBuffer=%p\n\n",
				this, vBuffer);
		//printf("  ===  📺  vBuffer.cpp done, as written to view vBuffer:\n");
		dumpViewBuffer("loadViewBuffer done");
	}

	return highest;
}

// for the JS side
extern "C" {
	void avatar_dumpViewBuffer(qAvatar *avatar, const char *title) {
		avatar->qvBuffer->dumpViewBuffer(title);
	}

	// return the vbuffer, raw floats
	float *avatar_getViewBuffer(qAvatar *avatar) {
//		printf("📺 avatar_getViewBuffer: theQViewBuffer=%p \n",
//			theQViewBuffer);
//		printf("📺                    theQViewBuffer->vBuffer=%p\n",
//			theQViewBuffer ? theQViewBuffer->vBuffer : 0);
		//if (avatar->) return NULL;
		return avatar->qvBuffer->vBuffer;
	}

	// load up the Avatar's view buffer based on the Avatar's wave buffer
	// returns the highest height of norm of wave entries
	double avatar_loadViewBuffer(qAvatar *avatar) {
		return avatar->qvBuffer->loadViewBuffer();
	}

	// returns the highest height of norm of wave entries (old)
	//double qViewBuffer_loadViewBuffer(void) {
	//	if (debugViewBuffer)
	//		printf("📺 ggggggg    ... theQViewBuffer=%p\n", theQViewBuffer);
	//	return theQViewBuffer->loadViewBuffer();
	//}
}

