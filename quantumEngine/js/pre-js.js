/*
** pre js - code to prepend to the JS that emcc generates
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

// this does NOT go thru babel/webpack; it's raw-metal javascript
console.log(`💉 pre-js.js has been included!`);

var Module = {
	locateFile: (path, scriptDirectory) =>
		path.replace(/^/, 'qEng/').replace(/gine.worker/, 'gine.thread'),
};


