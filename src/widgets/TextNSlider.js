/*
** Text and Slider -- an input slider and input text box working in unison
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import PropTypes from 'prop-types';


function setPT() {
	TextNSlider.propTypes = {
		className: PropTypes.string,
		label: PropTypes.string,
		style: PropTypes.object,

		// should be a number, or a string of a number
		value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
		min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
		max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
		step: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

		handleChange: PropTypes.func,

		// dom ID of <datalist> element
		list: PropTypes.string,
	};

	TextNSlider.defaultProps = {
		className: '',
		style: {},
		step: 'any',  // means no step, for if you use list

		handleChange: (ix, power) => {},
	};
}

function TextNSlider(props) {
	const p = props;

	const limit =
	val => Math.max(p.min, Math.min(p.max, val));

	function handleText(ev) {
		const el = ev.currentTarget;
		if (! isFinite(el.value))
			debugger;
		p.handleChange(limit(+el.value));
	}

	const handleSlider = handleText;
// 	function handleSlider(ev) {
// 		const el = ev.currentTarget;
// 		p.handleChange(limit(+el.value))
// 	}

	let value = limit(p.value);

	let controls;
	if (p.list) {
		// a list.  Must use integers as pseudovalues for the list items.
		// You're responsible for for making the list and dreaming up an ID.
		// Um, no, I'll have to finsih this later.
		// controls = <>
		// 	<input type='number' placeholder={p.label}
		// 			value={p.value} min={p.min} max={p.max}
		// 			list={p.list} step='any'
		// 			size='7'
		// 			onChange={handleChange} />
		// 	<input type='range'
		// 			value={p.value} min={p.min} max={p.max} step={p.step}
		// 			list={p.list}
		// 			onChange={handleChange} />
		// </>;
	}
	else {
		// to tweak the display in the text box, do it in the render.  Then when retrieving the number, convert it back.
		controls = <>
			<input type='number' placeholder={p.label || ''}
					value={value} min={p.min} max={p.max}
					step={p.step}
					size='7'
					onChange={handleText} />
			<input type='range'
					value={value} min={p.min} max={p.max}
					step={p.step}
					onChange={handleSlider} />
		</>;
	}

	const label = p.label ? <span>{p.label}</span> : '';
	return <div className={`TextNSlider {p.className}`} style={p.style}>
		{label}
		{controls}
	</div>;
}

setPT();

export default TextNSlider;

