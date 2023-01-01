These files are concerned with webgl for Squishy Electron.  See view directory for the next higher level.


# Strategic Files

* GLView.js - react component that wraps the <canvas and interfaces directly with the rest of the JS code.
* abstract*.js - base classes for viewDefs and drawings
* *Def.js - ViewDef classes, instances manage one or more Drawing instances
* *Drawing.js - Drawing classes; each draws one piece of stuff for a ViewDef


# drawing modules

## drawings
Things drawn into the canvas by webgl.
Sets up the inputs and arrays, passes to GL, draws.
* abstractDrawing.js - abstract superclass of drawings, although you can use them as-is for smoke testing
* flatDrawing.js - draws the flat bargraph of a wave
* starDrawing.js - testing only, unfinished

## view defs
Sortof a framework around the drawing situation.
Roughly corresponds to an Avatar?  not really...
* abstractViewDef.js  - abstract superclass of ViewDefs, although you can use them as-is for smoke testing
* flatDrawingViewDef.js - view def for flat stereotypical bargraph of wave

## misc drawing code
* viewVariable.js - helps drawing modules with the variables passed into GL
* cxToColor - convert a complex number to a RGB color + translator to .js
* cxToColor/cxToColor.glsl.js - GLSL code to calculate colors based on complex numbers

# other
* README.md - this file
* curiosity.js - test code to explore WebGL; retrieves all settings and other stuff, interesting!
