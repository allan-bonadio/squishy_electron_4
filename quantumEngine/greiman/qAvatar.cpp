/*
** qAvatar -- the instance and simulation of a quantum mechanical wave in a space
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

#include <string.h>

#include <limits>
#include <cfenv>

//#include "../hilbert/qSpace.h"
#include "qAvatar.h"
//#include "../schrodinger/qGrinder.h"
//#include "../debroglie/qWave.h"
//#include "../fourier/qSpectrum.h"
//#include "../fourier/fftMain.h"
#include "../directAccessors.h"

static const bool traceCreation = false;
static const bool traceHighest = false;

#define MAX_N_BUFFERS  4

/* ********************************************* loading view bufs */

// see constants in genExports.js

// for C++ calling, just set avatar->avatarBreed or pass it in the constructor directly.  avatarBreed optional.
// For JS calling C++, need an avatarBreed in commonConstants.h, and must be listed here.
// You can also load it in JS; write your on function and call it when you can
//void (*(getBreedLoader(int avatarBreed) ))(qAvatar *) {
//	printf("getBreedLoader(avatarBreed=%d)\n", avatarBreed);
//	printf("    loaders: %p   %p   %p\n", loaderFlat, loaderFlatTics, loaderRainbow);
//	switch (avatarBreed) {
//	case avNULL:
//		throw std::runtime_error("Cannot load avNULL");
//
//	case avOldFLAT:
//		throw std::runtime_error("Cannot load oldFlat");  // actual code doesn't relly work
//
//	case avFLAT:
//		return loaderFlat;
//
//	case avFLAT_TICS:
//		return loaderFlatTics;
//
//	case avRAINBOW:
//		return loaderRainbow ;
//
//	default:
//		printf("Cannot load strange avatarBreed=%d\n", avatarBreed);
//		throw std::runtime_error("Cannot load strange avatarBreed");
//
//	}
//}



// each viewBuffer is one of these.  to be filled in later.
viewBufInfo::viewBufInfo(void) {
	fArray = NULL;
	nVertices = -1;  // dangerous?
	nCoords = -1;  // dangerous?
}

/* ******************************************************************* qAvatar */

// create new avatar, complete with zero viewBuffers
qAvatar::qAvatar(int breed, const char *lab)
	: magic('Avat'), avatarBreed(breed), loader(NULL), space(NULL),
	qwave(NULL), d0(0), d1(0), i0(0), i1(0) {

	//strcpy(label, "ra");  // TODO fix this
	//// this crashes all the time.  I have no idea why.
	strncpy(label, lab, MAX_LABEL_LEN);
	label[MAX_LABEL_LEN-1] = 0;

	//	qwave = new qWave(space);
	//	voltage = sp->voltage;

	printf(" construct avatar.   label: %p      this=%p\n", lab, this );
	printf("the label passed in is %s\n", lab);
	if (traceCreation)
		printf(" 🚥 creating new qAvatar.  ptr=%p breed=%d  label='%s' MAX_LABEL_LEN: %d\n",
			this, avatarBreed, label, MAX_LABEL_LEN);
	// crashes!! printf("lab input string: 0x %2x %2x %2x %2x %2x %2x \n", lab[0], lab[1], lab[2], lab[3], lab[4], lab[5] );

	for (int b = 0; b < MAX_N_BUFFERS; b++)
		viewBuffers[b].fArray = NULL;

	// enable this when qAvatar.h fields change
	FORMAT_DIRECT_OFFSETS;
};

qAvatar::~qAvatar(void) {
	for (int i = 0; i < MAX_N_BUFFERS; i++)
		if (viewBuffers[i].fArray)
			delete viewBuffers[i].fArray;
};

// attach given buffer (useThisBuffer) as a view buffer in this avatar at
// position whichBuffer.  If useThisBuffer is null, then allocate it and use
// that.  does NOT clear or init the buffer.
float *qAvatar::attachViewBuffer(int whichBuffer, float *useThisBuffer,
		int nCoordsPerVertex, int nVertices) {
	viewBufInfo *vb = viewBuffers + whichBuffer;
	if (vb->fArray) throw std::runtime_error("view buffer already attached!");
	if (!useThisBuffer)
		useThisBuffer = new float[nCoordsPerVertex * nVertices];
	vb->fArray = useThisBuffer;
	vb->nVertices = nVertices;
	vb->nCoords = nCoordsPerVertex;
	return vb->fArray;
}

// allocates it, attaches to qAvatar, makes sure you don't do this twice.  Returns pointer.
short *qAvatar::attachIndexBuffer(short *useThisBuffer, int nItems) {
	if (this->indexBuffer) throw std::runtime_error("indexBuffer already attached!");
	if (!useThisBuffer)
		useThisBuffer = new short[nItems];
	this->indexBuffer = useThisBuffer;
	this->nIndices = nItems;

	return this->indexBuffer;
}

// need these numbers for the js interface to this object, to figure out the offsets.
// see eAvatar.js ;  usually this function isn't called.
// Insert this into the constructor and run this once.  Copy text output.
// Paste the output into class eAvatar, the class itself, to replace the existing ones
void qAvatar::formatDirectOffsets(void) {
	// don't need magic
	printf("🚥 🚥 --------------- starting 🥽 eAvatar direct access 🥽 JS getters & setters--------------\n\n");

	// the view Buffer to be passed to webgl.  Just the buffer
	makeIntGetter(avatarBreed);
	makeIntSetter(avatarBreed);

	makePointerGetter(space);
	makePointerSetter(space);
	makePointerGetter(qwave);
	makePointerSetter(qwave);

	// arguments and return values
	makeIntGetter(i0);
	makeIntSetter(i0);
	makeIntGetter(i1);
	makeIntSetter(i1);

	makeDoubleGetter(d0);
	makeDoubleSetter(d0);
	makeDoubleGetter(d1);
	makeDoubleSetter(d1);

	makeStringPointer(label);

	makePointerGetter(indexBuffer);
	makePointerSetter(indexBuffer);
	makePointerGetter(nIndices);

	makeInsidePointer(viewBuffers);


	printf("\n🚥  --------- done with 🥽 eAvatar direct access 🥽 ----------\n");
}

/* ********************************************************** dump  */

#define TXTLEN 300
char txt[TXTLEN];  // should make common code for this
int charsUsed;


// dump all the fields of an avatar other than the actual datapoints
// I don't think anybody uses this
void qAvatar::dumpMeta(const char *title) {
	if (!title) title = "no title 🧨 🧨";
	printf("\n🚥 🚥  ==== '%s' Avatar | avatarBreed=%d  ",
		title, avatarBreed);
	printf("        magic: " MAGIC_FORMAT "     '%s'   \n",
		magic>>3, magic>>2, magic>>1, magic, label);

	printf("   i0 = %10d   i1 = %10d    d0 = %12.6g   d1 = %12.6g\n",
		i0, i1, d0, d1);

	printf("        ==== end of qAvatar ====🚥 🚥 \n\n");
}

// dump out ALL the vertex buffer data, according to bufferMask.
// bitwise OR together: 1=buf 0, 2=buf1, 4=buf2, 8=buf3,
// bufferMask is a bit-mask: 1=viewbuf[0], 2=viewbuf[1],4=buf2, 8=buf3, etc
// Always omits buffers that aren't there yet.
void qAvatar::dumpViewBuffers(int bufferMask, const char *title) {
	txt[TXTLEN - 1] = 101;
	if (!title) title = "no title 🧨 🧨";

	printf(" 🚥 %s avatar ✈️ %d vertices (bufferMask: %x)\n",
		title, viewBuffers[0].nVertices, bufferMask);    // WRONG only for buf zero

	// HEADING row.  Pay careful attention to chars across so rows line up,
	// and line up with headings.  Right just.
	charsUsed = 0;
	int which = bufferMask;
	charsUsed += snprintf(txt+charsUsed, TXTLEN - charsUsed, "vtex ");
	for (int bufferIx = 0; (bufferIx < MAX_N_BUFFERS) && which; bufferIx++) {
		//printf("heading buffer %d\n", bufferIx);
		if ((which & 1) && viewBuffers[bufferIx].fArray) {
			int nC = viewBuffers[bufferIx].nCoords;
			if (nC < 0)
				throw std::runtime_error("qAvatar::view buffer uninitialized!!");

			// label
			charsUsed += snprintf(txt+charsUsed, TXTLEN - charsUsed, "   vBuf %2d ", bufferIx);
			//printf("buffer %d: nCoords=%d  charsUsed=%d\n", bufferIx, nC, charsUsed);
			// spaces for the rest of the heading for this buffer
			for (int coordIx = 1; coordIx < nC; coordIx++) {
				charsUsed += snprintf(txt+charsUsed, TXTLEN - charsUsed, "           ");
			}
			// between buffers on line
			charsUsed += snprintf(txt+charsUsed, TXTLEN - charsUsed, "    ");
//			strcpy(txt+charsUsed, (char *) '    ');
//			charsUsed += 4;
			if (101 != txt[TXTLEN - 1])
				throw std::runtime_error("qAvatar::dumpViewBuffers() overflowed txt buffer in hea!!");
		}  // end of buffer loop for heading
		which >>= 1;
	}
	printf("%s\n", txt);
	charsUsed = 0;

	// Actual Buffer Data.  one ROW PER VERTEX... so a bit convoluted
	// TODO: handle buffers with different lengths
	for (int vertexIx = 0; vertexIx < viewBuffers[0].nVertices; vertexIx++) {

		//printf("vertex %d:\n", vertexIx);
		// on this line: do which viewBuffers at vertexIx, and each of their coordinates
			// row heading
		charsUsed += snprintf(txt+charsUsed, TXTLEN - charsUsed, "%4d ", vertexIx);
		which = (bufferMask & 0xF);
		for (int bufferIx = 0; (bufferIx < MAX_N_BUFFERS) && which; bufferIx++) {

			if ((which & 1) && (viewBuffers[bufferIx].fArray)) {
				int nC = viewBuffers[bufferIx].nCoords;
				//printf("about to dump vx=%d in buffer=%d, which=0x%x\n", vertexIx, bufferIx, which);
				float *vertexStart = viewBuffers[bufferIx].fArray + nC * vertexIx;

				//printf("   buffer %d... nCoords=%d\n", bufferIx, nC);
				for (int coordIx = 0; coordIx < nC; coordIx++) {
					//printf("   %d bytes left... buf%d  coord=%d of %d\n", TXTLEN - charsUsed, bufferIx, coordIx, nC);
					charsUsed += snprintf(txt+charsUsed, TXTLEN - charsUsed, " %9.2f ", vertexStart[coordIx]);
				}
				charsUsed += snprintf(txt+charsUsed, TXTLEN - charsUsed, "    ");
//				strcpy(txt+charsUsed, (char *) '    ');
//				charsUsed += 4;
				if (101 != txt[TXTLEN - 1])
					throw std::runtime_error("qAvatar::dumpViewBuffer() overflowed txt buffer in vex!!");
			}  // end of vb buffer IF stmt
			//printf("end of coords for buffer bufferix=%d, of while which=0x%x\n", bufferIx, which);
			which >>= 1;
		}  // end of vb buffer loop
		printf(" %s\n", txt);  // end of one line
		charsUsed = 0;
	}  // end of vb vertexes loop

	if (101 != txt[TXTLEN - 1])
		throw std::runtime_error("qAvatar::dumpViewBuffer() overflowed txt buffer in ind!!");
}


// dump out ALL the vertex buffer data, according to bufferMask.
// bitwise OR together: 1=buf 0, 2=buf1, 4=buf2, 8=buf3,
// bufferMask is a bit-mask: 1=viewbuf[0], 2=viewbuf[1],4=buf2, 8=buf3, etc
// Always omits buffers that aren't there yet.
void qAvatar::dumpIndex(const char *title) {
	txt[TXTLEN - 1] = 101;
	if (!title) title = " no title 🧨 🧨";

	printf(" 🚥 '%s' avatar 🦆 %d indices\n",
		title, nIndices);
	if (!nIndices) {
		printf("🚥  🚥  no indices  🦆 🦆\n");
	}

	// index buffer
	const int IXES_PER_ROW = 18;
	charsUsed = 0;
	printf(" 🚥 avatar '%s' 🛫 %d indices\n", title, nIndices);
	for (int i = 0; i < nIndices; i += IXES_PER_ROW) {
		printf("got %d bytes left... ix ix=%d\n", TXTLEN - charsUsed, i);
		for (int j = 0; (j < IXES_PER_ROW) && (j+i < nIndices); j++) {
//			if (6 == j || 12 == j)
//				strcpy(txt+charsUsed, "     ");
			charsUsed += snprintf(txt+charsUsed, TXTLEN - charsUsed, " %4d", indexBuffer[i+j]);
		}
		printf(" %s\n", txt);
		charsUsed = 0;
	}  // end of index outer loop

	if (101 != txt[TXTLEN - 1])
		throw std::runtime_error(" qAvatar::dumpIndex() overflowed txt buffer in ind!!");
}


// SAVE THIS FOR LATER phase on the above dump
//// dump the view buffer just before it heads off to webgl.  TODO: remove
//static void old_qAvatar__dumpViewBuffers(int bufferMask, const char *title) {
//	float prevPhase = 0;
//	#define FORMAT_BASE      "%6d |  %8.5f  %8.5f  %6.5g  %6.5g"
//	#define FORMAT_SUFFIX  " | %6.5f %6.5f  %6.5f m𝜓/nm\n"
//
//	if (!title) title = "no title 🧨 🧨";
//	printf("==== 🚥 dump avatar %p ➔ buffer %p | '%s'\n", this, vBuffer, title);
//	printf("   ix  |    re      im     ---    serial  |      𝜃        d 𝜃      magn\n");
//	for (int i = 0; i < space->nPoints; i++) {
//
//		// first three should be all zero
//		float *row = vBuffer + i * 8;
//		printf(FORMAT_BASE "\n",
//			i,
//			row[0], row[1], row[2], row[3]);
//
//
//		float re = row[4];
//		float im = row[5];
//		float phase = atan2(im, re) * 180 / PI;
//		float dPhase = fmod(phase - prevPhase + 180, 360) - 180;
//		float magn = im * im + re * re;
//		printf(FORMAT_BASE FORMAT_SUFFIX,
//			i,
//			re, im, row[6], row[7],
//			phase, dPhase, magn);
//
//		prevPhase = phase;
//	}
//	printf("    🚥  qAvatar::at end of dumpViewBuffer vBuffer=%p\n\n",
//			vBuffer);
//}


	//float *getViewBuffer(int bufferIx);

/* ******************************************************** loading */

// see avFlatLoader

/* ************************************************************** C */

// for the JS side

qAvatar *avatar_create(int avatarBreed, char *label) {
	if (traceCreation)
		printf(" 🚥 avatar_create()  breed=%d  label='%s' %p\n",
			avatarBreed, label, label);
	return new qAvatar(avatarBreed, label);
}

// qwave and space are both optional, pass null for none or just don't call this
void avatar_setWaveSpace(qAvatar *avatar, qWave *qwave, qSpace *space) {
	avatar->qwave = qwave;
	avatar->space = space;
}

float *avatar_attachViewBuffer(qAvatar *avatar, int whichBuffer, float *useThisBuffer,
			int nCoordsPerVertex, int nVertices) {
	return avatar->attachViewBuffer(whichBuffer, useThisBuffer, nCoordsPerVertex, nVertices);
}

short *avatar_attachIndexBuffer(qAvatar *avatar, short *useThisBuffer,
			int nItems) {
	return avatar->attachIndexBuffer(useThisBuffer, nItems);
}

void avatar_dumpMeta(qAvatar *avatar, char *title) {
	avatar->dumpMeta(title);
}

void avatar_dumpViewBuffers(qAvatar *avatar, int bufferMask, char *title) {
	avatar->dumpViewBuffers(bufferMask, title);
}

void avatar_dumpIndex(qAvatar *avatar, char *title) {
	avatar->dumpIndex(title);
}

// return the vbuffer, address of raw float array.  Simple enough to do by hand;
// not needed for C++. take this int in JS and make a typed array out of it to
// access the elements
float *avatar_getViewBuffer(qAvatar *avatar, int bufferIx) {
	return avatar->buf(bufferIx);
}

//void avatar_loadViewBuffers(qAvatar *avatar, int breed) {
//	printf("avatar_loadViewBuffers avatar=%p  breed passedin=%d  created=%d\n",
//		avatar, breed, avatar->avatarBreed);
//	avatar->loadViewBuffers(breed);
//}

