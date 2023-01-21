/*
** quantum space - C++ code for optimized ODE integration for Squishy Electron
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

extern class qSpace *theSpace;
extern double *theVoltage;

extern qCx hamiltonian(qCx *wave, int x);
//extern void qeStarted(void);

/* *************************************** one for each DIMENSION of the wave array */
struct qDimension {
public:
	// possible  states, just for this  dimension.  end + start == datapoints=nPoints
	// end - start == N.  always loop for (j=start; j < end; j++) for actual state 𝜓
	int N;

	// contWELL or contENDLESS (has N+2 values for N possibilities)
	// contDISCRETE = (has N values for N possibilities)
	int continuum;

	int start;
	int end;

	// accumulated number of eigenstates, from this dim to the end
	// = product of Nv * Nv of next dimension or 1 if none
	int nStates;

	// accumulated number of complex values in wave, from this dim to the end.
	// includes boundaries.
	int nPoints;

	// nanometers separating data points
	double dx;

	// size for Fourier transforms, or zero if not yet calculated.  ON THIS DIMENSION ONLY!
	// Often a power of two.  no boundaries.
	void chooseSpectrumLength(void);
	int spectrumLength;

	// 'x', 'y' or 'z' - two particles will have x1, x2 but one in 2d will have x, y.
	// Spin: Sz, or Sz1, Sz2, ...  Smax = 2S+1.  Sz= ix - S.  Orbital Ang: Lz, combined: Jz
	// variable total angular mom: L combines Lz and Ltot so: state ix = 0...Lmax^2
	// Ltot = floor(sqrt(ix))   Lz = ix - L(L+1) and you have to choose a Lmax sorry
	// Also could have Energy dimensions...
	char label[MAX_LABEL_LEN+1];

};

/* ************************************************************ the space */

// MAX_LABEL_LEN and MAX_DIMENSIONS defined in whichever build script

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

	// part of the space; it helps to define the lay of the land
	double *voltage;
	double voltageFactor;  // tweak this
	void dumpVoltage(const char *title);

	// Dimensions are listed from outer to inner as with the resulting 𝜓 array:
	// 𝜓[outermost-dim][dim][dim][innermost-dim]
	// always a fixed size, for simplicity.
	qDimension dimensions[MAX_DIMENSIONS];

	// number of  dimensions actually used, always <= MAX_DIMENSIONS
	// do not confuse with nStates or nPoints
	int nDimensions;

	// totals for all dimensions.  These numbers dominate lots of areas in the code.
	int nStates;  // active datapoinits
	int nPoints;  // allocated size
	int spectrumLength;  // should == nStates

	struct qAvatar *mainAvatar;
	struct qAvatar *miniGraphAvatar;
	struct qGrinder *grinder;

	char label[MAX_LABEL_LEN+1];

	void formatDirectOffsets(void);
};

/* ************************************************************ JS interface */

//this gets passed back to the JS after the space is created, so it can
//construct stuff just a one-off struct; JS will access it via Uint32Array Note:
//the wave buffer fields should be eliminated cuz JS can get to them from the
//eAvatar
//struct salientPointersType {
//	qSpace *space;
//	double *voltageBuffer;
//
//	float *mainVBuffer;  // raw float[4][2] array
//	struct qAvatar *mainAvatar;
//
//	float *miniGraphVBuffer;
//	struct qAvatar *miniGraphAvatar;
//
//	struct qGrinder *grinder;
//};

// for JS to call
extern "C" {
	// create
	qSpace *startNewSpace(const char *name = "a space");
	void addSpaceDimension(int N, int continuum, double dx, const char *label);
	qSpace *completeNewSpace(void);

	// destroy
	void deleteTheSpace(qSpace *space);
}

