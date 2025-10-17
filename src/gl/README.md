These files are concerned with webgl for Squishy Electron.  See view directory for the next higher level.


# Strategic Files

* GLScene or GLCanvas.js - react component that wraps the <canvas and interfaces directly with the rest of the JS code.
* abstract*.js - base classes for viewDefs and drawings
* *Def.js - Scene classes, instances manage one or more Drawing instances
* *Drawing.js - Drawing classes; each draws one piece of stuff for a Scene


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
* abstractScene.js  - abstract superclass of Scenes, although you can use them as-is for smoke testing
* flatDrawingScene.js - view def for flat stereotypical bargraph of wave

## complex to RGB
* cx2rgb - convert a complex number to a RGB color + translator to .js
* cx2rgb/cx2rgb.glsl.js - GLSL code to calculate colors based on complex numbers

## complex to RYGB
* cx2rygb - convert a complex number to a RYGB color + translator to .js
* cx2rygb/cx2rygb.glsl.js - GLSL code to calculate colors based on complex numbers

# other
* README.md - this file
* curiosity.js - test code to explore WebGL; retrieves all settings and other stuff, interesting!
* drawingVariable.js - helps drawing modules with the variables passed into GL


# RYGB
Alternate color map.  Expands red-yellow-green and shrinks green-blue-magenta-red.
Cuz there's just more colors near yellow than near blue.
red=0  orange=45°  yellow=90° chartreuce=135° green=180°
cyan=225° blue=270° magenta=315°


