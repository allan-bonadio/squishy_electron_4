#!/usr/bin/env node
/*
** generate exports -- generate files for JS calling C++ code through emscripten
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

let traceOutput = false;

if (! process.env.SQUISH_ROOT) throw "env var SQUISH_ROOT not defined!  Should be the source tree root.";

console.log(`Run this whenever the list of C++ functions to call from JS changes.`);

const fsProm = import('fs');
let fs;

/* ************************************************************************** Tables of Inputs */

// the exports list.
// in C++: each function must be declared 'export "C" ...'
// in JS: import qe from 'engine/qe', then use qe.funcname()
// also must call defineQEngineFuncs after C++ is initialized
let exportsSrc  = [
	// args and retType can be 'number', 'string', 'array' (of bytes), or null
	// meaning void. That's all.  Anything more complex, you have to make up out
	// of those with multiple calls or a typed array.
	{name: 'main', args: [], retType: 'number'},

	// recreating the space
	{name: 'startNewSpace', args: ['string'], retType: 'number'},
	{name: 'addSpaceDimension', args: ['number', 'number', 'string'], retType: null},
	{name: 'completeNewSpace', args: [], retType: 'number'},
	{name: 'deleteTheSpace', args: ['number'], retType: null},

	// gets
	{name: 'getCppExceptionMessage', args: ['number'], retType: 'number'},

	// the potential
	{name: 'qSpace_dumpPotential', args: ['string'], retType: 'number'},

	// accept an integer pointer to the qWave as first arg
	{name: 'wave_normalize', args: ['number'], retType: null},

	// avatars - all accept an integer pointer to the avatar as first argument
	{name: 'avatar_loadViewBuffer', args: ['number'], retType:  'number'},

	// ?? this really has no return value ??
	{name: 'avatar_oneIteration', args: ['number'], retType: 'number'},
	{name: 'avatar_shouldIterate', args: ['number'], retType: 'number'},

	{name: 'avatar_askForFFT', args: ['number'], retType: null},
	{name: 'avatar_delete', args: ['number'], retType: null},

	// views
	{name: 'avatar_getViewBuffer', args: ['number'], retType: 'number'},
	{name: 'avatar_dumpViewBuffer', args: ['number', 'string'], retType: null},

];

// remember you don't have to export your func like this, you can do one-offs for testing with ccall():
// https://emscripten.org/docs/api_reference/preamble.js.html#calling-compiled-c-functions-from-javascript

// hey, how about common constants between C++ and JS?
// no strings.  Probably all ints.
let commonConstants = [
	{name: 'contDISCRETE', cppType: 'int', value: 0},
	{name: 'contWELL', cppType: 'int', value: 1},
	{name: 'contENDLESS', cppType: 'int', value: 2},
];


/* ************************************************************************** Generate Files */
// since the template strings all have tabs on most lines from the source,
// I remove them often after the string is made.  Except some lines don't need it...
// i'm inserting various newlines and tabs here and there to make them look nice.
// no problem if they're not all right; code works fine always.

// the exports.json file, needed by emcc
function generateExports() {
	let exportsFile = exportsSrc.map(funcDesc => '_' + funcDesc.name);
	exportsFile = JSON.stringify(exportsFile) + '\n';
	if (traceOutput)
		console.log('exports:\n' + exportsFile);

	fs.writeFile(`${process.env.SQUISH_ROOT}/quantumEngine/building/exports.json`,
		exportsFile,
		ex => ex && console.error('error building exports:', ex));
}

// commonConstants.h , needed by C++ AND js
function generateCommonConstants() {
	const hConsts = commonConstants.map(co => `const ${co.cppType} ${co.name} = ${co.value};`);

	let commonH = `/*
	** commonConstants.h - shared constants between JS and C++
	** this file generated ${new Date()}
	** by the file SquishyElectron/quantumEngine/building/genExports.js
	*/
	\n${hConsts.join('\n')}
	`;
	if (traceOutput)
		console.log('commonConstants.h:\n' + commonH);
	commonH = commonH.replace(/\n\t/g, '\n');  // tabs from above string
	if (traceOutput)
		console.log('commonConstants.h:\n' + commonH);

	fs.writeFile(`${process.env.SQUISH_ROOT}/quantumEngine/commonConstants.h`,
		commonH,
		ex => ex && console.error('error building exports:', ex)
	);
}


// qe.js file, funcs and constants for the js side

function generateQeJs() {
	// the JS file with the stub JS funcs that call the c++ funcs.  convert json's double " to single '
	let defineFuncBody = exportsSrc.map(funcDesc => {
		return `\t\tqe.${funcDesc.name} = cwrap('${funcDesc.name}', `+
			`${JSON.stringify(funcDesc.retType).replace(/\x22/g, '\x27')}, `+
			`${JSON.stringify(funcDesc.args).replace(/\x22/g, '\x27')});`;
	});

	const JsConsts = commonConstants.map(co => `\tqe.${co.name} = ${co.value};`);

	let code = `/*
	** qe - quantum engine interface
	** this file generated ${new Date()}
	** by the file SquishyElectron/quantumEngine/building/genExports.js
	*/

	let cwrap;
	export const qe = {};

	export function defineQEngineFuncs() {
		cwrap = window.Module.cwrap;
	\n${defineFuncBody.join('\n')}

		// constants shared with C++
	${JsConsts.join('\n\t')}
	}

	window.defineQEngineFuncs = defineQEngineFuncs;  // just in case
	window.qe = qe;

	export default qe;
	\n`;
	if (traceOutput)
		console.log('qe.js:\n' + code);
	let cleanCode = code.replace(/\n\t/g, '\n');  // tabs from above string
	if (traceOutput)
		console.log('qe.js:\n' + cleanCode);

	fs.writeFile(`${process.env.SQUISH_ROOT}/src/engine/qe.js`, cleanCode,
		ex => ex && console.error(ex));
}

/* ************************************************************************** main */

// Do it!  after the fs module is loaded
fsProm.then(fsModule => {
	fs = fsModule;

	// now write out the 3 files
	generateExports();
	generateCommonConstants();
	generateQeJs();
	// now give it time to finish, and Node will quit
}).catch(ex => {
	console.error(`error generatinig files in genExports: `, ex.stack ?? ex.message ?? ex);
	process.exit(1);
});
