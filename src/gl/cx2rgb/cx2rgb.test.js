/*
** complex to color testing -- all the widgets below the displayed canvas
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

import {expect} from '@jest/globals';
import {cx2rgb} from './cx2rgb.txlated.js';

let traceConfirm = false;

// THis is a Jest testfile.  Do 'npm test' and it'll run along with the rest.

/* ********************************** testing the translated glsl code*/

// given a complex number cx, |cx| == 1, passed in as just the complex angle
// in degrees, run it through cx2rgb() and compare the rgb-vector it returns
// with the expected return
function testOne(angle, expected) {
	let cx = {x: Math.cos(angle * Math.PI / 180), y: Math.sin(angle * Math.PI / 180)};

	const actual = cx2rgb(cx);
	if (traceConfirm) console.log(`cx2rgb: ${angle}°`+
		` = [${cx.x.toFixed(4)},${cx.y.toFixed(4)}]`+
		` => (${actual.r.toFixed(6)}, ${actual.g.toFixed(6)}, ${actual.b.toFixed(6)})`);

	expect(actual.r).toBeCloseTo(expected[0], 4);
	expect(actual.g).toBeCloseTo(expected[1], 4);
	expect(actual.b).toBeCloseTo(expected[2], 4);
}


describe('cx2rgb tests', () => {
	// run some tests ... go around the circle, testing all crucial points
	test(`Red 1 0 0 == +1`, () => {
		testOne(0, [1, 0, 0]);
	});
	test(`Red >>  Yellow`, () => {
		testOne(1, [1, .015117, 0]);
	});
	test(`Red > Yellow`, () => {
		testOne(29, [1, 0.4800457, 0]);
	});
	test(`Red + Yellow`, () => {
		testOne(30, [1, .5, 0]);
	});
	test(`Red < Yellow`, () => {
		testOne(31, [1, .5197630, 0]);
	});
	test(`Red << Yellow`, () => {
		testOne(59, [1, .9802369, 0]);
	});
	////	console.log();

	test(`Yellow 1 1 0`, () => {
		testOne(60, [1, 1, 0]);
	});
	test(`Yellow >> Green`, () => {
		testOne(61, [.9800457, 1, 0]);
	});
	test(`Yellow > Green == i`, () => {
		testOne(89, [0.5151165296525431, 1, 0]);
	});
	test(`Yellow + Green == i`, () => {
		testOne(90, [.5, 1, 0]);
	});
	test(`Yellow < Green == i`, () => {
		testOne(91, [0.4848834703474568, 1, 0]);
	});
	test(`Yellow << Green`, () => {
		testOne(119, [0.019954279894246696, 1, 0]);
	});
	////	console.log();

	test(`Green 0 1 0`, () => {
		testOne(120, [0, 1, 0]);
	});
	test(`Green >> Cyan`, () => {
		testOne(121, [0, 1, 0.019763062374686724]);
	});
	test(`Green > Cyan`, () => {
		testOne(149, [0, 1, 0.48023693762531305]);
	});
	test(`Green + Cyan`, () => {
		testOne(150, [0, 1, .5]);
	});
	test(`Green < Cyan`, () => {
		testOne(151, [0, 1, 0.5199542798942465]);
	});
	test(`Green << Cyan`, () => {
		testOne(179, [0, 1, 0.9848834703474568]);
	});
	////	console.log();

	test(`Cyan 0 1 1 == -1`, () => {
		testOne(180, [0, 1, 1]);
	});
	test(`Cyan >> Blue`, () => {
		testOne(181, [0, 0.984883470347457, 1]);
	});
	test(`Cyan > Blue`, () => {
		testOne(209, [0, 0.5199542798942467, 1]);
	});
	test(`Cyan + Blue`, () => {
		testOne(210, [0, .5, 1]);
	});
	test(`Cyan < Blue`, () => {
		testOne(211, [0, 0.4802369376253134, 1]);
	});
	test(`Cyan << Blue`, () => {
		testOne(239, [0, 0.019763062374687168, 1]);
	});


	////	console.log();

	test(`Blue 0 0 1`, () => {
		testOne(240, [0, 0, 1]);
	});
	test(`Blue >> Magenta`, () => {
		testOne(241, [0.0200, 0, 1]);
	});
	test(`Blue > Magenta = -i`, () => {
		testOne(269, [0.4848834703474568, 0, 1]);
	});
	test(`Blue + Magenta = -i`, () => {
		testOne(270, [.5, 0, 1]);
	});
	test(`Blue < Magenta = -i`, () => {
		testOne(271, [0.5151165296525428, 0, 1]);
	});
	test(`Blue << Magenta`, () => {
		testOne(299, [0.9800, 0, 1]);
	});
	////	console.log();

	test(`Magenta 1 0 1`, () => {
		testOne(300, [1, 0, 1]);
	});
	test(`Magenta >> Red`, () => {
		testOne(301, [1, 0, 0.9802369376253134]);
	});
	test(`Magenta > Red`, () => {
		testOne(329, [1, 0, 0.5197630623746872]);
	});
	test(`Magenta + Red`, () => {
		testOne(330, [1, 0, .5]);
	});
	test(`Magenta < Red`, () => {
		testOne(331, [1, 0, 0.4800457201057533]);
	});
	test(`Magenta << Red`, () => {
		testOne(359, [1, 0, .015117]);
	});
	////	console.log();

	test(`Red 1 0 0`, () => {
		testOne(360, [1, 0, 0]);
	});



});


//}

// uncomment this to run test under node, then run like this:
// $ sed s/export.*$
// cx2rgb.glsl.js | node
//if ( 'object' == typeof module)
//	testCxToColorGlsl();
