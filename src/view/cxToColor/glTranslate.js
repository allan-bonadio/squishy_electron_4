#!/usr/bin/env node
/*
** glTranslate.js - crude translator for GLSL => JS, just for testiing purposes
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

import fs from 'fs';

//import cxToColorGlsl from '/opt/dvl/squishyElectron/squishy_electron_4/src/view/cxToColor/cxToColor.glsl.js';
import cxToColorGlsl from './cxToColor.glsl.js';

// This does NOT translate all of glsl; just the stuff used in cxToColor file.
// Nor does it detect GLSL syntax errors.  All done by regex.
// Also activates certain comments that'll only show up in JS.
// no args needed, just run this

//console.log(`input:`, cxToColorGlsl);

function convertFile() {
	let text = cxToColorGlsl;
	//console.log(`text: `, text);

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

const preface = `// cxToColor.txlated.js -- generated from cxToColor.glsl.js into js
// mostly for testing purposes.  do not edit!
// this file written ${new Date()}
let trace = false;

`;

const suffix = '';

let jsText = convertFile();

//console.log(`here it is =============== pwd=${process.cwd()}`);
//console.log(jsText);
//console.log(`      done ===============`);

fs.writeFileSync('cxToColor.txlated.js', preface + jsText + suffix);

/* **************************************************************** main */



//convertFile(input);

