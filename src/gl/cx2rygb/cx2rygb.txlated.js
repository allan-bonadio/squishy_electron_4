
// cx2rygb.txlated.js -- generated from cx2rygb.glsl.js into js
// mostly for testing purposes.  do not edit!  instead edit cx2rygb.glsl.js & run unit tests
// this file written Thu Apr 17 2025 00:48:20 GMT-0700 (Pacific Daylight Time)

// TODO: use these someday?
//let traceQuarter = false;
//const  _  = (v) => v.toFixed(4);

// needed defs of vec2 (complex only) and vec3 (rgb only)
const vec2 = (x=0, y=0) => ({x, y});
const vec3 = (r=0, g=0, b=0) => ({r, g, b});



// take a complex and use the octogon alg to figure out the color
// complex is normalized?  ∑  r**2 + i**2 == 1 maybe
// webgl complex: x = real, y = imag; rgb = color components
function cx2rgb(psi) {
		let color = vec3(0., 0., 0.);

	// have to normallize it!!  this just calculates the color, not the mag
    // have to find a faster alg than this
    let factor = Math.sqrt(psi.x ** 2 + psi.y ** 2);
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
				color.b = -psi.y * 1.414214;
			}
			else {
				// magenta -45° to blue -90°
				color.r = psi.x * 1.414214;
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
				color.g = -psi.y * 1.414214;
			}
			else {
				// cyan -135° to green -180°
				color.b = -psi.y * 1.414214;
				color.g = 1;
			}
		}
    }
	return color;
}

export default cx2rgb;
