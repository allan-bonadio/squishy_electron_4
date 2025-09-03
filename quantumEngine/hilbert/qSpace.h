/*
** quantum space - C++ code for optimized ODE integration for Squishy Electron
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

#ifndef __QSPACE_H__
#define __QSPACE_H__

// not even used these days
extern qCx hamiltonian(struct qSpace *space, qCx *wave, int ix);

// currently we support only one dimension.  But we're envisioning...
//
// contENDLESS: number of data nPoints: = N+2.  Two on the ends get reflected from elements 1 and N.
//     Numbered 0=left bound  1...N = data points   N+1 = right bound
// contWELL: number of data nPoints: = N+2.  Two on the ends are fixed at zero
//     cuz the potential is ∞ there.  BUT they are actually part of the wave, so the wave
//     has N+1 states, state 0 and N are degenerate and fixed at zero, so total wavelength N+1
//     Numbered 0=left zero  1...N = data points   N+1 = right zero
// contDISCRETE is for angular momentum and other situations

/* *************************************** one for each DIMENSION of the wave array */

// nStates are available 𝜓 datapoints, each representing a state.  Complex
// number, where 𝜓*𝜓 is probability of being in that state. nPoints is nStates
// or nStates+1, depending on continuum.


// for more than one dimension, the labels:
// 'x', 'y' or 'z' - two particles will have x1, x2 but one in 2d will have x, y.
// Spin: Sz, or Sz1, Sz2, ...  Smax = 2S+1.  Sz= ix - S.  Orbital Ang: Lz, combined: Jz
// variable total angular mom: L combines Lz and Ltot so: state ix = 0...Lmax^2
// Ltot = floor(sqrt(ix))   Lz = ix - L(L+1) and you have to choose a Lmax sorry
// Also could have Energy dimensions...

struct qDimension {
public:
	// possible  states, just for this  dimension.  end + start == datapoints=nPoints
	// end - start == N.  always loop for (j=start; j < end; j++) for actual state 𝜓
	int N;

	// contWELL or contENDLESS (has N+2 values for N states superimposed)
	// contDISCRETE = (has N values for N possibilities) not yet implemented, requires a hamiltonian
	int continuum;

	int start;
	int end;

	// accumulated number of eigenstates, from this dim to the end
	// = product of Nv * Nv of next dimension or 1 if none
	int nStates;

	// accumulated number of complex values in wave, from this dim to the end.
	// includes boundaries.
	int nPoints;

	// actual distance, in nanometers, of the whole dimension
	double dimLength;

	// nanometers separating data points.
	// Not used if this is a discrete coordinate.
	double DX;

	// multiply this onto the second derivative while integrating.  Depends on
	// dx so different for each dimension.
	double d2Coeff;

	// size for Fourier transforms, or zero if not yet calculated.  ON
	// THIS DIMENSION ONLY! Often a power of two.  no boundaries.  Not
	void chooseSpectrumLength(void);
	int spectrumLength;

	char label[MAX_LABEL_LEN+1];

	// called by qSpace::tallyDimensions() to count/sum/multiply up stuff
	void tally(qSpace *space);

	void dumpDimension(void);
};

/* ************************************************************ the space */

struct qSpace {
public:
	qSpace(const char *label);
	~qSpace(void);

	// additional for space creation
	void addDimension(int N, int continuum, double dimLength, const char *label);
	private:
		void tallyDimensions(void);
	public:
	void initSpace(void);

	int magic;

	// part of the space; it helps to define the lay of the land
	double *voltage;
	void dumpVoltage(const char *title);

	// Dimensions are listed from outer to inner as with the resulting 𝜓 array:
	// 𝜓[outermost-dim][dim][dim][innermost-dim]
	// always a fixed size, for simplicity.
	qDimension dimensions[MAX_DIMENSIONS];

	// alpha for convergence https://en.wikipedia.org/wiki/FTCS_scheme#Stability
	double alpha;

	// picoseconds per step (re, im, re, im cycle of steps recommended for convergence
	double dt;

	// number of  dimensions actually used, always <= MAX_DIMENSIONS
	// do not confuse with nStates or nPoints
	int nDimensions;

	// totals for all dimensions.  These numbers dominate lots of areas in the code.
	int nStates;  // active datapoinits
	int nPoints;  // allocated size
	int spectrumLength;  // should == nStates

	struct qAvatar *mainAvatar;
	struct qAvatar *miniGraphAvatar;
	struct qWave *miniGraphWave;
	struct qGrinder *grinder;

	char label[MAX_LABEL_LEN+1];

	void dumpSpace(void);

	void formatDirectOffsets(void);
};

/* ************************************************************ JS interface */

// for JS to call
extern "C" {
	// create
	qSpace *startNewSpace(const char *name = "a space");
	void addSpaceDimension(qSpace *space, int N, int continuum, double dimLength, const char *label);
	qSpace *completeNewSpace(qSpace *space, int nThreads);

	// destroy
	void deleteFullSpace(qSpace *space);
}

#endif
