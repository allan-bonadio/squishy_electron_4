## Colors for Complex Numbers

### Color Octagon

This is the scheme for the Octogon Algorithm, mapping from Re, Im to RYGB to RGB.
the octagon:
√ =  √0.5 or 1/√2

```
								yellow 1,1,0
		 chartreuce √,1,0    orange 1,√,0
green 0,1,0                     red 1,0,0
			cyan 0,1,1            magenta 1,0,1
								blue 0,0,1
```

Guns are constant 1 when angle is next to gun color.
2 guns are always nonzero unless you're exactly on a rgb color, when only that one is.
Each side also has a gradient, on other color that's increasing/decreasing.

Note that the display numbers go to 1 whereas the complex x & y only go to √ 1/2
so we multiply by √2 .

### Numbers
Complex = x + iy
I divide these to isolate just the phase.

Color = r g b

phase tangent =x / (y + 1e-6)


### How to Test

./glTranslate.js
./cx2rygb.test.js

