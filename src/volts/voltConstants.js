/*
** voltage constants -- Give me an idea of what's a lot of volts and what's a little
** Copyright (C) 2022-2026 Tactile Interactive, all rights reserved
*/

// An order-of-magnitude guess as to a voltage that would be useful.
// if you carve out a notch in the potential of this many volts, it'll grab the wave
// and slow it or stop it progressing across the space.  Adjust if voltages change.
// this is NOT the maximum voltage; see storeSettings.js
// Adjust this subjectively to fit.
export let EFFECTIVE_VOLTS = 10000;

// used for default graphical limits; must synch with powers.js where spd=10
export let AMPLE_VOLTS = 4 * EFFECTIVE_VOLTS;

// lower bound of single side volt scale
export let LOW_VOLTS = 100

// any voltage above this is just too much for us to handle so it may be
// limited
export const TOO_MANY_VOLTS = 1e30;


// size of the size box at lower right of canvas.
//  Sorry these aren't proportional to font size.
export const SIZE_BOX_SIZE = 24;

// width of side bumpers if contWELL continuum.  Zero otherwise.
export const WELL_BUMPER_WIDTH = 16;

// width of the voltage sidebar
//export const VOLT_SIDEBAR_WIDTH = 32;
