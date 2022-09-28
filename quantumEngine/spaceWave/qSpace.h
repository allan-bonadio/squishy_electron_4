/*
** quantum space - C++ code for optimized ODE integration for Squishy Electron
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/


#include "../squish.h"

// do not exceed these!  they are open ended arrays.
// keep LABEL_LEN+1 a multiple of 4 or 8 for alignment.
// now defined in buildDev.sh, buildProd.sh or cppuRunner.sh
//#define LABEL_LEN  7
//#define LABEL_LEN  31

#define MAX_DIMENSIONS  2

extern class qSpace *theSpace;
//extern class qCx *peruWave, *laosWave;

//extern class qWave *peruQWave, *laosQWave;

extern double *thePotential;

extern qCx hamiltonian(qCx *wave, int x);
extern void qeStarted(void);

/* *************************************** one for each DIMENSION of the wave array */
struct qDimension {
public:
	// possible  states, just for this  dimension.  end + start == datapoints=nPoints
	// end - start == N.  always loop for (j=start; j < end; j++) for actual state 𝜓
	int N;
	int start;
	int end;

	// accumulated number of eigenstates, from this dim to the end
	// = product of Nv * Nv of next dimension or 1 if none
	int nStates;

	// accumulated number of complex values in wave, from this dim to the end.
	// includes boundaries.
	int nPoints;

	// contWELL or contENDLESS (has N+2 values for N possibilities)
	// contDISCRETE = (has N values for N possibilities)
	int continuum;

	// size for Fourier transforms, or zero if not yet calculated.  ON THIS DIMENSION ONLY!
	// Often a power of two.  no boundaries.
	void chooseSpectrumLength(void);
	int spectrumLength;

	// 'x', 'y' or 'z' - two particles will have x1, x2 but one in 2d will have x, y.
	// Spin: Sz, or Sz1, Sz2, ...  Smax = 2S+1.  Sz= ix - S.  Orbital Ang: Lz, combined: Jz
	// variable total angular mom: L combines Lz and Ltot so: state ix = 0...Lmax^2
	// Ltot = floor(sqrt(ix))   Lz = ix - L(L+1) and you have to choose a Lmax sorry
	// Also could have Energy dimensions...
	char label[LABEL_LEN+1];

};

// coerce your buffers into being one of these and you link them into a list
struct FreeBuffer {
	struct FreeBuffer *next;
};

/* ************************************************************ the space */

struct qSpace {
public:
	qSpace(const char *label);
	~qSpace(void);

	// additional for space creation
	void addDimension(int N, int continuum, const char *label);
	private:
		void tallyDimensions(void);
	public:
	void initSpace(void);

	int magic;

	char label[LABEL_LEN+1];

	// Dimensions are listed from outer to inner as with the resulting 𝜓 array:
	// 𝜓[outermost-dim][dim][dim][innermost-dim]
	// always a fixed size, for simplicity.
	qDimension dimensions[MAX_DIMENSIONS];

	// number of  dimensions actually used, always <= MAX_DIMENSIONS
	// do not confuse with nStates or nPoints
	int nDimensions;

	// totals for all dimensions.  These numbers dominate lots of areas in the code.
	int nStates;
	int nPoints;

	// should this be part of the space or the qAvatar?
	// the space; it helps to define the lay of the land
	double *potential;
	double potentialFactor;


	/* *********************************************** buffers */
	int spectrumLength;

	// some of these might go away as the buffers now have the essential numbers

	// will dump any wave that uses this space.  same as in qWave:: (obsolete)
	//void dumpThatWave(qCx *wave, bool withExtras = false);

	//void fixThoseBoundaries(qCx *targetWave);  // like for qWave but on any wave

	/* *********************************************** FreeBuffers */

	// the linked list of blocks available for rental.
	// All contain (freeBufferLength) complex number slots.
	FreeBuffer *freeBufferList;

	// number of qCx-s that'll be enough for both spectrums and waves
	// so waves that are cache-able have exactly this length.
	int freeBufferLength;

	// if you take one, return it.  If it isn't the right length,
	// returning might lead to it being used as if it was.
	qCx *borrowBuffer(void);
	void returnBuffer(qCx *abuffer);
	void clearFreeBuffers(void);  // delete them all

	/* *********************************************** potential */
	void dumpPotential(const char *title);
//	void setZeroPotential(void);
//	void setValleyPotential(double power, double scale, double offset);

};

/* ************************************************************ JS interface */

// this gets passed back to the JS after the space is created, so it can construct stuff
// just a one-off struct; JS will access it via Uint32Array
struct salientPointersType {
	qSpace *space;
	qCx *mainWaveBuffer;
	double *potentialBuffer;
	float *vBuffer;
	struct qAvatar *theAvatar;
	struct qAvatar *miniGraphAvatar;
};

// for JS to call
extern "C" {
	qSpace *startNewSpace(const char *name = "a space");
	void addSpaceDimension(int N, int continuum, const char *label);
	struct salientPointersType *completeNewSpace(void);
	void deleteTheSpace(void);
}

