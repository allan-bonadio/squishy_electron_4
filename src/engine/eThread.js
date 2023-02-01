/*
** e thread -- main thread source for creating crunching threads
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

// The main thread part of the asynch stuff. It turns out that most of the
// worker stuff in emscripten simply goes and calls the regular JS methods todo
// the same things.  So C++ isn't the lowest level, JS is.  So call JS and have
// full control.
import qe from './qe.js';

let traceIntegration = false;


// master switch cuz still in development
let useThreads = false;


console.log(`eThread: isSecureContext=${window.isSecureContext},`+
	`crossOriginIsolated=${window.crossOriginIsolated}`);

// i can't decide if there's one of these for each thread or one total.  hmmm
// how about this: everythiing that's unique, make iit static.  Prob moved to
// Avatar evenually.  Oh wait ... stuff that's per-space, actually per
// SquishPanel, should be on the avatar.  Then there's really unique things like
// nCores... everything per-thread, make it for the eThread iiinstance.
class eThread {
	static workerThreads = [];  // instances of Worker
	static threads = [];  // instances of eThread

	// for each thread, this runs in the main thread, to spawn off the worker.
	// the code for each thread's root is off in /public/qEng/tThread.js
	// a symlink that poinits to engine/tThread.js
	constructor(serial, avatar) {
		console.log(`⛏ eThread constructor ${serial} about to make worker`);
		// the root code is a URL into the /public folder
		let opts = {type: 'module', name: `qThread_${serial}`};
		debugger;
		let worker = this.worker = eThread.workerThreads[0] =
			new Worker(new URL('./tThread.js', import.meta.url), opts);
			// webpack says dosnt work new Worker('qEng/tThread.js', opts);

		// let's try this its cheatin and everythigni....
		worker.itsCheatinAndEverythoing = 9;

		// when is the worker alerted and when is the parent alerted?
		worker.onerror =
		ev => {
			console.info(`eThread: tThread error OE: `, ev);
			console.error(`eThread tThread error OE: ${ev.filename}:${ev.lineno}:${ev.colno}  - ${ev.message}  - ${ev.error ?? 'no error obj'}  - `);
			//console.error(`eThread: tThread error OE: `, err.stack ?? err.message ?? err);
			debugger;
		};

		worker.onmessageerror =
		ev => {
			console.error(`eThread: tThread  MessageEvent OME: `, ev);
			//console.error(`eThread: tThread error OE: `, err.stack ?? err.message ?? err);
			debugger;
		};

		// msgs coming in to the main thread from worker
		worker.onmessage =
		ev => this.messageHandler(ev.data, ev.target);

		// now to create its own module object.  Learned this from
		// https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/Module
		// guess each thread needs to do this individually?  maybe not...
		// see also instantiateStreaming() which claims to be faster but not sure we can use it
		// https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/instantiateStreaming
		//debugger;
		//WebAssembly.compileStreaming(fetch("qEng/quantumEngine.wasm"))
		//.then(newModule => {
		//	// the worker also needs to know which one iit is, and what avatar is running the show
		//	console.log(`⛏ eThread ${serial} compiled wasm file, sending off to new thread`, newModule);
		//	worker.postMessage({verb: 'init', module: newModule, serial, avatarPointer: avatar.pointer});
		//})
		//.catch(err => console.error(`error while posting init mesage:`, err));

		//worker.postMessage({verb: 'init', module: window.Module, serial, avatarPointer: avatar.pointer});
		worker.postMessage({verb: 'init', serial, avatarPointer: avatar.pointer});
	}

	// This runs in the main thread to create the threads and set doingThreads
	static createThreads(avatar) {
		if (!window.Worker || !useThreads) {
			eThread.doingThreads = false;
			return;
		}

		// we're not ready for this
		return;

		//eThread.nCores = navigator.hardwareConcurrency;
		//eThread.nThreads = 1;
		//eThread.workerThreads = new Array(this.nThreads);
		//eThread.threads = new Array(this.nThreads);
		//
		//// now set up that many threads
		//// just use one for now
		//for (let serial = 0; serial < this.nThreads; serial++) {
		//	try {
		//		console.log(`⛏ eThread creating thread ${serial}`);
		//		const thread = eThread.threads[serial] = new eThread(serial, avatar);
		//
		//
		//		// now send something...
		//		thread.worker.postMessage({verb: 'ping', message: `Welcome, thread!`});
		//		eThread.doingThreads = true;
		//		console.log(`⛏ eThread done creating thread ${serial} (except for async stuff)`);
		//	} catch (ex) {
		//		console.error(`eThread: worker creation exc: `, ex.stack ?? ex.message ?? ex);
		//		debugger;
		//		eThread.doingThreads = false;
		//		break;
		//	}
		//}
	}

	// tell the thread(s) to do 1 frame, like we did synchronously but now done by the thread(s)
	static oneFrame(avatar) {
		// i have to think of what to do if there's no workers available...
		if (eThread.doingThreads) {
			if (traceIntegration)
				console.log(`⛏ eThread postMessage toframe`);
			eThread.workerThreads[0].postMessage({verb: 'integrate', avatarPointer: avatar.pointer});
		}
		else {
			if (traceIntegration)
				console.log(`⛏ eThread postMessage directly cuz no threads`);
			qe.grinder_oneFrame(avatar.pointer);
		}
	}

	// messages to main thread from whatever thread
	messageHandler(msg, worker) {
		console.log(`eThread gota mesage: `, msg, worker);

		switch (msg.verb) {
		case 'ping':
			console.log(`ping to main:`, msg.message);
			break;

		default:
			console.error(`grinderWorker no such verb '${msg.verb}': `, msg);
		}
		// now send a message back
		// this.workerThreads[0].worker.postMessage({verb: 'ping', message: `so eThread got this message`});

	}
}

export default eThread;
