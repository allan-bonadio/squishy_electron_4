#  bugs and wishlist items for Squishy Electron


## Control Panel

- chord pulse should be harmonics of the full width

- Sliding the frequency slider really fast screws something up.  The
events come  too fast.  maybe need 'passive' mode?  Or capture mode?
Now the offset slider.  JUST the offset slider.  Doing it slowly is OK.
I get it.  Standing wave freq 0 => nans.

- need a button to reset ALL params and settings


## GL
- left tic marks rarely draw.

- display Garland Spiral in 3d could be easy.
	Really should use Three.js




## Voltage

- voltage area: dragging beyond bounds should expand scale

- set voltage: valley should prohibit negative powers and negative factors
- the potential stuff really needs a wrapper object like qWaves.  It's time.

- option to have voltage relax back to zero (or whatever's set in the tab)

## Integration

- finish real-world units

- multiple threads.  Need 3 or 4/5 buffers.  Plus ledge for each datapoint keeping track of what ministep and slave number it's at.  And mutex for holding each ministep number and slave number.  And way of each thread claiming the border and moving it in or out depending.

- divergence metric doesn't work.  try 2nd derivative.  which I'm already calculating, right?

- low pass filter doesn't seem to do it.  Verify it's working or come up with a better filter.

- should detect off-the-rails situations and stop frame. any NaNs,
	Infinity, or consecutive ix values that differ greatly.  Maybe calculate
	sum of abs of differences between consecutive psi values - and figure
	how what threshold to use.

- I think it doesn't converve energy - gotta check this out.  I'm pretty certain it doesn't.
	But now I have FFTs to measure it at least.

- Is the frame count correct?  If not, fix it.

- RK4

## Docs

- more documentation about...


## Wish List

- iphone touch events, and full screen

- make it a PWA.  Not hard!
	Use Lighthouse in Chrome Debugger


- tabs: add check boxe so you can have more than one open at a time

- display of momentum spectrum with double fft display.  along with energy?

- UI ability to set n of dimensions, and to specify angular momentum, and any
	energy/potential differences therein.  Two particles in the same space should
	have the same X coordinates; one in 2-d space should have X  and Y coords.  The
	V potential would be 1-dimensional or 2 dimensional, depending.


- Any number of dimensions, eg x and s, the spin, becomes ψ[1...N][-½, ½] or a
	2d wave is ψ[1...N][1...N], either two 1D particles or 1 2D particle whats the
	diff?  well, the potential V with two particles, each depends on the loc of the
	other. For one particle in 2D, the potential is a 2d map.

- ability to create two wave functions and superimpose them, with varying complex ratio between

- ability to 'stick your finger in' and measure a state variable and thereby change the state

- Dual waves for an electron with spin.



