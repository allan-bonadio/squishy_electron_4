/*
** Potential Area -- the white potential line, and its tactile
**	      interactions when the user moves it.  for Squishy Electron
** Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
*/

import React from 'react';
import PropTypes from 'prop-types';

import qe from '../engine/qe';
import eSpace from '../engine/eSpace';
import {dumpPotential} from '../utils/potentialUtils';




// ultimately, this is a <svg node with a <path inside it
export class PotentialArea extends React.Component {
	static propTypes = {
		width: PropTypes.number.isRequired,
		height: PropTypes.number.isRequired,

		// for first couple of renders, space and wholeRect are null
		space: PropTypes.instanceOf(eSpace),
		wholeRect: PropTypes.object,

		setUpdatePotentialArea: PropTypes.func,
	};

	constructor(props) {
		super(props);
		// why is this called so many times!?!?!?!?!  console.log(`PotentialArea(...`, props, (new Error()).stack);

		this.state = {
			// should just use forceUpdate on our comp obj instead!
			changeSerial: 0,
		};

		// should just use forceUpdate on our comp obj instead!
		props.setUpdatePotentialArea(this.updatePotentialArea);
	}

	/* ***************************************************  click & drag */

	mouseReveal(title, ev, x) {
		console.log(`mouse %s on point (%f,%f) potential[%d]=%f`,
			title,
			ev.clientX, ev.clientY,
			x, this.potentialBuffer[x]);
	}

	// every time user changes it
	changePotential(ev, title) {
		const p = this.props;
		if (!p.wholeRect)
			return;
		let newPotential = p.wholeRect.y + p.wholeRect.height - ev.clientY;
		newPotential -= 5;  // dunno but this works better
		let ix = Math.floor((ev.clientX - p.wholeRect.x) / this.barWidth);
		console.log(`mouse %s on point (%f,%f) potential[%d]=%f`,
			title,
			ev.clientX, ev.clientY,
			ix, this.potentialBuffer[ix]);//,
			this.mouseReveal(title, ev, ix);

		this.potentialBuffer[ix] = newPotential;

		//qe.set1DPotential(ix, p.height + p.y - newPotential);
		this.updatePotentialArea();
	}

	mouseDown(ev) {
		// a hit! otherwise we wouldn't be calling the event handler.
		this.changePotential(ev, 'M down');
		this.dragging = true;
		//debugger;
	}

	mouseMove(ev) {
		if (ev.buttons && this.dragging) {
			//this.mouseReveal('move DRAGGING', ev, ix);
			this.changePotential(ev, 'move DRAGGING');
			this.dragging = true;
			//debugger;
		}
		else {
			this.dragging = false;
			//this.mouseReveal('not dragging', ev, 0);
		}
	}

	mouseUp(ev) {
		const p = this.props;
		this.dragging = false;

		this.changePotential(ev, 'mouse UP');
		//this.mouseReveal('mouse UP', ev, ix);

		dumpPotential(p.space, this.potentialBuffer, 8);
	}

	/* *************************************************** drawing */

	updatePotentialArea =
	() => {
		this.forceUpdate();
	}

	// make the sequence of coordinates the white line needs to draw
	// as compressed as possible
	makePathAttribute(start, end) {
		//if (! p.space)  won't be called if no spae
		//	return `M0,0`;  // too early

		const p = this.props;

		const space = p.space;
		//let height = p.height;
		//const dim = space.dimensions[0];
		const potentialBuffer = this.potentialBuffer = space.potentialBuffer;
		const points = new Array(this.nPoints);
		let potential = potentialBuffer[start];  //qe.get1DPotential(dim.start);
		points[start] = `M0,${potential}L `;
		for (let ix = start+1; ix < end; ix++) {
			potential = potentialBuffer[ix];
			points[ix] = `${(ix * this.barWidth).toFixed(1)},${(potential).toFixed(1)} `;
		}
		if (start) {
			points.pop();
			points.shift();
		}
		return points.join('');
	}

	renderPaths() {
		const p = this.props;

		let {start, end} = p.space.startEnd;
		let paths = [];

		switch (p.space.dimensions[0].continuum) {
			//case 	qe.contDISCRETE:
			case qe.contWELL:
				// stone slabs on each end on the borders
				paths.push(
					<rect className='left wellSlab' key='left'
						x={0} y={0} width={this.barWidth} height={p.height}
					/>
				);
				paths.push(
					<rect className='right wellSlab' key='right'
						x={p.width - this.barWidth} y={0} width={this.barWidth} height={p.height}
					/>
				);
				break;

			case qe.contENDLESS:
				//full width including boundaries
				start = 0;
				end += 1;
				break;

			default: throw `bad continuum ${p.space.dimensions.continuum}`;
		}

		// the lines themselves
		const pathAttribute = this.makePathAttribute(start, end);
		paths.push(
			<path className='visibleLine' key='visible'
				d={pathAttribute}
				fill="transparent"
			/>
		);
		paths.push(
			<path className='tactileLine' key='tactile'
				d={pathAttribute}
				stroke='#fff4'
				fill="transparent"
				onMouseDown={ev => this.mouseDown(ev)}
			/>
		);
		return paths
	}

	static whyDidYouRender = true;
	static rendered = 0;
	render() {
		PotentialArea.rendered++;
		console.info(`PotentialArea 🤢 🤢 rendered ${PotentialArea.rendered} times`);

		const p = this.props;
		if (! p.space)
			return '';  // too early
		this.nPoints = p.space.nPoints;
		this.barWidth = p.width / this.nPoints;
		//debugger;

		return (
			<svg className='PotentialArea' viewBox={`0 0 ${p.width} ${p.height}`}
					width={p.width} height={p.height}
					onMouseMove={ev => this.mouseMove(ev)}
					onMouseUp={ev => this.mouseUp(ev)}
					ref={el => this.svgElement = el}
			 	>

				{this.renderPaths()}
			</svg>
		);
	}
}

export default PotentialArea;

