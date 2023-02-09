/*
** Doc Reader -- dialog content for reading online documentation
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

import './DocReader.scss';
import CommonDialog from './CommonDialog.js';

// This is a module for CommonDialog to read docs in from docGen and public/doc.
// a 'uri' is a url path relative to /public/doc

let traceReader = true;

class DocReader extends React.Component {
	static propTypes = {
		// for first couple of renders, space and idunno are null
		docUri: PropTypes.string,
	}

	// i'll probably turn this to a function component
	constructor(props) {
		super(props);
		DocReader.me = this;

		this.state = {
			docUri: DocReader.startingUri,  // null = hide.  a URL means show.
		};
		if (traceReader) console.log(`📘 📘 doc reader constructed for '${DocReader.startingUri}'`);

	}

	static me;
	static startingUri = null;

	static openWithUri(uri) {
		// am i doing this right?!?!
		if (DocReader.me)
			DocReader.me.setState({docUri: uri});
		else
			DocReader.startingUri = uri;
		CommonDialog.openDialog(<DocReader/>, {balckgroundColor: '#fff'});
	}

	static close(uri) {
		DocReader.me.setState({docUri: null});
		CommonDialog.close()
	}

	render() {
		let s = this.state;

		// figure out the size the iframe should be, based on the viewport size
		let frameWidth = window.innerWidth - 100;
		let frameHeight = window.innerHeight - 200;
		let src = s.docUri ? `/doc/${s.docUri}` : 'about:blank';
		return (
			<article id='DocReader' >
				<button className='x_close_box' onClick={CommonDialog.closeDialog} >×</button>
				<iframe src={src} name='DocReader' title='about squishy electron'
					allow='fullscreen' referrerPolicy='no-referrer'
					width={frameWidth} height={frameHeight} >
				</iframe>
			</article>
		);

		// someday, add in the
		// sandbox='allow-forms allow-modals allow-same-origin allow-scripts allow-storage-access-by-user-activation'
		// attribute for the iframe
	}


}


export default DocReader;
