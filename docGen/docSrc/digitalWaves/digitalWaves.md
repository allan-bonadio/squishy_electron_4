<!--
title: Digital Waves
description: What happens to waves in a computer
-->

<style>
	img {
		width: 30em;
		height: 15em;
		float: none;
		margin: 1em;
	}
	img.one {
		margin-inline: auto;
	}
	img.two {
		float: left;
	}
	img.three {
		float: left;
		width: 20em;
		height: 10em;
	}
	img.inbl {
		display: inline-block;
		/*vertical-align: middle;*/*
	}
</style>

## Digital Waves

Squishy Electron stores your wave as a sequence of numbers, one per point.  You change how many in the Space tab. The **resolution you choose has a profound effect** on the wave and how things are calculated.  An important part of your wave is the frequencies it can do.  In fact, you could say that your wave is entirely the frequencies it's made up from.

This is the normal way waves are kept in computers.  Computers are good at numbers, so here we are.

Let's take an example.  Let's say you have a space with a resolution of 8.  (You should use a higher resolution, but here you'll be able to see what's going on.)  A sine wave with a frequency 1 looks like this:

<img src=sin1.png class=one>

One full wave, up and down, in your 8-point space.  The blue curve is a perfect sine wave, and the brown one is the digital one you get if you only have 8 datapoints.  Not too bad.  If you double the frequency, you get frequency 2, two full waves in the same space:

<img src=sin2.png class=one alt='frequency 2'>

That has more kinks, and you can start to see how poorly it represents frequency 2.

Here's frequencies 3 and 4:

<img src=sin3.png class=two alt='frequency 3'>
<img src=sin4.png class=two alt='frequency 4'>
<br style='clear: left' />

Frequency 3 looks kindof bad, but something happened to frequency 4.  This is called the Nyquist frequency - half of your resolution.  Nyquist is the name of the guy who figured out that you should avoid that frequency.  But, you can continue on with frequencies 5, 6 and 7:

<img src=sin5.png class=three alt=' 5 '>
<img src=sin6.png class=three alt=' 6 '>
<img src=sin7.png class=three alt=' 7 '>
<br clear=left />

You can see that your 8-point space is really a mess with those frequencies.  Frequency 7 looks like what frequency 1 was, just upside down.  In fact, the brown kinks all start off going in the opposite direction from the natural wave, down instead of up.  Also the endings approach from the opposite direction.

Speaking of opposite, can we do negative frequencies?  Yes!  Let's see what they look like.  This is frequencies -1 and -2:

<img src=sin-1.png class=two alt=' -1 '>
<img src=sin-2.png class=two alt=' -2 '>
<br clear=left />

Hmmm, the brown lines look the same as what you got for frequencies 7 and 6.  In fact, the brown lines are exactly the same: frequency -1 produces the same thing as frequency 7, and frequency -2 produces the same thing as frequency 6, although the blue natural lines are totally different.  This is another thing that Nyquist figured out: if you go past the Nyquist frequency, you effectively get negative frequencies.  You can just subtract 8 to get the negative frequency that's equivalent.  (because our space has 8 datapoints.)

In fact, you can add 8 to the frequency, subtact 8, or any multple of 8, and the digital version will be the same.  In the following graphs, they are all frequency -3, offset by some multiple of 8 in either direction:

<img src=ny+5.png class=inbl alt=' 5 '>
<img src=ny+13.png class=inbl alt=' 5 '>
<img src=ny+45.png class=inbl alt=' 5 '>
<img src=ny-3.png class=inbl alt=' 5 '>
<img src=ny-19.png class=inbl alt=' 5 '>
<br clear=left />

Notice how the brown kinks (the digital version of the waves) are all the same.  How the heck does that come about?  In this graph, I've circled the crossing points between the digital wave and the natural wave.

<img src=freq5crossings.png class=one>

It's kindof like, the natural wave gets measured only at those circled points.  If you look at the natural wave between the circles, you can see that it has time to go through the better part of a halfwave before it gets to the next circle.  The digital wave just isn't fast enough to keep up.

So, if you have a resolution of 8 points, that means you can have 8 different frequencies mixed into your wave.  No more.  This includes:
* three positive frequencies 1, 2, 3
* three negative frequencies -1, -2, -3
* the zero frequency (we didn't try that but it's zero everywhere)
* the nyquist frequency 4


## Higher Resolution

The way to deal with this cruddy resolution problem is to use a higher resolution cavity.  You probably already figured this out.


So, you might wonder, why do we have to limit ourselves to integer frequencies?  We use 2 and 3, but not 3.5 or 3.1 or even π.  Here's why.   If you try to use a different frequency, for instance, π, you get a wave like this:

<img src=sinPi.png class=inbl alt=' π '>

So you can immediately see the problem.  At the end of the wave, it really needs to go back to where it started.  So it doesn't have to jerk around when it's startingh up.



