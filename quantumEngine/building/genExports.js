#!/usr/bin/env node
/*
** generate exports -- generate files for JS calling C++ code through emscripten
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

if (! process.env.SQUISH_ROOT) throw "SQUISH_ROOT not defined!";

console.log(`Run this whenever the list of C++ functions to call from JS changes.`)
const fs = require('fs');

/* ************************************************************************** Tables of Inputs */

// the exports list.
// in C++: each function must be declared 'export "C" ...'
// in JS: import qe from 'engine/qe', then use qe.funcname()
// also must call defineQEngineFuncs after C++ is initialized
exportsSrc  = [
	// args and retType can be 'number', 'string', 'array' (of bytes), or null
	// meaning void. That's all.  Anything more complex, you have to make up out
	// of those with multiple calls or a typed array.
	{name: 'main', args: [], retType: 'number'},

	// recreating the space
	{name: 'startNewSpace', args: ['string'], retType: 'number'},
	{name: 'addSpaceDimension', args: ['number', 'number', 'string'], retType: null},
	{name: 'completeNewSpace', args: [], retType: 'number'},
	{name: 'deleteTheSpace', args: [], retType: null},


	// gets
	{name: 'getCppExceptionMessage', args: ['number'], retType: 'number'},


	// the potential
	{name: 'qSpace_dumpPotential', args: ['string'], retType: 'number'},
	// now done in js {name: 'qSpace_setZeroPotential', args: [], retType: 'number'},
	// now done in js {name: 'qSpace_setValleyPotential', args: ['number', 'number', 'number'], retType: 'number'},

	// params
	//converted to direct{name: 'Avatar_setDt', args: ['number'], retType: null},
	//converted to direct{name: 'Avatar_setStepsPerIteration', args: ['number'], retType: null},
	//converted to direct{name: 'Avatar_setLowPassFilter', args: ['number'], retType: null},

	// accept an integer pointer to the qWave as first arg
	{name: 'wave_normalize', args: ['number'], retType: null},

	// avatars - all accept an integer pointer to the avatar as first argument
	{name: 'avatar_loadViewBuffer', args: ['number'], retType:  'number'},
	{name: 'avatar_oneIteration', args: ['number'], retType: 'number'},
	{name: 'avatar_askForFFT', args: ['number'], retType: null},
	{name: 'avatar_delete', args: ['number'], retType: null},

	// views
	{name: 'avatar_getViewBuffer', args: ['number'], retType: 'number'},
	//converted to direct{name: 'qViewBuffer_loadViewBuffer', args: ['number'], retType:  'number'},
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

// ****************************** the exports.json file, needed by emcc */
let exportsFile = exportsSrc.map(funcDesc => '_' + funcDesc.name);
fs.writeFile(`${process.env.SQUISH_ROOT}/quantumEngine/building/exports.json`,
	JSON.stringify(exportsFile) + '\n',
	ex => ex && console.error('error building exports:', ex));


// ****************************** commonConstants.h , needed by C++ */

const hConsts = commonConstants.map(co => `const ${co.cppType} ${co.name} = ${co.value};`);

const commonH = `/*
** commonConstants.h - shared constants between JS and C++
** this file generated ${new Date()}
** by the file SquishyElectron/quantumEngine/building/genExports.js
*/

${hConsts.join('\n')}
`;

fs.writeFile(`${process.env.SQUISH_ROOT}/quantumEngine/commonConstants.h`,
	commonH,
	ex => ex && console.error('error building exports:', ex)
);



/* ****************************** qe.js file, for the js side */

// the JS file with the stub JS funcs that call the c++ funcs.  convert json's double " to single '
let defineFuncBody = exportsSrc.map(funcDesc => {
	return `\tqe.${funcDesc.name} = cwrap('${funcDesc.name}', `+
		`${JSON.stringify(funcDesc.retType).replace(/\x22/g, '\x27')}, `+
		`${JSON.stringify(funcDesc.args).replace(/\x22/g, '\x27')});`;
});

const JsConsts = commonConstants.map(co => `\tqe.${co.name} = ${co.value};`);

const code = `/*
** qe - quantum engine interface
** this file generated ${new Date()}
** by the file SquishyElectron/quantumEngine/building/genExports.js
*/

let cwrap;
export const qe = {};

export function defineQEngineFuncs() {
	cwrap = window.Module.cwrap;

${defineFuncBody.join('\n')}

	// constants shared with C++
${JsConsts.join('\n')}
}

window.defineQEngineFuncs = defineQEngineFuncs;  // just in case
window.qe = qe;

export default qe;
`;

fs.writeFile(`${process.env.SQUISH_ROOT}/src/engine/qe.js`, code,
	ex => ex && console.error(ex));

