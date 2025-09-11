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

	// wait, I'm thinking that x and y should be -1...1 linearly and abs(x) + abs(y) = 1
	// ?? TODO

	// in all cases, we start the hues from red and move around, yellow, up,
	//  to green on the left, then red down to blue and to green



// what we're here for.  This is all GLSL.
// Convert a complex number to an rgb triplet using RYGB mapping.
export const cx2rygb = `
#line 114

// take a complex  num and use the octogon alg to figure out the color
// complex is normalized?  ∑  r**2 + i**2 == 1 maybe
// webgl complex: x = real, y = imag; rgb = color components
vec3 cx2rygb(vec2 psi) {
	vec3 color;
	color.rgb = vec3(0.);

	//return vec3(psi, 0);

	// have to normallize it!!  this just calculates the color, not the mag
	// have to find a faster alg than this
	float factor = sqrt(psi.x * psi.x + psi.y * psi.y);
	if (0. == factor)
		return vec3(0., 0., 0.);
	psi.x /= factor;
	psi.y /= factor;

	// decision tree cases: >0, =0, <0.  Then y (im) is outer, x (re) is inner
	if (psi.y > 0.) {
		// red 0°over to green +180°, and yellow 90° half way in between, straight up
		// it's all different cuz yellow in the middle is NOT a primary color.
		if (psi.x > 0.) {
			// red 0° to yellow 90°, and orange 45° half way in between
			// c'mon, use the sqrt 2!
			color.r = 1.;
			color.g = psi.y;
		}
		else if (0. == psi.x) {
				// yelllow
			color.r = 1.;
			color.g = 1.;
		}
		else {
			// psi.x  negative
			// yellow 90° to green 180°, and chartreuce 135° half way in between
			// c'mon, use the sqrt 2!
			color.r = psi.y;
			color.g = 1.;
		}
	}
	else if (0. == psi.y) {
		// red 0° OR green 180°
		if (psi.x > 0.) {
			color.r = 1.;
			color.g = 0.;
		}
		else {
			color.r = 0.;
			color.g = 1.;
		}
	}
	else {
		// psi.y < 0.
		// red 0° under to green ±180°, with blue halfway in between.
		// it's all different cuz blue in the middle is a primary color.
		// here we go all the way to the corners, and the x and y are sqrtHalf there
		if (psi.x > 0.) {
			// psi.x > 0 red 0° to blue -90° as x descends from 1 and y descends
			// down from zero, with magenta halfway in between
			if (psi.x > -psi.y) {
				// red 0° to magenta -45°
				color.r = 1.;
				color.b = -psi.y * ${sqrtTwo};
			}
			else {
				// magenta -45° to blue -90°
				color.r = psi.x * ${sqrtTwo};
				color.b = 1.;
			}
		}
		else if (0. == psi.x) {
				// straight down blue
				color.b = 1.;
		}
		else {
			// psi x and y both negative, blue -90°  to green -180°
			if (-psi.x < -psi.y) {
				// blue -90° to cyan -135°
				color.b = 1.;
				color.g = -psi.x * ${sqrtTwo};
			}
			else {
				// cyan -135° to green -180°
				color.b = -psi.y * ${sqrtTwo};
				color.g = 1.;
			}
		}
	}


	//return vec3(0., 0., 0.);
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

export default cx2rygb;

