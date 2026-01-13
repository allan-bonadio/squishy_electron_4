/*
** qAvatar -- the instance and simulation of a quantum mechanical wave in a space
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

// formerly called: Manifestation, Incarnation, Timeline, ... formerly part of qSpace
// formerly View Buffer or VIew Buffer Set

// manages GL attribute buffers.  Not completely Squish-dependent;
// no waves or voltage.  That gets handed in the load function.
// sometimes, 2 fArrays, each float.  position: 2 or 3 floats.  color: 3 or 4 floats.
// Details specific to the drawing and loader.
// each is optional and don't need to be poses or colors

// August Ferdinand Möbius invented homogenous coordinates


// one descriptor for a buffer: array of floats, representing vertices of coordinates
// total floats = nVertices * nCoords
struct viewBufInfo {
	float *fArray;
	int nVertices;
	int nCoords;

	viewBufInfo(void);
};

#define MAX_VIEW_BUFFERS  4

// allocates out the viewBuffers needed for this drawing; whatever sizes, etc
// and does whatever initialization needed.  Note if the word Buffer is plural.
struct qAvatar {
	qAvatar(const char *label);
	~qAvatar(void);
	void formatDirectOffsets(void);

	// create another view buffer of floats.  useThisBuffer if you already
	// allocated the memory in C++ space.  note nVertices, not nPoints
	float *attachViewBuffer(int whichBuffer, float *useThisBuffer, int nCoordsPerVertex, int nVertices);

	short *attachIndexBuffer(short *useThisBuffer, int nItems);

	// print metadata
	void dumpMeta(const char *title);

	// print contents of viewBuffer 0 as complex with angle etc for flatDrawing
	void dumpEachViewBuffer(int bufferMask, const char *title);
	void dumpComplexViewBuffer(int bufIx, int nPoints, const char *title);

	void dumpIndex(const char *title);

	/* *********************************************** data fields */

	int magic;

	// args that many loaders need.  Optional but NOT set by the constructor or anything.
	struct qSpace *space;
	struct qCavity *cavity;

	// different drawings might have numbers going in or out; drawing-specific
	int int0;
	int int1;
	double double0;
	double double1;

	// mostly for debugging
	char label[MAX_LABEL_LEN + 1];

	// the one and only index buffer.  Optional.  Each one points to vertices in
	// the view buffer(s) to describe the shape and colors
	short *indexBuffer;
	int nIndices;

	// each of the buffers, ready to be handed to webGL
	viewBufInfo viewBuffers[MAX_VIEW_BUFFERS];

};


/* *************************************************** loaders in nearby files */

extern void avFlatLoader(qAvatar *avatar, int bufIx, qCavity *cavity, int nPoints);


/* *************************************************** vector types for vb generation */
// note all of these are with floats, not doubles.  Not sure i'll use these...

class qPos2 {
public:
	float x;
	float y;

	qPos2(float xx, float yy) {x = xx; y = yy;}
	qPos2(void) {x = y = 0;}
};

class qPos3 {
public:
	float x;
	float y;
	float z;

	qPos3(float xx, float yy, float zz) {x = xx; y = yy; z = zz;}
	qPos3(void) {x = y = z = 0;}
};

class qColor3 {
public:
	float red, green, blue;

	qColor3(float rr, float gg, float bb) {red = rr; green = gg; blue = bb;}
	qColor3(void) {red = green = blue = 0;}
};

/* ************************************************************** C */

// for the JS side.  Note if the word Buffer is plural
extern "C" {
	qAvatar *avatar_create(char *label);

	// qcavity and space are both optional, pass null for none or just don't call this
	void avatar_setCavitySpace(qAvatar *avatar, qCavity *cavity, qSpace *space);

	// create one buffer in the set
	float *avatar_attachViewBuffer(qAvatar *avatar, int whichBuffer, float *useThisBuffer,
		int nCoordsPerVertex, int nVertices);
	short *avatar_attachIndexBuffer(qAvatar *avatar, short *useThisBuffer, int nItems);

	void avatar_dumpMeta(qAvatar *avatar, char *title);
	void avatar_dumpEachViewBuffer(qAvatar *avatar, int bufferMask, char *title);
	void avatar_dumpComplexViewBuffer(qAvatar *avatar, int bufIx, int nPoints, const char *title);
	void avatar_dumpIndex(qAvatar *avatar, char *title);

	// return one buffer, raw floats.  maybe we don't need this?  cuz JS wants the typed array.
	float *avatar_getViewBuffer(qAvatar *avatar, int bufferIx);
}

