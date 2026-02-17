/*
** Doc Reader -- dialog content for reading online documentation
** Copyright (C) 2023-2026 Tactile Interactive, all rights reserved
*/

import React, {useState, useRef} from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';

import './DocReader.scss';
import CommonDialog from '../widgets/CommonDialog.js';

// This is a module for CommonDialog to read docs in from docGen and public/doc.
// a 'uri' is a url path relative to /public/doc

let traceReader = true;



// App will call this if the user resizes the window
// export function setDimensions(width) {
// 	if (! DocReader.me)
// 		return;
//
// 	// actually we don't use that width, but at least we're
// 	// notified.  The body isn't always as high as the whole window, it
// 	// wraps the content.  Also, it might be taller; it's the content, not
// 	// the window
// 	DocReader.me.setState(DocReader.me.getOurDimensions());
// }

// want to fit inside the window, whatever its size
// getOurDimensions() {
// 	return {
// 		width: (window.innerWidth - 100) + 'px',
// 		height: (window.innerHeight - 100) + 'px,
// 	}
// }


const propTypes = {
	bodyWidth: PropTypes.number,
}

// this is a permanent part of the dom, in hte <App, so no URL
function DocReader(props) {
	cfpt(propTypes, props);

	DocReader.bodyWidth = props.bodyWidth;

	// call this so the doc viewed will be the startingUri.
	// starting: because of security rules, if the user surfs away, we can't know.
	let [startingUri, setStartingUri] = useState(null);
	//let [startingUri, setStartingUri] = useState(DocReader.startingUri);
	DocReader.setStartingUri = setStartingUri;

	// docHeight set by ... I dunno
	let [docHeight, setDocHeight] = useState(window.innerHeight / 2);

	// the <dialog element itself, NOT a CommonDialog
	let dialogRef = useRef();
	DocReader.instance = dialogRef.current;

	const handleError =
	(ev) => {
		debugger;
		DocReader.close();
		let exc = new Error('Sorry, no such topic available.');
		CommonDialog.openErrorDialog(exc, 'Doc Reader')
	}

	let src = startingUri ? `/doc/${startingUri}` : 'about:blank';

	//  iframe needs height and width as attributes.  Blank if not showing.
	let content = (
		<iframe
			src={src} name='DocReader' title='about squishy electron'
			allow='fullscreen' referrerPolicy='no-referrer' onError={handleError}
			width={props.bodyWidth} height={docHeight} >
		</iframe>
	);

	if (traceReader) {
		let blurb = startingUri ? `for '${src}' ` : 'empty';
		if (traceReader)
			console.log(`📘 doc reader constructed ${blurb} with bodywidth=`, props.bodyWidth);
	}

	return (
		<dialog id='DocReader' ref={dialogRef} >
			<button className='x_close_box' onClick={DocReader.close} >×</button>
			{content}
		</dialog>
	);

	// someday, maybe add in the
	// sandbox='allow-forms allow-modals allow-same-origin allow-scripts allow-storage-access-by-user-activation'
	// attribute for the iframe
	// or, maybe doesn't matter, these are security things, and it's all ours
}

// There is one and only one docReader component, alive always in the page.
DocReader.instance = null;
DocReader.startingUri = null;
DocReader.bodyWidth = null;

// this uri (part of a URL) could also be a single word.  If no slashes,
// it's a topic directory with an html file with the same name.
DocReader.openWithUri = function openWithUri(topic, title) {
	// if (!DocReader.current)
	// 	return;
	let uri = topic;
	if (!/\//.test(topic))
		uri = `${topic}/${topic}.html`;

	// title: what happens if the user surfs to a different doc page?

	// change in uri state triggers re-render
	DocReader.setStartingUri(uri);
	DocReader.instance?.show();
};

DocReader.close = function closeDocReader() {
	DocReader.instance.close();
};



export default DocReader;
