/*
** formatNumber -- SI unit and thousands seperators
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

/* ********************************** toSiPieces() */
// SI suffixes, as in milli, micro, nano, pico, .... kilo, mega, giga, ...
const suffixes = [
	// e-24 thru e-3
	'y', 'z', 'a', 'f', 'p', 'n', 'µ', 'm',

	'',

	// e3, kilo, to e24,
	'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y',
];
const suffixMid = suffixes.indexOf('');

// return a string for this real number, with greek/roman suffixes for the exponent
export function toSiPieces(f) {
	const thousands = Math.log10(f) / 3;
	const iThous = Math.floor(thousands);
	let suffix = suffixes[iThous + suffixMid];
	if (suffix === undefined)
		suffix = `e${iThous > 0 ? '+' : ''}${iThous * 3}`;
	const mantissa = f / (1000 ** iThous);
	return {mantissa, suffix, iThous};
}

// return a string for this real number, with greek/roman suffixes instead of exponent
export function toSiSuffix(f, nDigits) {
	const pieces = toSiPieces(f);

	return pieces.mantissa.toPrecision(nDigits) + pieces.suffix;
}

// testing
//for (let ff = 1e-30;  ff < 1e30; ff *= 12345) {
//	console.log(`${ff.toPrecision(5)} = ${toSiUnits(ff, 6)}`);
//}

/* ********************************** thousands() */
// I didn't realize when I wrote this that the Intl functions can do this too
const doesLocaleStuff = !!(window.Intl && Intl.NumberFormat);

export function thousands(n) {

	if (doesLocaleStuff) {
		return Number(n).toLocaleString();
		// num.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}));
	}
	return thousandsBackup(n);
}

// put spaces between triples of digits.  ALWAYS positive reals.
// not sure why I did this cuz it's built in to intl but in case you have an
// ancient browser ... but if you do, you can't run webassembly or GL...
export function thousandsBackup(n) {
	n = Math.round(n * 1e6) / 1e6;
	let nInt = Math.floor(n);
	let nFrac = (n) % 1;
	if (n < 1e-12) {
		console.warn(` hey!  ${n} is too small for thousands!!`);
	}

	let nuPart = 'z';
	let fracPart = '';
	if (nFrac > 0) {
		fracPart = String(nFrac).replace(/\.(\d\d\d)$/, '.$1 ');  // first space
		while (nuPart != fracPart) {
			nuPart = fracPart;
			fracPart = nuPart.replace(/ (\d\d\d)/, ' $1 ');  // each additional space
		}
		fracPart = fracPart.substr(1);  // get rid of leading 0
	}

	let intPart =String(nInt).replace(/(\d\d\d)$/, ' $1')
	nuPart = 'w';
	while (nuPart != intPart) {
		nuPart = intPart;
		intPart = nuPart.replace(/(\d\d\d) /, ' $1 ').trim();  // each additional space
	}

	console.log( '    done: '+ intPart + fracPart);
	return intPart + fracPart;
}

/* ********************************************************** put this in a spec file! */
//😇 function testThousands() {
//😇 	let n;
//😇 	for (n = 1e-6; n < 1e6; n *= 10) {
//😇 		for (let f = 1; f < 10; f *= 1.4)
//😇 			console.info(`  testThousands, progressive fractions: ${n*f} =>`, thousands(n * f));
//😇 		console.log();
//😇 	}
//😇 }
//😇testThousands();

/* ********************************************************** powers of 2 */

const superscripts = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const subscripts = '₀₁₂₃₄₅₆₇₈₉';

// convert this digit string to alternative unicode chars,   superscript, or subscript
function convertToAlt(n, table) {
	n = n.toString().split('');
	let ar = n.map(digit => table[digit.charCodeAt(0) - 0x30]);
	return ar.join('');
}

//  format non-integer as a normalized rational with a PO2 denominator, eg 0.375 => 3/8
// normalAscii = don't use n-dash and super/sub digits
export function formatAsPO2Rational(n, normalAscii) {
	// algorithm ∞-loops for zero!  can't handle minussign
	if (n == 0)
		return '0';
	if (n < 0) {
		return (normalAscii ? '-' : '– ') + formatAsPO2Rational(-n, normalAscii);
	}

	let denom = 1024;
	let num = Math.round(n * denom);
	while ((num & 1) == 0) {
		num /= 2;
		denom /= 2;
	}

	if (1 == denom) return num.toFixed(0);

	if (normalAscii)
		return num +'/'+ denom;
	else
		return convertToAlt(num, superscripts) + '⁄' + convertToAlt(denom, subscripts); // fraction slash in the middle
}


/* ********************************************************** put this in a spec file! */
// function testBinades() {
// 	// test basic algorithm
// 	let n;
// 	for (n = -3; n < 3; n += 19/64) {
// 		let f = formatAsPO2Rational(n, true);
// 		console.log(`formatting ${n}:`, f);
// 		// eslint-disable-next-line no-eval
// 		if (eval(f) != n) console.error(`errror with fraction ${n}: '${f}' instead`);
// // 		let m = f.match(/(– ?)?(\d+)\/(\d+)/);
// // 		if (m) {
// // 			// a fraction
// // 			let frac = m[2] / m[3];
// // 			if (m[1]) frac = -frac;
// //
// // 			console.info(`num/denom=${frac}  m=`, m)
// // 			if (frac != n) console.error(`errror with fraction ${n}: '${f}' instead`);
// // 		}
// // 		else {
// // 			// a whole integer
// // 			if (f != n) console.error(`errror with whole ${n}: '${f}' instead`);
// // 		}
// 	}
//
// 	// test fundamental super/sub mapping
// 	// they are NOT the same arrangement!
// 	let up = convertToAlt(8976542301, superscripts);
// 	console.log(`superscripts, should be '⁸⁹⁷⁶⁵⁴²³⁰¹'  really is:`,  up);
// 	if ('⁸⁹⁷⁶⁵⁴²³⁰¹' != up) console.error(`errror with superscripts: '${up}'`);
//
// 	let lo = convertToAlt(9768543120, subscripts);
// 	console.log(`subscripts, should be '₉₇₆₈₅₄₃₁₂₀' really is:`, lo );
// 	if ('₉₇₆₈₅₄₃₁₂₀' != lo) console.error(`errror with subscripts: '${lo}'`);
//
// 	// test a few odd ones with funny super/sub chars
// 	let zz = formatAsPO2Rational(37/128);
// 	if (zz != '³⁷⁄₁₂₈') console.error(`errror with 37/128: ${zz}`);
//
// 	zz = formatAsPO2Rational(1/1024);
// 	if (formatAsPO2Rational(1/1024) != '¹⁄₁₀₂₄') console.error(`errror with 1/1024: ${zz}`);
//
// 	zz = formatAsPO2Rational(-1023/1024);
// 	if (formatAsPO2Rational(-1023/1024) != '– ¹⁰²³⁄₁₀₂₄') console.error(`errror with -1023/1024: ${zz}`);
// }
// debugger;
// testBinades();

