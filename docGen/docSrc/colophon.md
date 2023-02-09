<!--
title: my Squishy Electron project
description: Overview and some results from Squishy Electron
-->
# How this was Built

This runs in a browser, so there's a limit to what the code can do.  Even though, there's pretty butch tools available as of 2021.

Most of the code is JavaScript, running in the browser, just like any other website.  It's done with React, d3, ReactFauxDOM, CRA, marked, katex, scss, webpack and babel, tested with Jest, with several other modules.

The numerical  integration, and most other time-critical numerical calculations, are done in C++ using Emscripten running on the WebAssembly platform in your browser.  It uses Visscher's algorithm, improved, to integrate Schrodinger's partial differential equation.

The graphics are done in WebGL, a blindingly fast graphics rendering system, using your GPU chip(s).  Basically, WebGL allows you to almost directly use the GPU in your computer to draw stuff.  Most of the graphics done on your screen, for all programs, is done using a similar interface to the GPU called OpenGL; this is how you get gradients, transparency and shadows with minimal overhead.

