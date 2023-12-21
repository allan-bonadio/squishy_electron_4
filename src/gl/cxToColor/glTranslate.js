#!/usr/bin/env node
/*
** glTranslate.js - crude translator for GLSL => JS, just for testing purposes
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

import fs from 'fs';
import cxToColorGlsl from './cxToColor.glsl.js';

// This does NOT translate all of glsl; just the stuff used in cxToColor file.
// Nor does it detect GLSL syntax errors.  All done by regex.
// Also activates certain comments that'll only show up in JS.
// no args needed, just run this

function convertFile() {
	// intro line for function, sigh, just do it by hand
	text = text.replace(/vec3 cxToColor\(vec2 (\w+)\)/g, 'export function cxToColor($1) ');

	// all those return stmts
	text = text.replace(/return vec3\((.+?)\);/g, 'return [$1];');

	// in the gl, the console.log stmts are commented out
	text = text.replace(/\/\/console/g, 'if (trace) console');

	// the #line directives I need.  this regex is funny - some bug.  don't mess with it.
	text = text.replace(/#line.*/g, '');

	text = text.replace(/sqrt\(/g, 'Math.sqrt(');
	text = text.replace(/psi.x/g, 'psi[0]');
	text = text.replace(/psi.y/g, 'psi[1]');

	// words to disappear
	text = text.replace(/varying|highp|attribute|uniform/g, ' ');

	// various types of variables
	text = text.replace(/vec2|vec3|vec4|float|int|bool/g, 'let ');

	// most functions start with
	//text = text.replace(/void /g, ' function ');


	return text;
}

export default function glTranslate() {
	let text = cxToColorGlsl;

	const preface = `// cxToColor.txlated.js -- generated from cxToColor.glsl.js into js
	// mostly for testing purposes.  do not edit!  instead edit cxToColor.glsl.js & run unit tests
	// this file written ${new Date()}
	let trace = false;

	`;

	const suffix = '\nexport default cxToColor\n';

	let jsText = convertFile();


	// at this point, the working dir is the project root.  This'll have to be
	// updated if you rearrange directories.
	fs.writeFileSync('src/gl/cxToColor/cxToColor.txlated.js', preface + jsText + suffix);
}
