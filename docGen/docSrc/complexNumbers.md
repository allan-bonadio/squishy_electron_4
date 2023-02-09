<!--
title: my Squishy Electron project
description: Overview and some results from Squishy Electron
-->
<title>Complex Numbers</title>
<link rel=stylesheet href=docs.css />
<h1>Complex Number refresher</h1>


Complex numbers are those that consist of two real numbers like this:

_a_ + _b i_

_a_ is called the __real part__ and _b_ is called the __imaginary part__... although b is still a real number.  _i_ is the square root of -1, which is impossible to do using only real numbers.  There are no real numbers that make this true:

_i_ <sup>2</sup> = -1



<h2>history</h2>

Many people think that complex numbers are bogus, partly because of the __imaginary__ numbers, as opposed to the __real__ numbers.  But, numbers, as concepts, have always been evolving.

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
