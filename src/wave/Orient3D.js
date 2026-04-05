/*
** Orient 3D -- testing sliders for all orientatiosn
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import PropTypes from 'prop-types';

const propTypes = {
   setOrientation: PropTypes.func.isRequired,
   orientation: PropTypes.object.isRequired,

}

function Orient3D(props) {
	cfpt(propTypes, props);

	let orientation = props.orientation;
	function setOneSlider(ev) {
		debugger;
		let which = ev.target.className;
		props.setOrientation({...props.orientation,
			[which]: ev.target.value});
	}

	return <div className='Orient3D'
						style={{width: '400px', height: '100px'}} >
			<input type='range' className='x' value={0}
				min={0} max={360} step={5} onChange={setOneSlider} />
			<input type='range' className='y' value={0}
				min={0} max={360} step={5} onChange={setOneSlider} />
			<input type='range' className='z' value={0}
				min={0} max={360} step={5} onChange={setOneSlider} />
		</div>;
}

export default Orient3D;
