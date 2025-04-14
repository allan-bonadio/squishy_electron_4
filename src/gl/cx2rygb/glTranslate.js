#!/usr/bin/env node
/*
** glTranslate.js - crude translator for GLSL => JS, just for testing purposes
** Copyright (C) 2022-2024 Tactile Interactive, all rights reserved
*/

import fs from 'fs';
import cxToColorGlsl from './cx2rygb.glsl.js';

// This is a nodejs library, imported and run from inside Jest

// This does NOT translate all of glsl; just the stuff used in cx2rygb file.
// Nor does it detect GLSL syntax errors.  All done by regex.
// This ONLY translates cx2rygb.glsl.js!  it's a hack.
// Also a few other ad-hoc details

//console.log(`input:`, cxToColorGlsl);

function convertFile(text) {
	// intro line for function, sigh, just do it by hand
	text = text.replace(/vec3 cx2rygb\(vec2 (\w+)\)/g, 'export function cx2rygb($1) ');

	// all those return stmts
	//text = text.replace(/return vec3\((.+?)\);/g, 'return [$1];');

	// in the gl, the console.log stmts are commented out
	text = text.replace(/\/\/trace(\w+)/g, 'if (trace$1) console.info');

	// the #line directives I need.  this regex is funny - some bug.  don't mess with it.
	text = text.replace(/#line.*/g, '');

	text = text.replace(/sqrt\(/g, 'Math.sqrt(' );
	// text = text.replace(/psi.x/g, 'psi[0]' );
	// text = text.replace(/psi.y/g, 'psi[1]' );

	// words to disappear
	text = text.replace(/varying|highp|attribute|uniform/g, ' ');

	// types in argument lists - get rid of em.  look for eg '(vec3 '
	text = text.replace(/\((vec2|vec3|vec4|float|int|bool) /g, '(');

	// variable declarations - always float
	text = text.replace(/\b(float|int|bool) /gm, 'let ');

	// function declarations - always return vec3
	text = text.replace(/^(vec2|vec3|vec4) /gm, 'function ');

	// types for local vars in func bodies
	text = text.replace(/\t(float|int|bool) /g, '\t\tlet ');

	// when you declare a vector, must use constructor in JS
	text = text.replace(/\t(vec2|vec3|vec4) (\w+)/g, '\t\tlet $2 = $1()');

	// this ONE special case.  A GL-ism
	text = text.replace(/vec3\(\)\.rgb = 0/g, 'vec3(0., 0., 0.)');


	return text;
}

// additional stuff needed for JS
const preface = `
// cx2rygb.txlated.js -- generated from cx2rygb.glsl.js into js
// mostly for testing purposes.  do not edit!  instead edit cx2rygb.glsl.js & run unit tests
// this file written ${new Date()}

// TODO: use these someday?
//let traceQuarter = false;
//const  _  = (v) => v.toFixed(4);

// needed defs of vec2 (complex only) and vec3 (rgb only)
const vec2 = (x=0, y=0) => ({x, y});
const vec3 = (r=0, g=0, b=0) => ({r, g, b});
`;

const suffix = `
export default cx2rgb;
`;

function glTranslate() {
	let text = cxToColorGlsl;

	let jsText = convertFile(text);
	fs.writeFileSync(process.env.SQUISH_ROOT + '/src/gl/cx2rygb/cx2rygb.txlated.js',
		preface + jsText + suffix);

	return null;
}

export default glTranslate;
