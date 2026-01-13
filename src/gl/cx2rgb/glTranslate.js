#!/usr/bin/env node
/*
** glTranslate.js - crude translator for GLSL => JS, just for testing purposes
** Copyright (C) 2022-2026 Tactile Interactive, all rights reserved
*/

import fs from 'fs';
import cxToColorGlsl from './cx2rgb.glsl.js';

// You must manually run this!  no script or makefile will run it for you.
// This is a nodejs, cmd-line program.
// no args needed, just run this to recompile after changing cxToColorGlsl file.
//            ./glTranslate.js

// This does NOT translate all of glsl; just the stuff used in cx2rgb file.
// Nor does it detect GLSL syntax errors.  All done by regex.
// This ONLY translates cx2rgb.glsl.js!  it's a hack.
// Also a few other details

//console.log(`input:`, cxToColorGlsl);

function convertFile(text) {
	// intro line for function, sigh, just do it by hand
	text = text.replace(/vec3 cx2rgb\(vec2 (\w+)\)/g, 'export function cx2rgb($1) ');

	// all those return stmts
	//text = text.replace(/return vec3\((.+?)\);/g, 'return [$1];');

	// in the gl, the console.log stmts are commented out
	text = text.replace(/\/\/trace(\w+)/g, 'if (trace$1) console.log');

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
	text = text.replace(/^(float|int|bool) /gm, 'let ');

	// function declarations - always return vec3
	text = text.replace(/^(vec2|vec3|vec4) /gm, 'function ');

	// types for local vars in func bodies
	text = text.replace(/\t(float|int|bool) /g, '\t\tlet ');

	// when you declare a vector, must use constructor in JS
	text = text.replace(/\t(vec2|vec3|vec4) (\w+)/g, '\t\tlet $2 = $1()');

	return text;
}

// additional stuff needed for JS
const preface = `
// cx2rgb.txlated.js -- generated from cx2rgb.glsl.js into js
// mostly for testing purposes.  do not edit!  instead edit cx2rgb.glsl.js & run unit tests
// this file written ${new Date()}

// set these after translation
let traceQuarter = false;

const vec2 = (x=0, y=0) => {{x, y}};
const vec3 = (r=0, g=0, b=0) => ({r, g, b});
const  _  = (v) => v.toFixed(4);
`;

const suffix = '\nexport default cx2rgb;\n';

function glTranslate() {
	let text = cxToColorGlsl;

	let jsText = convertFile(text);
	fs.writeFileSync(process.env.SQUISH_ROOT + '/src/gl/cx2rgb/cx2rgb.txlated.js',
		preface + jsText + suffix);
}

glTranslate();
