/*
** clickNDrag -- add-on for a component that user can click in and then drag for some interaction
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

import {interpretCppException} from '../utils/errors.js';

let traceSetup = false;
let traceClick = false;
let traceDrag = false;

// the Target is the element the user clicks down on.
// The Arena is the element the dragging 'should' be confined to (but prob not)
// How to use:
// in constructor: pass three handlers, any of which can be null:
//		this.cnDrag = new clickNDrag(this.onDown, this.onEvent, this.onUp);
// in render():
// when rendering arena, ref={this.cnDrag.refArena}
// when rendering target, ref={this.cnDrag.refTarget}
// No need to set an onMouseDown or any other!  refTarget does it
//
// You are responsible for toggling style.pointerEvents = 'none' or 'visible'
// You are responsible for active: and hover: CSS effects
// You are resposible for changing or moving the target, or any animation
// this does NOT do drag-n-drop, although maybe you could do it thru handlers
// or use d3.
//
// options: {
// outsideWindow: true,  // doesn't stop  dragging if user drags beyond win boundaries
// }
class clickNDrag {
	// onEvent is like onMove but is run for Down, Move and Up
	// Up is also run on mouse out of window
	constructor(onDown, onEvent, onUp, options) {
		this.dragging = false;

		this.onDown = onDown ?? (() => {});
		this.onEvent = onEvent ?? (() => {});
		this.onUp = onUp ?? (() => {});
		this.options = options ?? {};

		// if you want to disable clicks/drags, turn this on for the duration.
		// Will not pick up moves/mouseups if no clickdown happend with this on.
		this.acceptClicks = true;
	}

	// please call this before your component vaporizes, so we can remove the
	// mouseDown handler. not imperative but I think it leaks.
	liquidate() {
		// mouseDownHandler is unique for each instance
		this.targetEl.removeEventListener('mousedown', this.mouseDownHandler);
	}

	/* **************************************************** rectangles */
		// we want page coords so we can use pageX and pageY on events. And, the
		// Inside coords of arena, and Outside of target.  Presumably, the target
		// moves around inside arena. But you'll have to subtract out like the thumb
		// w & h if it'll bump against the sides

	// just for debugging to keep my sanity
	dumpARect(title, rect) {
		console.log(` ${title} 👆top: ${rect.top}`);
		console.log(`left: ${rect.left}👈   ...   width: 👉${rect.width}👈 ...  👉right: ${rect.right}`);
		console.log(`height: 👇👆${rect.height}⬍     bottom: ${rect.bottom}👇`);
	}

	// the outside rectangle of the block element, outside the padding & border
	// in page coords
	getOuterRectangle(el) {
		// the 'client' rectangle is the inner part of the box model box, for
		// each element the 'client' rectangle is also the box that's visible on
		// the browser window, that moves with scrolling, one per browser
		// window. we're talking about the second one.  What idiot came up with
		// that naming convention!???!?!?!
		let outer = el.getBoundingClientRect();
		let rect = {
			width: outer.width,
			left: window.scrollX + outer.left,
			right: window.scrollX + outer.right,
			height: outer.height,
			top: window.scrollY + outer.top,
			bottom: window.scrollY + outer.bottom,
		}
		if (traceSetup)
			this.dumpARect('getOuterRectangle got:', rect)
		return rect;
	}

	// the inside client area rectangle of the block element, inside the border & padding
	// in page coords
	getInnerRectangle(el) {
		let rect = this.getOuterRectangle(el);

		let {clientLeft, clientTop, clientWidth, clientHeight} = el;
		rect.left += clientLeft;
		rect.right = rect.left + clientWidth;  // ??
		rect.width = clientWidth;

		rect.top += clientTop;
		rect.bottom = rect.top + clientHeight;  // ??
		rect.height = clientHeight;

		if (traceSetup)
			this.dumpARect('getInnerRectangle got:', rect)
		return rect;
	}

	catchEventException(ex, handlerTitle) {
		// eslint-disable-next-line no-ex-assign
		ex = interpretCppException(ex);
		console.error(`clickNDrag during mouse${handlerTitle}: `, ex.stack ?? ex.message ?? ex);
	}

	/* **************************************************** Events */
	// this is set as the mouseDown handler - do not set your own
	mouseDown =
	ev => {
		try {
			if (traceClick)
				console.log(`👈 👆  mouseDown`, this, ev);
			if (!this.acceptClicks) return;

			if (this.targetEl && ev.currentTarget !== this.targetEl) {
				debugger;
				throw `mouseDown target isn't right:'`+
					`currentTarget:(${ev.currentTarget.offsetWidth}x${ev.currentTarget.offsetHeight})`+
					` != targetEl (${this.targetEl.offsetWidth}x${this.targetEl.offsetHeight})`;
			}

			// on the off chance stuff happens quickly
			if (ev.buttons & 1) {
				// xDown and yDown relative to arena
				this.xDown = this.xArena = ev.pageX - this.arenaRect.left;
				this.yDown = this.yArena = ev.pageY - this.arenaRect.top;

				this.dragging = true;
				let b = document.body;
				b.addEventListener('mousemove', this.mouseMove);
				b.addEventListener('mouseup', this.mouseUp);
				if (!this.options.outsideWindow)
					b.addEventListener('mouseleave', this.mouseUp);

				this.onDown(this, ev);
				this.eachEvent(ev);

				// shouldn't turn into a text selection
				ev.preventDefault();
				ev.stopPropagation();
			}
			else {
				// in case it didn't figure out to give us a mouseUp in time
				// OR some button other than left got clicked
				console.warn(`👈 👆 some other button`, ev);
				//this.mouseUp(ev);
			}
		} catch (ex) {
			this.catchEventException(ex, 'Down');
		}
	}

	// called upon moves and mouseup/leave.  for every point dragged over.
	// userHandler is either this.onDown, this.onUp, or null
	eachEvent =
	ev => {
		if (!this.dragging || !this.acceptClicks || !(ev.buttons & 1) )
			return;

		// give our caller the x y relative to the arena rect.
		// Above arena => yArena will be negative.  etc.
		this.xArena = ev.pageX - this.arenaRect.left;
		this.yArena = ev.pageY - this.arenaRect.top;
		if (traceDrag)
			console.log(`👈 👆  eachEvent rel to arena: (${this.xArena}, ${this.yArena})`, this, ev);

		this.targetRect = this.getOuterRectangle(this.targetEl);
		//this.figureTargetCoords();

		// where mouse is relative to target
		this.xTarget = ev.pageX - this.targetRect.left;
		this.yTarget = ev.pageY - this.targetRect.top;
		if (traceDrag)
			console.log(`👈 👆  eachEvent rel to target: (${this.xTarget}, ${this.yTarget})`, this, ev);

		// opportunity to move the target, depending on what kind of c&d
		// always called for down, move or up
		this.onEvent(this, ev);

		ev.preventDefault();
		ev.stopPropagation();
	}

	mouseMove =
	ev => {
		try {
			this.eachEvent(ev);
		} catch (ex) {
			this.catchEventException(ex, 'Move');
		}
	}

	mouseUp =
	ev => {
		try {
			if (traceClick)
				console.log(`👈 👆  mouseUp`, this, ev);
			this.eachEvent(ev, this.onUp);
			if (this.dragging && this.acceptClicks)
				this.onUp(this, ev);

			let b = document.body;
			b.removeEventListener('mousemove', this.mouseMove);
			b.removeEventListener('mouseup', this.mouseUp);
			if (!this.options.outsideWindow)
					b.removeEventListener('mouseleave', this.mouseUp);

			this.dragging = false;
		} catch (ex) {
			this.catchEventException(ex, 'Up');
		}
	}


	/* **************************************************** elements */

	// in render, put this in your Target element: ref=(cndrag.refTarget).
	// Target can be same el as arena.  This is where mouseDown will be caught.
	refTarget =
	el => {
		if (!el || this.targetEl === el)
			return;  // dunno why it passes null `refTarget: el is falsy ${el}`;
		this.targetEl = el;

		// by creating a new handler function each time, we can remove the
		// right handler when comes time.
		this.mouseDownHandler = (ev => this.mouseDown(ev));
		el.addEventListener('mousedown', this.mouseDownHandler);
		this.targetRect = this.getOuterRectangle(this.targetEl);
		//this.figureTargetCoords();
	}

	// in render, put this in your Arena element: ref=(cndrag.refArena)
	// we track movements outside of the arena
	refArena =
	el => {
		if (!el)
			return;  // dunno why it does this throw `refArena: el is falsy ${el}`;

		this.arenaEl = el;
		this.arenaRect = this.getInnerRectangle(el);

//		let {clientLeft, clientTop, clientWidth, clientHeight} = el;
//		let arenaRect = {
//			width: clientWidth,
//			left: window.scrollX + clientLeft,
//			right: window.scrollX + clientLeft + clientWidth,
//			height: clientHeight,
//			top: window.scrollY + clientTop,
//			bottom: window.scrollY + clientTop + clientHeight
//		}

//		...(el.getBoundingClientRect())};
//		delete arenaRect.x;  // distractions
//		delete arenaRect.y;

//		if (traceSetup)
//			console.log(`👈 👆  👈 👆  arena outside rect: t...b=${arenaRect.top} ... ${arenaRect.bottom}    `+
//				`l...r=${arenaRect.left} ... t=${arenaRect.right}`);

//		arenaRect.left += window.scrollX + el.clientLeft;
//		arenaRect.right = arenaRect.left + window.scrollX + el.clientWidth;
//		arenaRect.top += window.scrollY + arenaRect.clientTop;
//		arenaRect.bottom = arenaRect.Top + window.scrollY + el.clientHeight;

//		if (traceSetup)
//			console.log(`👈 👆  👈 👆  arenaRect: w=${arenaRect.width}  h=${arenaRect.height}    `+
//				`t...b=${arenaRect.top} ... ${arenaRect.bottom}    `+
//				`l...r=${arenaRect.left} ... t=${arenaRect.right}`);

//		this.arenaRect = arenaRect;
	}

}

export default clickNDrag;

