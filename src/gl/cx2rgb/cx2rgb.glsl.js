/*
** cx2rgb -- GLSL code for mapping cx numbers to rainbow colors
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

// sorry for the voodoo arithmetic here
// glsl doesn't allow initializers that require calculation
const sqrtOneThird = Math.sqrt(1. / 3.);  // 0.57735..
const sqrtThree = Math.sqrt(3.);  // 1.7320..

// slopes zero to this number will be directly used as gun gradient
const KINK = 0.5;
const HALF = 0.5;

const KINK_FACTOR = KINK / sqrtOneThird;

// slope and offset for the 30-60 part, as a linear function of ySlope-xSlope
const MEZZO_FACTOR = (1. - KINK) * sqrtThree / 4;
const MEZZO_OFFSET = (1. + KINK) / 2;

// line numbers should correspond!  Be careful how many lines this is!
//       '#line 17' labels the NEXT line as line 17
export const cx2rgb = `
#line 25
float sqrtOneThird = ${sqrtOneThird};

// see below
float KINK_FACTOR = ${KINK_FACTOR};

// slope and offset for the 30-60 part, as a linear function of ySlope-xSlope
float MEZZO_FACTOR = ${MEZZO_FACTOR};
float MEZZO_OFFSET = ${MEZZO_OFFSET};

// in here, the 'gradient' is supposed to range 0...1 and 1-gradient is  1...0
// the slope is ±0 thru ±∞; cotan(angle), x/y, and is used just for qualitative decisions.
// No transcendental functions were used in this code; all piecewise linear approximations.
// divisions are at 30° intervals.

// calculate any complex with both positive x and y, from northeast corner
// return a 3-vector with gradient values for each color (which gets rearranged)
// this returns an rgb but red=gradient over top (1->.5), and green = gradient over sides (0->1)
vec3 aQuarter(vec2 psi) {
	// we'll figure out a more efficient way to do this in the future
	float ySlope = psi.y / psi.x;  // ySlope is the one you learned in calculus
	float xSlope = psi.x / psi.y;
	vec3 col;
	col.r = col.g = col.b = 0.;  // no swizzling cuz of JS version

	// sqrt 3 and sqrt 1/3 are the slopes at 30 and 60 degrees
	if (xSlope < sqrtOneThird) {
		// the part between 60° and 90°, horizontal along the top, red starts to lower, green stays 1
		col.r = .5 + xSlope * KINK_FACTOR;    // 1 at 60°, HALF at 90°,
		col.g = 1.;
		//traceQuarter('quarter6090 cx=', _(psi.x), _(psi.y), '  color=', _(col.r), _(col.g));
	}
	else if (ySlope < sqrtOneThird)  {
		// bottom 0° to 30°, far right near 0°,  to KINK slope
		col.r = 1.;
		col.g = ySlope * KINK_FACTOR;    // zero at 0°, KINK at 30°
		//traceQuarter('quarter0030 cx=', _(psi.x), _(psi.y), '  color=', _(col.r), _(col.g));
	}
	else {
		// middle part between 30° and 60°
		float mezzo = ySlope - xSlope;
		col.r = 1.;
		col.g = mezzo * MEZZO_FACTOR + MEZZO_OFFSET;  // 1/2? ... 1
		//traceQuarter('quarter3060 cx=', _(psi.x), _(psi.y), '  color=', _(col.r), _(col.g));
	}
	return col;
}

// real or imag numbers.  handle x=0 & y=0 cases  that screw up division
vec3 handleRealImag(vec2 cx) {
	if (0. == cx.y) {
		if (0. == cx.x) {
			return vec3(0., 0., 0.);  // black
		}
		else if (cx.x > 0.) {
			return vec3(1., 0., 0.);  // red = +1
		}
		else {
			return vec3(0., 1., 1.);  // cyan = -1
		}
	}
	else {
		if (cx.y > 0.) {
			return vec3(0.5, 1., 0.);  // chartreuse = +i
		}
		else {
			return vec3(.5, 0., 1.);  // purple = -i
		}
	}
}


// Take aQuarter() and reflect it for the 4 corners.
vec3 cx2rgb(vec2 cx) {
	vec3 color;
	vec3 scratch;
	vec2 temp;
	temp = cx;

	if (cx.x == 0. || cx.y == 0.) {
		color = handleRealImag(cx);
	}
	else if (cx.x > 0.) {
		// the real positive side
		if (cx.y > 0.) {
			// yellow quarter
			color = aQuarter(cx);
			//traceQuarter('cx2 yellow q, cx=', _(cx.x), _(cx.y), '  color=', _(col.r), _(col.g), _(col.b) );
		}
		else {
			// the magenta corner, blue does main gradient instead of  green
			temp.y = -temp.y;
			scratch = aQuarter(temp);
			color.r = scratch.r;
			color.g = 0.;
			color.b = scratch.g;
			//traceQuarter('qu magenta, cx=', _(cx.x), _(cx.y), '  color=', _(col.r), _(col.g), _(col.b) );
		}
	}
	else {
		// the real negative side
		if (cx.y > 0.) {
			// green corner, green constant 1, red stops and blue starts
			temp.x = -temp.x;
			scratch = aQuarter(temp);
			color.r = 1. - scratch.r;  // .5 to zero
			color.g = 1.;
			color.b = 1. - scratch.g;  // 1 -> 0
			//traceQuarter('qu green, cx=', _(cx.x), _(cx.y), '  color=', _(col.r), _(col.g), _(col.b) );
		}
		else {
			// blue corner
			temp.x = -temp.x;
			temp.y = -temp.y;
			scratch = aQuarter(temp);
			color.r = 1. - scratch.r;
			color.g = 1. - scratch.g;
			color.b = 1.;
			//traceQuarter('qu blue, cx=', _(cx.x), _(cx.y), '  color=', _(col.r), _(col.g), _(col.b) );
		}
	}

	return color;
}


// OLD
// convert a complex number into a color, whose hue is based on the
// complex phase of the number.  Piecewise linear.  Visualize a hexagon
// 1+0i is on the far right, 0°, and is Red.  x is real part, y is imaginary part
// 1/2 + √3/2i is Yellow at 60°; -1/2 + √3/2i is Green at 120°, and so on through the hues.
// All result colors are opaque, and are at 100% saturation, except for zero, which is black.
// Each gun is a float 0...1.  300° == -60° as you would expect.
vec3 OLDcxToColor(vec2 psi) {
	if (psi.y == 0.) {
		// real numbers.  Get rid of y=0 cases  that screw up division by y.
		if (psi.x == 0.) {
			return vec3(0., 0., 0.);  // black
		}
		else {
			//console.log('     line 26, psi.x=', psi.x);
			if (psi.x > 0.) {
				return vec3(1., 0., 0.);  // red = +1
			}
			else {
				return vec3(0., 1., 1.);  // cyan = -1
			}
		}
	}

	// I think each of the diagonal sides sags in the middle but whatever
	float slope = psi.x / psi.y;
	//console.log('     line 41, slope=', slope.toFixed(4));
	if (slope > sqrtOneThird) {
		// magenta, red, yellow... 30° 210°
		if (psi.y > 0.) {
			//console.log('     30°   red ... yellow');
			float gradient = psi.y / psi.x * sqrtOneThird;
			//console.log('     line 47, gradient', gradient.toFixed(4));
			return vec3(1, gradient, 0.);  // red...yellow as gradient increases
		}
		else {
			//console.log('     210°, cyan to blue');
			float gradient = psi.y / psi.x * sqrtOneThird;
			//console.log('     line 53, gradient', gradient.toFixed(4));
			return vec3(0., 1.-gradient, 1.);  // red...magenta as gradient descends from zero
		}
	}

	if (slope < -sqrtOneThird) {
		// green, cyan, blue; psi.re < 0.  y will pass thru zero.
		if (psi.y > 0.) {
			//console.log('     150°  green ... cyan');
			float gradient = psi.y / psi.x * sqrtOneThird;
			//console.log('     line 63, gradient=', gradient.toFixed(4));
			return vec3(0., 1., 1.+gradient);  // cyan...green
		}
		else {
			//console.log('     330°, magenta... red');
			float gradient = psi.y / psi.x * sqrtOneThird;
			//console.log('     line 69, gradient=', gradient.toFixed(4));
			return vec3(1., 0., -gradient);
		}
	}

	// yellow to green (slope goes .57 .. -.57), or blue to magenta
	// x can be zero but we'll avoid dividing by it
	float gradient = (slope/sqrtOneThird + 1.) / 2.;  // 1...0
	//console.log('     line 77, gradient', gradient.toFixed(4));
	if (psi.y > 0.) {
		//console.log('     90°, yellow ... green as angle increases');
		return vec3(gradient, 1., 0.);
	}
	else {
		//console.log('     270°, magenta ... blue as angle decreases');
		return vec3(1.-gradient, 0., 1.);
	}
}

`;


// actual glsl string exported so all webgl code can reuse it
// temp removed during testing
export default cx2rgb;

