/*
** abacus unit testing
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

#include "../hilbert/qSpace.h"
#include "../debroglie/qFlick.h"
#include "qGrinder.h"
#include "abacus.h"

#include "../testing/testingHelpers.h"
#include "../testing/cppuMain.h"

#include "CppUTest/TestHarness.h"

static qSpace *space;
static qGrinder *qgrinder;
static qFlick *qflick;

static abacus *aba;

/* *************************************************************************** creation and reset */

TEST_GROUP(abacus_creation)
{
	void setup()
	{
		space = makeFullSpace(8);
		qgrinder = space->qgrinder;
		qflick = qgrinder->qflick;
	}

	void teardown()
	{
		deleteFullSpace(space);
	}
};

TEST(abacus_creation, simple) {
	aba = new abacus(space, qgrinder, 3, 3);

	POINTERS_EQUAL(space, aba->space);
	POINTERS_EQUAL(qgrinder, aba->qgrinder);
	POINTERS_EQUAL(qflick, aba->qflick);
	POINTERS_EQUAL(qflick->waves, aba->waves);

	LONGS_EQUAL(3, aba->nThreads);
	LONGS_EQUAL(3, aba->nWaves);

	delete aba;
}

progress *prog0, *prog1, *prog2;

edge *edge00, *edge01, *edge02;
edge *edge10, *edge11, *edge12;
edge *edge20, *edge21, *edge22;


void setProgsEdges(void) {
	prog0 = &aba->progresses[0];
	prog1 = &aba->progresses[1];
	prog2 = &aba->progresses[2];

	edge00 = &aba->edges[0];
	edge01 = &aba->edges[1];
	edge02 = &aba->edges[2];

	edge10 = &aba->edges[3];
	edge11 = &aba->edges[4];
	edge12 = &aba->edges[5];

	edge20 = &aba->edges[6];
	edge21 = &aba->edges[7];
	edge22 = &aba->edges[8];
}

TEST(abacus_creation, progressFresh) {
	aba = new abacus(space, qgrinder, 3, 3);

		//aba->dumpProgress();

	setProgsEdges();
	POINTERS_EQUAL(aba, prog0->abac);
	POINTERS_EQUAL(aba, prog1->abac);
	POINTERS_EQUAL(aba, prog2->abac);

	LONGS_EQUAL(0, prog0->serial);
	LONGS_EQUAL(1, prog1->serial);
	LONGS_EQUAL(2, prog2->serial);

	delete aba;
}

TEST(abacus_creation, progressReset) {
	aba = new abacus(space, qgrinder, 3, 3);
	aba->reset();

	//printf("---------------------------- thread progresses after reset\n");
	//aba->dumpProgress();

	setProgsEdges();

	POINTERS_EQUAL(edge00, prog0->behind);
	POINTERS_EQUAL(edge01, prog0->ahead);

	POINTERS_EQUAL(edge01, prog1->behind);
	POINTERS_EQUAL(edge02, prog1->ahead);

	POINTERS_EQUAL(edge02, prog2->behind);
	POINTERS_EQUAL(edge00, prog2->ahead);


	delete aba;
}



TEST(abacus_creation, edgesFresh) {
	aba = new abacus(space, qgrinder, 3, 3);
	//printf("---------------------------- edges fresh\n");
	//aba->dumpEdges();

	setProgsEdges();

	POINTERS_EQUAL(aba, edge00->abac);
	POINTERS_EQUAL(aba, edge01->abac);
	POINTERS_EQUAL(aba, edge02->abac);

	POINTERS_EQUAL(aba, edge10->abac);
	POINTERS_EQUAL(aba, edge11->abac);
	POINTERS_EQUAL(aba, edge12->abac);

	POINTERS_EQUAL(aba, edge20->abac);
	POINTERS_EQUAL(aba, edge21->abac);
	POINTERS_EQUAL(aba, edge22->abac);

	LONGS_EQUAL(0, edge00->serial);
	LONGS_EQUAL(1, edge01->serial);
	LONGS_EQUAL(2, edge02->serial);

	LONGS_EQUAL(3, edge10->serial);
	LONGS_EQUAL(4, edge11->serial);
	LONGS_EQUAL(5, edge12->serial);

	LONGS_EQUAL(6, edge20->serial);
	LONGS_EQUAL(7, edge21->serial);
	LONGS_EQUAL(8, edge22->serial);

	delete aba;
}

TEST(abacus_creation, edgesReset) {
	aba = new abacus(space, qgrinder, 3, 3);

	aba->reset();

	//printf("---------------------------- edges after reset\n");
	//aba->dumpEdges();

	setProgsEdges();

	LONGS_EQUAL(0, edge00->boundary);
	LONGS_EQUAL(2, edge01->boundary);
	LONGS_EQUAL(5, edge02->boundary);

	LONGS_EQUAL(UNDECIDED, edge10->boundary);
	LONGS_EQUAL(UNDECIDED, edge11->boundary);
	LONGS_EQUAL(UNDECIDED, edge12->boundary);

	LONGS_EQUAL(UNDECIDED, edge20->boundary);
	LONGS_EQUAL(UNDECIDED, edge21->boundary);
	LONGS_EQUAL(UNDECIDED, edge22->boundary);


	// do the rest some other day when things have stabilized more
	//LONGS_EQUAL(0, edge00->serial);
	//LONGS_EQUAL(1, edge01->serial);
	//LONGS_EQUAL(2, edge02->serial);
	//
	//LONGS_EQUAL(3, edge10->serial);
	//LONGS_EQUAL(4, edge11->serial);
	//LONGS_EQUAL(5, edge12->serial);
	//
	//LONGS_EQUAL(6, edge20->serial);
	//LONGS_EQUAL(7, edge21->serial);
	//LONGS_EQUAL(8, edge22->serial);

	delete aba;
}



