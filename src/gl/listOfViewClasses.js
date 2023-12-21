/*
** listOfViewDefs -- for selecting them.  but nobody selects them.
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

import {abstractViewDef} from './abstractViewDef.js';
import flatViewDef from './flatViewDef.js';

let traceViewClasses = false;

// unfortunately, we hafe to have a list of all the view types.  here.
// this will appear in the resolution dialog
export const listOfViewClasses = {
	abstractViewDef,  // wait a minute, this can't draw by itself...

	//starViewDef,  // simple for testinig ... makes its own inputs

	flatViewDef,
};

if (traceViewClasses)
	console.log(`list of view classes:`, listOfViewClasses);

export default listOfViewClasses;
