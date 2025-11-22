/*
** Doc Menu -- dropdown menu for reading online documentation
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/




import React from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import DocReader from './DocReader.js';
import './DocMenu.scss';

// This is a menu into /public/doc for the user to find documentation from the /DocGen subdirectory.

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
		target.value = 'docs';
	}

	return (
		<select id='DocMenu' onChange={handleSelect}>
			<option value='docs' >docs</option>
			<option value='intro'>Intro</option>
			<option value='gettingStarted'>Getting Started</option>
			<option value='naturalWaves'>Natural Waves</option>
			<option value='digitalWaves'>Digital Waves</option>
		</select>
	);
}

// 	const checked=true
// 	const checkedChange=()=>{}
//
//
// 	// 'asChild' is required otherwise you get nested buttons
// 	return (
// 		<DropdownMenu.Root>
// 			<DropdownMenu.Trigger className='docsTrigger'>
// 				docs
// 			</DropdownMenu.Trigger>
//
// 			<DropdownMenu.Content className="docsContent" sideOffset={5}>
// 				<DropdownMenu.Item className="gettingStartedItem">
// 					Getting Started
// 				</DropdownMenu.Item>
// 				<DropdownMenu.Item className="naturalWavesItem">
// 					Natural Waves
// 				</DropdownMenu.Item>
// 				<DropdownMenu.Item className="digitalWavesItem" disabled>
// 					Digital Waves
// 				</DropdownMenu.Item>
// 			</DropdownMenu.Content>
// 		</DropdownMenu.Root>
// 	);

			// <button className="IconButton" aria-label="Customise options">
			// 	docs
			// </button>








export default DocMenu;
