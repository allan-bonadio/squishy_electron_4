/*
** Doc Reader -- dialog content for reading online documentation
** Copyright (C) 2023-2025 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';

import './DocReader.scss';
import CommonDialog from './CommonDialog.js';

// This is a module for CommonDialog to read docs in from docGen and public/doc.
// a 'uri' is a url path relative to /public/doc

let traceReader = false;

class DocReader extends React.Component {
	static propTypes = {
		// for first couple of renders, space and idunno are null
		docUri: PropTypes.string,
	}

	// i'll probably turn this to a function component
	constructor(props) {
		super(props);
		checkPropTypes(this.constructor.propTypes, props, 'prop', this.constructor.name);
		DocReader.me = this;

		this.state = {
			docUri: DocReader.startingUri,  // null = hide.  a URL means show.

			...this.getOurDimensions(),
		};
		if (traceReader) console.log(`📘 oc reader constructed for '${DocReader.startingUri}'`);

	}

	static me;
	static startingUri = null;

	static openWithUri(uri) {
		// am i doing this right?!?!
		if (DocReader.me)
			DocReader.me.setState({docUri: uri});  // doesn't exist yet
		else
			DocReader.startingUri = uri;
		CommonDialog.openDialog(<DocReader/>,
			{backgroundColor: '#fff', top: '50px', transform: 'none'});
	}

	static close(uri) {
		DocReader.me.setState({docUri: null});
		CommonDialog.close()
	}

	// App will call this if the user resizes the window
	static setDimensions(width) {
		if (! DocReader.me)
			return;

		// actually we don't use that width, but at least we're
		// notified.  The body isn't always as high as the whole window, it
		// wraps the content.  Also, it might be taller; it's the content, not
		// the window
		DocReader.me.setState(DocReader.me.getOurDimensions());
	}

	// want to fit inside the window, whatever its size
	getOurDimensions() {
		return {
			width: window.innerWidth - 100,
			height: window.innerHeight - 100,
		}
	}

	render() {
		let s = this.state;

		// figure out the size the iframe should be, based on the viewport size.
		//  iframe needs height and width as attributes.
		let dims = this.getOurDimensions();
		let src = s.docUri ? `/doc/${s.docUri}` : 'about:blank';
		return (
			<article id='DocReader' >
				<button className='x_close_box' onClick={CommonDialog.closeDialog} >×</button>
				<iframe src={src} name='DocReader' title='about squishy electron'
					allow='fullscreen' referrerPolicy='no-referrer'
					width={dims.width} height={dims.height} >
				</iframe>
			</article>
		);

		// someday, maybe add in the
		// sandbox='allow-forms allow-modals allow-same-origin allow-scripts allow-storage-access-by-user-activation'
		// attribute for the iframe
		// or, maybe doesn't matter, these are security things, and it's all ours
	}


}


export default DocReader;
