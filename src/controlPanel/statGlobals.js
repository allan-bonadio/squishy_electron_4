/*
** Integration Statistics -- g nodes for display of integration stats
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

import React from 'react';

const statGlobals = {
	// one dom pointer for each stat, keyed by name
	span: {},

	/* ******************************************************** rendering */

	// render the row for the integration statistic
	statRow(label, name, units) {
		return <tr key={name + 'row'}>
			<td>{label}:</td>
			<td>
				<span  className={name}  ref={el => statGlobals.span[name] = el}>-</span> {units}
			</td>
		</tr>;
	},

	// render all the rows
	renderIStats() {
		return (
			<div className='iStats'>
				<h3 style={{textAlign: 'left'}}>Integration Statistics</h3>
				<table><tbody>
					{this.statRow('Divergence'         , 'reversePercent', '%')}
					{this.statRow('Frame Calc Time'    , 'frameCalcTime', 'ms')}
					{this.statRow('Draw'                  , 'drawTime', 'ms')}
					{this.statRow('Total For Frame'   , 'totalForIntegration', 'ms')}
					{this.statRow('Frame Period'      , 'framePeriod', 'ms')}
					{this.statRow('Frames Per Sec'   , 'framesPerSec', '/sec')}
				</tbody></table>
			</div>
		);
	},

	/* ********************************************** filling in values */

	/* given the fluctuation over time, try to smooth it out if it's near a
	round number smoothing is done by a weighted avg of this value and
	the last several (or more). You keep a running average.  Then, every
	cycle, say for the new display, you mix ¼ the new number and ¾ the
	running average.

	After many cycles, the latest number will be: ¼
	the new number + ³⁄₁₆=19% the previous number + ⁹⁄₆₄=14% of the
	penultimate number, and so on, fading as you go backwards.  sortof
	to infinity, but practically, actually a nice average of recent
	history.

	You can use a different mix, say half the new and half the running
	total, which will be ¼ the number before that, and then ⅛ the one
	past there...

	Much slower to change, you can have a more dilute mix, say 1% the
	new number and 99% the running average..  This way, the most
	influential previous values will stretch back about 100 cycles.
	*/

	// and remember this is called every frame so ¼ influence, repeated 10/sec, go quickly
	smoothNumber(value, el) {
		// but smooth according to how violently it's changing
		let smooth = value;  // if the previous wasn't there, start here
		if (el.iStatAvg) {
			// now it depends on the ratio between the old and the new
			let recent = el.iStatAvg;
			let bigger = value, smaller = recent;
			if (bigger < smaller) {
				let t = smaller;
				smaller = bigger;
				bigger = t;
			}
			let ratio = bigger / smaller;

			// this is a seat-of-the-pants way to judge.  Adjust the numbers as needed.
			// Always make sure the mixes total to 100%.
			if (ratio > 4)
				// things happening too fast, quick, catch up!
				smooth = value;
			else if (ratio > 1.5)
				smooth = (value + 3 * recent) / 4;
			else if (ratio > 1.01)
				// maybe it takes a sec to converge to new value
				smooth = (value + 15 * recent) / 16;
			else
				// slow moving, avg over several seconds
				smooth = (value + 255 * recent) / 256;
		}
		el.iStatAvg = smooth;
		return smooth;
	},

	show(cName, value, nDigits = 1) {
		const el = this.span[cName];
		//const el = document.querySelector(`#${p.id}.SquishPanel .ControlPanel .SetIntegrationTab .${cName}`);
		if (el) {
			// hard to see if it's jumping around a lot, so average over many frames
			let smoothVal = this.smoothNumber(value, el);


			el.innerHTML = el.iStatAvg.toFixed(nDigits);
		}
	},

};

/*
<tr><td>(.+):(\s*)</td><td><span  className='(\w+)'>-</span> (.+)</td></tr>


{this.statRow('$1' $2, '$3', '$4')}

			<tr><td>:  </td><td><span  className=''>-</span>/sec</td></tr>
*/

export default statGlobals;



