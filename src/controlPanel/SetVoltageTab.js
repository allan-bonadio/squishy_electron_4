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


// the setting, show/hide voltage on voltareaused in multiple places? not any more.
// can't figure out how to get hover working.  grrrr.
export function ShowVoltageControl(props) {
	return <label className='ShowVoltageControl' >
		Show Voltage
		&nbsp;
		<select name='showVoltage' value={props.showVoltage}
					onChange={props.changeShowVoltage}>
			<option value='always'>Always</option>
			<option value='hover'>only while hovering</option>
			<option value='never'>Never</option>
		</select>
	</label>;
}


/* ******************************************************* the tab itself */

function setPT() {
	SetVoltageTab.propTypes = {
		// function that actually sets showVoltage
		voltageParams: PropTypes.shape({
			canyonPower: PropTypes.number.isRequired,  // there's more but not now
			slotWidth: PropTypes.number.isRequired}),
		setVoltageParams: PropTypes.func.isRequired,

		// showVoltage is a separate Setting (not param) for showing/hiding voltage over canvas
		showVoltage: PropTypes.string.isRequired,
		changeShowVoltage: PropTypes.func.isRequired,

		space: PropTypes.object,
	};
}

// the tab that user sets voltage buffer with
function SetVoltageTab({voltageParams, setVoltageParams, showVoltage, changeShowVoltage, space}) {
	const vParams = voltageParams;  // our local version, before user clicks Set Voltage
	const setVParams = setVoltageParams;
	let stuff;

	// we'll hang on to these so I don't have to reallocate the buffer all the time
	let stuffRef = useRef(null);
	stuff = stuffRef.current;
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

	// Set Voltage button copies our working volts to the space's volts, and stores familiar params
	const setVoltage=
	(ev) => {
		//if (!vDisp)
		//	return;
		vDisp.setFamiliarVoltage(vParams);
		storeAGroup('voltageParams', vParams);

    // huh?!?
		vDisp.setBottomVolts(vDisp.bottomVolts);
		vDisp.setHeightVolts(vDisp.heightVolts);
	};

	/* ***************************************************** rendering for the Tab */

	//  some slot and block chars if you need them: ⎍ ⊓ ⊔  also try box
	// drawing symols ⨅ ⨆ vs ⊓ ⊔ they're different!
	function renderBreedSelector() {
		const breed = vParams.voltageBreed ?? 'flat';
		return <div className='breedSelector'>
			<label>
				<input type='radio' className='flatBreed' name='breed'
					checked={'flat' == breed}
					onChange={ev => setVParams({voltageBreed: 'flat'}) }/>
				Flat, zero everywhere
			</label>
			<label>
				<input type='radio' className='slotBreed' name='breed'
					checked={'slot' == breed}
					onChange={ev => setVParams({voltageBreed: 'slot'})}/>
				<big> ⨆</big> Slot
			</label>
			<label>
				<input type='radio' className='blockBreed' name='breed'
					checked={'block' == breed}
					onChange={ev => setVParams({voltageBreed: 'block'})}/>
				<big> ⨅</big> Block
			</label>
			<label>
				<input type='radio' className='canyonBreed' name='breed'
					checked={'canyon' == breed}
					onChange={ev => setVParams({voltageBreed: 'canyon'})}/>
				<big> ⋎</big> Canyon
			</label>
		</div>;
	}


	// the minigraph is all in svg; no gl
	function renderMiniGraph() {
		// even if you can't draw it, at least reserve the space
		//if (!vDisp)
		//	return <svg width={MINI_WIDTH} height={MINI_HEIGHT} />;
		//debugger;

		vDisp.setAppropriateRange(vParams);
		vDisp.setVoltScales(0, MINI_WIDTH, MINI_HEIGHT);

		// fill the voltage buffer
		vDisp.setFamiliarVoltage(vParams);

		let path = vDisp.makeVoltagePathAttribute(vDisp.yUpsideDown);

		// black background, path in cream white
		return <svg className='miniGraph' width={MINI_WIDTH} height={MINI_HEIGHT}  >
			<rect x={0} y={0} width={MINI_WIDTH} height={MINI_HEIGHT} fill='#000' />
			<path d={path} />
		</svg>;
	}

	// call this to start pointer capture on whichever range slider
	const startCapture = (ev) => ev.target.setPointerCapture(ev.pointerId);

	// draw minigraph, and wrap it with sliders on both sides, depending on breed
	function renderFirstRow(breed, vMinsMaxes) {
		return <>
			{/* only shows for canyon, otherwise blank space */}
			<LogSlider className='canyonPower'
				current={vParams.canyonPower ?? alternateStoreDefaults.voltageParams.canyonPower}
				annotation={false}
				sliderMin={vMinsMaxes.canyonPower.min} sliderMax={vMinsMaxes.canyonPower.max}
				stepsPerDecade={10}
				handleChange={power => setVParams({canyonPower: power})}
				wholeStyle={{visibility: 'canyon' == breed ? 'visible' : 'hidden'}}
			/>

			{renderMiniGraph()}

			{/* only shows for canyon - shouldn't this be logarithmic?  */}
			<input type='range' className='canyonScale'
				value={(vParams.canyonScale ?? alternateStoreDefaults.voltageParams.canyonScale)}
				min={vMinsMaxes.canyonScale.min}
				max={vMinsMaxes.canyonScale.max}
				step='10'
				onChange={ev => setVParams({canyonScale: ev.target.valueAsNumber})}
				onPointerDown={startCapture}
				style={{display: 'canyon' == breed ? 'inline-block' : 'none'}}
			/>

			{/* only shows for slot and block - shouldn't this be logarithmic? */}
			<input type='range' className='slotScale'
				value={(vParams.slotScale ?? alternateStoreDefaults.voltageParams.slotScale)}
				min={vMinsMaxes.slotScale.min}
				max={vMinsMaxes.slotScale.max}
				step='10'
				onChange={ev => setVParams({slotScale: ev.target.valueAsNumber})}
				onPointerDown={startCapture}
				style={{display: ('slot' == breed || 'block' == breed) ? 'inline-block' : 'none'}}
			/>

			{/* only if neither of above */}
			<div className='sliderSpacer' style={{display:'flat' == breed ? 'inline-block' : 'none' }}
			/>
		</>
	}

	// draw minigraph, and wrap it with sliders on 3 sides, depending on breed
	function renderSecondRow(breed, vMinsMaxes) {
		let slotScaleDisplay = vParams.slotScale.toFixed(0);
		let canyonScaleDisplay = vParams.canyonScale.toFixed(0);
		// shouldn't be neg if (scaleDisplayN < 0) scaleDisplay = `(${scaleDisplay})`;

		return <>
			{/* only shows for canyon, otherwise blank space */}
			<div className='powerDisplay'
					style={{visibility: 'canyon' == breed ? 'visible' : 'hidden'}}>
				<var>x</var><sup> {(vParams.canyonPower ?? 0).toFixed(1)}</sup>
			</div>

			{/* voltage slide for offset, all except flag.  0% to 100%.  */}
			<input type='range' className='voltageCenter'
				value={vParams.voltageCenter ?? alternateStoreDefaults.voltageParams.voltageCenter}
				min={vMinsMaxes.voltageCenter.min}
				max={vMinsMaxes.voltageCenter.max}
				step={5}
				onChange={ev => setVParams({voltageCenter: ev.target.valueAsNumber})}
				onPointerDown={startCapture}
				style={{visibility: 'flat' == breed ? 'hidden' : 'visible'}}
			/>

			{/* only one of these three is displayed */}
			<div className='slotScaleDisplay'
					style={{display: ('slot' == breed || 'block' == breed) ? 'inline-block' : 'none',
					width: '4em', textAlign: 'right'}}>
				{(slotScaleDisplay / 1000).toFixed(2)} kV
			</div>
			<div className='canyonScaleDisplay'
					style={{display: 'canyon' == breed ? 'inline-block' : 'none'}}>
				{canyonScaleDisplay} <var>x</var><sup>•</sup>
			</div>
			<div style={{display: 'flat' == breed ? 'inline-block' : 'none'}} />
		</>;
	}

	// only the slot/black width, otherwise blank space
	function renderThirdRow(breed, vMinsMaxes) {
		return <>
			<div />
			<input type='range' className='slotWidth'
				value={vParams.slotWidth ?? alternateStoreDefaults.voltageParams.slotWidth}
				min={vMinsMaxes.voltageCenter.min}
				max={vMinsMaxes.voltageCenter.max}
				step={.1}
				onChange={ev => setVParams({slotWidth: ev.target.valueAsNumber})}
				onPointerDown={startCapture}
				style={{visibility: ('slot' == breed || 'block' == breed) ? 'visible' : 'hidden',
					width: '50%'}}
			/>
			<div />
		</>;
	}

	// draw minigraph, and wrap it with sliders on 3 sides, depending on breed
	function renderMiniGraphPanel() {
		let vMinsMaxes = alternateMinMaxs.voltageParams;
		let breed = vParams.voltageBreed;

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
	//  <sup>{(vParams.canyonPower ?? 0).toFixed(1)}</sup>

  // soon to include: relaxation...
	function renderMisc() {
		return <div className='misc'>
			<ShowVoltageControl showVoltage={showVoltage}
				changeShowVoltage={changeShowVoltage} />
		</div>;
	}


	// remember that set*VoltageHandler is an event handler that gets the
	// params from ControlPanel state
	return <div className='setVoltageTab'>
		<div className='voltageBreedPanel'>
			<h3>Set Voltage</h3>
			{renderBreedSelector()}

      <button onClick={setVoltage} >Set Voltage</button>
		</div>

		<div className='divider' />

		{renderMiniGraphPanel()}

		<div className='divider' />

		{renderMisc()}
	</div>;

}

setPT();
export default SetVoltageTab;
