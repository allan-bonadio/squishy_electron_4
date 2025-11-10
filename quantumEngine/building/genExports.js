#!/usr/bin/env node
/*
** generate exports -- generate files for JS calling C++ code through emscripten
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

let traceOutput = false;

if (! process.env.SQUISH_ROOT) throw "env var SQUISH_ROOT not defined!  Should be the source tree root.";

console.log(`genExports: Run this whenever the list of C++ functions to call from JS changes.`);

// we mostly don't use fs promises; the promise is just for loading the fs package
const fsProm = import('fs');
let fs;  // filled in after promise is resolved

/* ************************************************************************** Tables of Inputs */

// the exports list.
// in C++: each function must be declared 'export "C" ...'
// in JS: import qeConsts from 'engine/qeConsts', then use qeConsts.funcname()
// and: import qeFuncs from 'engine/qeFuncs', then use qeFuncs.constName()
// also must call defineQEngineFuncs() after C++ is initialized
// Very often, object pointers are passed in as numbers from JS, which keeps pointers for significant objects
// then, in C++, those arguments are just the right type.  ez peazy.
let exportsSrc  = [
	// args and retType can be 'number', 'string', 'array' (of bytes), or null
	// meaning void. That's all.  Anything more complex, you have to make up out
	// of those with multiple calls or a typed array.
	{name: 'main', args: [], retType: 'number'},

	// creating the space
	{name: 'startNewSpace', args: ['string'], retType: 'number'},
	{name: 'addSpaceDimension', args: ['number', 'number', 'number', 'number', 'string'], retType: null},
	{name: 'completeNewSpace', args: ['number', 'number'], retType: 'number'},
	{name: 'deleteFullSpace', args: ['number'], retType: null},

	// errors & exceptions
	{name: 'getCppExceptionMessage', args: ['number'], retType: 'number'},

	// the voltage
	{name: 'qSpace_dumpVoltage', args: ['number', 'string'], retType: 'number'},

	/* ***************************************** waves, buffers */

	{name: 'buffer_allocateZeroedWave', args: ['number'], retType: 'number'},

	{name: 'buffer_allocateWave', args: ['number'], retType: 'number'},

	// any size data
	{name: 'buffer_allocateBuffer', args: ['number'], retType: 'number'},

	// accept an integer pointer to the qCavity as first arg
	{name: 'cavity_normalize', args: ['number'], retType: null},

	// create a new qCavity, allocating the space dynamically, that conforms to the space passed in
	{name: 'cavity_create', args: ['number', 'number'], retType: 'number'},
	{name: 'cavity_delete', args: ['number'], retType: null},

	{name: 'flick_create', args: ['number', 'number'], retType: 'number'},
	{name: 'flick_delete', args: ['number'], retType: null},

	//? can't get to work {name: 'flick_delete', args: ['number'], retType: null},

	/* ***************************************** avatars */
	// most accept an integer pointer to the avatar as first argument
	// except this that creates a new one.  When a space is created,
	// it also makes its own avatars.
	{name: 'avatar_create', args: ['number', 'string'], retType: 'number'},

	{name: 'avatar_setWaveSpace',
		args: ['number', 'number', 'number'], retType: null},

	// create one buffer in the set
	{name: 'avatar_attachViewBuffer',
		args: ['number', 'number', 'number', 'number'], retType: 'number'},

	{name: 'avatar_attachIndexBuffer',
		args: ['number', 'number', 'number'], retType: 'number'},

	{name: 'avatar_dumpMeta', args: ['string'], retType: null},

	{name: 'avatar_dumpViewBuffers', args: ['number', 'number', 'string'], retType: null},

	{name: 'avatar_dumpIndex', args: ['number', 'string'], retType: null},

	{name: 'avatar_getViewBuffer', args: ['number', 'number'], retType: 'number'},

	//{name: 'avatar_loadViewBuffers', args: ['number', 'number'], retType: null},  // kindof defunct

	{name: 'avatar_avFlatLoader', args: ['number', 'number', 'number', 'number'], retType: null},


	// ************************* grinder

	{name: 'grinder_create', args: ['number', 'number', 'string'], retType: 'number'},
	{name: 'grinder_delete', args: ['number'], retType: null},

	// alternative to the JS atomic triggering
	{name: 'grinder_triggerIteration', args: ['number'], retType: null},

	// only needed if UI thread does a frame's worth of integration (siingle thread)
	{name: 'grinder_oneFrame', args: ['number'], retType: null},

	{name: 'grinder_askForFFT', args: ['number'], retType: null},

	// this one is called from JS
//	{name: 'grinder_copyFromAvatar', args: ['number', 'number'], retType: null},
//
//	// i think this one is actually only called from C++
//	{name: 'grinder_copyToStage', args: ['number', 'number'], retType: null},

	// return the  message stored in grinder->integrationEx
	{name: 'grinder_getExceptionMessage', args: [], retType: 'string'},


	// ************************* pthreads / qThread

	{name: 'thread_setupThreads', args: [], retType: 'number'},

];

// remember you don't have to export your func like this, you can do one-offs for testing with ccall():
// https://emscripten.org/docs/api_reference/preamble.js.html#calling-compiled-c-functions-from-javascript

// common constants between C++ and JS
let commonConstants = [
	{name: 'contDISCRETE', cppType: 'int', value: 0},
	{name: 'contWELL', cppType: 'int', value: 1},
	{name: 'contENDLESS', cppType: 'int', value: 2},

	// Tolerance for ==.  Absolute, not relative, we're comparing 𝜓 values here.
	// all values are |𝜓| <1, and typically |𝜓| > roundoff error
	// these are not really the radius, it's more rectangular, but pretty much the same idea
	{name: 'ERROR_RADIUS', cppType: 'double', value: 1e-12},

	// out-of-band value that means Fastest on frame speed menu
	{name: 'FASTEST', cppType: 'double', value: 999_999},

	// phony bool value that marks the end of a qGrinder object
	{name: 'grSENTINEL_VALUE', cppType: 'byte', value: 123},

	// view buffer generators - all of these fill (one or more) typed arrays,
	// usually/always floats.  each in its own file.
	{name: 'avNULL', cppType: 'int', value: 0},
	{name: 'avOldFLAT', cppType: 'int', value: 1},
	{name: 'avFLAT', cppType: 'int', value: 2},
	{name: 'avFLAT_TICS', cppType: 'int', value: 3},
	{name: 'avRAINBOW', cppType: 'int', value: 4},

	// labels, mostly for debugging, on dumps and objects
	{name: 'MAX_LABEL_LEN', cppType: 'int', value: 15},


];


/* *********************************** Generate .h Files */
// since the template strings all have tabs on most lines from the source,
// I remove them often after the string is made.  Except some lines don't need it...
// i'm inserting various newlines and tabs here and there to make them look nice.
// no problem if they're not all right; code works fine always.

// the exports.json file, needed by emcc
function generateExports() {
	let exportsFile = exportsSrc.map(funcDesc => '_' + funcDesc.name);
	exportsFile = JSON.stringify(exportsFile) + '\n';
	exportsFile = exportsFile.replace(',', ', ');
	if (traceOutput)
		console.log('exports:\n' + exportsFile);

	fs.writeFile(`${process.env.SQUISH_ROOT}/quantumEngine/building/exports.json`,
		exportsFile,
		ex => ex && console.error('error building exports:', ex));
}

// commonConstants.h , needed by C++ AND js
function generateCommonConstants() {
	const hConsts = commonConstants.map(co =>
		`const ${co.cppType} ${co.name} = ${co.value};`);

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


/* *********************************** Generate .js Files */
// qeFuncs.js and qeConsts.js files, funcs and constants for the js side
// New!  qeFuncs.js and qeConsts.js


// the funcs need emscripten's cwrap() to wrap them; only available in browser while running
// and after this function runs
function generateQeFuncs() {
	// the JS file with the stub JS funcs that call the c++ funcs.  convert json's double " to single '
	let defineFuncBody = exportsSrc.map(funcDesc => {
		return `\t\tqeFuncs.${funcDesc.name} = cwrap('${funcDesc.name}', `+
			`${JSON.stringify(funcDesc.retType).replace(/\x22/g, '\x27')}, `+
			`${JSON.stringify(funcDesc.args).replace(/\x22/g, '\x27')});`;
	});

	let funcCode = `/*
	** qeFuncs - quantum engine functions shared js ⇆  C++
	** this file generated ${new Date()}
	** by the file SquishyElectron/quantumEngine/building/genExports.js
	*/

	let cwrap;
	export const qeFuncs = {};

	export function defineQEngineFuncs() {
		// needs to run this in the app with emscripten set up for cwrap to exist
		// or punt on it for node.js situations like unit tests
		// eslint-disable-next-line no-restricted-globals
		cwrap = globalThis.Module.cwrap;

${defineFuncBody.join('\n')}

	}

	globalThis.defineQEngineFuncs = defineQEngineFuncs;  // just in case
	globalThis.qeFuncs = qeFuncs;

	export default qeFuncs;
	\n`;
	if (traceOutput)
		console.log('qeFuncs.js:\n' + funcCode);
	let cleanCode = funcCode.replace(/\n\t/g, '\n');  // tabs from above string
	if (traceOutput)
		console.log('qeFuncs.js:\n' + cleanCode);

	fs.writeFile(`${process.env.SQUISH_ROOT}/src/engine/qeFuncs.js`, cleanCode,
		ex => ex && console.error(ex));
}

function generateQeConsts() {

	const JsConsts = commonConstants.map(co => `\tqeConsts.${co.name} = ${co.value};`);

	let constCode = `/*
	** qeConsts - quantum engine constants shared js ⇆  C++
	** this file generated ${new Date()}
	** by the file SquishyElectron/quantumEngine/building/genExports.js
	*/

	const qeConsts = {};
	${JsConsts.join('\n\t')}
	export default qeConsts;
	`;

	if (traceOutput)
		console.log('qeConsts.js:\n' + constCode);
	let cleanCode = constCode.replace(/\n\t/g, '\n');  // tabs from above string
	if (traceOutput)
		console.log('qeConsts.js:\n' + cleanCode);

	fs.writeFile(`${process.env.SQUISH_ROOT}/src/engine/qeConsts.js`, cleanCode,
		ex => ex && console.error(ex));
}


/* ************************************************************************** main */

// Do it!  after the fs module is loaded
fsProm.then(fsModule => {
	fs = fsModule;

	// now write out the 3 files
	generateExports();
	generateQeFuncs();

	generateCommonConstants();
	generateQeConsts();
	console.log(`genExports done `);
	// now give it time to finish, and Node will quit
}).catch(ex => {
	console.error(`error generatinig files in genExports: `, ex.stack ?? ex.message ?? ex);
	process.exit(1);
});
