/*
** complex to color testing -- all the widgets below the displayed canvas
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

import {expect} from '@jest/globals';
import {cx2rygb} from './cx2rygb.txlated.js';

let traceConfirm = true;

// THis is a Jest testfile.  Do 'npm test' and it'll run along with the rest.

/* ********************************** testing the translated glsl code*/

// given a complex number cx, |cx| == 1, passed in as just the complex angle
// in degrees, run it through cx2rygb() and compare the rygb-vector it returns
// with the expected return
function testOne(angle, expected) {
	let cx = {x: Math.cos(angle * Math.PI / 180), y: Math.sin(angle * Math.PI / 180)};

	const actual = cx2rygb(cx);
	if (traceConfirm) console.info(`cx2rygb: ${angle}°`+
		` = [${cx.x.toFixed(4)},${cx.y.toFixed(4)}]`+
		` => (${actual.r.toFixed(6)}, ${actual.g.toFixed(6)}, ${actual.b.toFixed(6)})`);

	expect(actual.r).toBeCloseTo(expected[0], 4);
	expect(actual.g).toBeCloseTo(expected[1], 4);
	expect(actual.b).toBeCloseTo(expected[2], 4);
}

describe('cx2rygb tests', () => {
	// run some tests ... go around the circle, testing all crucial points

  // near RED
	test(`Red 1 0 0 == +1`, () => {
		testOne(0, [1, 0, 0]);
	});
	test(`Red >>  Yellow`, () => {
		testOne(1, [1, .015117, 0]);
	});

  // near ORANGE
	test(`Red > Yellow`, () => {
		testOne(44, [1, 0.4800457, 0]);
	});
	test(`Red + Yellow`, () => {
		testOne(45, [1, .5, 0]);
	});
	test(`Red < Yellow`, () => {
		testOne(46, [1, .5197630, 0]);
	});

  // near YELLOW
	test(`Red << Yellow`, () => {
		testOne(89, [1, .9802369, 0]);
	});
	test(`Yellow 1 1 0`, () => {
		testOne(90, [1, 1, 0]);
	});
	test(`Yellow >> Green`, () => {
		testOne(91, [.9800457, 1, 0]);
	});

  // near CHARTREUCE
	test(`Yellow > Green == i`, () => {
		testOne(134, [0.5151165296525431, 1, 0]);
	});
	test(`Yellow + Green == i`, () => {
		testOne(135, [.5, 1, 0]);
	});
	test(`Yellow < Green == i`, () => {
		testOne(136, [0.4848834703474568, 1, 0]);
	});

//	test(`Yellow << Green`, () => {
//		testOne(179, [0.019954279894246696, 1, 0]);
//	});
//	test(`Green 0 1 0`, () => {
//		testOne(180, [0, 1, 0]);
//	});
//	test(`Green >> Cyan`, () => {
//		testOne(181, [0, 1, 0.019763062374686724]);
//	});
//
//	test(`Green > Cyan`, () => {
//		testOne(224, [0, 1, 0.48023693762531305]);
//	});
//	test(`Green + Cyan`, () => {
//		testOne(225, [0, 1, .5]);
//	});
//	test(`Green < Cyan`, () => {
//		testOne(226, [0, 1, 0.5199542798942465]);
//	});
//
//	test(`Green << Cyan`, () => {
//		testOne(269, [0, 1, 0.9848834703474568]);
//	});
//	test(`Cyan 0 1 1 == -1`, () => {
//		testOne(270, [0, 1, 1]);
//	});
//	test(`Cyan >> Blue`, () => {
//		testOne(271, [0, 0.984883470347457, 1]);
//	});
//
//	test(`Cyan > Blue`, () => {
//		testOne(314, [0, 0.5199542798942467, 1]);
//	});
//	test(`Cyan + Blue`, () => {
//		testOne(315, [0, .5, 1]);
//	});
//	test(`Cyan < Blue`, () => {
//		testOne(316, [0, 0.4802369376253134, 1]);
//	});

  // near GREEN
	test(`Cyan << Blue`, () => {
		testOne(179, [0, 0.019763062374687168, 1]);
	});
	test(`Blue 0 0 1`, () => {
		testOne(180, [0, 0, 1]);
	});
	test(`Blue >> Magenta`, () => {
		testOne(181, [0.0200, 0, 1]);
	});

// near CYAN
	test(`Blue > Magenta = -i`, () => {
		testOne(224, [0.4848834703474568, 0, 1]);
	});
	test(`Blue + Magenta = -i`, () => {
		testOne(225, [.5, 0, 1]);
	});
	test(`Blue < Magenta = -i`, () => {
		testOne(226, [0.5151165296525428, 0, 1]);
	});

// near BLUE
	test(`Blue << Magenta`, () => {
		testOne(269, [0.9800, 0, 1]);
	});
	test(`Magenta 1 0 1`, () => {
		testOne(270, [1, 0, 1]);
	});
	test(`Magenta >> Red`, () => {
		testOne(271, [1, 0, 0.9802369376253134]);
	});

// near MAGENTA
	test(`Magenta > Red`, () => {
		testOne(314, [1, 0, 0.5197630623746872]);
	});
	test(`Magenta + Red`, () => {
		testOne(315, [1, 0, .5]);
	});
	test(`Magenta < Red`, () => {
		testOne(316, [1, 0, 0.4800457201057533]);
	});

// near RED
	test(`Magenta << Red`, () => {
		testOne(359, [1, 0, .015117]);
	});
	test(`Red 1 0 0`, () => {
		testOne(360, [1, 0, 0]);
	});



});


//}

// uncomment this to run test under node, then run like this:
// $ sed s/export.*$
// cx2rygb.glsl.js | node
//if ( 'object' == typeof module)
//	testCxToColorGlsl();
