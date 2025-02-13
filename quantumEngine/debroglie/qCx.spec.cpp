/*
** qCx test -- complex arithmetic unit tests for Squishy Electron
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

// this already has qCx defined in it
#include "../testing/cppuMain.h"

#include "CppUTest/TestHarness.h"


TEST_GROUP(qCx)
{
};

// actually, the expected is the first argument, actual is second
// but here, doesn't make much difference

TEST(qCx, ConstructorReals)
{
	CHECK_EQUAL(qCx(3), qCx(3, 0));
	CHECK_EQUAL(qCx(-35), qCx(-35, 0));
}

TEST(qCx, ConstructorComplex)
{
	CHECK_EQUAL(qCx(3, 4), qCx(3, 4));
	CHECK_EQUAL(qCx(3, -4), qCx(3, -4));
	CHECK_EQUAL(qCx(-3, -4), qCx(-3, -4));
	CHECK_EQUAL(qCx(-3, 4), qCx(-3, 4));
}

TEST(qCx, ConstructorZero)
{
	CHECK_EQUAL(qCx(0), qCx(0.));
	CHECK_EQUAL(qCx(0), qCx(0, 0));
	CHECK_EQUAL(qCx(0, 0), qCx(0));
	CHECK_EQUAL(qCx(0), qCx());
}

TEST(qCx, Addition)
{
	CHECK_EQUAL(qCx(3, 4) + qCx(2, 3), qCx(5, 7));

	qCx addend(5, 6);
	addend += qCx(12, 15);
	CHECK_EQUAL(addend, qCx(17, 21));
}

TEST(qCx, Subtraction)
{
	CHECK_EQUAL(qCx(3, 4) - qCx(2, 3), qCx(1, 1));

	qCx subtrahend(5, 6);
	subtrahend -= qCx(12, 15);
	CHECK_EQUAL(subtrahend, qCx(-7, -9));

	CHECK_EQUAL(-qCx(-17), qCx(17, 0));
	CHECK_EQUAL(-qCx(-3, 4), qCx(3, -4));
}

TEST(qCx, Multiplication)
{
	CHECK_EQUAL(qCx(3, 4) * qCx(2, 3), qCx(-6, 17));

	qCx factor(5, 6);
	factor *= qCx(12, 15);
	CHECK_EQUAL(factor, qCx(-30, 147));
}

TEST(qCx, Division)
{
	CHECK_EQUAL(qCx(0, 2) / qCx(1, 1), qCx(1, 1));
	CHECK_EQUAL(qCx(0, -2) / qCx(1, 1), qCx(-1, -1));
	CHECK_EQUAL(qCx(-2, 0) / qCx(-1, 1), qCx(1, 1));
	CHECK_EQUAL(qCx(2, 0) / qCx(1, -1), qCx(1, 1));

	CHECK_EQUAL(qCx(30, 40) / qCx(0, 10), qCx(4, -3));
	CHECK_EQUAL(qCx(30, 40) / -qCx(10), qCx(-3, -4));
}

TEST(qCx, AssignDivision)
{
	CHECK_EQUAL(qCx(0, 2) /= qCx(1, 1), qCx(1, 1));
	CHECK_EQUAL(qCx(0, -2) /= qCx(1, 1), qCx(-1, -1));
	CHECK_EQUAL(qCx(-2, 0) /= qCx(-1, 1), qCx(1, 1));
	CHECK_EQUAL(qCx(2, 0) /= qCx(1, -1), qCx(1, 1));

	qCx dividendA(0, 2);
	dividendA /= qCx(1, 1);
	CHECK_EQUAL(dividendA, qCx(1, 1));

	qCx dividendB(30, 40);
	dividendB /= qCx(0, 10);
	CHECK_EQUAL(dividendB, qCx(4, -3));
}

TEST(qCx, Horse)
{
	// i am completely mystified as to why these don't work.
	// seems like arthemetic inside the method is bananas
	qCx horse(30, 40);
	qCx plus2 = qCx(2);
	qCx halfHorse = (horse /= plus2);
	CHECK_EQUAL(horse, qCx(15, 20));
}

TEST(qCx, Whale)
{
	qCx whale(30, 40);
	qCx minus2 = -qCx(2);
	whale /= minus2;
	CHECK_EQUAL(whale, qCx(-15, -20));
}

TEST(qCx, Giraffe)
{
	qCx giraffe(30, 40);
	qCx minus10 = -qCx(10);
	giraffe /= minus10;
	CHECK_EQUAL(giraffe, qCx(-3, -4));
}

TEST(qCx, Norm)
{
	CHECK_EQUAL(qCx(12, 5).norm(), 169);
}

TEST(qCx, Abs)
{
	CHECK_EQUAL(qCx(12, 5).abs(), 13);

}

TEST(qCx, Phase)
{
	// i know testing for equality here is kindof stupid, but it passes
	CHECK_EQUAL(qCx(+1,+1).phase(), 45);
	CHECK_EQUAL(qCx(+1,-1).phase(), -45);
	CHECK_EQUAL(qCx(-1,-1).phase(), -135);
	CHECK_EQUAL(qCx(-1,+1).phase(), 135);
}

