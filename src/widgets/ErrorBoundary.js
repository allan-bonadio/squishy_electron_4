/*
** Error Boundary -- global uncaught error handling
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

// TODO this needs some cleanup and testing.  needs to use ErrorDialog

import React from 'react';
import PropTypes, {checkPropTypes} from 'prop-types';
import './ErrorBoundary.scss';


/* React handles many errors/exceptions, by default, off the top levelby unmounting of the
/whole React component
tree in that portal.  Your whole portal has had all of its components amputated out, all
because some exception bubbled past the top.

So, ErrorBoundary is a component you use to wrap your medium or large React panel that
works like a try-catch block, except for components instead of functions.  This means
that, - during dev testing, if it crashes, you don't have to reload the app; just click a
button.  It destroys all components previously in that space on the page, and puts up a
red panel in its place.  You can then click a button to start over, with all newly created
components. - during production, we can have it reload the component, and record this
crash on a log somewhere.

Error boundaries catch exceptions in the whole tree below (inside) the ErrorBoundary.  It
catches exceptions during component:
- Construction
- Rendering
- Lifecycle methods, including componentDidMount() and componentDidUpdate().  Probably
			everything on this page: https://reactjs.org/docs/react-component.html

Except for here:
- event handlers (clicks, keystrokes, focus events) - exceptions that boil to the top get
			dropped silently.
- requestAnimationFrame(), setTimeout() and setInterval() handlers - these also swallow
			exceptions silently.
- Promises rely on their own exception catching system - see elsewhere.
- 'asynchronous' code
- code inside the ErrorBoundary itself - which is why this is a separate component

React swallowing exceptions:
	The thinking is that you're able to use try/catch in the places mentioned above where
	ErrorBoundary won't pick it up.  So, for instance, if your click handler called some
	other code, and that code threw an exception, the exception would bubble up through
	the other code, then through your event handler code, and then disappear.  Not very
	good if you're trying to debug some code, and exceptions are flying around, and you
	don't know anything about it.   The solution is to use a try/catch block.
	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling#try...catch_statement

ErrorBoundary implemented based on this page from ReactJS.org: https://reactjs.org/docs/error-boundaries.html
*/

let traceExceptions = false;


class ErrorBoundary extends React.Component {
	static propTypes = {
		howToRecover: PropTypes.func,

		jumpStartDev: PropTypes.func,
		jumpStartProd: PropTypes.func
	}

	constructor(props) {
		super(props);
		checkPropTypes(this.constructor.propTypes, props, 'prop', this.constructor.name);
		this.state = {
			errorObj: null,
			terminalErrorObj: null,
			infoObj: null,
		};

		// this numbers them if there's more than one exception (different Error instances)
		this.serial = 0;
	}

	/* **************************************************** Exception Catchers */

	// these two functions are react 'lifecycle' methods, that get called variously
	// when an exception is captured, sometimes one or the other gets called;
	// sometimes both, Derived before Catch
	// The react driver has a tendency to repeat reporting of an error, again and again.
	// Just wait for the dust to settle.

	// this catches errors in places other than render (i think).  Lifecycle funcs?
	// Here, we'll turn on state.errorObj if one comes in.
	static getDerivedStateFromError(errorObj) {
		if (traceExceptions)
			console.log(`🧨 🧨  getDerivedStateFromError():`, errorObj)

		// react will setState:
		return { errorObj };
	}

	// called when other exceptions get thrown (maybe during render?).
	// called right after render() methods have been called and dom tree
	// rebuilding/updating is happening - the 'commit' phase.
	// Usually also gets called after getDerivedStateFromError() with the same errorObj
	componentDidCatch(errorObj, infoObj) {
		if (traceExceptions)
			console.log(`🧨 🧨 ErrorBoundary: componentDidCatch() `, errorObj, infoObj);
		if (!this.state.errorObj) {
			//  first time, state.errorObj is null.  Just remember the new one.
			// next see: compDidUpdate()
			this.setState({ errorObj, infoObj });
			return;
		}

		// same error was set, before this
		if (this.state.errorObj === errorObj) {
			// just make sure we got the infoObj - getDerivedStateFromError() doesn't get that.
			if ( ! this.state.infoObj)
				this.setState({infoObj});
			return;
		}

		// those were different errors... this one is new.  this happened while handling the previous error?
		// Two strikes you're out: nested errors locks you up
		console.warn(`🧨🧨🧨🧨🧨 ErrorBoundary 🧨🧨🧨🧨🧨🧨🧨🧨🧨 this.state.errorObj !== errorObj 🧨🧨🧨🧨🧨🧨🧨🧨🧨🧨`);
		console.warn(`🧨🧨🧨🧨 ${this.state.errorObj.message} !== ${errorObj.message} 🧨🧨🧨🧨`);
		console.warn(`🧨🧨🧨 error encountered handling error; contact Allan 🧨🧨🧨`);
		this.setState({ terminalErrorObj: errorObj });
	}

	//componentDidCatch(error, info) {
	//	this.error = error;  // always a string; always same as error0
	//	if (error !== this.state.error0) throw `error != this.state.error0`;
	//
	//	this.info = info;  // object of class Object
	//	console.warn(`%%% Component Did Catch: error str=\n${error}
	//		info~=${JSON.stringify(info)}`);
	////		console.log('%%% ...error...', error, this.state.error0, this.state.error0 === error);
	////		console.log('%%% ...info...', info);
	//}


/* ************************************* Error renderers */

	// this erObj could be the terminalErrorObj, or the normal errorObj
	// come up with something to say about the errors that just happened
	renderDialogContent(eObj) {
		const { errorObj, infoObj } = this.state;
		console.info(`error obj & info`, errorObj)
		console.info(infoObj);

		// might have these, src line number & stuff where it happened
		let where = '';
		if (errorObj.fileName) {
			// usually a full path to an unrecognizable bundle file
			where += 'in '+ errorObj.fileName;
			if (errorObj.lineNumber) {
				where += ':'+ errorObj.lineNumber;
				if (errorObj.columnNumber)
					where += ':'+ errorObj.columnNumber;
			}
			where = <p> { where } </p>;
		}

		// probably we have info
		let infoNodes = '';
		if (infoObj) {
			infoNodes = <>
				<hr />
				<pre className='traceback'>
					Component Stack: {infoObj ? infoObj.componentStack : '-'}
				</pre>
				<pre className='traceback'>
					infoObj: {JSON.stringify({...infoObj, componentStack: 'see above'}, null, '  ')}
				</pre>
			</>;
		}

		// maybe we have a jumpStart handler
		const { jumpStartDev, jumpStartProd } = this.props;
		let jumpStartButton = null;
		const jumpStartCallback = window.isDevel ? jumpStartDev : jumpStartProd;
		if (jumpStartCallback) {
			jumpStartButton =
				<button onClick={ev => this.jumpStart(errorObj, infoObj)}>
					try to jump start it again
				</button>;
		}

		// the ignore (reset) and the Jump Start (restart) buttons
		let buttonNodes;
		if (this.state.terminalErrorObj) {
			// emergency!  display only the terminal error
				buttonNodes = <p className='rightSide terminal'>
					Too many errors on this component; it's locked closed.
					You must reload ⟳ the page to reactivate it.
				</p>;

				// oh yeah this is from the first error in errorObj so wrong error
				infoNodes = '';
		}
		else {
			// gimme that panel with the two buttons
			buttonNodes = <div className='rightSide'>
				<button onClick={ev => this.reset()}>ignore it</button>
				{jumpStartButton}
			</div>;
		}

		// make references to src files clickable <a links
		const regularStack = errorObj.stack;  //.replace(/\((http\w+\.js)(.*)\)/g,
			//` <a href=$1 target=src> $1 @$2 </a>`);

		return (
			<article className='ErrorBoundaryReport'>
				{ buttonNodes }
				<h1>Exception</h1>
				{ where }
				<p className='messageBox'>
					{ eObj.message || eObj.stack || '-' }
				</p>
				{ infoNodes }
				<hr />
				regular stack:
				<pre className='traceback' dangerouslySetInnerHTML={{ __html: regularStack }}>
				</pre>
			</article>
		);
	}

	// THIS triggers the dialog6
	componentDidUpdate() {
		// production: just restart.  turn off the error condition & roll back whatever
		if (this.state.errorObj && !window.isDevel) {
			setTimeout(() => {
				this.jumpStart();
				// soon it'll rerender, starting over
			}, 100);

		}
	}

	renderDev(errorObj) {
		return JSON.stringify(errorObj);
	}

	renderProd = this.renderDev;

	// try to reanimate frankenstein by calling this callback.
	// It'll call functions passed in as props from our enclosure.
	// Passes the errorObj, infoObj to the callback, if it wants to do something differently.
	jumpStart() {
		const { errorObj, infoObj, terminalErrorObj } = this.state;
		console.log(`jumpStart(): errorObj, infoObj, terminalErrorObj=`, errorObj, infoObj, terminalErrorObj);
		if (terminalErrorObj) return; // bad reputation

		// decide which callback, and call it safely
		const { jumpStartDev, jumpStartProd } = this.props;
		const jsFunc = window.isDevel ? jumpStartDev : jumpStartProd;
		let rv;
		try {
			// call it!  if it's there
			if (jsFunc)
				rv =  jsFunc(errorObj, infoObj);
			this.reset();
		} catch (ex) {
			console.error(`Locking ErrorBoundary because Exception while jumpStart code running:
				$(ex.message}: `);
			console.error(ex.stack || ex.message || ex);
			this.setState({ terminalErrorObj, infoObj, errorObj });

			if (!errorObj) {
				// he's a first offender, be nice
				this.setState({ terminalErrorObj: null, infoObj: null, errorObj: ex });
			}
			else {
				// a repeat offender - terminate
				debugger;
				this.setState({ terminalErrorObj: ex });
			}
		}
		return rv;
	}



	render() {
		const { errorObj, infoObj, terminalErrorObj } = this.state;
		let ermsgs = '';

		if (terminalErrorObj)
			ermsgs = window.isDevel ? this.renderDev(terminalErrorObj) : this.renderProd(terminalErrorObj);
		if (errorObj)
			ermsgs += window.isDevel ? this.renderDev(errorObj) : this.renderProd(errorObj);
		if (infoObj)
			ermsgs += JSON.stringify(infoObj, null, '\t');

		if (ermsgs) {
			return <pre>{ermsgs}</pre>;
		}

		// normal: act like nothing happened
		return this.props.children;
	}

	//render() {
	//	if (this.state.hasError) {
	//		console.log(this.info)
	//		return <main style={{textAlign: 'center', color: '#fee'}}>
	//			<h1>Error in SquishyElectron</h1>
	//			<p style={{backgroundColor: '#400', color: '#fdd'}}>
	//				Error: {this.state.error0 || this.error || '-'}</p>
	//			<p style={{backgroundColor: '#840', color: '#fed'}}>
	//				Stack: {this.info ? this.info.componentStack : '-'}</p>
	//			<p style={{backgroundColor: '#804', color: '#fde'}}>
	//				Info: {JSON.stringify(this.info)}</p>
	//			<p style={{backgroundColor: '#fee', color: '#000'}}>
	//				<button onClick={() => this.recover()}>
	//					try to restart</button></p>
	//		</main>;
	//	}
	//
	//	// otherwise, be transparent
	//	return this.props.children;
	//}
	//
	// will this ever become great?
	recover() {
		let errorMsg = this.state.error0;
		this.setState({hasError: false, error0: null});

		if (this.props.howToRecover)
			this.props.howToRecover(errorMsg);
	}
}

export default ErrorBoundary;
