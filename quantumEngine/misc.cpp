/*
** misc -- unclassified code for Squisy Electron
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

#include <ctime>
#include <string>
#include <stdexcept>

// return elapsed real time since last page reload, in seconds, only for tracing
// seems like it's down to miliseconds or even a bit smaller
double getTimeDouble(void)
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return ts.tv_sec + ts.tv_nsec / 1e9;
}

// there's TWO copies of this: jsSpace.cpp and misc.cpp .
// this is from https://emscripten.org/docs/porting/Debugging.html#handling-c-exceptions-from-javascript
// it's only called from genExports for JS to get a textual error message from C++
// nobody in C++ calls it
std::string getCppExceptionMessage(intptr_t exceptionPtr) {
	printf("calling std::string getCppExceptionMessage(%ld) in misc.cpp\n", exceptionPtr);

	return std::string(reinterpret_cast<std::exception *>(exceptionPtr)->what());
}

#ifdef qDEV_VERSION
// check to make sure real and imag are finite and nice; warn if not
void qCheck(qCx aCx, const char *where, int index) {
	// this is exactly the test I want: not NAN, not ∞
	if (isfinite(aCx.re) && isfinite(aCx.im))
		return;

	if ( -999999999 == index) {
		printf("💥 complex number became non-finite in %s: (%lf,%lf)\n",
			where, aCx.re, aCx.im);
	}
	else {
		printf("💥 complex wave member became non-finite in %s[%d]: (%lf,%lf)\n",
				where, index, aCx.re, aCx.im);
	}
}
#endif

