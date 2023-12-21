/*
** complex to color testing -- all the widgets below the displayed canvas
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import {expect} from '@jest/globals';
import {cxToColor} from './cxToColor.txlated.js';

let traceConfirm = false;

/* ********************************** testing the translated glsl code*/

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

	expect(actual[0]).toBeCloseTo(expected[0], 4);
	expect(actual[1]).toBeCloseTo(expected[1], 4);
	expect(actual[2]).toBeCloseTo(expected[2], 4);
}



describe('cxToColor tests', () => {
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



});



// uncomment this to run test under node, then run like this:
// $ sed s/export.*$
// cxToColor.glsl.js | node
//if ( 'object' == typeof module)
//	testCxToColorGlsl();
// actually these days I'm doing it thru Jest

