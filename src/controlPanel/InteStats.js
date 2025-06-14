/*
** Integration Statistics -- component for display of integration stats
** Copyright (C) 2024-2025 Tactile Interactive, all rights reserved
*/

import SquishContext from '../sPanel/SquishContext.js';
import {useContext, useRef} from 'react';

// holds all statistics shown on the Integration tab
// One per space and SquishPanel.  No props but uses context.
function InteStats(props) {
	const context = useContext(SquishContext);
	const statsInfoRef = useRef();
	let info = statsInfoRef.current;

	// creates a stat object for one statistic.  everything but the actual number
	function addStat(label, name, unit, getterFunc, help) {
		let stat = {label, name, unit, help};
		info.statsMap[name] = stat;
		info.statsList.push(stat);
	}

	// create the info object once
	if (!statsInfoRef.current) {
		 info = statsInfoRef.current = {
			statsMap: {},  // each, by name
			statsList: [],  // each, by serial
		}


		// the stats.  This is also the order they're displayed in.
		addStat('Divergence'         , 'divergence', '%',
				"How close the integration is to exploding");
		addStat('Frame Calc Time'    , 'frameCalcTime', 'ms',
				"How much CPU time it took to calculate a frame");
		addStat('Draw Time'                  , 'totalDrawTime', 'ms',
				"How much time it took to draw wave on screen");
		//addStat('Total For Frame'   , 'totalForFrame', 'ms');
//		addStat('Frame Period'      , 'chosenFP', 'ms');
//		addStat('Frames Per Sec'   , 'framesPerSec', '/sec');
		addStat('rAF Period'   , 'rAFPeriod', 'ms',
				"How long a frame takes on your screen");
	}

	/* ********************************************************* display numbers */

	/* given the fluctuation over time, try to smooth it out if it's near a
	round number. smoothing is done by a weighted avg of this value and
	the last several (or more). You keep a running average.  Then, every
	cycle, say for the new display, you mix ¼ the new number and ¾ the
	running average.

	After many cycles, the latest number will be: ¼
	the new number + ³⁄₁₆ ≅ 19% the previous number + ⁹⁄₆₄ ≅ 14% of the
	penultimate number, and so on, fading as you go backwards.  sortof
	to infinity, but practically, a nice average of recent
	history.

	You can use a different ratio, say half the new and half the running
	total, which will be ¼ the number before that, and then ⅛ the one
	past there...

	Much slower to change, you can have a more dilute mix, say 1% the
	new number and 99% the running average..  This way, the most
	influential previous values will stretch back about 100 cycles.
	*/

	// given new value, assimilate it into the running avg, attached on the node itself
	// and remember this is called every frame so ¼ influence, repeated 10/sec, go quickly
	function smoothNumber(stat, value) {
		// but smooth according to how violently it's changing
		let smooth = value;  // if the previous wasn't there, start here
		if (stat.statAvg) {
			// now it depends on the ratio between the old and the new
			let recent = stat.statAvg;
			let bigger = value, smaller = recent;
			if (bigger < smaller) {
				let t = smaller;
				smaller = bigger;
				bigger = t;
			}
			let ratio = bigger / smaller;

			// this is a seat-of-the-pants way to adjust the numbers at an appropriate speed.
			// Always make sure the mixes total to 100%.  must be a simpler way...
			if (ratio > 4)
				// things happening too fast, quick, catch up!  100%
				smooth = value;
			else if (ratio > 1.5)
				// going quickly, use 1/4
				smooth = (value + 3 * recent) / 4;
			else if (ratio > 1.01)
				// maybe it takes a sec to converge to new value
				smooth = (value + 15 * recent) / 16;
			else
				// slow moving, avg over several seconds
				smooth = (value + 255 * recent) / 256;
		}
		stat.statAvg = smooth;
	}

	// stick text into existing <span to display number, smoothed.
	// value is raw latest measured value.  mangleFunction() cuz divergence is special
	function display(stat, value, nDigits = 1, mangleFunction) {
		if (stat.el) {
			smoothNumber(stat, value);
			if (stat.statAvg != undefined && !isNaN(stat.statAvg)) {
				stat.el.innerHTML = stat.statAvg.toFixed(nDigits);
				if (mangleFunction)
					mangleFunction(value, stat.el);
			}
		}
	}

	// stick correct values into the html for the InteStats
	// inteTimes is key-value obj of raw numbers collected by sAnimator
	// grinder is eGrinder instance doing integration and its numbers
	const displayAllStats = (inteTimes, grinder) => {
		// the map of stat management objects, by name
		const sm = info.statsMap;

		// some of these aren't here when we need them.  Grinder numbers come from c++
		if (grinder) {
			display(sm.divergence, grinder.divergence, 0, (value, element) => {
				let dv = grinder.divergence;
				if (dv <= 50 ) {
					// color will go black -> dark red -> full red
					let red = dv / 50 * 255
					element.style.color = `rgb(${red}, 0, 0)`;
					element.style.fontSize = '1em';
					element.style.textShadow = 'initial';
				}
				else {
					// color will go red -> orange -> yellow, also size 1em -> 2em
					let green = (dv - 50) / 50 * 240;
					element.style.color = `rgb(255, ${green}, 0)`;
					element.style.fontSize = (dv / 50) + 'em';
					element.style.textShadow = '0 0 3px #0008';
				}
			});

			display(sm.frameCalcTime, grinder.maxCalcTime );
		}


		// these are mostly from sAnimator
		if (inteTimes) {
			display(sm.totalDrawTime, inteTimes.totalDrawTime);
			display(sm.rAFPeriod, inteTimes.rAFPeriod);
		}
	}

	// it will be called once an anaimation frame to update stats
	const grinder = context.waveView.space.grinder;
	grinder.displayAllStats = displayAllStats;

	/* ********************************************************* render table */

	// render the row for this integration statistic (1 num), collecting nodes for the spans.
	// values inserted right now are dummies to be replaced - real numbers inserted in display()
	function renderStat(stat) {
		// this'll run when the dom nodes are in place.  eventually.
		const init = el => {
			if (!el)
				return;
			stat.el = el;
			stat.statAvg = 1e-10;  // like zero but you can divide by it
		}

		// value - will be filled in by raw DOM setting each frame
		return <tr key={stat.name + '-row'} title={stat.help} >
			<td>{stat.label}:</td>
			<td>
				<span  className={stat.name}  ref={init}>-</span> {stat.units}
			</td>
			<td>{stat.unit}</td>
		</tr>;
	}

	// render all the rows - with dummy values.  Just creates the nodes and elements, not numbers.
	// display() will actually stick the text into the elements.
	return (
		<div className='iStats'>
			<h3 style={{textAlign: 'left'}}>Integration Statistics</h3>
			<table><tbody>
				{info.statsList.map(stat => renderStat(stat))}
			</tbody></table>
		</div>
	);
}

export default InteStats;



