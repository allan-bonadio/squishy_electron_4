/*
** Set Voltage tab -- user can set the voltage to something interesting
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

import {useState, useRef, useReducer} from 'react';
import PropTypes from 'prop-types';

import voltDisplay from '../utils/voltDisplay.js';
import {EFFECTIVE_VOLTS, VALLEY_FACTOR, TOO_MANY_VOLTS} from '../utils/voltConstants.js';
import {getAGroup, storeAGroup, alternateMinMaxs} from '../utils/storeSettings.js';
import {eSpaceCreatedPromise} from '../engine/eEngine.js';

// miniGraph: always fixed size
let MINI_WIDTH = 300;
let MINI_HEIGHT = 150;

function setPT() {
	SetVoltageTab.propTypes = {
		// function that actually sets showVoltage
		toggleShowVoltage: PropTypes.func.isRequired,
		showVoltage: PropTypes.bool.isRequired,
	};
}

// reducer is an object with just the components that change
function reducer(vParams, action) {
	// gotta make a whole new object, with old values, overwritten by new values
	const newParams = Object.assign({}, vParams, action);
	// no!  wait for SetVoltage click!  storeAGroup('voltageParams', newParams);
	return newParams;
}

// the tab that user sets voltage with
function SetVoltageTab(props) {
	const p = props;

	const [vParams, setVParams] = useReducer(reducer, getAGroup('voltageParams'));

	let [This, setThis] = useState(null);  // triggers rerender only when space created
	// const ThisRef = useRef(null);
	//let This = ThisRef.current;
	if (!This) {
		// only the first time this is run
		This = {};

		// think of this like a useEffect
		eSpaceCreatedPromise.then(space => {
			// This obj holds various big objects

			This.space = space;

			// used for depicting what the user's selected.  Copy from live one.
			This.miniGraphBuffer = new Float64Array(space.nPoints);
			voltDisplay.copyVolts(This.miniGraphBuffer, space.voltageBuffer);

			// each voltDisplay manages a voltage context; this one does the minigraph one
			This.miniVolts = new voltDisplay(space.start, space.end,
				This.miniGraphBuffer, getAGroup('voltageSettings'));

			setThis(This);
		});

		return null;  // can't render this time
	}
	if (!This.space)
		return null;  // can't render till space promise resolves, sorry

// 	constructor(props) {
// 		super(props);
//
// 		// This is exactly the voltageParams object.  THEREFORE,
// 		// don't stick some other stuff into the state!
// 		this.state = {
// 		};
//
// 		// be prepared.  If this isn't an object, punt
// 		this.miniVolts = null;
// 		eSpaceCreatedPromise.then(space => {
// 			this.space = space;
//
// 			// used for depicting what the user's selected.  Copy from live one.
// 			this.miniGraphBuffer = new Float64Array(space.nPoints);
// 			voltDisplay.copyVolts(this.miniGraphBuffer, space.voltageBuffer);
// 			this.miniVolts = new voltDisplay(space.start, space.end,
// 				this.miniGraphBuffer, getAGroup('voltageSettings'));
//
// 			// only now set the state, when we're prepared to render
// 			let vParams = getAGroup('voltageParams');
// 			this.setState(vParams);
// 			this.miniVolts.setFamiliarVoltage(vParams);
// 		})
// 	}

	// Set Voltage button copies This panel's volts to the space's volts, and stores params
	const setVoltage=
	(ev) => {
		if (!This.miniVolts)
			return;
		This.space.vDisp.setFamiliarVoltage(vParams);

		// only NOW do we set it in the localStorage, and space
		storeAGroup('voltageParams', vParams);
		This.space.updateVoltageArea();
	};

	/* *************************************************************** rendering for the Tab */

	function renderBreedSelector() {
		const breed = vParams.voltageBreed ?? 'flat';
		return <div className='breedSelector'>
			<label>
				<input type='radio' className='flatBreed' name='flatBreed'
					checked={'flat' == breed}
					onChange={ev => setVParams({voltageBreed: 'flat'}) }/>
				Flat - zero everywhere
			</label>
			<br />
			<label>
				<input type='radio' className='canyonBreed' name='canyonBreed'
					checked={'canyon' == breed}
					onChange={ev => setVParams({voltageBreed: 'canyon'})}/>
				Canyon - |<var>x</var>|<sup><var>n</var></sup>
			</label>
		</div>;
	}

	// the minigraph is all in svg; no gl
	function renderMiniGraph() {
		// even if you can't draw it, at least reserve the space
		if (!This.miniVolts)
			return <svg width={MINI_WIDTH} height={MINI_HEIGHT} />;
		const v = This.miniVolts;
		//debugger;

		// You see, if I did an autorange, the scale will seem to have no effect.  So do this crude version.
		// v.heightVolts = EFFECTIVE_VOLTS * 4;
		// v.bottomVolts = vParams.canyonScale ? 0 : -EFFECTIVE_VOLTS;  // center it only if flat

		v.setVoltScales(MINI_WIDTH, MINI_HEIGHT, This.space.nPoints);

		// fill the voltage buffer
		v.setFamiliarVoltage(vParams);

		let path = v.makeVoltagePathAttribute(v.yUpsideDown);

		// black background, path in cream white
		return <svg className='miniGraph' width={MINI_WIDTH} height={MINI_HEIGHT}  >
			<rect x={0} y={0} width={MINI_WIDTH} height={MINI_HEIGHT} fill='#000' />
			<path d={path} />
		</svg>;

	}

	// draw minigraph, and wrap it with sliders on 3 sides
	function renderMiniGraphPanel() {
		let vMinsMaxes = alternateMinMaxs.voltageParams;
		let disabled = 'flat' == vParams.voltageBreed;
		let breed = vParams.voltageBreed;

		// vertical sliders have zero on the top
		let scaleDisplayN = vParams.canyonScale ?? 0;
		let scaleDisplay = scaleDisplayN.toFixed(3);
		// shouldn't be neg if (scaleDisplayN < 0) scaleDisplay = `(${scaleDisplay})`;

        // for vertical sliders, firefox wanted orient=vertical as element attr;
        // chrome/safari wanted appearance:slider-vertical in css.
        // chrome/safari  won
		return <div className='miniGraphPanel'>
			{/* this is a grid.  first row: left vert slider, mGraph, right slider */}
			<input type='range' className='canyonPower' disabled={disabled}
				value={vParams.canyonPower ?? alternateStoreDefaults.voltageParams.canyonPower}
				min={vMinsMaxes.canyonPower.min} max={vMinsMaxes.canyonPower.max}
				step={.5}
				onChange={ev => setVParams({canyonPower: ev.target.valueAsNumber})}
				style={{visible: 'canyon' == breed ? 'visible' : 'hidden', direction: 'rtl'}}
			/>

			{renderMiniGraph()}

			<input type='range' className='canyonScale' disabled={disabled}
				value={(vParams.canyonScale ?? alternateStoreDefaults.voltageParams.canyonScale)}
				min={vMinsMaxes.canyonScale.min}
				max={vMinsMaxes.canyonScale.max}
				step='.01'
				onChange={ev => setVParams({canyonScale: ev.target.valueAsNumber})}
				style={{visible: 'canyon' == breed ? 'visible' : 'hidden'}}
			/>

			<input type='range' className='slotScale' disabled={disabled}
				value={(vParams.slotScale ?? alternateStoreDefaults.voltageParams.slotScale)}
				min={vMinsMaxes.slotScale.min}
				max={vMinsMaxes.slotScale.max}
				step='.01'
				onChange={ev => setVParams({canyonScale: ev.target.valueAsNumber})}
				style={{visible: 'canyon' == breed ? 'visible' : 'hidden', direction: 'rtl'}}
			/>

			{/* second row. Indicators, sliders */}
			<div className='powerDisplay'>
				<var>x</var><sup> {(vParams.canyonPower ?? 0).toFixed(1)}</sup>
			</div>

			<input type='range' className='voltageSlide' disabled={disabled}
				value={vParams.voltageSlide ?? alternateStoreDefaults.voltageParams.voltageSlide}
				min={vMinsMaxes.voltageSlide.min}
				max={vMinsMaxes.voltageSlide.max}
				step={.1}
				onChange={ev => setVParams({voltageSlide: ev.target.valueAsNumber})}
				style={{visible: 'canyon' == breed ? 'visible' : 'hidden', direction: 'rtl'}}
			/>

			<input type='range' className='slotWidth' disabled={disabled}
				value={vParams.slotWidth ?? alternateStoreDefaults.voltageParams.slotWidth}
				min={vMinsMaxes.voltageSlide.min}
				max={vMinsMaxes.voltageSlide.max}
				step={.1}
				onChange={ev => setVParams({voltageSlide: ev.target.valueAsNumber})}
				style={{visible: 'canyon' == breed ? 'visible' : 'hidden', direction: 'rtl'}}
			/>

			<div className='scaleDisplay'>
				{scaleDisplay} <var>x</var><sup>•</sup>
			</div>

		</div>;
	}
	//  <sup>{(vParams.canyonPower ?? 0).toFixed(1)}</sup>



	// remember that set*VoltageHandler is an event handler that gets the
	// params from ControlPanel state
	return <div className='setVoltageTab'>
		<div className='voltageTitlePanel'>
			<h3>Set Voltage</h3>
			{renderBreedSelector()}
			<button onClick={setVoltage} >Set Voltage</button>
			<label>
				<input type='checkbox' checked={p.showVoltage} name='showVoltage'
					onChange={p.toggleShowVoltage} />
				Show Voltage <small>while hovering</small>
			</label>
		</div>

		<div className='divider' ></div>

		{renderMiniGraphPanel()}


	</div>;

}

setPT();
export default SetVoltageTab;
