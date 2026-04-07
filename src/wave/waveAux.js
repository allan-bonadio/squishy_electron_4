/*
** waveAux -- managing the wave component width and height
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

// common code between the wavevista and waveview
// methods spliced onto the two components from the waveAux.
// So, remember, 'this' is the WaveView or WaveVista, not the waveAux
// Same for this.props
// the width is shared. oof, but the height is not!

// NOT a class; just an object full of methods.  We'll assign them to
// the instances of WaveViews and WaveVistas.  So nobody 'constructs'
// this; it's compiled right here ready to use

const CANVAS_BORDER_THICKNESS = 1;
const DOUBLE_THICKNESS = 2 * CANVAS_BORDER_THICKNESS;

let traceDimensions = false;
let traceDragCanvasHeight = false;

export const waveAux = {

	CANVAS_BORDER_THICKNESS,
	DOUBLE_THICKNESS,

	// set this.canvasInner* from the right places
	updateInnerDims() {
		// on the off chance this is not yet an integer, keep our rounded version of the number
		// this is like the edge of the widow/document
		this.outerWidth = Math.round(this.props.outerWidth);

		// then this is inside the border around the canvases
		this.canvasInnerWidth = Math.round(this.outerWidth - this.DOUBLE_THICKNESS);
		this.canvasInnerHeight = Math.round(this.state.outerHeight - this.DOUBLE_THICKNESS);
		if (traceDimensions)
			console.log(`🏄 canvas updateInner: w=${this.canvasInnerWidth} h=${this.canvasInnerHeight}`);
	},

	// called in constructors
	createInnerDims() {
			this.updateInnerDims();  // after outerWidth done

			this.formerWidth = this.outerWidth;
			this.formerHeight = Math.round(this.state.outerHeight);

			this.animator = this.props.animator;

	},

	// the actual componentDidUpdate for WaveView or Vista.
	componentDidUpdate() {
		const p = this.props;
		const s = this.state;
		this.updateInnerDims();

		// only need this when the WaveVista outer dims change, either a user
		// change height or window change width.  On that occasion, we have to adjust
		// a lot, including resizing the canvases.
		if ((this.formerWidth != this.outerWidth || this.formerHeight != s.outerHeight) ) {
			//this.updateInnerDims();

			// Size of window & canvas changed!  (or, will change soon)
			if (traceDimensions) {
				console.log(`🏄 wv Resizing  👀
					formerWidth=${this.formerWidth} ≟➔ outerWidth=${this.outerWidth}
					formerHeight=${this.formerHeight} ≟➔ outerHeight=${s.outerHeight}
					btw props.outerWidth=${this.props.outerWidth}`);
			}

			if (this.canvasResized)
				this.canvasResized();  // vista only

			// trigger a render.  But only if they actually changed!  potential for ∞ loop.
			this.setState({outerHeight: s.outerHeight});

			// the formers are OUTER sizes.  All these should be integers by now.
			this.formerWidth = this.outerWidth;
			this.formerHeight = s.outerHeight;
			if (traceDimensions) {
				console.log(`🏄 WaveVista canvasInner width is ${this.canvasInnerWidth};  `
					+ `now outer width = ${this.outerWidth}`);
			}
		}
	},



/* ************************************* resize box */
	// with the size box that can be different between vista and view

	// these are for resizing the WaveView/Vista ONLY with the size box. usually
	// event handlers are arrow functions, but in this case there is no 'this'
	// that they're being compiled under, so we have to use Function functions.

	resizePointerDown(ev) {
		this.resizing = true;
		this.yOffset = Math.round(this.state.outerHeight - ev.pageY);
		if (traceDragCanvasHeight)
			console.log(`🏄 resizePointer down ${ev.pageX} ${ev.pageY} offset=${this.yOffset}`);
		ev.target.setPointerCapture(ev.pointerId);
		ev.preventDefault();
		ev.stopPropagation();
	},

	resizePointerMove(ev) {
		if (!this.resizing)
			return;

		const vHeight = Math.round(ev.pageY + this.yOffset);
		if (this.state.outerHeight != vHeight)
			this.setState({outerHeight: vHeight});
		storeASetting('miscSettings', 'vistaHeight', vHeight);
		if (traceDragCanvasHeight)
			console.log(`🏄 resizePointer drag ${ev.pageX} ${ev.pageY} `
					+`  newheight=${ev.pageY + this.yOffset}`);

		ev.preventDefault();
		ev.stopPropagation();
	},

	// usually I send pointerLeave events here, but now with pointerCapture, maybe it doesn't matter.
	// I do get pointerLeave events, but only after pointerUp, if the pointer is out of the size box.
	resizePointerUp(ev) {
		if (traceDragCanvasHeight)
			console.log(`🏄 resizePointer up ${ev.pageX} ${ev.pageY}`);
		this.resizing = false;
		ev.preventDefault();
		ev.stopPropagation();
	}
}


export default waveAux;


