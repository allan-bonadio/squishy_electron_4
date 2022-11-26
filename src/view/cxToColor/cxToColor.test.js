

import {expect} from '@jest/globals';
import {cxToColor} from './cxToColor.txlated.js';

let traceConfirm = false;

test('adds 1 + 2 to equal 3', () => {
  expect(1 + 2).toBe(3);
});

test('the best flavor is grapefruit', () => {
  expect('grapefruit').toBe('grapefruit');
});



/* ************************************************* testing the translated glsl code*/

// given this angle (in degrees), transform it to a complex number
// then run it through cxToColor() and return the rgb-vector it returns
function testOne(angle, expected) {
	let cx = [
		Math.cos(angle * Math.PI / 180),
		Math.sin(angle * Math.PI / 180),
	];
	const actual = cxToColor(cx);
	if (traceConfirm) console.log(`CxToColor: ${angle}°`+
		` = [${cx[0]},${cx[1]}]`+
		` => (${actual[0]}, ${actual[1]}, ${actual[2]})`);
//	if (notClose(actual.r, expected.r)
//			|| notClose(actual.g, expected.g)
//			|| notClose(actual.b, expected.b)) {
//		console.error(`**** error in '${label}': `+
//			`(${actual.r},${actual.g},${actual.b}) ≠ `+
//			`(${expected.r},${expected.g},${expected.b})`)
//	}

	expect(actual[0]).toBeCloseTo(expected[0], 4);
	expect(actual[1]).toBeCloseTo(expected[1], 4);
	expect(actual[2]).toBeCloseTo(expected[2], 4);
}






//
// const vec3 = function vec3(r, b, g) { return {r, b, g} }
//
// // you can test this in Node; just uncomment the bottom section and run it alone.
//
// // testing in JS/node.  so hokey.  This substitutes a few things to turn GLSL  into JS
// function testCxToColorGlsl() {
// 	// we use homogenous 2d coords so we can do infinity (?)
// 	let jsCxToColor;
// 	const notClose = (a, b) => (Math.abs(a-b) > 5e-5);  // remember this is single floats
//
// 	console.log(`                input         =  [re,im]      =>     (red, green, blue)\n`)
//
// 	// test just one angle
// 	function test1cx(angle, expected, label) {
// 		let cx = {
// 			x: Math.cos(angle * Math.PI / 180),
// 			y: Math.sin(angle * Math.PI / 180),
// 		}
// 		const actual = jsCxToColor(cx);
// 		console.log(`CxToColor: ${angle}° ${label})`+
// 			` = [${cx.x.toFixed(4)},${cx.y.toFixed(4)}]`+
// 			` => (${actual.r.toFixed(4)}, ${actual.g.toFixed(4)}, ${actual.b.toFixed(4)})`);
// 		if (notClose(actual.r, expected.r)
// 				|| notClose(actual.g, expected.g)
// 				|| notClose(actual.b, expected.b)) {
// 			console.error(`**** error in '${label}': `+
// 				`(${actual.r},${actual.g},${actual.b}) ≠ `+
// 				`(${expected.r},${expected.g},${expected.b})`)
// 		}
// 		//console.log();
// 	}
//
// 	// convert the code to JS, brutally
// 	let jsCode = cxToColorGlsl.replace(/.*cxToColor.*$/m, '{');
// 	//	console.log(`=========== jsCode 1 ======\n${jsCode}\n=====\n`);
//
// 	jsCode = jsCode.replace(/float/g, 'let');
// 	//	console.log(`=========== jsCode float =====\n${jsCode}\n======\n`);
//
// 	jsCode = jsCode.replace(/sqrt\(/g, 'Math.sqrt(');
// 	//	console.log(`=========== jsCode Math.sqrt =====\n${jsCode}\n======\n`);
//
// 	jsCxToColor = new Function('psi', jsCode);
//



	// run some tests ... go around the circle, testing all crucial points
	test(`Red 1 0 0 == +1`, () => {
		testOne(0, [1, 0, 0]);
	});
	test(`Red > Yellow`, () => {
		testOne(1, [1, 0.0101, 0]);
	});
test(`Red + Yellow`, () => {
	testOne(30, [1, 0.3333, 0]);
});
test(`Red < Yellow`, () => {
	testOne(59, [1, 0.9609, 0]);
});
////	console.log();

test(`Yellow 1 1 0`, () => {
	testOne(60, [1, 1, 0]);
});
test(`Yellow > Green`, () => {
	testOne(61, [0.9800, 1, 0]);
});
test(`Yellow + Green == i`, () => {
	testOne(90, [.5, 1, 0]);
});
test(`Yellow < Green`, () => {
	testOne(119, [0.0200, 1, 0]);
});
////	console.log();

test(`Green 0 1 0`, () => {
	testOne(120, [0, 1, 0]);
});
test(`Green > Cyan`, () => {
	testOne(121, [0, 1, 0.0391]);
});
test(`Green + Cyan`, () => {
	testOne(150, [0, 1, 0.6667]);
});
test(`Green < Cyan`, () => {
	testOne(179, [0, 1, 0.9899]);
});
////	console.log();

test(`Cyan 0 1 1 == -1`, () => {
	testOne(180, [0, 1, 1]);
});
test(`Cyan > Blue`, () => {
	testOne(181, [0, 0.9899, 1]);
});
test(`Cyan + Blue`, () => {
	testOne(210, [0, 0.6667, 1]);
});
test(`Cyan < Blue`, () => {
	testOne(239, [0, 0.0391, 1]);
});


////	console.log();

test(`Blue 0 0 1`, () => {
	testOne(240, [0, 0, 1]);
});
test(`Blue > Magenta`, () => {
	testOne(241, [0.0200, 0, 1]);
});
test(`Blue + Magenta = -i`, () => {
	testOne(270, [.5, 0, 1]);
});
test(`Blue < Magenta`, () => {
	testOne(299, [0.9800, 0, 1]);
});
////	console.log();

test(`Magenta 1 0 1`, () => {
	testOne(300, [1, 0, 1]);
});
test(`Magenta > Red`, () => {
	testOne(301, [1, 0, 0.9609]);
});
test(`Magenta + Red`, () => {
	testOne(330, [1, 0, 0.3333]);
});
test(`Magenta < Red`, () => {
	testOne(359, [1, 0, 0.0101]);
});
////	console.log();

test(`Red 1 0 0`, () => {
	testOne(360, [1, 0, 0]);
});


//}

// uncomment this to run test under node, then run like this:
// $ sed s/export.*$// cxToColor.glsl.js | node
if ( 'object' == typeof module)
	testCxToColorGlsl();
