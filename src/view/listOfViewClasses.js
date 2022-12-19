/*
** listOfViewDefs -- for selecting them.  but nobody selects them.
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

import {abstractViewDef} from './abstractViewDef.js';
import flatDrawingViewDef from './flatDrawingViewDef.js';
import starViewDef from './starViewDef.js';

// unfortunately, we hafe to have a list of all the view types.  here.
// this will appear in the resolution dialog
export const listOfViewClasses = {
	abstractViewDef,

	starViewDef,  // simple for testinig ... makes its own inputs


	flatDrawingViewDef,
};

//console.log(`list of view classes:`, listOfViewClasses);

export default listOfViewClasses;
