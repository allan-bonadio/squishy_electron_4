/*
** helpers 3 dimensions -- 3d playground for Squish
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

//import {mat4} from 'gl-matrix';

const _ = (n) => (n.toFixed(4).padStart(9, ' '));

export function dump4x4(matrix, title) {
	dblog(`⣿⣿⣿ dump of matrix: `+ title);
	dblog(_(matrix[0]) + _(matrix[1]) + _(matrix[2]) + _(matrix[3]) );
	dblog(_(matrix[4]) + _(matrix[5]) + _(matrix[6]) + _(matrix[7]) );
	dblog(_(matrix[8]) + _(matrix[9]) + _(matrix[10]) + _(matrix[11]) );
	dblog(_(matrix[12]) + _(matrix[13]) + _(matrix[14]) + _(matrix[15]) );
}


