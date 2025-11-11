/*
** Doc Menu -- dropdown menu for reading online documentation
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';

import './DocReader.js';
import './DocReader.js';
import './DocMenu.scss';

// This is a menu into /public/doc

//let traceReader = false;

const propTypes = {
	// for first couple of renders, space and idunno are null
	//docUri: PropTypes.string,
}

function DocMenu(props) {
	//cfpt(DocMenu, props);

	// want to fit inside the window, whatever its size
	const handleSelect =
	(ev) => {
		let target = ev.target;
		let topic = target.value;
		if ('doc' == topic)
			return;

		DocReader.openWithUri(`/${topic}/${topic}.html`);
		target.value = 'doc';
	}

	return (
		<select id='DocMenu' onChange={handleSelect}>
			<option value='doc' >doc</option>
			<option value='intro'>Intro</option>
			<option value='gettingStarted'>Getting Started</option>
			<option value='naturalWaves'>Natural Waves</option>
			<option value='digitalWaves'>Digital Waves</option>
		</select>
	);
}


export default DocMenu;
