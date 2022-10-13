/*
** qCx -- complex arithmetic for Squishy Electron
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

#include "../squish.h"


qCx qCx::operator/(qCx b) {
	double det = b.norm();
	return qCx(
		(re * b.re + im * b.im) / det,
		(im * b.re - re * b.im) / det
	);
}

// what is wrong with this?  this is handed in ÷ 10.
qCx qCx::operator/=(qCx b) {
	double det = b.norm();
	double t = (re * b.re + im * b.im) / det;
	im = (im * b.re - re * b.im) / det;
	re = t;
	return *this;
}

// these are also used in the CppUTest CHECK_EQUAL macro
bool qCx::operator==(const qCx b) {
	return fabs(re - b.re) + fabs(im - b.im) <= ERROR_RADIUS;
}

bool qCx::operator!=(const qCx b) {
	return fabs(re - b.re) + fabs(im - b.im) > ERROR_RADIUS;
}

// more work than it's worth - should use the norm instead
double qCx::abs() {
	return sqrt(norm());
}

// in real degrees!  -180 thru +180
double qCx::phase() {
	return atan2(im, re) * 180 / PI;
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

