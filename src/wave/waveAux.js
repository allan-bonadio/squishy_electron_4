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



}


export default waveAux;


