/*
** cx2rygb -- GLSL code for mapping cx numbers to rainbow colors
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

// alternate - try octagon where i=yellow, -1=green, -i=blue and ads udsual red=1
// so think of the six points and add chartreuce and orange
// doing this cuz yellow band is too crampped

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


// take a complex and use the octogon alg to figure out the color
// complex is normalized; r**2 + i**2 == 1
vec3 cx2rygb(vec2 cx) {
	vec3 color.rgba = 0;
	vec3 scratch;

	// have to normallize it!!
	vec2 temp;
	temp = cx;


	if (cx.x > 0) {
		// red 0° to green ±180°, and yellow 90° half way in between
		if (cx.y > 0) {
			// red 0° to yellow 90°, and orange 45° half way in between
			color.r = 1;
			color.g = cx.y;
		}
		else {
			// yellow 90°to green 180°, and chartreuce 135° half way in between
			color.r = cx.y;
			color.g = 1;
		}
	}
	else {
		// green ±180° to red 0°, with blue halfway in between
		if (cx.y > 0) {
			// green ±180° to blue -90°, with cyan halfway in between
			color.g = 1 - cx.y;
			color.b = cx.y;
		}
		else {
			// blue -90° to red 0°, with magenta halfway in between
			color.r = 1 - cx.y;
			color.b = cx.y;
		}
	}

	return color;
}

`;


/*
the octagon:
√ =  √.5

                yellow 1,1,0
     chartreuce √,1,0    orange 1,√,0
green 0,1,0                     red 1,0,0
      cyan 0,1,1            magenta 1,0,1
                blue 0,0,1
*/

// actual glsl string exported so all webgl code can reuse it
// temp removed during testing
export default cx2rgb;

