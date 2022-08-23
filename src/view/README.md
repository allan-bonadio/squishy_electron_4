These files are concerned with WebGL.


# Strategic Files

* SquishView.js - react component that wraps the <canvas.
* view.scss - for SquishView


# drawing modules

## drawings
Things drawn into the canvas by webgl.
Sets up the inputs and arrays, passes to GL, draws.
* abstractDrawing.js - abstract superclass of drawings, although you can use them as-is for smoke testing
* flatDrawing.js - draws the flat bargraph of a wave
* potentialDrawing.js - draws the white potential bar

## view defs
Sortof a framework around the drawing situation.
Roughly corresponds to an Avatar?  not really...
* abstractViewDef.js  - abstract superclass of ViewDefs, although you can use them as-is for smoke testing
* flatDrawingViewDef.js - view def for flat bargraph

## misc drawing code
* viewVariable.js - helps drawing modules with the variables passed into GL
* cxToColor.glsl.js - GLSL code to calculate colors based on complex numbers

# other
* old/ - old srcs used in the gradual evolution of this system
* README.md - this file
* curiosity.js - test code to explore WebGL; retrieves all settings and other stuff, interesting!
* cxToRgb.js - porting the cxToColor to .js (will go away)
