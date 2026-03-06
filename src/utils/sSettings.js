/*
** sSettings -- control panel setting variables (also stored in localStorage )
** Copyright (C) 2022-2026 Tactile Interactive, all rights reserved
*/

// so sSettings is the actual data; storeSettings is the code to access it
//import {isPowerOf2} from './powers.js';
import qeConsts from '../engine/qeConsts.js';
import {EFFECTIVE_VOLTS, AMPLE_VOLTS, LOW_VOLTS}
	from '../volts/voltConstants.js';


export const sSettings = {defaults: {}, verifiers: {}, minMaxes: {}};

// export let alternateStoreDefaults = sSettings.defaults {};
// export let alternateStoreVerifiers = sSettings.verifiers;
// export let alternateMinMaxs = sSettings.minMaxes;

//export let alternateStore = {};  // try this again?

window.sSettings = sSettings;


export default sSettings;
