/*
** SquishContext -- a react context shared over a whole squish panel
** Copyright (C) 2025-2025 Tactile Interactive, all rights reserved
*/

import { createContext } from 'react';

// all of these start as null so we don't need to import everything.  So no circular references.
// As the squishPanel inits up, these will be filled in.  mostly funcs i guess
export const SquishContext = createContext({
	// the context object will be frozen, but not its subobjects.
	controlPanel: {
		singleFrame: null,
	},
	space: {
		space: null,
	}

});
SquishContext.displayName = 'SquishContext';

export default SquishContext;
