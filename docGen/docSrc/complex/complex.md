<!--
title: Complex Numbers
description: Complex Numbers
-->
<title>Complex Numbers</title>
<link rel=stylesheet href=docs.css />
<h1>Complex Number refresher</h1>


Complex numbers are those that consist of two real numbers like this:

_a_ + _b i_

_a_ is called the __real part__ and _b_ is called the __imaginary part__... although b is still a real number.  _i_ is the square root of -1, which is impossible to do using only real numbers.  There are no real numbers that make this true:

_i_ <sup>2</sup> = -1



<h2>history</h2>


Real positive numbers are actual concepts everybody can get a sense of.
But there's so many more numbers, and kinds of numbers out there, depending on your domain.
And each group took time for people to understand them.

Zero was a stretch to understand for a lot of people before 1000ce.
Roman Numerals have no way to say zero.
They tended to have spaces where a zero number would be.

Negative numbers require stretching reality, sometimes, too.




------------------------------  start of the real thing

Many people think that _complex_ and _imaginary_ numbers are bogus, partly because of the names.
It sounds bad, like they're not there. Especially compared to the __real__ numbers.
But really they're just poorly chosen names.


## Domains

Let's say you have a 5 gallon bucket.
How much water is in it?
It's a number between zero and the size of the bucket, 5 gallons.
The water can't go below zero.  It can't go over 5 gallons.
But it can be a fraction of any size, like 0.13 or 4.0001 gallons.
That's the domain of that particular number, the amount of water.
If you have a 10 gallon bucket, the water can go up to 10.
If you have an ocean for your bucket, the allowable number of gallons might seem infinite.

Let's say you have a classroom with nine children in it.
How many children can you have?
In other words, what is the domain of the number of kids.
Well, you can only have integer (whole) kids.
You cannot have 3/8 of a kid.
You cannot have a negative number of children, but you can have zero.
What's the maximum number of kids?  That depends on your classroom size.

Let's say you have a bank account with some money in it.
How much?  What kind of domain does this number have?
Well, first of all, there's different currencies,
but in the US there's dollars and cents.
It can be positive, negative or zero.
If it goes negative, there could be real-world consequences.
Prices are usually rounded off to the nearest cent, like $4.46 or $1703.71 .
So, that's not a smooth continuum, either.  only multiples of 1¢.

Let's say you have a calculator.  Or a computer!
The numbers you can represent on it is also a domain.

Single Float numbers were pretty common in the 1900s.
They use 10 bits for an exponent, 53 bits for the mantissa (digits) of the number,
and one bit for sign, in an adaptation of scientific notation.
The whole thing is 64 bits; it can represent no more than 18,446,744,073,709,551,616 different possible values.
Now, that's a lot of numbers, and quite enough for most applications, but it is still a limited domain.



Double Float numbers are pretty common.
They use 10 bits for an exponent, 53 bits for the mantissa (digits) of the number,
and one bit for sign, in an adaptation of scientific notation.
The whole thing is 64 bits; it can represent no more than 18,446,744,073,709,551,616 different possible values.
Now, that's a lot of numbers, and quite enough for most applications, but it is still a limited domain.


Double Float numbers are pretty common.
They use 10 bits for an exponent, 53 bits for the mantissa (digits) of the number,
and one bit for sign, in an adaptation of scientific notation.
The whole thing is 64 bits; it can represent no more than 18,446,744,073,709,551,616 different possible values.
Now, that's a lot of numbers, and quite enough for most applications, but it is still a limited domain.



Gerolamo Cardano, an Italian mathematician,
is really the European guy who started taking negative numbers seriously in the mid 1500s.
The Chinese, Indians, and near east were already using negative numbers, eg for money.
Cardano was trying to solve cubic and quartic equations, up to the third and fourth powers.
These always have three or four solutions, just like a quadratic always has two solutions.
But sometimes they're not visible, at least as real numbers.

But he couldn't get his hands around what was going on.
He finally realized that his numbers needed to go not just forward and backward,
but sideways.




<a href=https://en.wikipedia.org/wiki/Roman_numerals>Roman numerals</a>
never had negative numbers, and zero was unheard of in Roman times, but was written out in words like __nulla__ on rare occasions starting in the 500s.

The Romans did have a system of fractions that used ¹⁄₁₂ths, ¹⁄₁₄₄ths and ¹⁄₁₇₂₈ths with ever more obscure symbols (all of which are in unicode).  ¹⁄₈ became "1½ twelfths".  This, and more obscure numbering systems, were used in Europe until the Renaissance.

Negative numbers were invented by the Chinese during the Han dynasty, 200bce through 200ce.  They then percolated through India by the 600s, and Arabia by the 800s.  They were first thought of, by believers, as __losses__ or __debts__.  And, by critics, as metaphysical, nonexistent, or just nonsense.

During the Golden Age of Islam, Al-Khwarizmi invented algebra and introduced Arabic numerals, based on Indian numerals.  (His name eventually evolved into the word 'algorithm'.)  Others developed symbolic equation notation, the theory behind rational and irrational numbers, decimal fractions, geometrical solutions to equations, trigonometry and even spherical trigonometry.

Meanwhile, in Europe, equations like _x_ + 1 = 0 were considered to have no solutions at all, even up to the 1700s.  Equations with minus terms had to have them moved to the other side of the equation to avoid the nasty.  Leonardo Fibonacci introduced Arabic numbers, zeroes and negatives to European intellectuals in the early 1200s.

Imaginary and Complex numbers were first used by Cardano in the 1500s to solve quadradic (_a x_<sup>2</sup> + _b x_ + c = 0), cubic and quartic equations.  Still then, there were no other practical uses, and they seemed to break rules that were used at the time, so Descartes, in 1637, called them 'imaginary'.

In the 1700s, Euler (say 'oiler') wrote a book _Elements of Algebra_, where he immediately plunged beginning students into complex numbers.  But some mathematicians were still paranoid about them into the 1800s.  Gauss introduced the letter _i_ as we use it today, and coined the term 'complex numbers' in the early 1800s.

Complex numbers today are used for almost anything that has waves or vibrates.  For instance, if you have an alternating electrical current running through a device, the device has an _impedance_, which is a complex number.  The real part is the _resistance_ that absorbs energy, and the imaginary part is called the _reactance_, a sort of elastic pushback on the vibration.


<h2>proper</h2>

If you want to make sure this is a 'field', you have to make sure the complex number system has addition, subtraction, multiplication and division.  So this is the way to do those:

(_a_ + _b i_) + (_c_ + _d i_)
= (a + c) + (b + d) i

(_a_ + _b i_) − (_c_ + _d i_)
= (a + c) + (b + d) i

(_a_ + _b i_) × (_c_ + _d i_)
= _a_ × _c_ + _a_ × _d i_ + _b i_ × _c_ + _b i_ × _d i_
= (_a c_ - _b d_) + (_a d_ + _b c_) i

(_a_ + _b i_) ÷ (_c_ + _d i_)
= yeesh kindof complicated
