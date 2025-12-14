/*
** qAvatar -- the instance and simulation of a quantum mechanical wave in a space
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

#include <string.h>

#include <limits>
#include <cfenv>

#include "qAvatar.h"
#include "../directAccessors.h"

static const bool traceCreation = false;
static const bool traceHighest = false;

#define MAX_N_BUFFERS  4

/* ********************************************* loading view bufs */

// see constants in genExports.js


// each viewBuffer is one of these.  to be filled in later.
viewBufInfo::viewBufInfo(void) {
	fArray = NULL;
	nVertices = -1;  // dangerous?
	nCoords = -1;  // dangerous?
}

/* ******************************************************************* qAvatar */

// create new avatar, complete with zero viewBuffers
qAvatar::qAvatar(const char *lab)
	: magic('Avat'), space(NULL),
	cavity(NULL), double0(0), double1(0), int0(0), int1(0) {

	strncpy(label, lab, MAX_LABEL_LEN);
	label[MAX_LABEL_LEN-1] = 0;

	printf(" construct avatar.   label: %p      this=%p\n", lab, this );
	printf("the label passed in is %s\n", lab);
	if (traceCreation)
		printf(" 🚥 creating new qAvatar.  ptr=%p  label='%s' MAX_LABEL_LEN: %d\n",
			this, label, MAX_LABEL_LEN);
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
	printf("🚥 🚥 --------------- starting    👽   👽    eAvatar direct access    👽   👽    JS getters & setters--------------\n\n");

	// the view Buffer to be passed to webgl.  Just the buffer
	makePointerGetter(space);
	makePointerSetter(space);
	makePointerGetter(cavity);
	makePointerSetter(cavity);

	// arguments and return values
	makeIntGetter(int0);
	makeIntSetter(int0);
	makeIntGetter(int1);
	makeIntSetter(int1);

	makeDoubleGetter(double0);
	makeDoubleSetter(double0);
	makeDoubleGetter(double1);
	makeDoubleSetter(double1);

	makeStringPointer(label);

	makePointerGetter(indexBuffer);
	makePointerSetter(indexBuffer);
	makePointerGetter(nIndices);

	makeInsidePointer(viewBuffers);


	printf("\n🚥  --------- done with    👽   👽    eAvatar direct access    👽   👽    ----------\n");
}

/* ********************************************************** dump  */

#define TXTLEN 300
char txt[TXTLEN];  // should make common code for this
int charsUsed;


// dump all the fields of an avatar other than the actual datapoints
// I don't think anybody uses this
void qAvatar::dumpMeta(const char *title) {
	if (!title) title = "no title 🧨 🧨";
	printf("\n🚥 🚥  ==== '%s' Avatar |  magic: " MAGIC_FORMAT "     '%s'   \n",
		title, magic>>3, magic>>2, magic>>1, magic, label);

	printf("   int0 = %10d   int1 = %10d    double0 = %12.6g   double1 = %12.6g\n",
		int0, int1, double0, double1);

	printf("        ==== end of qAvatar ====🚥 🚥 \n\n");
}

// dump out ALL the vertex buffer data, according to bufferMask.
// bitwise OR together: 1=buf 0, 2=buf1, 4=buf2, 8=buf3,
// bufferMask is a bit-mask: 1=viewbuf[0], 2=viewbuf[1],4=buf2, 8=buf3, etc
// Always omits buffers that aren't there yet.
void qAvatar::dumpEachViewBuffer(int bufferMask, const char *title) {
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
		if ((which & 1) && viewBuffers[bufferIx].fArray) {
			int nC = viewBuffers[bufferIx].nCoords;
			if (nC < 0)
				throw std::runtime_error("qAvatar::view buffer uninitialized!!");

			// label
			charsUsed += snprintf(txt+charsUsed, TXTLEN - charsUsed, "   vBuf %2d ", bufferIx);

			// spaces for the rest of the heading for this buffer
			for (int coordIx = 1; coordIx < nC; coordIx++) {
				charsUsed += snprintf(txt+charsUsed, TXTLEN - charsUsed, "           ");
			}
			// between buffers on line
			charsUsed += snprintf(txt+charsUsed, TXTLEN - charsUsed, "    ");
//			strcpy(txt+charsUsed, (char *) '    ');
//			charsUsed += 4;
			if (101 != txt[TXTLEN - 1])
				throw std::runtime_error("qAvatar::dumpEachViewBuffer() overflowed txt buffer in hea!!");
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
				float *vertexStart = viewBuffers[bufferIx].fArray + nC * vertexIx;

				for (int coordIx = 0; coordIx < nC; coordIx++) {
					charsUsed += snprintf(txt+charsUsed, TXTLEN - charsUsed, " %9.2f ", vertexStart[coordIx]);
				}
				charsUsed += snprintf(txt+charsUsed, TXTLEN - charsUsed, "    ");
//				strcpy(txt+charsUsed, (char *) '    ');
//				charsUsed += 4;
				if (101 != txt[TXTLEN - 1])
					throw std::runtime_error("qAvatar::dumpComplexViewBuffer() overflowed txt buffer in vex!!");
			}  // end of vb buffer IF stmt
			which >>= 1;
		}  // end of vb buffer loop
		printf(" %s\n", txt);  // end of one line
		charsUsed = 0;
	}  // end of vb vertexes loop

	if (101 != txt[TXTLEN - 1])
		throw std::runtime_error("qAvatar::dumpEachViewBuffer() overflowed txt buffer in ind!!");
}

// dump only the first two fields of the bufIx-th vbuf, assuming they're real and inag, exactly as flatDrawing uses it
void qAvatar::dumpComplexViewBuffer(int bufIx, int nPoints, const char *title) {
	float *fArray = viewBuffers[bufIx].fArray;  // to here
	float prevPhase =0;
	#define FORMAT_BASE      "%6d |  %6.5f  %6.5f  %6.5g  %6.5g"
	#define FORMAT_SUFFIX  " |  %6.5f  %6.5f  %6.5f  m𝜓/nm\n"

	if (!title) title = "";
	printf("==== 🚦  dump view buffer Array %p | %s\n", fArray, title);
	printf("   ix  |    re      im     ---    serial  |      𝜃        d 𝜃      magn\n");
	for (int i = 0; i < nPoints; i++) {

		// first three should be all zero
		float *row = fArray + i * 8;
		printf(FORMAT_BASE "\n",
			i,
			row[0], row[1], row[2], row[3]);

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
	}
	printf(" 🚦 at end of dumpComplexViewBuffer avatar=%p  avatar->fArray=%p\n\n",
			this, fArray);
}


// never used
// dump out the index list, if any
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


// SAVE THIS FOR LATER phase on the above dump.  No, done by dumpComplexViewBuffer()
//// dump the view buffer just before it heads off to webgl.
//static void old_qAvatar__dumpEachViewBuffer(int bufferMask, const char *title) {
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
//	printf("    🚥  qAvatar::at end of dumpComplexViewBuffer vBuffer=%p\n\n",
//			vBuffer);
//}

/* ************************************************************** C */

// for the JS side

qAvatar *avatar_create(char *label) {
	if (traceCreation)
		printf(" 🚥 avatar_create()  label='%s' %p\n",
			label, label);
	return new qAvatar(label);
}

// cavity and space are both optional, pass null for none or just don't call this
void avatar_setCavitySpace(qAvatar *avatar, qCavity *cavity, qSpace *space) {
	avatar->cavity = cavity;
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

void avatar_dumpEachViewBuffer(qAvatar *avatar, int bufferMask, char *title) {
	avatar->dumpEachViewBuffer(bufferMask, title);
}

void avatar_dumpComplexViewBuffer(qAvatar *avatar, int bufIx, int nPoints, const char *title) {
	avatar->dumpComplexViewBuffer(bufIx, nPoints, title);
}

void avatar_dumpIndex(qAvatar *avatar, char *title) {
	avatar->dumpIndex(title);
}

// return the address of raw float array.  Simple enough to do by hand;
// not needed for C++. in JS, take this viewBuffer  and make a typed array out of it to
// access the elements
float *avatar_getViewBuffer(qAvatar *avatar, int bufferIx) {
	return avatar->viewBuffers[bufferIx].fArray;
}

// loading th3e view buffers is done in a drawing-dependent way,
// usually in JS or C++
