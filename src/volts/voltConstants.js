/*
** voltage constants -- Give me an idea of what's a lot of volts and what's a little
** Copyright (C) 2022-2025 Tactile Interactive, all rights reserved
*/

// An order-of-magnitude guess as to a voltage that would be fun.
// if you carve out a notch in the potential of this many volts, it'll grab the wave
// and pretty much stop it progressing across the space.  Adjust if voltages change.
// this is NOT the maximum voltage; see storeSettings.js
// Adjust this subjectively to fit.
export let EFFECTIVE_VOLTS = 1000;

// used for default graphical limits
export let AMPLE_VOLTS = 4 * EFFECTIVE_VOLTS;


// any voltage above this is just too much for the code to handle so it may be
// truncated or similar
export const TOO_MANY_VOLTS = 1e30;


// Controls the overall height of Valley voltage in SetVolt panel
// Adjust this subjectively to fit.
export let VALLEY_FACTOR = 1e-5;

// Controls the overall height of Slot voltage in SetVolt panel
// Adjust this subjectively to fit.
export let SLOT_FACTOR = 1e-5;


// for debugging
window.adjustVC = () => {debugger};
