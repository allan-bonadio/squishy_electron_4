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
		float: left;
		margin: 1em;
	}
	sta {
		clear: both;
	}
</style>

## Waves in Nature
<sta></sta>
<sta></sta>
<img src=guitar.jpg class=leftSide style='height: 325px' />

Many things in nature vibrate.
You might think that these things bang violently from one side to another, but, usually, they follow a gentle sine wave.

With a guitar string, some guitar player pulls on a string and then lets go.
When they let go, the string is coasting through the air, and it's following the laws of nature.

So, first, think about the position of the string; where it is sideways, how far from its middle position.
Of course, it's vibrating back and forth.
Over time, the position follows a sine wave, back and forth.
We can call the middle position 0, and each side –1 and +1.

<sta></sta>
<img src=sinAndCos2.png class=leftSide style='width: 437px; height: 137px' />
The way we describe these things mathematically is with trig functions: sine and cosine.

Sine and cosine are a quarter circle apart (or π/2 or 90°).
You need both of them.

Next, think of the speed that the string is moving sideways.
It's stopped when it's at the ends, positions –1 and +1; about to go the other way.
It's moving fastest when the string passes the middle the zero position.
So, this is kind of inside-out: the speed is -1 or 1 when the position is zero.
The speed is zero when the position is at -1 or 1.
So, the speed isn't the sine, it's the cosine, 90° off.
The derivative, rate of change, of the position is cosine.

Now, think of the force that the string uses to bring it back to the middle, overshoot to the other end, and back again.  It's proportional to the (slight) curvature of the string, at that time.  So, just like the position, it's a sine wave.  But notice how, when the string is to the right, the force pushes to the left.  And, when the string is to the left, the force pushes to the right.

<sta></sta>
<img src=sinCosAllFour3.png class=leftSide style='width: 436px; height: 130px' />

Many other things go in a circle.  In order to model them, you need all four variations: sine and cosine, and the negatives of each:

Sine is up-down, and the cosine is left-right.  This diagram shows how the point goes in a circle.  x=cosine, y=sine.

<sta></sta>
<img src=circleArrows4.png class=leftSide  style='width: 217px; height: 217px; float: right'>

And as soon as they're on the other side,
the same forces work to push the string back.
Immediately, these forces pushing back, get a little bit smaller.
And, every fraction of a second, they get a little bit smaller still.
These forces also follow a sine wave over time.
And, the rate of change over time follows a sine wave.

<sta></sta>
< video src=greenTreeAndMts2.mp4 class=leftSideClear autoplay controls  \>

A tree branch being blown in the wind will go back and forth.

Sounds are vibrations in the air, and they often follow a sine wave.

<sta></sta>
<img src=Natural_Waves,freq_1.png class=leftSide  style='width:640px height:192px' >

What's so special about a sine wave?

The curvature, mathematically, is the 'second derivative'.
The derivative is the rate of change.
The second derivative is the rate of change of the rate of change.
And, the force always overshoots.  So, the string swings to the other side.

This is the differential equation that describes it.
The $$\omega$$ is the greek letter omega; that's the frequency, number of radians turned per second.

$$(d^2y \over dt^2) = - \omega y $$

$$y$$ is where the vibrating thing is.
And $$d^2y \over dx^2$$ is the second derivative of it.
The minus sign on the right side is because, when the string is far to the left, the force pushes to the right.  And vice versa.  The notation is kindof screwy but that's what they use.  If you solve that, you get an exact sine wave.

* Square Wave

<sta></sta>
<img src=Natural_Waves,square_wave.png class=leftSide  style='width:640px height:192px' >
But, there's a lot of sounds that don't sound like a sine wave.
Because they're not shaped exactly like a sine wave.
For instance, a square wave isn't a sine wave.
It's more like a buzzing sound.


In the early 1800s, a French mathematician named Fourier figured out that any wave shape can be described as a bunch of sine waves at higher frequencies.  For instance, the square wave above can be described with this infinite series:

$$sin (t)  + sin 3 t \over 3 + sin 5 t \over 5 + sin 7 t \over 7 + ... $$

<sta></sta>
<img src=Natural_Waves,freq_1.png class=leftSide  style='width:640px height:192px' >
Here are the first three: frequencies 1,

<sta></sta>
<img src=Natural_Waves,freq_3.png class=leftSide  style='width:640px height:192px' >
3,

<sta></sta>
<img src=Natural_Waves,freq_5.png class=leftSide  style='width:640px height:192px' >
and 5.

<sta></sta>
<img src=Natural_Waves,each_of_the_three.png class=leftSide  style='width:640px height:192px' >
and, here they are all on the same graph.  Notice that at the start, middle and end, all three of them have the same slope.  Each one makes the curve steeper when you add it on.  If you add them up all the way to ∞, that will result in the steep cliffsides in the square wave.

But, in the middles, at the 1/4 and 3/4 areas, each of the three go in different directions.  If you add all the way to ∞, it'll end up flat, as in the square wave graph above.
But, even if we just add the first three, we're getting close to a square wave.

<sta></sta>
<img src=Natural_Waves,three_added_together.png class=leftSide  style='width:640px height:192px' >
Starting to make the right shape.

<sta></sta>
<img src=Natural_Waves,ten_added_together.png class=leftSide  style='width:640px height:192px' >
If you add up the first ten terms, you can see how much things cancel out to make the square wave.

