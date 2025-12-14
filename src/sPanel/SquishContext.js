/*
** SquishContext -- a react context shared over a whole squish panel
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/

import { createContext } from 'react';

// all of these start as empty so we don't need to import anything into this
// file.  So no import circular references. As the waveView and controlPanel init up, those empty objects
// will be filled in.  funcs & objects mostly
export const SquishContext = createContext({
	// the context object will be frozen, except in SquishPanel, the root.
	// the actual value comes from state of SquishPanel; this is just a lame default.
	name: 'main',
	shouldBeIntegrating: false,
	controlPanel: {},
	waveView: {},
	space: null,
});
SquishContext.displayName = 'SquishContext';

export default SquishContext;
