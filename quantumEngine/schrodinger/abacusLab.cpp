/*
** Abacus Lab -- experimental harness to test Abacus algorithm
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

#include "../hilbert/qSpace.h"
#include "../debroglie/qFlick.h"
#include "qGrinder.h"
#include "abacus.h"

#include "../testing/testingHelpers.h"



double proxyTime = 1;

doAReal(double *aReal) {
	*aReal = proxyTime++;
}


/* ********************************************************************************* one frame? */

abacus *aba;

static void stepOnSeg(progress *prog) {
//	int gap = prog->behind->border - prog->behind->border;
//	int gapMasked &= gap & aba->statesMask;
//	if (gap < 4) {
//		// short - just do them all
//	}
//	else {
//		// do the behind, do the ahead
//	}
}



static void doOneFrameMaybe(void) {
	proxyTime = 1


}


/* ********************************************************************************* main level */
#define nWAVES  3
#define nTHREADS  3

int main(int argc, char **argv) {
	space = makeFullSpace(8);
	qgrinder = space->qgrinder;
	qflick = qgrinder->qflick;

	//printf("argc=%d argv0=%s\n", argc, argv[0]);
	//printf("argv: 1=%p 2=%p 3=%p 4=%p\n", argv[1], argv[2], argv[3], argv[4]);
	//for (int i = 0; i < argc; i++) {
	//	printf("arg %d is %s\n", i, argv[i]);
	//}

	aba = new abacus(space, qgrinder, nWAVES, nTHREADS);

	//printf("---------------------------- edges fresh\n");
	//aba->dumpEdges();
	//printf("---------------------------- thread progresses fresh\n");
	//aba->dumpProgress();

	aba->reset();

	//printf("---------------------------- edges after reset\n");
	//aba->dumpEdges();
	//printf("---------------------------- thread progresses after reset\n");
	//aba->dumpProgress();







	delete aba;
	deleteFullSpace(space);
}

