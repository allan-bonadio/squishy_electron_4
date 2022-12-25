// cxToColor.txlated.js -- generated from cxToColor.glsl.js into js
// mostly for testing purposes.  do not edit!
// this file written Sat Nov 26 2022 14:25:54 GMT-0800 (Pacific Standard Time)
let trace = false;



let  sqrtOneThird = Math.sqrt(1. / 3.);  // 0.57735..
//let  sqrtThreeOver2 = Math.sqrt(3.) / 2.;  // .8660...

// convert a complex number let o a color, whose hue is based on the
// complex phase of the number.  Piecewise linear.  Visualize a hexagon
// 1+0i is on the far right, 0°, and is Red.  x is real part, y is imaginary part
// 1/2 + √3/2i is Yellow at 60°; -1/2 + √3/2i is Green at 120°, and so on through the hues.
// All result colors are opaque, and are at 100% saturation, except for zero, which is black.
// Each gun is a let  0...1.  300° == -60° as you would expect.
export function cxToColor(psi)  {
	if (psi[1] == 0.) {
		// real numbers.  Get rid of y=0 cases  that screw up division by y.
		if (psi[0] == 0.) {
			return [0., 0., 0.];  // black
		}
		else {
			if (trace) console.log('     line 14, psi[0]=', psi[0]);
			if (psi[0] > 0.) {
				return [1., 0., 0.];  // red +1
			}
			else {
				return [0., 1., 1.];  // cyan -1
			}
		}
	}

	// in here, the 'gradient' is supposed to range 0...1 or 1...0
	// the slope is ±0 thru ±∞; cotan(angle), x/y, and is used just for qualitative decisions.
	// No transcendental functions were used in this code; all linear approximations.
	// I think each of the diagonal sides sags in the middle but whatever
	let  slope = psi[0] / psi[1];
	if (trace) console.log('     line 23, slope=', slope.toFixed(4));
	if (slope > sqrtOneThird) {
		// magenta, red, yellow... 30° 210°
		if (psi[1] > 0.) {
			if (trace) console.log('     30°   red ... yellow');
			let  gradient = psi[1] / psi[0] * sqrtOneThird;
			if (trace) console.log('     line 48, gradient', gradient.toFixed(4));
			return [1, gradient, 0.];  // red...yellow as gradient increases
		}
		else {
			if (trace) console.log('     210°, cyan to blue');
			let  gradient = psi[1] / psi[0] * sqrtOneThird;
			if (trace) console.log('     line 54, gradient', gradient.toFixed(4));
			return [0., 1.-gradient, 1.];  // red...magenta as gradient descends from zero
		}
	}

	if (slope < -sqrtOneThird) {
		// green, cyan, blue; psi.re < 0.  y will pass thru zero.
		if (psi[1] > 0.) {
			if (trace) console.log('     150°  green ... cyan');
			let  gradient = psi[1] / psi[0] * sqrtOneThird;
			if (trace) console.log('     line 32, gradient=', gradient.toFixed(4));
			return [0., 1., 1.+gradient];  // cyan...green
		}
		else {
			if (trace) console.log('     330°, magenta... red');
			let  gradient = psi[1] / psi[0] * sqrtOneThird;
			if (trace) console.log('     line 38, gradient=', gradient.toFixed(4));
			return [1., 0., -gradient];
		}
	}

	// yellow to green (slope goes .57 .. -.57), or blue to magenta
	// x can be zero but we'll avoid dividing by it
	let  gradient = (slope/sqrtOneThird + 1.) / 2.;  // 1...0
	if (trace) console.log('     line 45, gradient', gradient.toFixed(4));
	if (psi[1] > 0.) {
		if (trace) console.log('     90°, yellow ... green as angle increases');
		return [gradient, 1., 0.];
	}
	else {
		if (trace) console.log('     270°, magenta ... blue as angle decreases');
		return [1.-gradient, 0., 1.];
	}
}

export default cxToColor;


