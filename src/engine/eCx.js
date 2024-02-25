/*
** qa complex -- complex numbers in JS.  (Actually we don't use this much - often easier to just handle an array)
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

// should get rid of cxToRgb; it was an old translation
import cxToRgb from '../view/cxToRgb.js';
import cx2rgb from '../gl/cx2rgb/cx2rgb.txlated.js';

// do this old school class so  i can use the constructor without new
// very handy - either arg can be a complex obj, or a real, and the im arg can be absent
function eCx(re, im) {
	// if called as a function instead of with new, convert
	if (!this || this === window)
		return new eCx(re, im);

	if (typeof re == 'object') {
		if (typeof im == 'object') {
			return {re: re.re - im.im, im: re.im + im.re};
		}
		else {
			return {re: re.re, im: re.im + (im || 0)};
		}
	}
	else {
		if (typeof im == 'object') {
			// very unlikely
			return {re: (re || 0) - im.im, im:  im.re};
		}
		else {
			// this is the most common use
			return {re: re || 0, im: im || 0};
		}
	}

}

// aint workin
eCx.prototype.color = function color() {
	// should siwtch this over to cxToRgb////
	return cxToRgb(this);
};

// aint workin?
eCx.prototype.norm = function norm() {
	return this.re ** 2 + this.im ** 2;
}

// const eCx = (re, im) => {
// 	if (typeof re == 'object') {
// 		if (typeof im == 'object') {
// 			return {re: re.re - im.im, re.im + im.re);
// 		}
// 		else {
// 			return {re: re.re, re.im + (im || 0));
// 		}
// 	}
// 	else {
// 		if (typeof im == 'object') {
// 			// very unlikely
// 			return {re: (re || 0) - im.im, im.re);
// 		}
// 		else {
// 			// this is the most common use
// 			return {re: re || 0, im || 0);
// 		}
// 	}
// };



export default eCx;

