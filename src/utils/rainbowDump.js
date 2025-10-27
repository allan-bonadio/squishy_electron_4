/*
** rainbow dump -- colored bargraph in JS console
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/

// not sure about this file; originally used just for testing
import cx2rygb from '../gl/cx2rygb/cx2rygb.txlated.js';

let traceColors = true;

// Dump a wave buffer as a colored bargraph in the JS console
// this is also called by C++ so it's easier as a standalone function
// see also eWave method by same name (but different args)
export function rainbowDump(wave, start, end, nPoints, title) {
	let start2 = 2 * start;
	let end2 = 2 * end;
	if (isNaN(start2) || isNaN(end2))
		debugger;

	// maybe doesn't work when called from c++?
	console.log(`%c rainbowDump  🌊 |  ${title} `,
		`color: #222; background-color: #fff; font: 14px Palatino;`);

	// autorange
	let maxi = 0;
	for (let ix2 = start2; ix2 < end2; ix2 += 2)
		maxi = Math.max(maxi, wave[ix2] ** 2 + wave[ix2 + 1] ** 2);
	let correction = 1000 / maxi;  // intended max width in console

	for (let ix2 = start2; ix2 < end2; ix2 += 2) {
		let mag = (wave[ix2] ** 2 + wave[ix2 + 1] ** 2) * correction;

		let color = cx2rygb({x: wave[ix2],y:  wave[ix2 + 1]});
		color = `rgb(${color[0]*255}, ${color[1]*255}, ${color[2]*255})`;
		let style = `background-color: ${color}; padding-right: ${mag+5}px; `;
		console.log(`%c `, style);
		if (traceColors)
			console.log(`color: ${color}, style=${style}`);
	}
}
window.rainbowDump = rainbowDump;  // so c++ can get to it

export default rainbowDump;
