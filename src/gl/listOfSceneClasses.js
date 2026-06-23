/*
** listOfScenes -- for selecting them.  but nobody selects them.
** Copyright (C) 2022-2026 Tactile Interactive, all rights reserved
*/

import {abstractScene} from './abstractScene.js';
import flatScene from './flatScene.js';
import garlandScene from './garlandScene.js';
import rainbowScene from './rainbowScene.js';
import rgbVaneScene from './misc/rgbVaneScene.js';
import plusFieldScene from './misc/plusFieldScene.js';

let traceSceneClasses = false;

// unfortunately, we hafe to have a list of all the view types.  here.
// this will appear in the resolution dialog
export const listOfSceneClasses = {
	abstractScene,  // wait a minute, this can't draw by itself...

	//starScene,  // simple for testinig ... makes its own inputs

	flatScene,
	garlandScene,
	rainbowScene,
	rgbVaneScene,
	plusFieldScene,
};

if (traceSceneClasses)
	console.log(`list of scene classes:`, listOfSceneClasses);

export default listOfSceneClasses;
