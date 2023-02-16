<!--
title: Discrete Frequencies
description: Effects of a Limited Wave Representation
-->

# Discrete Frequencies

Squishy Electron stores your wave as a sequence of numbers, one per point.  You change this in the Space tab. The **resolution you choose has a profound effect** on the wave and how things are calculated.  An important part of your wave is the frequencies it has in it.  The numbers of frequencies that can show up there is exactly equal to the number of points in your wave.

Let's take an example.  Let's say you have a wave with a resolution of 16.  (You should use a higher frequency, but here you'll be able to see what's going on.)  If you have a resolution of 16 points, that means you can have 16 different frequencies mixed into your wave.  No more.  This includes the positive frequencies moving right, and the negative frequencies moving left.

Because it's a complex-number wave, it might be **hard to see** what's going on.  So we're going to see just a simple sine wave - like we're looking at a cross-section slice of the wave.

[line graph of sine wave, freq 3, res 16]

Here you see a wave with frequency 3, in a space with resolution 16.  There's 3 humps, and three gutters.  Now, the line you see is a perfect sine wave - more like real life.  The circled points are where the perfect wave gets sampled - almost like we **measure the height of the wave** (positive or negative) **only at those 16 points**.  And, that's all that Squishy Electron can see, because those are the only numbers it has in memory for the wave.  And, all of the information about that wave is encoded in those 16 numbers.


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

