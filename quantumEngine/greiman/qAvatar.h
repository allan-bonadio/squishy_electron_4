/*
** qAvatar -- the instance and simulation of a quantum mechanical wave in a space
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
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

// all of these arguments are optional, depending on which loader/breed.
// loader func knows how to allocate needed viewBuffers if not done alreadyu
//typedef  void (*avatarLoader)(struct qAvatar *) ;

#define MAX_VIEW_BUFFERS  4

// allocates out the viewBuffers needed for this drawing; whatever sizes, etc
// and does whatever initialization needed.  Note if the word Buffer is plural.
struct qAvatar {
	qAvatar(int avatarBreed, const char *label);
	~qAvatar(void);
	void formatDirectOffsets(void);

	// create another view buffer of floats.  useThisBuffer if you already
	// allocated the memory in C++ space.
	float *attachViewBuffer(int whichBuffer, float *useThisBuffer, int nCoordsPerVertex, int nVertices);

	short *attachIndexBuffer(short *useThisBuffer, int nItems);

	// print metadata
	void dumpMeta(const char *title);

	// print contents of viewBuffers
	void dumpViewBuffers(int whichBuffers, const char *title);
	void dumpIndex(const char *title);

	// populates the viewBuffers; depends on avatarBreed.  You can use your own
	// independent load function; it's not rocket science.
	// for WaveView, transcribes the complex double numbers (2x8 = 16by) in qwave
	void loadViewBuffers(int breed);

	// set this so it doesn't have to do it while running.  Pass either breed
	//integer (from js) or direct func pointer (from C++).  One or the other,
	//other one null.
	//do it by hand void setLoader(void (*loaderFunc)(qAvatar *avatar));

	// handy
	float *buf(int bufferIx){return viewBuffers[bufferIx].fArray; }

	/* *********************************************** data fields */

	int magic;

	// set to a loader fucntion in same directory
	int avatarBreed;  // which loader - kindof obsolete; each drawing has its own loader
	void (*loader)(qAvatar *);  // actual function pointer

	// args that many loaders need.  Optional but NOT set by the constructor or anything.
	struct qSpace *space;
	struct qWave *qwave;

	// different drawings might have numbers going in or out; drawing-specific
	int i0;
	int i1;
	double d0;
	double d1;

	// mostly for debugging
	char label[MAX_LABEL_LEN + 1];

	// the one and only index buffer.  Optional.  Each one points to vertices in
	// the view buffer(s) to describe the shape and colors
	short *indexBuffer;
	int nIndices;

	viewBufInfo viewBuffers[MAX_VIEW_BUFFERS];

};


/* *************************************************** loaders in nearby files */

extern void avFlatLoader(qAvatar *avatar, int bufIx, qWave *qwave, int nPoints);


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

void complexToRYGB(qCx *cx, qColor3 *color);

/* ************************************************************** C */

// for the JS side.  Note if the word Buffer is plural
extern "C" {
	qAvatar *avatar_create(int avatarBreed, char *label);

	// qwave and space are both optional, pass null for none or just don't call this
	void avatar_setWaveSpace(qAvatar *avatar, qWave *qwave, qSpace *space);

	// create one buffer in the set - obsolete!  TODO
	float *avatar_attachViewBuffer(qAvatar *avatar, int whichBuffer, float *useThisBuffer,
		int nCoordsPerVertex, int nVertices);
	short *avatar_attachIndexBuffer(qAvatar *avatar, short *useThisBuffer, int nItems);

	void avatar_dumpMeta(qAvatar *avatar, char *title);
	void avatar_dumpViewBuffers(qAvatar *avatar, int whichBuffers, char *title);
	void avatar_dumpIndex(qAvatar *avatar, char *title);

	// return one buffer, raw floats.  maybe we don't need this?  cuz JS wants the typed array.
	float *avatar_getViewBuffer(qAvatar *avatar, int bufferIx);

	// load up all the set's view viewBuffers based on the space's wave buffer (or whatever)
	// ?? returns the highest height of norm of wave entries.  Flat does.  Should.  Soon.
	void avatar_loadViewBuffers(qAvatar *avatar, int breed);

// this is obsolete right>?  cuz the constructor does it.
//	void avatar_setLoader(qAvatar *avatar, int loaderIx);
}

