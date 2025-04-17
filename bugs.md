#  bugs and wishlist items for Squishy Electron

- Find a replacement for CreateReactApp - no longer supported:
	** - Vite, seems comparable complexity to CRA
	* *- Next.js, more complex.  Does server side rendering & SEO stuff
	- Remix, similar to Next, but different.
	- Gatsby, uses GraphQL
	- Expo, has it’s own templating language
	For squish, I don't need a server so I think Vite is best (say veet)



## Control Panel

- chord pulse should be harmonics of the full width.  Needs an overhaul, and re-enabling.

* *- SetWave: Sliding the frequency slider really fast screws something up.  The
events come  too fast.  maybe need 'passive' mode?  Or capture mode?
Now the offset slider.  JUST the offset slider.  Doing it slowly is OK.
I get it.  Standing wave freq 0 => nans.

- need a button to reset ALL params and settings

- need a hamburger menu for things like the above.

- StartOver displays a kinked wave - cick a second time and it's ok


## GL & WaveView

- left tic marks rarely draw.

- display Garland Spiral in 3d could be easy.
	Really should use Three.js

- use gl.getError() (I already do in some places)

* *- install that WebGL debugger

- should have x axis on the bottom marked in nm

- frame number and elapsed ps don't display anywhere  near right

😡- the Start and Stop icons are totally bozo on Firefox.  Time to overhaul them.


## Voltage

- voltage setting doesn't work anymore!?!?

- voltage line is too short horizontally.  I think only when it first starts up.

- voltage area: dragging beyond bounds should expand scale.  Actually,
now, it just breaks stuff and gives you a really low or high boundary.
Needs fixing.

- option to have voltage relax back to zero (or whatever's set in the
tab)

- reset voltage doesn't reset voltage range

## Space and Integration

- multiple threads.  Break up wave into segments, with borders; one seg
per thread. And way of each thread claiming the border and moving it in
or out depending.


- I think it doesn't conserve energy - gotta check this out.  I'm pretty
certain it doesn't. But now I have FFTs to measure it at least.  If you think about it, pushing up the potential will certainly increase energy.

- RK4?

√- for Well contimuum, need start and end to be nailed to zero, and N-1 points between.

## Docs

- need to integrate specific help topics into the app with little (i) buttons

- more documentation about... divergence

- behavior of different waveforms

- complex numbers, fourier transform

- the voltage


## Wish List

- iphone touch events, and full screen

- make it a PWA.  Not hard!
	Use Lighthouse in Chrome Debugger


- tabs: add check boxes so you can have more than one open at a time

- display of momentum spectrum with double fft display.  along with
energy?  Energy should be one number ... or maybe total potential and
total kinetic

- UI ability to set n of dimensions, and to specify angular momentum, and any
	energy/potential differences therein.  Two particles in the same space should
	have the same X coordinates; one in 2-d space should have X  and Y coords.  The
	V potential would be 1-dimensional or 2 dimensional, depending.  whew, not this year.


- Any number of dimensions, eg x and s, the spin, becomes ψ[1...N][-½,
½] or a 2d wave is ψ[1...N][1...N], either two 1D particles or 1 2D
particle whats the diff?  well, the potential V with two particles, each
depends on the loc of the other. For one particle in 2D, the potential
is a 2d map.

- ability to create two wave functions and superimpose them, with varying complex ratio between

- ability to 'stick your finger in' and measure a state variable and thereby change the state

- Dual waves for an electron with spin.



