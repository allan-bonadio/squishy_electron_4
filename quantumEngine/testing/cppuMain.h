/*
** cppu main -- cppu testing helpers - all CPPUTest tests should include this file
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

// this allows CHECK_EQUAL() to do complex numbers
extern struct SimpleString StringFrom(const qCx value);


/* *************************************************** waves, buffers */

// make sure they're equal, both the waves and the nPoints, start and end
extern void compareWaves(struct qBuffer *expected, struct qBuffer *actual);


