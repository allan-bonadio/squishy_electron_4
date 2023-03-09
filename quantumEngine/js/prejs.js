/*
** pre js - code to prepend to the JS that emcc generates
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

// this does NOT go thru babel/webpack; it's raw-metal javascript
console.log(`👩‍🌾 Hey!  prejs.js has been included!`)

// proxy-to-worker will pick up this name for the worker js
// var filename = 'qEng/quantumEngine.worker.js';
// no, only in the worker file itself, where it isn't needed
