/*
** e thread -- main thread source for creating crunching threads
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

// THe main thread part of the asynch stuff.
import qe from './qe.js';

console.log(`eThread: isSecureContext=${window.isSecureContext},
crossOriginIsolated=${window.crossOriginIsolated}`);

class eThread {
	workerThreads = [];

	// pass it
	constructor() {
		if (window.Worker) {
			this.nCores = navigator.hardwareConcurrency;
			this.nThreads = 1;
			this.workerThreads = new Array(this.nThreads);

			// now set up that many threads
			// just use one for now
			for (let w = 0; w < this.nThreads; w++) {
				let opts = {type: 'module', 'name': `thread_${w}`};

				// this is a URL into the /public folder
				let worker = this.workerThreads[0] = new Worker('qe/tThread.js', opts);

				worker.onmessage =
				ev => this.messageHandler(ev.data, ev.target);

				// now send something...
				worker.postMessage({verb: 'ping', message: `Welcome, thread!`});

			}

		}
	}

	// tell the thread(s) to do 1 iteration, like we did synchronously but now done by the thread(s)
	oneIteration(avatar) {
		if (window.Worker)
			this.workerThreads[0].postMessage({verb: 'iterate', avatar: avatar.pointer});
		else {
			qe.avatar_oneIteration(avatar.pointer);
		}
	}

	// messages to UI thread from whatever thread
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
