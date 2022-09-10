// only used with WDYR diagnostic package.

import React from 'react';

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
  	// maybe comment this out?  We want to track specific components, not all of them
    trackAllPureComponents: true,
    logOnDifferentValues: true,

  });
}
