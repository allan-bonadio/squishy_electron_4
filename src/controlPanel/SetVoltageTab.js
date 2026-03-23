/*
** Set Voltage tab -- user can set the voltage to something interesting
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

import {useState, useRef, useReducer, useEffect} from 'react';
import PropTypes from 'prop-types';
import * as d3 from "d3";

import voltDisplay from '../volts/voltDisplay.js';
import {EFFECTIVE_VOLTS, TOO_MANY_VOLTS} from '../volts/voltConstants.js';
import {getAGroup, storeAGroup, storeASetting} from '../utils/storeSettings.js';
import sSettings from '../utils/sSettings.js';
import {eSpaceCreatedPromise} from '../engine/eEngine.js';
import LogSlider from '../widgets/LogSlider.js';

// miniGraph: always fixed size.    TODO: also in setWaveTab
let MINI_WIDTH = 300;
let MINI_HEIGHT = 150;


/* ******************************************************* the tab itself */

const propTypes = {
	voltageParams: PropTypes.shape({
		canyonPower: PropTypes.number.isRequired,  // there's more but not now
		blockWidth: PropTypes.number.isRequired}),
	setVoltageParams: PropTypes.func.isRequired,

	// showVoltage is a separate Setting (not param) for showing/hiding voltage over canvas
	showVoltage: PropTypes.string.isRequired,
	changeShowVoltage: PropTypes.func.isRequired,

	// the SetVoltage button
	saveMainVoltage:  PropTypes.func.isRequired,

	space: PropTypes.object,
};


// the tab that user sets voltage buffer with
function SetVoltageTab(p) {
	cfpt(propTypes, p);
	// these are all the local versions, for use and setting in this Voltage Tab
	const {voltageParams, setVoltageParams, showVoltage, changeShowVoltage,
		saveMainVoltage, space} = p;
	const vP = voltageParams;
	const setVP = setVoltageParams;

	const yAxisRef = useRef(null);
	let pathRef= useRef(null);


	// we'll hang on to these so I don't have to reallocate the buffer or voltDisplay all the time
	let mgVarsRef = useRef(null);
	let mgVars = mgVarsRef.current;
	if (!mgVars) {

		// only the first time this is run
		mgVars = mgVarsRef.current = {};
		mgVars.miniGraphBuffer = new Float64Array(space.nPoints);
		voltDisplay.copyVolts(mgVars.miniGraphBuffer, space.voltageBuffer);

		// each voltDisplay manages a voltage context; this one does the minigraph one
		mgVars.miniVoltDisplay = new voltDisplay('miniVoltDisplay',
			space.start, space.end, space.continuum,
			mgVars.miniGraphBuffer, getAGroup('voltageSettings'));
		mgVars.miniVoltDisplay.setVoltScales(0, MINI_WIDTH, MINI_HEIGHT);
	}
	const vDisp = mgVars.miniVoltDisplay;

	/* ***************************************************** rendering for the Tab */

	//  some slot and block chars if you need them: ⎍ ⊓ ⊔  also try box
	// drawing symols ⨅ ⨆ vs ⊓ ⊔ they're different!
	function renderBreedSelector() {
		const breed = vP.voltageBreed;
		return <div className='breedSelector'>
			<label>
				Flat
				<input type='radio' className='flatBreed' name='breed'
					checked={'flat' == breed}
					onChange={ev => setVoltageParams({voltageBreed: 'flat'}) }/>
			</label>
			<label title="sides will look diagonal if you have low resolution">
				<big> ⨅ ⨆</big> Block
				<input type='radio' className='blockBreed' name='breed'
					checked={'block' == breed}
					onChange={ev => setVoltageParams({voltageBreed: 'block'})}/>
			</label>
			<label title="x² or √x or similar.  Use this with Well space continuum.">
				V Canyon
				<input type='radio' className='canyonBreed' name='breed'
					checked={'canyon' == breed}
					onChange={ev => setVoltageParams({voltageBreed: 'canyon'})}/>
			</label>
		</div>;
	}

	// <label title="sides will look diagonal if you have low resolution">
	// 	<big> </big>
	// 	<input type='radio' className='slotBreed' name='breed'
	// 		checked={'slot' == breed}
	// 		onChange={ev => setVoltageParams({voltageBreed: 'slot'})}/>
	// </label>

	// an effect.  runs when <svg is there
	const makeAxis = () => {
		// If the scale has changed, call the axis component a second time to update.
		// For smooth animations, you can call it on a transition.
		if (yAxisRef.current) {
			yAxisRef.current.transition()
				.duration(200)
				.call(d3.axisLeft(vDisp.yUpsideDown).ticks(2, "s"));
			return;
		}

		// multiple squish panels: must be more specific
		let svg = d3.select(".miniGraph");

		// i shoulda used d3 for most of it...  except the path TODO
		yAxisRef.current = svg.append("g")
			.attr("transform", `translate(${MINI_WIDTH}, 0)`)
			.call(d3.axisLeft(vDisp.yUpsideDown).ticks(2, "s"));
	}

	function updateAxis() {
		if (yAxisRef.current) {
			yAxisRef.current.transition()
				//.duration(200)
				.call(d3.axisLeft(vDisp.yUpsideDown).ticks(2, "s"));
			return;
		}

	}

	// the minigraph is all in svg; no gl
	function renderMiniGraph() {
		vDisp.setFamiliarVoltage(vP);  // fill my buffer
		//vDisp.setVoltScales(0, MINI_WIDTH, MINI_HEIGHT);

		// fill the voltage buffer
		vDisp.setAutoRange();

		let path = vDisp.makeVoltagePathAttribute(vDisp.yUpsideDown);

		useEffect(makeAxis);

		// black background, path in cream white
		return <svg className='miniGraph' width={MINI_WIDTH} height={MINI_HEIGHT}  >
			<rect x={0} y={0} width={MINI_WIDTH} height={MINI_HEIGHT} fill='#000' />
			<path ref={pathRef} d={path} />
		</svg>;
	}

	// call whenever somehing changes that affects the minigraph.
	// Somehow setState() on the ControlPanel doesn't do it.
	function updateMiniGraph(change) {



		//vDisp.setFamiliarVoltage(vP);  // don't need this cuz setAutoRange()?  TODO
		//vDisp.setVoltScales(0, MINI_WIDTH, MINI_HEIGHT);

		// new range to autorange for new params
		vDisp.setAutoRange();

		// new path
		if (pathRef.current) {
			let path = vDisp.makeVoltagePathAttribute(vDisp.yUpsideDown);
			pathRef.current.setAttribute('d', path);
		}

		// new axis params
		updateAxis();
	}

	// call this on mousedown to start pointer capture on whichever range slider the user clicked on
	const startCapture =
		(ev) => ev.target.setPointerCapture(ev.pointerId);

	// make a logarithmic scale slider for either slots, blocks, canyons or flats
	// according to breed.  singlePowerWidth=currentPower value; minMax has min and max limits to value
	function makeScaleSlider(breed, powerVal, minMax) {
		const breedScale = breed + 'Scale';
		//console.log(`😎  svt props.voltageParams: `, p.voltageParams);

		// this goes -minMax.max...-100  0  +100...+minMax.max
		return <LogSlider className={breedScale} unique={breedScale}
			twoSided={true}
			currentPower={powerVal}
			annotation={false}
			vertical={true}
			sliderPowerMax={minMax.max}
			sliderPowerMin={100}
			stepsPerDecade={10}
			handleChange={scale => setVoltageParams({[breedScale]: scale})}
			wholeStyle={{visibility: 'visible'}}
			title='choose what power for the curve'
		/>
	}

	const breed = vP.voltageBreed;
	const breedScale = breed + 'Scale';

	// draw minigraph, with sliders on both sides, depending on breed.
	function renderFirstRow(breed) {
		const breedScale = breed + 'Scale';
		return <>
			{/* only shows for canyon, otherwise blank space */}
			<LogSlider className='canyonPower' unique='canyonPower'
				currentPower={vP.canyonPower}
				annotation={false}
				vertical={true}
				sliderPowerMin={sSettings.minMaxes.voltageParams.canyonPower.min}
				sliderPowerMax={sSettings.minMaxes.voltageParams.canyonPower.max}
				stepsPerDecade={10}
				handleChange={power => setVoltageParams({canyonPower: power})}
				wholeStyle={{visibility: 'canyon' == breed ? 'visible' : 'hidden'}}
				title='choose what power for the curve'
			/>

			{renderMiniGraph()}

			{makeScaleSlider(breed, vP[breedScale],
				sSettings.minMaxes.voltageParams[breedScale])} }
		</>
	}


	// draw minigraph, and wrap it with sliders on 3 sides, depending on breed
	function renderSecondRow(breed) {
		// let slotScaleDisplay = vP.slotScale.toFixed(0);
		// let canyonScaleDisplay = vP.canyonScale.toFixed(0);
		// shouldn't be neg if (scaleDisplayN < 0) scaleDisplay = `(${scaleDisplay})`;

		return <>
			{/* xⁿ only shows for canyon, otherwise blank space */}
			<label className='powerDisplay'
					style={{visibility: 'canyon' == breed ? 'visible' : 'hidden'}}>
				<var>x</var><sup> {(vP.canyonPower).toFixed(1)}</sup>
			</label>

			{/* voltage slide for offset, all except flag.  0% to 100%.  */}
			<input type='range' className='voltageCenter'
				value={vP.voltageCenter}
				min={sSettings.minMaxes.voltageParams.voltageCenter.min}
				max={sSettings.minMaxes.voltageParams.voltageCenter.max}
				step={5}
				onChange={ev => setVoltageParams({voltageCenter: ev.target.valueAsNumber})}
				onPointerDown={startCapture}
				style={{visibility: 'flat' == breed ? 'hidden' : 'visible'}}
				title="move the voltage profile left and right"
			/>

			<label className='scaleDisplay' style={{display: 'inline-block'}} >
				{(vP[`${breed}Scale`] / 1000).toFixed(2)} kV
			</label>
		</>;
	}

	// only the slot/black width, otherwise blank space
	function renderThirdRow(breed) {
		return <>
			<div />
			<input type='range' className='blockWidth'
				value={vP.blockWidth}
				min={sSettings.minMaxes.voltageParams.voltageCenter.min}
				max={sSettings.minMaxes.voltageParams.voltageCenter.max}
				step={.1}
				onChange={ev => setVoltageParams({blockWidth: ev.target.valueAsNumber})}
				onPointerDown={startCapture}
				style={{visibility: ('slot' == breed || 'block' == breed) ? 'visible' : 'hidden',
					width: '50%'}}
				title="how wide the pulse is, in percent of whole wave"
			/>
			<div />
		</>;
	}

	// draw minigraph, and wrap it with whatever sliders on 3 sides, depending on breed
	function renderVoltageGraphNSliders() {
		let vMinsMaxes = {...sSettings.minMaxes.voltageParams};
		let breed = vP.voltageBreed;

		return <div className='voltageGraphNSliders'>
			{/* this is a grid.  first row: left vert slider, mGraph, right slider
				left vert slider is power for canyon, or blank space otherwise */}
			{renderFirstRow(breed)}

			{/* second row. Indicators, horizontal sliders */}
			{renderSecondRow(breed, vMinsMaxes)}

			{/* third row: just the width slider */}
			{renderThirdRow(breed, vMinsMaxes)}
		</div>;
	}
	//  <sup>{(vP.canyonPower).toFixed(1)}</sup>

	// right space.  soon to include: relaxation...
	function renderShowVoltage() {
		return <label className='ShowVoltageControl' >
			Show Voltage
			&nbsp;
			<select name='showVoltage' value={p.showVoltage}
						onChange={p.changeShowVoltage}>
				<option value='always'>Always</option>
				<option value='hover'>only while hovering</option>
				<option value='never'>Never</option>
			</select>
		</label>;
	}


	// remember that set*VoltageHandler is an event handler that gets the
	// params from ControlPanel state
	return <div className='setVoltageTab controlPanelPanel'>
		<h3>Design the Voltage Profile</h3>
		<div className='voltageBreedPanel'>
			{renderBreedSelector()}

			<button onClick={p.saveMainVoltage}
					title={"This will set the voltage on the main display above, "
						+" from what you've created on this panel, and save it for next time."}>
				Set Voltage
		 	</button>
		</div>

		{renderVoltageGraphNSliders()}

		{renderShowVoltage()}
	</div>;

	// removed
	//<div className='divider' />
	//<div className='divider' />
}

export default SetVoltageTab;
