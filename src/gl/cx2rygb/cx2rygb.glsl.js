/*
** cx2rygb -- GLSL code for mapping cx numbers to rainbow colors
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

// alternate - try octagon where i=yellow, -1=green, -i=blue and as usual red=1
// so think of the six points and add chartreuce and orange
// doing this cuz yellow band is too cramped when humans see

// glsl doesn't allow initializers that require calculation, so stick in actual digits
const sqrtHalf = Math.SQRT1_2.toFixed(6);  // 0.707...
const sqrtTwo = Math.SQRT2.toFixed(6);  // 1.4142...
//const sqrtHalf = Math.sqrt(1. / 2.);  // 0.707...
//const sqrtTwo = Math.sqrt(2.);  // 1.4142...

//const sqrtOneThird = Math.sqrt(1. / 3.);  // 0.57735..
//const sqrtThree = Math.sqrt(3.);  // 1.7320..

// ?? slopes zero to this number will be directly used as gun gradient
//const KINK = 0.5;
//const HALF = 0.5;
//
//const KINK_FACTOR = KINK / sqrtOneThird;

//?? slope and offset for the 30-60 part, as a linear function of ySlope-xSlope
//const MEZZO_FACTOR = (1. - KINK) * sqrtThree / 4;
//const MEZZO_OFFSET = (1. + KINK) / 2;

// line numbers should correspond!  Be careful how many lines this is!
//       '#line 17' labels the NEXT line as line 17
//export const cx2rgb = `
//#line 30
//float sqrtHalf = ${sqrtHalf};

// see below
//float KINK_FACTOR = ${KINK_FACTOR};
//
//// slope and offset for the 30-60 part, as a linear function of ySlope-xSlope
//float MEZZO_FACTOR = ${MEZZO_FACTOR};
//float MEZZO_OFFSET = ${MEZZO_OFFSET};

// in here, the 'gradient' is supposed to range 0...1 and 1-gradient is  1...0
// the slope is ±0 thru ±∞; cotan(angle), x/y, and is used just for qualitative decisions.
// No transcendental functions were used in this code; all piecewise linear approximations.
// divisions are at 30° intervals.

// calculate any complex with both positive x and y, from northeast corner ONLY
// return a 3-vector with gradient values for each color (which gets rearranged)
// this returns an rgb but red=gradient over top (1->.5), and green = gradient over sides (0->1)
//vec3 aQuarter(vec2 psi) {
//	// we'll figure out a more efficient way to do this in the future
//	float ySlope = psi.y / psi.x;  // ySlope is the one you learned in calculus
//	float xSlope = psi.x / psi.y;
//	vec3 col;
//	col.r = col.g = col.b = 0.;  // no swizzling cuz of JS version
//
//	// sqrt 3 and sqrt 1/3 are the slopes at 30 and 60 degrees
//	if (xSlope < sqrtOneThird) {
//		// the part between 60° and 90°, horizontal along the top, red starts to lower, green stays 1
//		col.r = .5 + xSlope * KINK_FACTOR;    // 1 at 60°, HALF at 90°,
//		col.g = 1.;
//		//traceQuarter('quarter6090 cx=', _(psi.x), _(psi.y), '  color=', _(col.r), _(col.g));
//	}
//	else if (ySlope < sqrtOneThird)  {
//		// bottom 0° to 30°, far right near 0°,  to KINK slope
//		col.r = 1.;
//		col.g = ySlope * KINK_FACTOR;    // zero at 0°, KINK at 30°
//		//traceQuarter('quarter0030 cx=', _(psi.x), _(psi.y), '  color=', _(col.r), _(col.g));
//	}
//	else {
//		// middle part between 30° and 60°
//		float mezzo = ySlope - xSlope;
//		col.r = 1.;
//		col.g = mezzo * MEZZO_FACTOR + MEZZO_OFFSET;  // 1/2? ... 1
//		//traceQuarter('quarter3060 cx=', _(psi.x), _(psi.y), '  color=', _(col.r), _(col.g));
//	}
//	return col;
//}

//// real numbers.  handle im = y=0 cases  that screw up division
//vec3 handleReal(vec2 cx) {
//    // red thru zero to yellow
//    if (0. == cx.x) {
//        return vec3(0., 0., 0.);  // black
//    }
//    else if (cx.x > 0.) {
//        // east
//        return vec3(1., 0., 0.);  // red = +1
//    }
//   return vec3(0., 1., 0.);  // green = -1
//}
//
//
//// imag numbers.  handle re = x = 0 cases  that screw up division
//vec3 handleImag(vec2 cx) {
//    // yellow thru zero to blue
//	if (cx.y > 0.) {
//        return vec3(1., 1., 0.);  // yellow = +i
//    }
//    else if (cx.y < 0.) {
//        return vec3(0., 0., 1.);  // blue = -i
//	}
//    return vec3(0., 0., 0.);  // black
//}
//`;




// what we're here for.  This is all GLSL.
// Convert a complex number to an rgb triplet using RYGB mapping.
export const cx2rgb = `
#line 110

// take a complex and use the octogon alg to figure out the color
// complex is normalized?  ∑  r**2 + i**2 == 1 maybe
// webgl complex: x = real, y = imag; rgb = color components
vec3 cx2rgb(vec2 psi) {
	vec3 color.rgb = 0;

	// have to normallize it!!  this just calculates the color, not the mag
		// have to find a faster alg than this
		float factor = sqrt(psi.x ** 2 + psi.y ** 2);
		if (0. == factor)
				return vec3(0., 0., 0.);
		psi.x /= factor;
		psi.y /= factor;

		// wait, I'm thinking that x and y should be -1...1 linearly and abs(x) + abs(y) = 1
		// make it so!

		// in all cases, we start from red and move around, up or down, to green

		// decision tree cases: >0, =0, <0.  Then y (im) is outer, x (re) is inner
	if (psi.y > 0) {
		// red 0°over to green +180°, and yellow 90° half way in between
		if (psi.x > 0) {
			// red 0° to yellow 90°, and orange 45° half way in between
			// c'mon, use the sqrt 2!
			color.r = 1;
			color.g = psi.y;
		}
		else if (0. == psi.x) {
				// yelllow
			color.r = 1;
			color.g = 1.;
		}
		else {
				// psi.x  negative
			// yellow 90°to green 180°, and chartreuce 135° half way in between
			// c'mon, use the sqrt 2!
			color.r = psi.y;
			color.g = 1;
		}
	}
	else if (0. == psi.y) {
				// red 0° OR green 180°
		if (psi.x > 0) {
			color.r = 1;
			color.g = 0.;
		}
		else {
			color.r = 0.;
			color.g = 1.;
		}
	}
	else {
			// psi.y < 0
		// red 0° under to green ±180°, with blue halfway in between.
		// here we go all the way to the corners, and the x and y are sqrtHalf there
		if (psi.x > 0) {
			// psi.x> 0 red 0° to blue -90° as x descends from 1 and y ascends from zero,
			// with magenta halfway in between
			if (psi.x > -psi.y) {
				// red 0° to magenta -45°
				color.r = 1;
				color.b = -psi.y * ${sqrtTwo};
			}
			else {
				// magenta -45° to blue -90°
				color.r = psi.x * ${sqrtTwo};
				color.b = 1;
			}
				}
				else if (0. == psi.x) {
						// straight down blue
						color.b = 1;
				}
				else {
						// psi x and y both negative, blue -90°  to green -180°
			if (-psi.x < -psi.y) {
				// blue -90° to cyan -135°
				color.b = 1;
				color.g = -psi.y * ${sqrtTwo};
			}
			else {
				// cyan -135° to green -180°
				color.b = -psi.y * ${sqrtTwo};
				color.g = 1;
			}
		}
		}
	return color;
}
`;

/*  scraps of code

		#############################################

//            if (0. == psi.x == 0.) {
//			else {
//				// magenta -45° to blue -90°
//				color.r = 1 - psi.x * ${sqrtTwo};
//				color.b = 1;
//			}
//			// green ±180° to blue -90°, with cyan halfway in between
//			color.g = 1 - psi.y;
//			color.b = psi.y;



		no not these
		else {
						// green ±180° under to red 0°, with blue halfway in between.
			if (psi.x > 0) {
				// blue -90° to red 0°, with magenta halfway in between
				if (psi.x > 0) {
					// blue -90° to red 0°, with magenta halfway in between
					color.g = 1 - psi.y;
					color.b = psi.y;
				}
				else {
					// blue -90° to red 0°, with magenta halfway in between
					color.r = 1 - psi.y;
					color.b = psi.y;
				}
			}
			else {
				// blue -90° to red 0°, with magenta halfway in between
				if (psi.x > 0) {
					// blue -90° to red 0°, with magenta halfway in between
					color.g = 1 - psi.y;
					color.b = psi.y;
				}
				else {
					// blue -90° to red 0°, with magenta halfway in between
					color.r = 1 - psi.y;
					color.b = psi.y;
				}
			}
			color.r = 1 - psi.y;
			color.b = psi.y;
		}
	}

`;
 */


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

export default cx2rgb;

