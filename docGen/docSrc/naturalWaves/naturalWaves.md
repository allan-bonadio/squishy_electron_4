<!--
title: Natural Waves
description: How waves work in nature
-->

# Natural Waves

<style>
	img {
		width: 300px;
		height: 150px;
		float: none;
		margin-block: 1em;
		margin-right: 1em;
	}
	img.one {
		margin-inline: auto;
	}
	img.two {
		float: left;
	}
	img.three {
		float: left;
		width: 240px;
		height: 120px;
	}
	img.inbl {
		display: inline-block;
		/*vertical-align: middle;*/*
	}
	.leftSide {
		width: 320px;
		height: 96px;
		float: left;
		clear: left;
		display: inline;
		vertical-align: middle;
	}
	sta {
		clear: both;
	}
	p {
		clear: left;
	}
</style>

## Waves in Nature
<sta></sta>
<sta></sta>
<img src=guitar.jpg class=leftSide style='height: 325px' />

Many things in nature vibrate.
You might think that these things bang violently from one side to another, but, usually, they follow a gentle sine wave.

With a guitar string, some guitar player pulls sideways on a string and then lets go.
When they let go, the string is coasting through the air, and it's following the laws of nature.

### Waves in Nature
So, first, think about the position of the string; where it has been stretched sideways, how far from its middle position.
Of course, it's vibrating back and forth.
Over time, the position follows a sine wave, back and forth.
We can call the middle position 0, and each side –1 and +1.

<sta></sta>
<img src=sinAndCos2.png class=leftSide style='width: 437px; height: 137px' />
The way we describe these things mathematically is with trig functions: *sine* and *cosine*.  In formulas, the abbreviations are *sin* and *cos*, like *sin x* or *sin(x)*.

Sine and cosine are a quarter circle apart (or _π_/2 or 90°).
You need both of them.  Keep reading.

Next, think of the speed that the string is moving sideways.
It's stopped when it's at the ends, positions –1 and +1; about to go the other way.
It's moving fastest when the string passes the middle the zero position.
So, this is kind of inside-out: the speed is -1 or 1 when the position is zero.
The speed is zero when the position is at -1 or 1.
So, the speed isn't the sine, it's the cosine, 90° off.
The derivative, rate of change, of the position is cosine.

Now, think of the force that the string uses to bring it back to the middle, overshoot to the other end, and back again.  It's proportional to the stretch of the string, at that time.  So, just like the position, it's a sine wave.  BUT, it's the opposite: when the string is stretched to 1, the force that pulls it back to the center is -1.  This diagram shows the stretch of the string, its velocity, and the force pulling it back.  As you go from left to right, it goes around the circle: zero, ¼, then ½, then ¾, and to 1, one whole cycle of sound later.  (On a real guitar, this is just a fraction of a second; middle C is 440 cycles per second, so the cycle time would be 1 sec / 440, or 0.00227 second.  But, don't worry about that.)

<sta></sta>
<img src=stretch_speed_force3.png class=leftSide style='width: 50em; height: 14em' />

(all the red stuff is just there to help.)

Follow the blue line, __stretch over time__.  Starts at zero, stretches up to 1 at the first quarter cycle (circle).  Then, it swings back down to zero, and flies to the -1 position at ¾ cycle.  At the end, it's back to the zero position.  Looks like a guitar string, right?

Now, follow the teal line (pine green), __velocity over time__.  At the start, it's at +1 because the string, while not stretched, is flying past the zero position.  At the one-quarter point, the string is stretched as far as it will go, so the velocity goes to zero.  At another quarter, at the halfway point, the string is, again, in the middle, but again it's flying, but this time, in the opposite direction, so the velocity is -1.  And, so on, the negative of the first half cycle.

Finally, look at the __force over time__, green.  It starts  at zero, because the string isn't stretched in one direction or another.  A quarter cycle later, when the stretch is at +1, the force is pulling back in the exact opposite direction, -1.  By the halfway point, the string isn't stretched anymore, it's been brought to the middle again, and there's no force, zero.  But, it still has velocity, so it swings past, until there's a force pulling it back to center.

So, you can see how the sine and cosine go hand-in-hand; you can't have one without the other.  They are complementary, this is why the cosine is the 'complementary sine', or cos.

All musical instruments work this way, give or  take.  And, they vibrate the air, and those vibrations are sound, and the sound waves travel away from the guitar.  If you could see the sound waves in the air as they travel, middle C waves would be 80 cm long.  (For our American friends, look at your ruler and see that 30cm is about a foot.)

### Wheels

Many other things go in a circle, like a wheel on a car.  In order to model them, you need all four variations: sine and cosine, and the negatives of each.  In this diagram, Sine is up-down, and the cosine is left-right.  This diagram shows how the point goes in a circle.  x=cosine, y=sine.

<sta></sta>
<img src=circleArrows4.png class=leftSide  style='width: 217px; height: 217px; float: right'>

<sta></sta>
<video src=greenTreeAndMts2.mp4 class=leftSideClear autoplay controls  \>

A tree branch being blown in the wind will go back and forth.

Sounds are vibrations in the air, and they often follow a sine wave.

<sta></sta>
<img src=Natural_Waves,freq_1.png class=leftSide  style='width:640px height:192px' >

What's so special about a sine wave?

The curvature, mathematically, is the 'second derivative'.
The derivative is the rate of change, the velocity above, a cosine.
The second derivative is the rate of change of the rate of change, which is also a sine wave.  It acts as the force.
And, the force always overshoots.  So, the string swings to the other side.

This is the differential equation that describes it.

${d^2y \over dt^2} = - \omega^2 y $

$$y$$ is where the vibrating thing is.
And $$d^2y \over dt^2$$ is the second derivative of it.
The minus sign on the right side is because, when the string is far to the left, the force pushes to the right.  And vice versa.  If you solve that, you get an exact sine wave.

The $$\omega$$ is the greek letter omega; that's the frequency, number of radians turned per second.  Radians are a way of measuring angles; you take the radius of the circle, measure along the outside of the circle, and that's the radians of your angle.  180° = _π_ radians.

# Square Wave

<sta></sta>
<img src=square_wave3.png class=leftSide  style='width: 40.625em; height:14em; ' >
But, there's a lot of sounds that don't sound like a nice, smooth sine wave.
Because they're not shaped exactly like a sine wave.
For instance, a square wave isn't a sine wave.
It's more like a buzzing sound.

In the early 1800s, a French mathematician named Fourier figured out that any wave shape can be described as a bunch of sine and cosine waves at higher frequencies, where the frequencies are multiples of the fundamental.  For instance, the square wave above can be described with this infinite series:

square wave = ${\sin \  {t}}+{\sin \ {3 t}\over 3}+{\sin \ {5 t}\over 5}+{\sin \ {7 t}\over 7}  ... \infty$

so the ...∞ means, you keep on adding terms like ${\sin \ {35 t}\over 35}$ for odd numbers, all the way to infinity.
<sta></sta>
<img src=Natural_Waves,freq_1.png class=leftSide  style='' >
Here are the first three: frequency 1,

<sta></sta>
<img src=Natural_Waves,freq_3.png class=leftSide  style='' >
<br />frequency 3,

<sta></sta>
<img src=Natural_Waves,freq_5.png class=leftSide  style='' >
<br />and frequency 5.

<sta></sta>
<img src=Natural_Waves,each_of_the_three.png class=leftSide  style='' >
<br />and, here they are all on the same graph.  Notice that at the start, middle and end, all three of them have the same slope.  Each one makes the curve steeper when you add it on (but only for shorter and shorter distances).  If you add them up all the way to ∞, that will result in the steep cliffsides in the square wave.

But, in between, at the 1/4 and 3/4 areas, each of the three go in different directions.  If you add all the way to ∞, it'll end up flat, as in the square wave graph above.


<sta></sta>
<img src=Natural_Waves,three_added_together.png class=leftSide  style='' ><br />
If we just add those first three together, we're starting to make the right shape.

<sta></sta>
<img src=Natural_Waves,ten_added_together.png class=leftSide  style='' >
<br />Here, we add up the first ten terms, 1 ... 19, you can see how much things cancel out to head towards a square wave.
These higher frequencies are called Harmonics of the original frequency.
Any integer multple of the original frequency is a harmonic.

## Quantum Waves

So, at a microscopic level, electrons are waves.
Each electron is a blob of electron stuff, and each electron has the same amount of electron stuff in it, 100%.
The waviness comes in when it moves around.

As with other waves, you need the sine and the cosine to make it work.
Unlike other waves, the sine and cosine aren't different things, like the speed and acceleration.
Mathematically, the best way to represent them is with complex numbers.
You know, _a_ + _b_ _i_.
Then, the sine can be the imaginary part, and the cosine can be the real part.
Or, vice versa.  As a function of time t, here's a wave function:

$$\psi = \cos \omega t + i \sin \omega t$$

% There's a symmetry like this.
The ω is the frequency, kindof like the number of beats per second for the wave.
The higher the ω, the faster the beats come, and the faster the electron travels.
% If you have a quantum mechanical wave, represented by complex numbers

Here's a writeup about
[Quantum Mechanics]
## More Info
