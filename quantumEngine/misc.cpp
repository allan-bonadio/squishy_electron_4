/*
** misc -- unclassified code for Squisy Electron
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

#include <ctime>
#include <string>
#include <string.h>
#include <stdexcept>

static bool traceExceptions = false;

// return elapsed real time since last page reload, in seconds, only for tracing
// seems like it's down to miliseconds or even a bit smaller
double getTimeDouble(void)
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return ts.tv_sec + ts.tv_nsec / 1e9;
}

/* ***************************************************************************************************** exceptions */

// there's TWO copies of this
// this is from https://emscripten.org/docs/porting/Debugging.html#handling-c-exceptions-from-javascript
// it's only called from genExports for JS to get a textual error message from C++
// nobody in C++ calls it
//std::string getCppExceptionMessage(intptr_t exceptionPtr) {
//	printf("calling std::string getCppExceptionMessage(%ld) in misc.cpp\n", exceptionPtr);
//
//	return std::string(reinterpret_cast<std::exception *>(exceptionPtr)->what());
//}

// there's TWO copies of this
// Given the mysterious number thrown when C++ barfs, get a real error message.  this is loosely from
// https://emscripten.org/docs/porting/Debugging.html#handling-c-exceptions-from-javascript
extern "C" const char * getCppExceptionMessage(intptr_t exceptionPtrInt) {
	printf("calling const char *getCppExceptionMessage(%ld) in jsSpace\n", exceptionPtrInt);

	// what() returns a C string; pass pointer back to JS as integer
	if (traceExceptions) printf("getCppExceptionMessage(%ld) \n", exceptionPtrInt);
	if (exceptionPtrInt & 3)
		return "bad exc ptr";
	if (traceExceptions) printf("getCppExceptionMessage = '%s'\n",
		 reinterpret_cast<std::exception *>(exceptionPtrInt)->what());
	return reinterpret_cast<std::exception *>(exceptionPtrInt)->what();
}
//extern "C" std::string getCppExceptionMessage(intptr_t exceptionPtrInt);

#define LAST_WHERE_LENTH 99
static char lastWhere[LAST_WHERE_LENTH+1];
static int howManyWheres = 0;

#ifdef qDEV_VERSION
// check to make sure real and imag are finite and nice; warn if not
void qCheck(qCx aCx, const char *where, int index) {
	// this is exactly the test I want: not NAN, not ∞
	if (isfinite(aCx.re) && isfinite(aCx.im))
		return;

	if (strncmp(lastWhere, where, LAST_WHERE_LENTH) == 0) {
		if (0 == howManyWheres++)
			printf("💥 same msg...\n");
	}
	else {
		howManyWheres = 0;
		if ( -999999999 == index) {
			// no array with index
			printf("💥 complex number became non-finite in %s: (%5.4g,%5.4g)\n",
				where, aCx.re, aCx.im);
		}
		else {
			// array with index
			printf("💥 complex wave member became non-finite in %s[%d]: (%5.4g,%5.4g)\n",
					where, index, aCx.re, aCx.im);
		}
		strncpy(lastWhere, where, LAST_WHERE_LENTH);
	}
}

void qCheckReset(void) {
	if (howManyWheres)
		printf("💥 %d unprinted complex wave errors\n", howManyWheres);
	*lastWhere = 0;
	howManyWheres = 0;
}

#endif

