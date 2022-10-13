import {abstractViewDef} from './abstractViewDef';
import flatDrawingViewDef from './flatDrawingViewDef';
import starViewDef from './starViewDef';

// unfortunately, we hafe to have a list of all the view types.  here.
// this will appear in the resolution dialog
export const listOfViewClasses = {
	abstractViewDef,
	//manualViewDef, viewVariableViewDef, flatViewDef,

	starViewDef,  // simple for testinig ... makes its own inputs


	//drawingViewDef,
	flatDrawingViewDef,
};

//console.log(`list of view classes:`, listOfViewClasses);

export default listOfViewClasses;
