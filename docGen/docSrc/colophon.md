How this was Built

This runs in a browser, so there's a limit to what the code can do.  Even though, there's pretty butch tools available as of 2021.

Most of the code is JavaScript, running in the browser, just like any other website.  It's done with React.

The numerical  integration, and most other time-critical numerical calculations, are done in C++ using Emscripten.  It uses Visscher's algorithm to integrate Schrodinger's ordinary differential equation.

The graphics are done in WebGL, a blindingly fast graphics rendering system, using your GPU chip(s).  Basically, WebGL allows you to almost directly use the GPU in your computer to draw stuff.  Most of the graphics done on your screen, for all programs, is done using a similar interface to the GPU called OpenGL; this is how you get gradients, transparency and shadows with minimal overhead.

