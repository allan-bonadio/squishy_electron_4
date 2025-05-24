/*
** Set Voltage tab -- user can set the voltage to something interesting
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

import {useState, useRef, useReducer} from 'react';
import PropTypes from 'prop-types';

import voltDisplay from '../volts/voltDisplay.js';
import {EFFECTIVE_VOLTS, VALLEY_FACTOR, TOO_MANY_VOLTS} from '../volts/voltConstants.js';
import {getAGroup, storeAGroup, storeASetting, alternateMinMaxs} from '../utils/storeSettings.js';
import {eSpaceCreatedPromise} from '../engine/eEngine.js';
import LogSlider from '../widgets/LogSlider.js';

// miniGraph: always fixed size
let MINI_WIDTH = 300;
let MINI_HEIGHT = 150;


/* ******************************************************* the tab itself */

function setPT() {
	SetVoltageTab.propTypes = {
		voltageParams: PropTypes.shape({
			canyonPower: PropTypes.number.isRequired,  // there's more but not now
			slotWidth: PropTypes.number.isRequired}),
		setVoltageParams: PropTypes.func.isRequired,

		// showVoltage is a separate Setting (not param) for showing/hiding voltage over canvas
		showVoltage: PropTypes.string.isRequired,
		changeShowVoltage: PropTypes.func.isRequired,

		// the SetVoltage button
		saveMainVoltage:  PropTypes.func.isRequired,

		space: PropTypes.object,
	};
}

// the tab that user sets voltage buffer with
function SetVoltageTab(p) {
	// these are all the local versions, for use and setting in this Voltage Tab
	const {voltageParams, setVoltageParams, showVoltage, changeShowVoltage,
		saveMainVoltage, space} = p;
	const vP = voltageParams;
	const setVP = setVoltageParams;

	// we'll hang on to these so I don't have to reallocate the buffer all the time
	let stuffRef = useRef(null);
	let stuff = stuffRef.current;
	if (!stuff) {
		// only the first time this is run
		stuff = stuffRef.current = {};
		stuff.miniGraphBuffer = new Float64Array(space.nPoints);
		voltDisplay.copyVolts(stuff.miniGraphBuffer, space.voltageBuffer);

		// each voltDisplay manages a voltage context; this one does the minigraph one
		stuff.miniVolts = new voltDisplay('miniVolts',
			space.start, space.end, space.continuum,
			stuff.miniGraphBuffer, getAGroup('voltageSettings'));
	}
	const vDisp = stuff.miniVolts;

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
				<big> ⨆</big> Slot
				<input type='radio' className='slotBreed' name='breed'
					checked={'slot' == breed}
					onChange={ev => setVoltageParams({voltageBreed: 'slot'})}/>
			</label>
			<label title="sides will look diagonal if you have low resolution">
				<big> ⨅</big> Block
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


	// the minigraph is all in svg; no gl
	function renderMiniGraph() {
		// even if you can't draw it, at least reserve the space
		//if (!vDisp)
		//	return <svg width={MINI_WIDTH} height={MINI_HEIGHT} />;
		//debugger;

		vDisp.setAppropriateRange(vP);
		vDisp.setVoltScales(0, MINI_WIDTH, MINI_HEIGHT);

		// fill the voltage buffer
		vDisp.setFamiliarVoltage(vP);

		let path = vDisp.makeVoltagePathAttribute(vDisp.yUpsideDown);

		// black background, path in cream white
		return <svg className='miniGraph' width={MINI_WIDTH} height={MINI_HEIGHT}  >
			<rect x={0} y={0} width={MINI_WIDTH} height={MINI_HEIGHT} fill='#000' />
			<path d={path} />
		</svg>;
	}

	// call this to start pointer capture on whichever range slider
	const startCapture = (ev) => ev.target.setPointerCapture(ev.pointerId);

	// draw minigraph, and wrap it with sliders on all sides, depending on
	// breed.  All comes in three rows.
	function renderFirstRow(breed, vMinsMaxes) {
		return <>
			{/* only shows for canyon, otherwise blank space */}
			<LogSlider className='canyonPower'
				current={vP.canyonPower}
				annotation={false}
				sliderMin={vMinsMaxes.canyonPower.min} sliderMax={vMinsMaxes.canyonPower.max}
				stepsPerDecade={10}
				handleChange={power => setVoltageParams({canyonPower: power})}
				wholeStyle={{visibility: 'canyon' == breed ? 'visible' : 'hidden'}}
				title='choose the exponent'
			/>

			{renderMiniGraph()}

			{/* only shows for canyon - shouldn't this be logarithmic?  */}
			<input type='range' className='canyonScale'
				value={(vP.canyonScale)}
				min={vMinsMaxes.canyonScale.min}
				max={vMinsMaxes.canyonScale.max}
				step='10'
				onChange={ev => setVoltageParams({canyonScale: ev.target.valueAsNumber})}
				onPointerDown={startCapture}
				style={{display: 'canyon' == breed ? 'inline-block' : 'none'}}
				title="Voltage of multiplier.  The little graph autoranges so you can't see it so well."
			/>

			{/* only shows for slot and block - shouldn't this be logarithmic? */}
			<input type='range' className='slotScale'
				value={(vP.slotScale)}
				min={vMinsMaxes.slotScale.min}
				max={vMinsMaxes.slotScale.max}
				step='10'
				onChange={ev => setVoltageParams({slotScale: ev.target.valueAsNumber})}
				onPointerDown={startCapture}
				style={{display: ('slot' == breed || 'block' == breed) ? 'inline-block' : 'none'}}
				title="Voltage between upper and lower levels"
			/>

			{/* only if neither of above */}
			<div className='sliderSpacer' style={{display:'flat' == breed ? 'inline-block' : 'none' }}
			/>
		</>
	}

	// draw minigraph, and wrap it with sliders on 3 sides, depending on breed
	function renderSecondRow(breed, vMinsMaxes) {
		let slotScaleDisplay = vP.slotScale.toFixed(0);
		let canyonScaleDisplay = vP.canyonScale.toFixed(0);
		// shouldn't be neg if (scaleDisplayN < 0) scaleDisplay = `(${scaleDisplay})`;

		return <>
			{/* xⁿ only shows for canyon, otherwise blank space */}
			<div className='powerDisplay'
					style={{visibility: 'canyon' == breed ? 'visible' : 'hidden'}}>
				<var>x</var><sup> {(vP.canyonPower).toFixed(1)}</sup>
			</div>

			{/* voltage slide for offset, all except flag.  0% to 100%.  */}
			<input type='range' className='voltageCenter'
				value={vP.voltageCenter}
				min={vMinsMaxes.voltageCenter.min}
				max={vMinsMaxes.voltageCenter.max}
				step={5}
				onChange={ev => setVoltageParams({voltageCenter: ev.target.valueAsNumber})}
				onPointerDown={startCapture}
				style={{visibility: 'flat' == breed ? 'hidden' : 'visible'}}
				title="move the voltage profile left and right"
			/>

			{/* only one of these three is displayed */}
			<div className='slotScaleDisplay'
					style={{display: ('slot' == breed || 'block' == breed) ? 'inline-block' : 'none'}} >
				{(slotScaleDisplay / 1000).toFixed(2)} kV
			</div>
			<div className='canyonScaleDisplay'
					style={{display: 'canyon' == breed ? 'inline-block' : 'none'}}>
				{(canyonScaleDisplay/1000).toFixed(2)} kV ∙ <var>x</var><sup>n</sup>
			</div>
			<div style={{display: 'flat' == breed ? 'inline-block' : 'none'}} />
		</>;
	}

	// only the slot/black width, otherwise blank space
	function renderThirdRow(breed, vMinsMaxes) {
		return <>
			<div />
			<input type='range' className='slotWidth'
				value={vP.slotWidth}
				min={vMinsMaxes.voltageCenter.min}
				max={vMinsMaxes.voltageCenter.max}
				step={.1}
				onChange={ev => setVoltageParams({slotWidth: ev.target.valueAsNumber})}
				onPointerDown={startCapture}
				style={{visibility: ('slot' == breed || 'block' == breed) ? 'visible' : 'hidden',
					width: '50%'}}
				title="how wide the pulse is, in percent of whole wave"
			/>
			<div />
		</>;
	}

	// draw minigraph, and wrap it with sliders on 3 sides, depending on breed
	function renderMiniGraphPanel() {
		let vMinsMaxes = alternateMinMaxs.voltageParams;
		let breed = vP.voltageBreed;

				// for vertical sliders, firefox wanted orient=vertical as element attr;
				// chrome/safari wanted appearance:slider-vertical in css.
				// chrome/safari  won


		return <div className='miniGraphPanel'>
			{/* this is a grid.  first row: left vert slider, mGraph, right slider
				left vert slider is power for canyon, or blank space otherwise */}
			{renderFirstRow(breed, vMinsMaxes)}

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

		{renderMiniGraphPanel()}

		{renderShowVoltage()}
	</div>;

	// removed
	//<div className='divider' />
	//<div className='divider' />
}

setPT();
export default SetVoltageTab;
