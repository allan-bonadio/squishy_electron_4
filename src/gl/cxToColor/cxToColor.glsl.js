/*
** cxToColorGlsl -- GLSL code for mapping cx numbers to rainbow colors
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

// line numbers should correspond!  Be careful how many lines this is!
const cxToColorGlsl = `
#line 9
float sqrtOneThird = sqrt(1. / 3.);  // 0.57735..
//float sqrtThreeOver2 = sqrt(3.) / 2.;  // .8660...

// convert a complex number into a color, whose hue is based on the
// complex phase of the number.  Piecewise linear.  Visualize a hexagon
// 1+0i is on the far right, 0°, and is Red.  x is real part, y is imaginary part
// 1/2 + √3/2i is Yellow at 60°; -1/2 + √3/2i is Green at 120°, and so on through the hues.
// All result colors are opaque, and are at 100% saturation, except for zero, which is black.
// Each gun is a float 0...1.  300° == -60° as you would expect.
vec3 cxToColor(vec2 psi) {
	if (psi.y == 0.) {
		// real numbers.  Get rid of y=0 cases  that screw up division by y.
		if (psi.x == 0.) {
			return vec3(0., 0., 0.);  // black
		}
		else {
			//console.log('     line 14, psi.x=', psi.x);
			if (psi.x > 0.) {
				return vec3(1., 0., 0.);  // red +1
			}
			else {
				return vec3(0., 1., 1.);  // cyan -1
			}
		}
	}

	// in here, the 'gradient' is supposed to range 0...1 or 1...0
	// the slope is ±0 thru ±∞; cotan(angle), x/y, and is used just for qualitative decisions.
	// No transcendental functions were used in this code; all linear approximations.
	// I think each of the diagonal sides sags in the middle but whatever
	float slope = psi.x / psi.y;
	//console.log('     line 23, slope=', slope.toFixed(4));
	if (slope > sqrtOneThird) {
		// magenta, red, yellow... 30° 210°
		if (psi.y > 0.) {
			//console.log('     30°   red ... yellow');
			float gradient = psi.y / psi.x * sqrtOneThird;
			//console.log('     line 48, gradient', gradient.toFixed(4));
			return vec3(1, gradient, 0.);  // red...yellow as gradient increases
		}
		else {
			//console.log('     210°, cyan to blue');
			float gradient = psi.y / psi.x * sqrtOneThird;
			//console.log('     line 54, gradient', gradient.toFixed(4));
			return vec3(0., 1.-gradient, 1.);  // red...magenta as gradient descends from zero
		}
	}

	if (slope < -sqrtOneThird) {
		// green, cyan, blue; psi.re < 0.  y will pass thru zero.
		if (psi.y > 0.) {
			//console.log('     150°  green ... cyan');
			float gradient = psi.y / psi.x * sqrtOneThird;
			//console.log('     line 32, gradient=', gradient.toFixed(4));
			return vec3(0., 1., 1.+gradient);  // cyan...green
		}
		else {
			//console.log('     330°, magenta... red');
			float gradient = psi.y / psi.x * sqrtOneThird;
			//console.log('     line 38, gradient=', gradient.toFixed(4));
			return vec3(1., 0., -gradient);
		}
	}

	// yellow to green (slope goes .57 .. -.57), or blue to magenta
	// x can be zero but we'll avoid dividing by it
	float gradient = (slope/sqrtOneThird + 1.) / 2.;  // 1...0
	//console.log('     line 45, gradient', gradient.toFixed(4));
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
export default cxToColorGlsl;
