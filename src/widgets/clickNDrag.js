/*
** clickNDrag -- add-on for a component that user can click in and then drag for some interaction
** Copyright (C) 2023-2023 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

let traceSetup = true;
let traceClick = true;
let traceDrag = true;

// the Target is the element the user clicks down on.
// The Arena is the element the dragging 'should' be confined to (but prob not)
// How to use: in constructor, three handlers, any of which can be null
//		this.cndrag = new clickNDrag(onDown, onMove, onUp);
//
// when rendering target, ref={this.cndrag.refTarget}
// when rendering arena, ref={this.cndrag.refArena}
class clickNDrag {
	constructor(onDown, onPoint, onUp) {
		this.dragging = false;

		this.onDown = onDown; || () => {};
		this.onPoint = onPoint || () => {};
		this.onUp = onUp || () => {};
	}

	/* **************************************************** Events */
	// use this as the React mouseDown handler on the target
	// eg onMouseDown={cnd.mouseDown}
	mouseDown =
	ev => {
		if (traceClick)
			console.log(`👆🏻 mouseDown`, this, ev);

		if (ev.currentTarget !== this.targetEl) {
			throw `mouseDown target `+
				`(${ev.currentTarget.offsetWidth}x${ev.currentTarget.offsetHeight})`+
				` != targetEl (${this.targetEl.offsetWidth}x${this.targetEl.offsetHeight})`;
		}

		// on the off chance stuff happens quickly
		if (ev.buttons & 1) {
			this.xDown = ev.pageX - arenaRect.left;
			this.yDown = ev.pageY - arenaRect.top;
			this.onDown(this.xDown, this.yDown);

			this.dragging = true;
			body.addEventListener('mousemove', this.mouseMove);
			body.addEventListener('mouseleave', this.mouseUp);
			body.addEventListener('mouseup', this.mouseUp);
		}
		else {
			// in case it didn't figure out to give us a mouseUp in time//// remove someday
			console.warn(`👆🏻 👆🏻in case it didn't set ev.buttons for some reason`, ev);
			this.mouseUp(ev);
		}

		// shouldn't turn into a text selection
		ev.preventDefault();
		ev.stopPropagation();
	}


	// called upon moves and mouseup/leave.  for every point dragged over.
	eachPoint =
	(ev, onWhat) => {
		if (this.dragging) {
			if (ev.buttons & 1) {
				// give our caller the x y relative to the arena rect.
				// Above arena => yArena will be negative.  etc.
				this.xArena = ev.pageX - arenaRect.left;
				this.yArena = ev.pageY - arenaRect.top;
				if (traceClick)
					console.log(`👆🏻 eachPoint rel to arena: (${this.xArena}, ${this.yArena})`, this, ev);

				// relative to target rect
				this.xTarget = ev.pageX - targetRect.left;
				this.yTarget = ev.pageY - targetRect.top;
				if (traceClick)
					console.log(`👆🏻 eachPoint rel to target: (${this.xTarget}, ${this.yTarget})`, this, ev);

				// opportunity to more the target, depending on what kind of c&d
				onWhat(this);
				this.figureTargetCoords();

				ev.preventDefault();
				ev.stopPropagation();
			}
			else {
				// in case it didn't figure out to give us a mouseUp in time//// remove someday
				console.warn(`👆🏻 👆🏻mouseMove: in case it didn't figure out to give us a mouseUp in time`, ev);
				this.mouseUp(ev);
			}
		}
	}

	mouseMove =
	ev => {
		if (traceDrag)
			console.log(`👆🏻 mouseMove`, this, ev);

		this.eachPoint(ev, this.onMove);
	}

	mouseUp =
	ev => {
		if (traceClick)
			console.log(`👆🏻 mouseDown`, this, ev);
		this.eachPoint(ev, this.onUp);

		body.removeEventListener('mousemove', this.mouseMove);
		body.removeEventListener('mouseleave', this.mouseUp);
		body.removeEventListener('mouseup', this.mouseUp);
		this.dragging = false;
	}

	/* **************************************************** elements */

	// every mouse move, the target might have been moved.  Keep targetRect up to date.
	figureTargetCoords() {
		// outside size, including padding & border
		let targetRect = el.getBoundingClientRect();
		delete targetRect.x;  // distractions
		delete targetRect.y;

		// we want page coords so we can use pageX and pageY on events
		targetRect.left += window.scrollX;
		targetRect.right += window.scrollX;
		targetRect.top += window.scrollY;
		targetRect.bottom += window.scrollY;

		if (traceSetup)
			console.log(`👆🏻 👆🏻 targetRect: t...b=${targetRect.top} ... ${targetRect.bottom}    `+
				`l...r=${targetRect.left} ... t=${targetRect.right}`);
		this.targetRect = targetRect;
	}

	// in render, put this in your Target element: ref=(cndrag.refTarget)
	refTarget =
	el => {
		this.targetEl = el;
		this.figureTargetCoords();
	}

	// in render, put this in your Arena element: ref=(cndrag.refArena)
	refArena =
	el => {
		this.arenaEl = el;

		let arenaRect = el.getBoundingClientRect();
		delete arenaRect.x;  // distractions
		delete arenaRect.y;

		if (traceSetup)
			console.log(`👆🏻 👆🏻 arena outside rect: t...b=${arenaRect.top} ... ${arenaRect.bottom}    `+
				`l...r=${arenaRect.left} ... t=${arenaRect.right}`);

		// we want page coords so we can use pageX and pageY on events.
		// And, the Inside coords, not Outside.  client area.  Presumably, the target moves around in here.
		// But you'll have to subtract out like the thumb w & h
		arenaRect.left += window.scrollX + el.clientLeft;
		arenaRect.right = arenaRect.left + window.scrollX + el.clientWidth;
		arenaRect.top += window.scrollY + arenaRect.clientTop;
		arenaRect.bottom = arenaRect.Top + window.scrollY + el.clientHeight;

		if (traceSetup)
			console.log(`👆🏻 👆🏻 arenaRect: t...b=${arenaRect.top} ... ${arenaRect.bottom}    `+
				`l...r=${arenaRect.left} ... t=${arenaRect.right}`);

		this.arenaRect = arenaRect;
	}

}

export default clickNDrag;

