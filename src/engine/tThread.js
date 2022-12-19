/*
** t thread -- top level thread source for crunching thread
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/
/* eslint-disable no-restricted-globals */

// see also eThread.js
// this sourcefile is not processed by WebPack; it's run raw by the browser.
// So this will import the raw qe.js file
// actually a symlink in the public directory

//import qe from './qe.js';

console.log(`tThread worker starts`);
console.log(`isSecureContext=${self.isSecureContext},
				crossOriginIsolated=${self.crossOriginIsolated}`);

debugger;

onerror =
ev => {
	console.error(`tThread error OE: `,
		ev.stack ?? ev.reason.stack ?? ev.message ?? ev.reason.message ?? ev,
		ev);
	debugger;
}

onunhandledrejection =
ev => {
	console.error(`tThread onunhandledrejection error UHR: `,
		ev.stack ?? ev.reason.stack ?? ev.message ?? ev.reason.message ?? ev,
		ev);
	debugger;
}




//let reactBuildType;
//let serial, avatarPointer;
let importantWorkerStuff = {reactBuildType: null,serial: null, avatarPointer: null, module: null, instance: null};

//console.info(` 🧽  web assembly:`,WebAssembly );
//console.info(` 🧽   WebAssembly?.Module:`,WebAssembly?.Module );
//console.info(` 🧽   WebAssembly?.Memory:`,WebAssembly?.Memory );
//console.info(` 🧽   WebAssembly?.Module?.cwrap:`,WebAssembly?.Module?.cwrap );

// copied out of qe.js
//const avatar_oneIteration = WebAssembly?.Module?.cwrap('avatar_oneIteration', null, ['number']);

postMessage({verb: 'ping', message: `the thread lives!`});

onmessage =
ev => {
	let msg = ev.data;
	console.log(`worker gota mesage: `, ev, ev.msg);

	if (msg.source) {
		// do these happen for threads?  Seems they happen for <script tag code.
		console.info(`yet another source msg '${msg.source}':`);
		debugger;
		// this is what we expect, seems to happen when thread starts up?  no when included from a s<script
		if (msg.source != "react-devtools-inject-backend") {
			console.log(`got msg from the sky:`, msg.source, msg);
			// should be "development" or whatever
			importantWorkerStuff.reactBuildType = msg.reactBuildType;
			return;
		}
		return;
	}

	switch (msg.verb) {
	case 'ping':
		console.log(`ping from main thread:`, msg.message);
		break;

//	case 'start':
//		// Start the C++ iteration loop
//		qe.avatar_initIterationLoop(msg.avatarPointer, 4);
//		break;

	case 'init':
		initMe(msg);

		break;

	case 'iterate':
		iterate(msg);
		break;

	default:
		console.error(`tThread error, bad verb: '${msg.verb}':`, msg);
		break;
	}
}

// first message we get has a Module object plus other stuff
function initMe(msg) {
	console.log(`initMe: received msg:`, msg);
debugger;
	importantWorkerStuff.serial = msg.serial;
	importantWorkerStuff.avatarPointer= msg.avatarPointer;
//
//		// and now what we've been waiting for.  I just copied this out of the doc;
//		// I have no idea what imported_func and exported_func are
//		const importObject = {
//	//		imports: {
//	//			cwrap(arg) {
//	//				console.log(arg);
//	//			},
//	//			avatar_askForFFT(arg) {
//	//				console.log(arg);
//	//			},
//	//			addSpaceDimension(arg) {
//	//				console.log(arg);
//	//			},
//	//		},
//		};
//		console.log(`initMe: importObject i made = `, importObject);

	// see also https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/instantiate
//	WebAssembly.instantiate(msg.module, importObject)
//	.then( ({module, instance}) => {
		console.log(`initMe: received module & instance:`, msg);
		//instance.exports.exported_func();

		// now what... like this?
		importantWorkerStuff.Instance = msg.module;
		importantWorkerStuff.Constuctor = msg.WebAssemblyModule;
		console.log(`you mean this stuff?`, importantWorkerStuff);
//	})
//	.catch(err => {
//		console.error(`error instantiating the module: `,
//			ev.stack ?? ev.message ?? ev);
//		debugger;
//	});


}

// an asynch msg telling me to do an iteration
function iterate(msg) {
	// time to iterate again!  will start After any current iteration finishes
	console.log(`time to iterate again!  will start After any current iteration finishes`);
	// wait for it ... avatar_oneIteration?.(msg.avatarPointer);
}


// duz it werk?
//console.info('THREAD THREAD THREAD duz it werk?');
//console.info(WebAssembly);
//console.info(WebAssembly?.Module);
//console.info(WebAssembly?.Memory);



