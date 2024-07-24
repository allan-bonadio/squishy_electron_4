/*
** listOfScenes -- for selecting them.  but nobody selects them.
** Copyright (C) 2022-2024 Tactile Interactive, all rights reserved
*/

import {abstractScene} from './abstractScene.js';
import flatScene from './flatScene.js';

let traceViewClasses = false;

// unfortunately, we hafe to have a list of all the view types.  here.
// this will appear in the resolution dialog
export const listOfViewClasses = {
	abstractScene,  // wait a minute, this can't draw by itself...

	//starScene,  // simple for testinig ... makes its own inputs

	flatScene,
};

if (traceViewClasses)
	console.log(`list of view classes:`, listOfViewClasses);

export default listOfViewClasses;
