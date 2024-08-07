/*
** misc -- unclassified code for Squisy Electron
** Copyright (C) 2022-2024 Tactile Interactive, all rights reserved
*/

#include <ctime>
#include <string>
#include <string.h>
#include <stdexcept>
#include <stdarg.h>

static bool traceExceptions = false;

// return elapsed real time since last page reload, in Milliseconds, just like JS
// seems like accuracy down to miliseconds or even a bit smaller
double getTimeDouble(void)
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return ts.tv_sec * 1000 + ts.tv_nsec / 1e6;
}

/* ****************** constants */

const double ℏ = 105.4571817;  // units of pfg nm^2 / ps
const double m_e = .91093837015;  // pico femto grams

const double ℏOver2m_e = ℏ / (2 * m_e);  // units nm^2 / ps
const double inverseℏ = 1 / ℏ;  // units ps / pfg nm^2

const double NaN = nan("squish");


/* *********************************************** speedyLogging */
// for extra-fast logging of timing for these threads.

// of course, tracing it will not be speeding
bool traceSpeedyLog = false;

#define MAX_BUF_LEN  16000
#define MAX_ONE_LOG_LEN  400
static char speedyBuf[MAX_BUF_LEN];
static int speedyCursor = 0;
//static double startTime = getTimeDouble();


void speedyLog(const char* format, ...) {
    va_list args;
    va_start(args, format);

	if (speedyCursor >= MAX_BUF_LEN - MAX_ONE_LOG_LEN)
		speedyFlush();

	struct tm nowPieces;
	time_t nowTime = time(NULL);
	localtime_r(&nowTime, &nowPieces);

 	// first the time, then the message
	speedyCursor += snprintf(speedyBuf+speedyCursor, 20, "🌪️ %02d:%02d:%02d ",
		nowPieces.tm_hour, nowPieces.tm_min, nowPieces.tm_sec);
	speedyCursor +=  vsnprintf(speedyBuf+speedyCursor, MAX_ONE_LOG_LEN, format, args);
	speedyBuf[speedyCursor] = 0;

    va_end(args);
	if (traceSpeedyLog)
		printf("🌪 🌪 🌪 speedyLog fmt='%s' speedyCursor=%d  log so far:\n‹%s›\n", format, speedyCursor, speedyBuf);
}

// finally, print it out
void speedyFlush(void) {
	if (traceSpeedyLog)
		printf("🌪 🌪 🌪 speedyFlush speedyCursor=%d \n", speedyCursor);
	if (speedyBuf[0])
		printf("%s", speedyBuf);
	speedyCursor = 0;
	speedyBuf[0] = 0;
}

/* *********************************************************************** exceptions */

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

#define LAST_WHERE_LENTH 99
static char lastWhere[LAST_WHERE_LENTH+1];
static int errorCount = 0;

#ifdef qDEV_VERSION
// check to make sure real and imag are finite and nice; warn if not
void qCheck(qCx aCx, const char *where, int index) {
	// this is exactly the test I want: not NAN, not ∞
	if (isfinite(aCx.re) && isfinite(aCx.im))
		return;

	if (strncmp(lastWhere, where, LAST_WHERE_LENTH) == 0) {
		if (0 == errorCount++)
			printf("💥 same msg...\n");
	}
	else {
		errorCount = 0;
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
	if (errorCount)
		printf("💥 %d unprinted complex wave errors\n", errorCount);
	*lastWhere = 0;
	errorCount = 0;
}

#endif

