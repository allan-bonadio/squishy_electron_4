These files display on top of the wave, over the webgl canvas itself (see gl dir).

# Strategic Files

* WaveView.js - react component that contains all these and the <canvas.

## sub-widgets of WaveView
* VoltArea.js - contains voltage line & axis, does click/drag
* VoltSidebar.js - scrolling & zoom buttons
* VoltOverlay.js - overlays canvas, contains both of the above

## other
* README.md - this file
* volts.scss - CSS for all the voltage stuff in this dir
* voltDisplay - voltage calculations for volt UI


# sidebar icons

## ??  assuming 1em=16px
* left edge to pause icon right edge: 44px = 2.75em  width: 16=1em
* left edge to singleframe icon right edge: 90px = 5 5/8 em    width:16=1em
* bottom edge to bottom of pause icon: 14=7/8em  height: 20=1.25em
* bottom edge to bottom of single frame icon: 20 =1.25em  height: 16=1em


