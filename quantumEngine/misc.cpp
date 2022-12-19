/*
** misc -- unclassified code for Squisy Electron
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

#include <ctime>

// i think the exception thing needs this, not sure
#include <emscripten/bind.h>

#include "squish.h"


// return elapsed real time since last page reload, in seconds, only for tracing
// seems like it's down to miliseconds or even a bit smaller
double getTimeDouble(void)
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return ts.tv_sec + ts.tv_nsec / 1e9;
}


// this is from https://emscripten.org/docs/porting/Debugging.html#handling-c-exceptions-from-javascript
// it's only called from genExports for JS to get a textual error message from C++
// nobody in C++ calls it
std::string getCppExceptionMessage(intptr_t exceptionPtr) {
	return std::string(reinterpret_cast<std::exception *>(exceptionPtr)->what());
}


// obsolete
// check to make sure real and imag are finite and nice; warn if not
void qCheck(const char *where, qCx aCx) {
	// this is exactly the test I want: not NAN, not ∞
	if (isfinite(aCx.re) && isfinite(aCx.im))
		return;
	printf("🚨 🚨 complex number became non-finite in %s: (%lf,%lf)\n",
		where, aCx.re, aCx.im);
//	call_stack st;
//	printf(st.to_string());
}

