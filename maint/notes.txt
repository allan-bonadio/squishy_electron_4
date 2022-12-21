This project is like, pre-alpha quality.  sorry.
It has hardwired file paths that I've created identically on my machines.

====================================================== Dec 2022

tweaking CRA config:
https://marmelab.com/blog/2021/07/22/cra-webpack-no-eject.html

make a general purpose binary object identifier function

====================================================== Dec 2022
Browser availability for important features I use:

WebGL 1: most browsers 2010 thru 2016, android maybe 2016

WebGL 2: chrome & firefox Jan '17, Safari (both) & Edge 2020-2021

WebGL 2 if you enable experimental features: Chrome & Safari 2015-2017

WebAssembly: most browsers 2017, on android maybe 2018

WebWorkers:
safari & Firefox & Chrome 2009 to early 2010
Edge July 2015
Safari ios 2012
Android 2013 - 2022

in general, Android browsers lag the rest, although I'm not sure which browsers they use.  Maybe Chrome, then Samsung, then Edge then Firefox.

need to update code for this.

====================================================== Oct 2022

other notes:
webassembly error handling:
https://emscripten.org/docs/compiling/WebAssembly.html?highlight=webassembly%20exception#web-server-setup
for some streamlining; by adding a Mime type and .gz
more deploy tips:  https://emscripten.org/docs/compiling/Deploying-Pages.html
some type of error handling I might be able to implement someday:
https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/Exception/stack


====================================================== Sep 2022
While it's running, try surfing here:
http://localhost:4444/webpack-dev-server

====================================================== Aug 2022
original, mid-2021

v3 refers to the previous SquishyElectron project.
v4 is squishy_electron_4, this project.

------------------------------------------------ Spaces and Waves

This is aspirational, or maybe just the description of the quantum engine.

- a 'dimension' is a description of one of the state variable sets that index a wave.
class qDimension {
	continuum: contWELL or contENDLESS (has N+2 values for N possibilities)
		or contDISCRETE (has N values for N possibilities)
	N: possible QM states.  Always a power of 2 for non-discrete dimensions.
	nPoints: number of values (=N or N+2) times nPoints for lower-numbered dimensions
	nStates: number of states (N) times nStates for lower-numbered dimensions
	label: 'x', 'y' or 'z' or other; C string
		two particles will have x1, x2 but one in 2d will have x, y.
			Spin: Sz, or Sz1, Sz2, ...  Smax = 2S+1.  Sz= ix - S.  Orbital Ang: Lz, combined: Jz
			variable total angular mom: L combines Lz and Ltot so: state ix = 0...Lmax^2
			Ltot = floor(sqrt(ix))   Lz = ix - L(L+1) and you have to choose a Lmax sorry
			Also could have Energy dimensions...
}
Each dimension's variable is an integer, either 0...N-1 or 1...N, the latter for contWELL or contENDLESS.
	Coordinates always have 1 extra point on each end, either for ∞ wall or for wraparound

- a 'Space' is a list of dimensions, and a potential function of those dimension variables
	Dimensions are listed from outer to inner as with the resulting psi array:
	psi[outermost-dim][dim][dim][innermost-dim]
	As fo present writing, only does one dimension
	class Space {
		qDimension dimensions[];
		Avatar, one or more.  manages iteration and display
		potential (array of state variables often denoted V);
		Waves, one or more
	}

- a 'Wave' is a multidimensional array of psi  values, each a complex number (two floats, usually double)
	- qWave is a quantum system state
	- qSpectrum is an FFT of a qWave
	- qBuffer is the superclass of the above two
	- qBuffer points to space it's designed for; all buffers are freed when space changes dimensions so they can be recreated
	- iterate passes thru all psi values along all dimensions
	- fixBoundaries() automatically wraps continuum dimensions
	- can have multiple waves per space; user can superimpose them (someday)


Also must have shared between JS and C++:
- animation period
- potential energy as function of state; scalars not complex
- elapsed time; frame number
- all things in the control panel
- just lots of others

Also must have in C++; not sure if JS cares:
- progress of each thread, so it can coordinate the threads
someday

------------------------------------------------ equations

ih ∂ψ / ∂t  =  [V - (h^2/2m) (∂^2/∂x^2)] ψ


ih ∂psi / ∂t  =  V psi - (h^2/2m) (∂^2/∂x^2) psi

where t=time, x=location (potentially scalar, 2-vec or 3-vec)
h=hbar ħ plank's constant / 2π   m=particle (electron) mass
V=potential, function of x (and t maybe someday)
psi ψ is the wave function itself, a complex function of x and t.  Both of those are discretized: dx=1 always, and dt is variable




------------------------------------------------ wish list


- UI ability to set n of dimensions, and to specify angular momentum, and any energy/potential differences therein.  Two particles in the same space should have the same X coordinates; one in 2-d space should have X  and Y coords.  The V potential would be 1-dimensional or 2 dimensional, depending.
Any number of dimensions, eg x and s, the spin, becomes ψ[1...N][-½, ½]
or a 2d wave is ψ[1...N][1...N], either two 1D particles or 1 2D particle
whats the diff?  well, the potential V with two particles, each depends on the loc of the other.
For one particle in 2D, the potential is a 2d map.

- Multiprocessing must be done with web workers, with atomics synchronizing.  Multiple threads working on successive generations; dual threads on Re and Im.

- display Spiral in 3d could be easy.  Dual waves for an electron with spin?

- ability to create two wave functions and superimpose them, with varying complex ratio between

- ability to 'stick your finger in' and measure a state variable and thereby change the state

- small key table indicating phase-color correspondence (see that file... i think in resume directory)


================================================================ emscripten

Follow the directions on this page to install it, into /opt/dvl/emscripten:

https://emscripten.org/docs/getting_started/downloads.html

then from the top level run this:
quantumEngine/building/genExports.js

go change that file as you add more C++ exports you want to call from JS.

-------------------- node and python

I had to upgrade my Python to 3.9.5, otherwise the 'install' wouldn't work.  And then, add the 'certificates'.

I think it installs its own version of Python 3.9.2 (after I installed 3.9.5), and also its own version of node 14.15.5, which I also already have installed with nvm.  Should figure out a way to better coexist with that someday.

oh yeah, here:
emsdk uninstall node-14.15.5-64bit
emsdk uninstall python-3.9.2-1-64bit

get the installed version numbers:
./emsdk list

----------------------

this is automatically done in the build scripts so you don't have to put them into your .profile or whatever files:

. /opt/dvl/emscripten/emsdk/emsdk_env.sh

# according to informal benchmarks run June 5, 2021, the C++
# version of RK2 is 5x or 6x faster than the JS version.  ha.
# not even using rk2 anymore


================================================================ Dec 2021

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

needs more research
--------------------------------------------------


Great discussion of how to integrate Schrodinger.
https://physics.stackexchange.com/questions/259134/schrodinger-equation-for-a-hamiltonian-with-explicit-time-dependence

-------------------------------------------------- react management after eject
and other tips and tricks

https://github.com/sanjsanj/create-react-app-ejected

CRA docs
https://create-react-app.dev/docs/documentation-intro

v4 gets rid of the ejected property cuz almost no docs on how to do that

-------------------------------------------------- optimization

Use PureComponent to speed up rendering if you follow the rules:
https://reactjs.org/docs/react-api.html#reactpurecomponent

--------------------------------------------------
--------------------------------------------------
--------------------------------------------------
--------------------------------------------------
