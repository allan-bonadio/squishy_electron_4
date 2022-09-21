
====================================================== Mid-2021 notes

v3 refers to this SquishyElectron project.

------------------------------------------------wish list for v3


- UI ability to set n of dimensions, and to specify angular momentum, and any energy/potential differences therein.  Two particles in the same space should have the same X coordinates; one in 2-d space should have X  and Y coords.  The V potential would be 1-dimensional or 2 dimensional, depending.
Any number of dimensions, eg x and s, the spin, becomes ψ[1...N][-½, ½]
or a 2d wave is ψ[1...N][1...N], either two 1D particles or 1 2D particle
whats the diff?  well, the potential V with two particles, each depends on the loc of the other.
For one particle in 2D, the potential is a 2d map.

- Emscripten engine in C - definitely
https://emscripten.org/docs/getting_started/downloads.html
Multiprocessing must be done with pThreads and/or web workers, it seems.

- test harness to run C++ iterator for testing

- OpenGL, if possible (maybe v4?)  Must be webgl cuz emscripten doesn't do full OpenGL
(basically OpenGL ES = WebGL anyway).

- display Spiral in 3d could be easy.  Dual waves for an electron with spin.

- ability to create two wave functions and superimpose them, with varying complex ratio between

- ability to alter speed of animation/calculation

- ability to 'stick your finger in' and measure a state variable and thereby change the state

- small key image indicating phase-color correspondence
- time display, iterations,
- some diagnostics for me?

- Fourier transforms with http://www.fftw.org to xform space domain to momentum domain

------------------------------------------------ v3 definitions

This is aspirational, or maybe just the description of the quantum engine.  I don't know how i'll put a UI on all  of this, but the simpler variations should be  no problem.

- a 'dimension' is a description of one of the state variables input to a wave.
class qDimension {
	continuum: contWELL or contENDLESS (has N+2 values for N possibilities)
		or contDISCRETE (has N values for N possibilities)
	N: possible  states.  Always a power of 2.
	nPoints: number of values (=N or N+2) times nPoints for dimensions to the left
	nStates: number of states (N) times nStates for dimensions to the left
	label: 'x', 'y' or 'z' or other; C string
		two particles will have x1, x2 but one in 2d will have x, y.
			Spin: Sz, or Sz1, Sz2, ...  Smax = 2S+1.  Sz= ix - S.  Orbital Ang: Lz, combined: Jz
			variable total angular mom: L combines Lz and Ltot so: state ix = 0...Lmax^2
			Ltot = floor(sqrt(ix))   Lz = ix - L(L+1) and you have to choose a Lmax sorry
			Also could have Energy dimensions...
}
Each dimension's variable is an integer, either 0...N-1 or 1...N, the latter for contWELL or contENDLESS.
	Coordinates always have 1 extra point on each end, either for ∞ wall or for wraparound

- a 'Space' is a list of dimensions, and a potential function of those dimension variables, known as V
	Dimensions are listed from outer to inner as with the resulting psi array:
	psi[outermost-dim][dim][dim][innermost-dim]
	As fo present writing, only does one dimension
	class Space {
		qDimension dimensions[];
		Manifestation mani;  // manages iterations; may go away
		function V(array of state variables);
		coordinates = what names for dimensions
	}

- a 'wave' is a multidimensional array of psi  values, each a complex number (two floats, either single or double)
	- qWave is a quantum system state
	- qSpectrum is an FFT of a wave
	- qBuffer is the superclass of the above two
	- buffer points to space it's designed for; all buffers are freed when space changes dimensions
	- iterate passes thru all psi values along all dimensions
	- fixBoundaries() automatically wraps continuum dimensions
	- can have multiple waves per space; user can superimpose them (someday)
	- must have at least 2 copies of wave so alg can create one from other
	- plus boolean telling which is latest


Also must have shared between JS and C++:
- animation period?
- potential energy as function of state; scalars not complex
- elapsed time

Also must have in C++; not sure if JS cares:
- acceptable error amount
- progress of each thread, so it can coordinate the pthreads

------------------------------------------------ equations

ih ∂ψ / ∂t  =  [V - (h^2/2m) (∂^2/∂x^2)] ψ


ih ∂psi / ∂t  =  V psi - (h^2/2m) (∂^2/∂x^2) psi

where t=time, x=location (potentially scalar, 2-vec or 3-vec)
h=hbar ħ plank's constant / 2π   m=particle mass
V=potential map, function of x and t
psi ψ is the wave function itself, a complex function of x and t.  Both of those are discretized

------------------------------------------------ layman descriptions


Q: what does an electron look like?

A: first you have to define what you mean by that.  Usually when we "look at" something, some photons from a light or the sun hit the thing we want to see, then they go to our eyes, which senses the photons.  (The photons really go off in all directions, but only the lucky ones are aimed at our eyes.)

Imagine a boat in a lake.  We can splash some waves toward it, and the waves bounce off and come back.  By checking out the waves that get reflected, we can figure out how big the boat is, and the shape of its surface (at the water line).  This will also work with rocks or posts in the water - anything that the waves bounce off.  This is radar, except with water waves instead of radio waves.

The problem is, if our boat is a small toy boat, it mostly gets swamped by the waves.  Our water radar will see something about as big as a water wave, but not much smaller.  It shows up as a dot, a blur, about as big as a water wave.  And so that boat will look like a rock the same size, which will look like a post of the same size.  We might not even be able to see the dot if it's too small.

The light that our eyes see are waves, and they have wavelengths of 400 to 700 nanometers, that's 4 x 10^-7 to 7 x 10^7.  That's very tiny.  It's great for us humans to look at large things, and even tiny things, but anything smaller than those waves, we won't be able to see much.  An atom can be as small as 10^-10 meters, that's more than 1000 times smaller.  So we can't see them with light.

So, then you have to think, what do I want to know by looking at it?



---------------------------------------------------- Qualitative vs Quantitative thinking




---------------------------------------------- emscripten

Follow the directions on this page to install it, into /dvl/emscripten:

https://emscripten.org/docs/getting_started/downloads.html

then from the top level run this:
quantumEngine/building/genExports.js

go change that file as you add more C++ exports you want to call from JS.

-------------------- node and python

I had to upgrade my Python to 3.9.5, otherwise the 'install' wouldn't work.  And then, add the 'certificates'.

I think it installs its own version of Python 3.9.2 (after I installed 3.9.5), and also its own version of node 14.15.5, which I also already have installed with nvm.  Should figure out a way to get rid of that someday.

oh yeah, here:
emsdk uninstall node-14.15.5-64bit
emsdk uninstall python-3.9.2-1-64bit

get the installed version numbers:
./emsdk list

----------------------

this is automatically done in the build scripts so you don't have to put them into your .profile or whatever files:

. /dvl/emscripten/emsdk/emsdk_env.sh


================================================================ Dec 2021:

-------------------------------------------------- icon notes



⏋𝒆⟩
230pt font
212 height of text
logo|𝒆⟩2.png - original image, pink but darker
logo|𝒆⟩3.png - latest, white


next time, try 200px text so there's more padding space


-------------------------------------------------- benchmarks

---------------------- with 25 points, on firefox:
stepsPerIteraction: 1000
iteration calc time:     23.00ms
update GL variables:     15.00ms
total for iteration:  38.00ms

stepsPerIteraction: 500
iteration calc time:     41.00ms
updateCounts:   0.00ms
total for iteration:  41.00ms

period:  67.00ms

-------------------------------------------------- Bogdonoff Affair
blurb by vman

You see, many years ago, I had a stint as a Mathematical Physicist, and because of that I was a regular reader of the Mathematical Physicist John Baez's blog "This week's finds in Mathematical Physics".  I remember being very interested in an intriguing article he wrote where he discussed the "Bogdonoff Affair" where in 2002 it was discovered that each of these two brothers earned their PhDs in the 90s by fraudulently by publishing articles in journals and defending theses that were complete gibberish. Their work was simply nonsensical strings of research physics buzzwords. All of this caused quite a stir in the world Physics community as it was shocking that this could even happen. In fact, it caused much tighter review processes to be instituted by journals and Universities alike.  I discovered that the Bogdanoffs published a book In 1991, called Dieu et la Science (God and Science), which became a French bestseller. However, they were sued by Astronomy Professor Trinh Xuan They settled out of court, and the Bogdanovs later denied plagiarism.  It's been suggested that the plagiarism suit pressed the brothers to obtain doctorates as fast as possible, since the back cover of the book claimed that the Bogdanoff's held doctorates but they didn't.



--------------------------------------------------


Great discussion of how to integrate Schrodinger.
https://physics.stackexchange.com/questions/259134/schrodinger-equation-for-a-hamiltonian-with-explicit-time-dependence


--------------------------------------------------
9/19,2022
Maybe I should think of waves WRT an atom size.  H atom sized 1Å.

--------------------------------------------------
--------------------------------------------------
--------------------------------------------------
--------------------------------------------------
--------------------------------------------------

--------------------------------------------------
--------------------------------------------------
--------------------------------------------------
--------------------------------------------------
--------------------------------------------------
--------------------------------------------------

--------------------------------------------------
--------------------------------------------------
--------------------------------------------------
--------------------------------------------------
--------------------------------------------------
--------------------------------------------------
