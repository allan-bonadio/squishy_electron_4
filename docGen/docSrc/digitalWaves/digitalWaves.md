<!--
title: Digital Waves
description: What happens to waves in a computer
-->

# Discrete Frequencies

<style>
	img {
		width: 300px;
		height: 150px;
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
		width: 240px;
		height: 120px;
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

One full wave, up and down, in your 8-point space.  The blue curve is a perfect sine wave, and the brown one is what you get if you only have 8 datapoints.  Not too bad.  If you double the frequency, you get frequency 2, two full waves in the same space:

<img src=sin2.png class=one alt='frequency 2'>

That has more kinks, and you can really see how poorly it represents frequency 2.

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

Hmmm, the brown kinks look the same as what you got for frequencies 7 and 6.  In fact, they are exactly the same: frequency -1 produces the same thing as frequency 7, and frequency -2 produces the same thing as frequency 6.  This is another thing that Nyquist figured out: if you go past the Nyquist frequency, you effectively get negative frequencies.  You can just subtract 8 to get the negative frequency that's equivalent.  (because our space has 8 datapoints.)

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





# # # # # # # # # # # # # # # # # #

Because it's a complex-number wave, it might be **hard to see** what's going on.  So we're going to see just a simple sine wave - like we're looking at a cross-section slice of the wave.

[line graph of sine wave, freq 3, res 16]

The number of frequencies that can show up there is exactly equal to the number of points in your wave.


Here you see a wave with frequency 3, in a space with resolution 16.  There's 3 crests (high points), and three troughs (low points).  Now, the line you see is a perfect sine wave - more like real life.  The circled points are where the perfect wave gets sampled - almost like we **measure the height of the wave** (positive or negative) **only at those 16 points**.  And, that's all that Squishy Electron can see, because those are the only numbers it has in memory for the wave.  And, all of the information about that wave is encoded in those 16 numbers.


It's not like real life - there seems to be no limit to the resolution that a real quantum mechanical wave can have in real life.  That would take an infinite number of data points, and your computer just doesn't have that much memory.

And, the highest frequency you can have is 8. 8 cycles in the entire width of the window.  That basically looks like a big, tight zig-zag.

[line graph of sine wave, freq 8, res 16]

You can try to have a higher frequency, but a funny thing happens.  Let's try to have a frequency of 9.  Look at the pattern of circled points.  It **looks kindof like a frequency of 7** .

[line graph of sine wave, freq 9, res 16]

In fact, it's **exactly the same as a frequency of -7**  , 7 pointing backwards.  The numbers are exactly the same, and since those are the only numbers we have to describe the wave, it **is** a wave with frequency -7 .

[line graph of sine wave, freq -7, res 16]

sidebar: (You can have a frequency of 9 if you want, but you have to **increase your resolution to 32** or higher.

[line graph of sine wave, freq 9, res 32])

A similar thing happens if you try for frequency 12 , you really get frequency -4 .

[line graph of sine wave, freq 12 & -4, res 16]

And frequency 15 will really turn into frequency -1 .

[line graph of sine wave, freq 15 & -1, res 16]

Try frequency 16 , and you'll be back to frequency 0 .

[line graph of sine wave, freq 15 & -1, res 16]

## All the Frequencies

On your resolution-16 wave, you can have 16 different frequencies, in any mixture:
- frequencies 1 thru 7 , moving right
- frequencies -1 thru -7 , moving left
- frequency 8 , same as  -8
- zero - this doesn't move, but it's still one of the frequencies.

Frequency 8 is called the
[Nyquist frequency](https://en.wikipedia.org/wiki/Nyquist_frequency),
after
[Harry Nyquist](https://en.wikipedia.org/wiki/Harry_Nyquist)
a brilliant engineer who figured it out in 1924 .
It's always ½ of the wave resolution.

If you want to study frequencies, you should use a resolution so that the Nyquist frequency is higher than that; preferably much higher.


![wavy Moire pattern of bricks](Moire_pattern_of_bricks_small.jpg)
A photo showing bricks photographed at a bad sampling rate, too close to the Nyquist frequency.
Courtesy Colin M.L. Burnett
<https://en.wikipedia.org/wiki/User:Cburnett>
thru Creative Commons
<https://creativecommons.org/licenses/by-sa/3.0/deed.en>

