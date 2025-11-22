/*
** Doc Reader -- dialog content for reading online documentation
** Copyright (C) 2023-2025 Tactile Interactive, all rights reserved
*/

import React, {useState, useRef} from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';

import './DocReader.scss';
import CommonDialog from '../widgets/CommonDialog.js';

// This is a module for CommonDialog to read docs in from docGen and public/doc.
// a 'uri' is a url path relative to /public/doc

let traceReader = false;



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
	// for first couple of renders, space and idunno are null
	docUri: PropTypes.string,
}

function DocReader(props) {
	cfpt(propTypes, props);

	let [startingUri, setStartingUri] = useState(DocReader.startingUri);
	let [frame, setFrame] = useState([0, 0, (window.innerWidth - 100), (window.innerHeight - 100)]);
	let dialogRef = useRef();
	if (traceReader) console.log(`📘 oc reader constructed for '${startingUri}' in `, frame);

	DocReader.openWithUri ??= function openWithUri(uri) {
		if (!dialogRef.current)
			return;

		setStartingUri(uri);
		dialogRef.current.show();

		// // am i doing this right?!?!
		// if (DocReader.me)
		// 	DocReader.me.setState({docUri: uri});  // doesn't exist yet
		// else
		// 	DocReader.startingUri = uri;
		// CommonDialog.openDialog(<DocReader/>,
		// 	{backgroundColor: '#fff', top: '50px', transform: 'none'});
	};

	DocReader.close ??= function closeDocReader(uri) {
		dialogRef.current.close();
	};

	const handleError =
	(ev) => {
		debugger;
		dialogRef.current.close();
		let exc = new Error('Sorry, no such topic available.');
		CommonDialog.openErrorDialog(exc, 'Doc Reader')
	}

	// figure out the size the iframe should be, based on the viewport size.
	//  iframe needs height and width as attributes.
	let src = startingUri ? `/doc${startingUri}` : 'about:blank';
	// this was formerly on the <dialog element    closedBy='any'
	return (
		<dialog className='DocReader' closedby='any' ref={dialogRef}>
			<button className='x_close_box' onClick={CommonDialog.closeDialog} >×</button>
			<iframe src={src} name='DocReader' title='about squishy electron'
				allow='fullscreen' referrerPolicy='no-referrer' onError={handleError}
				width={frame[2]} height={frame[3]} >
			</iframe>
		</dialog>
	);

	// someday, maybe add in the
	// sandbox='allow-forms allow-modals allow-same-origin allow-scripts allow-storage-access-by-user-activation'
	// attribute for the iframe
	// or, maybe doesn't matter, these are security things, and it's all ours


}

//export const openWithUri(uri) {

export default DocReader;
