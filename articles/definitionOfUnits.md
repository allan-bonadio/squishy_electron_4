<!--
title: Physical Units
description: Physical Units of Measure in Squishy Electron
-->
# Physical Units of Measure in Squishy Electron

In order to deal properly with units,
I have to shift from MKS units to more commensurate units,
but I want to stick to SI prefixes.

## •••••••••••••••••••• MKS Units

MKS stands for Meters, Kilograms, Seconds.  So length is measured in Meters (m), mass in Kilograms (kg) and time in Seconds (s).  Speed is in m/s, acceleration in m/s² which is m/s gained, per second.

Momentum is mass x velocity, kg m / s.  Momentum is conserved if you add up all the pieces involved.
Kinetic energy is mass x velocity², so energy is in   kg m²/s².
Energy is also conserved, but it can be Kinetic (energy of motion) or Potential (energy of situation, like being uphill vs downhill).  And, like momentum, you have to add up all the pieces and their energy.

Plank's constant is in kg m² / s .
Same as the units for angular momentum; momentum is kg m/s, but held out at a distance (length) that becomes kg m² / s.

## ••••••••••••••••••••••• Squishy Units

Squishy Electron works in a subatomic world.
Therefore, we should work in units that are closer to the size of an atom.

### Distance
We measure distance in nanometers (nm), pronounced 'na-no-meter'.
The smallest metal traces on the latest microchips,
is about 24nm, as of 2022.
A Sulfur atom is about .1 nm in diameter.

1 meter = 1e9 nm

### Time
We measure time in picoseconds (ps),
pronounced 'pie-ko-second' or 'pee-ko-second'.
This is a trillionth of a second.
Light travels about 0.3 mm, or 1/85th of an inch, in a picosecond.
(It goes about 1 foot per nanosecond, or 30 cm)

1 sec = 1e12 ps

### Mass
Mass is measured in 'rontograms', yep, 1e-27 grams, look it up.
A little bit more than the mass of an electron.
If you think of it, mass ∝ volume, so a nanometer cube is 1e-27 m³

Nobody knows what 'ronto' is so it's easier to use pico femto grams.
Let's use the abbreviation 'pfg' for pico femto gram.
Kindof like mg but 1e-24 times smaller.

Mass of an electron is 9.1093837015×10−31 kg
= 9.1093837015×10−28 g
= .91093837015 pico femto grams

1 gram = 1e+27 pfg
1 kilogram = 1e+30 pfg

m_e = .91093837015 pfg


### Energy

Energy is measured in electron volts, eV.
This is the energy needed to push an electron uphill against a voltage of 1 volt.
Burning a matchstick generates about 6 or 7 quadrillion eV, or 6 or 7 PeV (Peta eV).
A whisper for one second is about 100,000 ev or 0.1 MeV (Mega eV).

In MKS, energy is measured in Joules (named after James Prescott Joule,
who discovered the law of conservation of energy).
It's kg m² / s²; energy is always mass x length² / time² .

1 eV = 1.602176634e-19 J

= 1.602176634e-19 kg m² / s²

= 1.602176634e-19 (1e30 pico femto grams) (1e9 nm)² / (1e12 ps)²
//= 1.602176634e-19 kg (1e9 nm)² / (1e12 ps)²

= (1.602176634e-19 * (1e30 * 1e18 / 1e24) pfg nm² / ps²

= 1.602176634e-19 * 1e24 pfg nm² / ps²

= 1.602176634e+5 pfg nm² / ps²
or 160217.6634 pfg nm² / ps²

But in SI/Squish units, energy is in pfg nm² / ps²
can we give this a name like 'moxie'?
moxie = 1e-30 kgrams 1e-18 meters / 1e-24 sec
= 1e-48 / 1e-24 = 1e-24 joules

### Volts and Coulombs

charge of electron is 𝑒 = 1.602176634e−19 coulombs

So, that term in the schrodinger's equation is U𝜓, the potential energy times 𝜓.
U = eV, where e is electron charge, and V is the voltage — the electrical potential.
That sounds like the whole electron, but really the electron is broken up into 16 or
128 cells or whatever N is.  That's why we say eV𝜓, where 𝜓 is in millipsis per cell.

Actually, the only reason for e is to multiply it by a voltage, so it's more like eV is the quantity we're concerned with.  Which seems to be about .005, with the settings I have now, at voltage=5V, voltageFactor=-0.1 (?!?!?) and inverseℏ at .0095 (which won't change).  That is, .005 is effective as a voltage at altering the wave progression over time.  (wrong i think)

For a point, if the U𝜓 / | 𝜓 | is (?) about -0.005
that is for U ≈ volts * voltageFactor * hamiltW->im * inverseℏ
where 'volts' is just the phony number I'm using to fill the voltage buffer
potential volts=  4.9  voltageFactor= -0.1000  inverseℏ=  0.0095
   so U must  be ≈  -0.5    (wrong i think)

Adjust voltageFactor to be 1, and we get:
 🧶  viss: real ΔE: kinetic/ℏ=  0.1619  potential/ℏ=  0.0475  total/ℏ=  0.2094
  potential U: volts=  5.0081  voltageFactor=  1.0000  inverseℏ=  0.0095
  so U must  be  =   5.0081
🧶  viss: imag ΔE: kinetic=-126.3952  potential=0.0475  total=-126.3477

So if volts are actual volts, then U = 𝑒V, where 𝑒 = 1.602176634e−19 coulombs...
I''ve  been assuming that U ≈ V, like the charge is 1 coulomb or something.  No.

Volts * Amps = Watt.
Volts * Amps * second = Volts * Coulomb = Joule but we don't use joules, we use moxies
U is volts * coulombs  ≈  5v * 1.602176634e-19 coulombs  ≈ 8e-19 joules
1 moxie = 1e-24 joules
1e24 moxie = 1 joules
so U is 1e24 * 8e-19  moxie = 8e5 moxie, that's the energy from 5 volts * e

turns out 1500 volts or 1000 volts is effective at moving the wave.
1000v * 1.6e-19 coulombs = 1.6e-16 moxies
yeah, 500v barely has an effect, seems mostly friction
yeah, 1000v seems to snag it pretty well.  Wonder how much energy is lost, or where it goes.



<!--
### mass

zepto = 1e−21 so like micro-femto-grams or nano-pico-grams


1 kg = 1000g = 1e+30 kilo-quectograms = 1e+33 quectograms
  = 1e21 kilo-zepto grams = 1e24 zeptograms
1 g = 1e+30 quecto-grams
1 g = 1e+30 femto-femto-grams

Lets not use quectos or zeptos.    femtos are 1e-15, size of a nucleus.  that's OK.
1 eV = 1.602176634×10−19 J
meaning the charge of an electron is 1.602176634×10−19 coulomb, exactly.

1 kg = 6.241509074460763e+24 eV ps² / nm²
 -->

<!--
### volts
charge of an electron is 1.602176634×10−19 coulomb, exactly.

and one Joule is 1 volt * 1 coulomb

so an eV = 1 volt * 1.602176634×10−19 coulomb

1 volt = 1 eV / 1.602176634×10−19 coulomb

because e is a sortof standard unit of charge, eV ~= V

 -->



## physical constants

### ℏ, plank's reduced constant

In 1900,  Max Planck figured out a formula for Blackbody Radiation.
Long story.
Anyway, he needed a conversion factor in there, and he called it *h*.

This was just as quantum mechanics was starting to be understood.
Back then, people were using frequencies measured in cycles per second.
it fit better to measure them in radians per second.
Imagine if you take the radius of a circle, and you used that length to crawl around a circle.
That unit is called a 'radian', and that's how you measure angles in calculus.
There's 2π radians in a circle.

So in order to avoid dragging 2π around in all their equations, they just absorbed into Plank's constant as h / 2π.
that's what ℏ h-bar is.

ℏ = 1.054571817e-34 kg m² / s

ℏ = 1.054571817e-34 * (1e30 pfg) (1e9 nm)² / (1e12 ps)

= 105.4571817 pfg nm² / ps

In other words, about a hundred.


<!--
= 1.054571817e-34 * (6.241509074460763e+24 eV ps² / nm²)  * (1e9 nm)² / 1e12 ps

= 6.582119565476075e-10 (eV ps² / nm²) * (1e18 / 1e12) * (nm² / ps)

= 6.582119565476075e-10 eV ps² / nm² * 1e6 (nm²/ps)

= 6.582119565476075e-10 eV ps²  * 1e6 (1/ps)

= 6.582119565476075e-10 eV ps²  * 1e6 (1/ps)


= 6.58211956547607524373e-4 eV ps

ℏ =  6.58211956547607524373e-4 eV ps
confirmed with wikipedia: 6.582119569...e−16 eV⋅s
or 6.58 e-4  eV s
 -->


### Schrodinger's coefficients

The schrodinger's is:

iℏ ∂/∂t 𝜓 = U𝜓 + ℏ²/(2m_e 𝜉²) ∂²/∂ix² 𝜓

where 𝜉 is the spacing of points along the x axis, called dx in the code.
These come from the second derivative wrt x turning into 𝜉 ix.

U is the potential energy given the location; this is effectively the
voltage times the charge of 1 electron.

Move the coefficients on the left to the right:

∂/∂t 𝜓 = - iU𝜓 / ℏ + iℏ/(2m_e 𝜉²) ∂²/∂ix² 𝜓

That is how integration proceeds, calculating d𝜓 for each time step.
The coefficient  on the double derivative is the 'diffusivity' 𝛼

hOver2m_e = 105.4571817 / (2 * 0.91093837015)   nm² / ps

Divide this by dx² and it's ready to use for integrating.


