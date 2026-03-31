// code shared between 2d & 3d


// gee since we're rewriting this, maybe we could make both WaveView and WaveVista func components, and use hooks?!??!

/* ************************** dimensions of canvases */
//
// // this should be common between them cuz the width is shared.
// // oof, but the height is not!  figger this out
//
//
// 	// set this.canvasInnerDims from the right places
// 	updateInnerDims() {
// 		// on the off chance this is not yet an integer, keep our rounded version of the number
// 		this.outerWidth = round(this.props.outerWidth);
//
// 		this.canvasInnerWidth = round(this.outerWidth - DOUBLE_THICKNESS);
// 		this.canvasInnerHeight = round(this.state.outerHeight - DOUBLE_THICKNESS);
// 		if (traceDimensions)
// 			console.log(`🏄 canvas updateInner: w=${this.canvasInnerWidth} h=${this.canvasInnerHeight}`);
// 	}
//
//
// updateInnerDimsEtc called in constructor
// {
// 		this.updateInnerDims();  // after outerWidth done
//
// 		this.formerWidth = this.outerWidth;
// 		this.formerHeight = round(this.state.outerHeight);
//
// 		this.animator = this.props.animator;
//
// }
//
// // the actual componentDidUpdate for WaveView.
// 	componentDidUpdate() {
// 		const p = this.props;
// 		const s = this.state;
// 		this.updateInnerDims();
//
// 		// only need this when the WaveVista outer dims change, either a user
// 		// change height or window change width.  On that occasion, we have to adjust
// 		// a lot, including resizing the canvases.
// 		if ((this.formerWidth != this.outerWidth || this.formerHeight != s.outerHeight) ) {
// 			//this.updateInnerDims();
//
// 			// Size of window & canvas changed!  (or, will change soon)
// 			if (traceDimensions) {
// 				console.log(`🏄 wv Resizing  👀
// 					formerWidth=${this.formerWidth} ≟➔ outerWidth=${this.outerWidth}
// 					formerHeight=${this.formerHeight} ≟➔ outerHeight=${s.outerHeight}
// 					btw props.outerWidth=${this.props.outerWidth}`);
// 			}
//
// 			// trigger a render
// 			this.setState({outerHeight: s.outerHeight});
//
// 			// the formers are OUTER sizes.  All these should be integers by now.
// 			this.formerWidth = this.outerWidth;
// 			this.formerHeight = s.outerHeight;
// 			if (traceDimensions) {
// 				console.log(`🏄 WaveVista canvasInner width is ${this.canvasInnerWidth};  `
// 					+ `now outer width = ${this.outerWidth}`);
// 			}
// 		}
// 	}
//
//
//
//
//
// /* ************************************* resize box */
// 	with the size box that can be different between vista and view
//
// 	// these are for resizing the WaveVista ONLY with the size box
// 	resizePointerDown =
// 	ev => {
// 		this.resizing = true;
// 		this.yOffset = round(this.state.outerHeight - ev.pageY);
// 		if (traceDragCanvasHeight)
// 			console.log(`🏄 resizePointer down ${ev.pageX} ${ev.pageY} offset=${this.yOffset}`);
// 		ev.target.setPointerCapture(ev.pointerId);
// 		ev.preventDefault();
// 		ev.stopPropagation();
// 	}
//
// 	resizePointerMove =
// 	ev => {
// 		if (!this.resizing)
// 			return;
//
// 		const vHeight = round(ev.pageY + this.yOffset);
// 		if (this.state.outerHeight != vHeight)
// 			this.setState({outerHeight: vHeight});
// 		storeASetting('miscSettings', 'vistaHeight', vHeight);
// 		if (traceDragCanvasHeight)
// 		console.log(`🏄 resizePointer drag ${ev.pageX} ${ev.pageY}  newheight=${ev.pageY + this.yOffset}`);
//
// 		ev.preventDefault();
// 		ev.stopPropagation();
// 	}
//
// 	// usually I send pointerLeave events here, but now with pointerCapture, maybe it doesn't matter.
// 	// I do get pointerLeave events, but only after pointerUp, if the pointer is out of the size box.
// 	resizePointerUp =
// 	ev => {
// 		if (traceDragCanvasHeight)
// 		console.log(`🏄 resizePointer up ${ev.pageX} ${ev.pageY}`);
// 		this.resizing = false;
// 		ev.preventDefault();
// 		ev.stopPropagation();
// 	}
//
//



/* ************************** setting up context and space created */

// 	handleSpaceCreatedPromiseAndShit() {
// 		eSpaceCreatedPromise.then(
// 			this.handleSpacePromise,  // call this with (space)
//
// 			// catch
// 			ex => {
// 				console.error(`eSpaceCreatedPromise failed:`, ex.stack ?? ex.message ?? ex);
// 				debugger;
// 			}
// 		);
//
// 	}
//
//
//
// 		// this should only run once between the view and vista
// 		// set up 1/3 of the context: WaveVista
// 		setUpContext() {
// 			// need BOTH context  and the space.  So this is called twice.
// 			const context = this.context;
// 			if (!context) {
// 				// not ready yet so try again
// 				setTimeout(this.setUpContext, 100);
// 				return;
// 			}
//
// 			let wv = context.WaveVista;
// 			if (wv && wv.grinder)
// 				return;  // already done
//
// 			const space = this.space;
// 			wv = {
// 				space: space,
// 				grinder: space.grinder,
//
// 				// somebody's going to want to see both at once.  someday...
// 				show2D: getASetting('miscSettings', 'show2D'),
// 				show3D: getASetting('miscSettings', 'show3D'),
//
// 				// make room for the bumpers for WELL continuum (both sides).  Note that
// 				// continuum can change only when page reloads.
// 				bumperWidth: (qeConsts.contWELL == space.continuum)
// 						? WELL_BUMPER_WIDTH
// 						: 0,
//
// 				mainVDisp: space.vDisp,
// 			};
// 			this.props.setWVContext(wv);
//
// 				// make room for the bumpers for WELL continuum (both sides).  Note that
// 				// continuum can change only when page reloads.
// 			//wv.bumperWidth = (qeConsts.contWELL == space.continuum)
// 			//	? WELL_BUMPER_WIDTH
// 			//	: 0;
//
// 			//wv.mainVDisp = space.vDisp;
//
// 			if (traceContext) {
// 				// Note: the state won't kick in until next render
// 				console.log(`🏄 WaveVista setUpContext context:`,
// 					context.setShouldBeIntegrating,
// 					context.controlPanel,
// 					context.WaveVista,
// 				);
// 			}
// 			return;  // done
// 		}
//
//
// 		// set up 2/3 of the context: WaveVista and engine
// 		handleSpacePromise = (space) => {
// 			// this will kick off a render, now that the avatar is in place
// 			this.setState({space});
// 			this.space = space;  // for immediate access
//
// 			this.grinder = space.grinder;
//
// 			const ani = this.props.animator;
// 			if (ani && !ani.grinder)
// 				ani.grinder = this.grinder;
//
// 			// make room for the bumpers for WELL continuum (both sides).  Note that
// 			// continuum can change only when page reloads.
// 			this.bumperWidth = (qeConsts.contWELL == space.continuum)
// 				? WELL_BUMPER_WIDTH
// 				: 0;
//
// 			this.mainVDisp = space.vDisp;
//
// 			this.setUpContext();
// 		}
//

