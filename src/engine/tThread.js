/*
** t thread -- top level thread source for crunching thread
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

// see also eThread.js
// this sourcefile is not processed by WebPack; it's run raw by the browser.
// So this will import the raw qe.js file
// actually a symlink in the public directory

//import qe from './qe.js';

debugger;

self.addEventListener('error', err => {
	console.error(`tThread error E: `, err.stack ?? err.message ?? err);
	debugger;
});

self.addEventListener('unhandledrejection', err => {
	console.error(`tThread error UHR: `, err.stack ?? err.message ?? err);
	debugger;
});

let reactBuildType;

console.log(`griinderWorker: isSecureContext=${self.isSecureContext},
crossOriginIsolated=${self.crossOriginIsolated}`);

console.log(`Here we are, working away!  self.isSecureContext=`,
	self.isSecureContext);
postMessage({verb: 'ping', message: `the thread lives!`});

onmessage =
ev => {
	debugger;
	let msg = ev.data;
	console.log(`worker gota mesage: `, ev, ev.msg);

	if (msg.source) {
		// this is what we expect, seems to happen when thread starts up?  no when included from a s<script
		if (msg.source != "react-devtools-inject-backend") {
			console.log(`got msg from the sky:`, msg.source, msg);
			// should be "development" or whatever
			reactBuildType = msg.reactBuildType;
			return;
		}
		//		still from the <script tag call
		// also got {
		//    "source": "react-devtools-bridge",
		//    "payload": {
		//        "event": "backendVersion",
		//        "payload": "4.25.0-336ac8ceb"
		//    }
		//}
		//	{
		//"source": "react-devtools-bridge",
		//"payload": {
		//	"event": "isSynchronousXHRSupported",
		//	"payload": true
		//}
		//}

		//{
		//	"source": "react-devtools-bridge",
		//	"payload": {
		//		"event": "operations",
		//		"payload": [
		//			1,
		//			1,
		//			18,
		//			13,
		//			69,
		//			114,
		//...            0,
		//			2,
		//			0
		//		]
		//	}
		//}
		//{}
		//    "source": "react-devtools-content-script",
		//    "hello": true
		//}
	}

	switch (msg.verb) {
	case 'ping':
		console.log(`ping from main thread:`, msg.message);
		break;

	case 'start':
		// Start the C++ iteration loop
		qe.avatar_iterationLoop(msg.avatarPointer, 4);
		break;

	case 'iterate':
		// time to iterate again!  C++ will start After any current iteration finishes
		qe.avatar_pleaseIterate(msg.avatarPointer);
		break;

	default:
		console.error(`tThread error, bad verb: '${msg.verb}':`, msg);
		break;
	}
	// now send a message back
	//postMessage({verb: 'ping', message: `ok so worker got this message, '${ev.data}'`});
}

if (self.crossOriginIsolated) {
	// Post SharedArrayBuffer
	console.log(`Hey!  We're crossOriginIsolated!  Open a bottle of sekt!`)
} else {
	// Do something else
	console.log(`We're NOT crossOriginIsolated!  keep workiin at it!`)
}
