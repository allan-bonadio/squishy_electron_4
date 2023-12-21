/*
** e thread -- main thread source for creating crunching threads
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

// The main thread part of the asynch stuff. It turns out that most of the
// worker stuff in emscripten simply goes and calls the regular JS methods todo
// the same things.  So C++ isn't the lowest level, JS is.  So call JS and have
// full control.
import qe from './qe.js';

let traceThreadCreation = true;
let traceMessages = true;
let traceIntegration = false;

console.log(`eThread: isSecureContext=${window.isSecureContext},`+
	`crossOriginIsolated=${window.crossOriginIsolated}`);

// i can't decide if there's one of these for each thread or one total.  hmmm
// how about this: everythiing that's unique, make iit static.  Prob moved to
// grinder evenually.  Oh wait ... stuff that's per-space, actually per
// SquishPanel, should be on the grinder.  Then there's really unique things like
// nCores... everything per-thread, make it for the eThread instance.
class eThread {
	static workers = [];  // instances of Worker
	static threads = [];  // instances of eThread
	// eEngine turns this on or off; see.  static doingThreads = false;

	constructor(serial, grinder) {
		if (traceThreadCreation)
			console.log(`⛏ eThread constructor: ${serial} about to make worker`);

		//debugger;
		let worker = {};
		//let worker = this.worker = window.makeAWorker(`thread_${serial}`, grinder);
		worker.serial = serial;

		eThread.workers[serial] = worker;
		eThread.threads[serial] = this;

		if (traceThreadCreation)
			console.log(`⛏ eThread constructor: ${serial} created, about to setup handlers`);

		this.setupEventHandlers();

		if (traceThreadCreation)
			console.log(`⛏ eThread constructor ${serial} Done.`);

		// when is the worker alerted and when is the parent alerted?
	}

	// as the thread finishes startup, it'll send this message to us (see in .main.js)
	static confirmThread(serial) {
		if (traceMessages)
			console.log(`⛏ thread ${serial} successfully launched`)
		this.threads[serial].confirmed = true;
	}

	// This runs in the main thread to create All (or most of ) the threads
	// shortly after page startup
	static createThreads(grinder) {
		this.nCores = navigator.hardwareConcurrency;
//<<<<<<< Updated upstream
		this.nThreads = 1;
		this.workers = new Array(this.nThreads);
		this.threads = new Array(this.nThreads);
		if (traceThreadCreation)
			console.log(`⛏ eThread starting thread creation blitz`);

		// now set up that many threads
		for (let serial = 0; serial < this.nThreads; serial++) {
			try {
				console.log(`⛏ eThread creating thread ${serial}`);
				this.threads[serial] = new this(serial, grinder);

				// now, try it out a few times
//				setInterval(() => {
//					window.Atomics.notify(grinder.ints, grinder.needsIntegrationOffset, 1);
//				}, 2000);

			} catch (ex) {
				console.error(`eThread: worker creation ${serial} failed: `,
					ex.stack ?? ex.message ?? ex);
				debugger;

				// wait don't get discouraged so easily!
				//workers.doingThreads = false;
				break;
//=======
// 		this.nThreads = 5;
//
// 		if (doingPTHreads) {
// 			thread_startAllThreads()
// 		}
// 		else {
// 			this.workers = new Array(this.nThreads);
// 			this.threads = new Array(this.nThreads);
// 			if (traceThreadCreation)
// 				console.log(`⛏ eThread starting thread creation blitz`);
//
// 			// now set up that many threads
// 			for (let serial = 0; serial < this.nThreads; serial++) {
// 				try {
// 					console.log(`⛏ eThread creating thread ${serial}`);
// 					this.threads[serial] = new eThread(serial, grinder);
//
// 					// now, try it out a few times
// 	//				setInterval(() => {
// 	//					window.Atomics.notify(grinder.ints, grinder.needsIntegrationOffset, 1);
// 	//				}, 2000);
//
// 				} catch (ex) {
// 					console.warn(`eThread: worker creation ${serial} failed: `,
// 						ex.stack ?? ex.message ?? ex);
// 					debugger;
//
// 					// wait don't get discouraged so easily!
// 					//workers.doingThreads = false;
// 					break;
// 				}
//>>>>>>> Stashed changes
			}
		}

		if (traceThreadCreation)
			console.log(`⛏ eThread finished thread creation blitz`);
	}

	// tell the thread(s) to do 1 frame, like we did synchronously but now done by the thread(s)
	// unused for now - qGrinder does it
	static oneFrame(grinder) {
		// i have to think of what to do if there's no workers available...
		if (traceIntegration)
			console.log(`⛏ eThread postMessage toframe`);
		// this isn't right
		eThread.workers[0].postMessage({verb: 'integrate', grinderPointer: grinder.pointer});
	}

	/* ******************************************************************* msgs & events */
	// messages to main thread from whatever thread
	// handlers, in the main thread, to receive messages from a worker and do something about them
	setupEventHandlers() {
//		this.worker.addEventListener('error', ev => {
//			let err = ev.error;
//			console.error(`eThread:  ⛏ error ev: `, err.stack ?? err.message ?? err);
//			//console.error(`eThread  ⛏ error OE: ${err.filename}:${err.lineno}:${err.colno}  - `
//			//	+` ${err.message} `, ev.error ?? 'no error obj', err.stack ?? err.message ?? err);
//			debugger;
//		});
//
//		this.worker.addEventListener('messageerror', ev => {
//			console.log(`eThread ⛏: tThread  Message Error: `, ev);
//			let err = ev.error;
//			console.error(`      Message Error: `, err.stack ?? err.message ?? err);
//			debugger;
//		});

		// for messages, see onCustomMessage in the .main.js and .thread.js files
	}

}

export default eThread;
