/*
** resolution dialog -- what you get from the resolution tab in CP
** Copyright (C) 2021-2024 Tactile Interactive, all rights reserved
*/

import React from 'react';


import qeFuncs from '../engine/qeFuncs.js';
import qeConsts from '../engine/qeConsts.js';
import CommonDialog from '../widgets/CommonDialog.js';
import {powerToIndex} from '../utils/powers.js';
import LogSlider from '../widgets/LogSlider.js';
import {eSpaceCreatedPromise} from '../engine/eEngine.js';
import {getASetting, storeAGroup} from '../utils/storeSettings.js';

export default class ResolutionDialog extends React.Component {
	static propTypes = {
	};

	constructor(props) {
		super(props);

		// this is the state in the dialog; will be used to recreate space upon OK().
		// Therefore, initial values set from storage = current settings.
		let N = getASetting('spaceParams', 'N');
		this.state = {
			N,
			powerIndex: powerToIndex(16, N),
			continuum: getASetting('spaceParams', 'continuum'),
			origN: N,
			spaceLength: getASetting('spaceParams', 'spaceLength'),
		};
	}

	/* ******************************************************************* open/close */

	static initialParams;
	static me = this;

	// open the Resolution dialog specifically, passing in the callbacks
	static openResDialog(okCallback, cancelCallback = () => {}) {
		// no more than 1 resolution dialog open at a time so I can store this stuff here
		ResolutionDialog.okCallback = okCallback;
		ResolutionDialog.cancelCallback = cancelCallback;

		// open the general dialog with resolutionDialog as the main component
		CommonDialog.openDialog(
			<ResolutionDialog />
		);
	}

	// called when user clicks OK, before dialog is hidden in App
	OK =
	ev => {
		ResolutionDialog.okCallback(this.state);
		CommonDialog.closeDialog();
	}

	// called when user clicks Cancel, before dialog is hidden in App
	cancel =
	ev => {
		ResolutionDialog.cancelCallback();
		CommonDialog.closeDialog();
	}


	// puts up the resolution dialog, starting with the values from the state
	static openResolutionDialog(grinder) {
		// freeze the frame while this is going on ...
		const timeWasAdvancing = grinder.shouldBeIntegrating;
		grinder.shouldBeIntegrating = false;

		// pass our state upward to load into the dialog
		ResolutionDialog.openResDialog(
			// OK callback
			finalParams => {
				// this is the 0-th dimension of the space, the x axis
				finalParams.label = 'x';

				let {N, continuum, spaceLength} = finalParams;
				storeAGroup('spaceParams',  {N, continuum, spaceLength});
				location = location;   // reload page
			},  // end of OK callback

			// cancel callback
			() => {
				grinder.shouldBeIntegrating = timeWasAdvancing;
			}
		);
	}

	/* ******************************************************************* rendering */

	renderNSlider() {
		const s = this.state;
		return <section className='resolutionSlider'>
			<LogSlider
				unique='resolutionSliderCore'
				className='resolutionSliderCore'
				label='Datapoints'
				minLabel='faster'
				maxLabel='more accurate'

				current={s.N}
				original={s.origN}
				sliderMin={window.isDevel ? 4 : 16 /* evaluate now to make sure isDevel defined */}
				sliderMax={256}

				stepsPerDecade={16}
				willRoundPowers={true}

				handleChange={this.handleResChange}
			/>
			<div className='note'>
				<small>Calculation speed goes as the cube of
				the number of points, so if you use twice
				as many points, it'll take 8× as long to run.</small>
			</div>
		</section>;
	}

	handleResChange =
	(N, powerIndex) => {
		this.setState({
			powerIndex: +powerIndex,
			N: +N,
		});
		console.info(`handleResChange, not effective yet (N=${N}, powerIndex=${powerIndex}) `)
	}

	// Endless or Well
	renderContinuum() {
		const s = this.state;
		const onChange = ev => this.setState({continuum: +ev.target.value});
		return <section className='continuum'>
			<div className='continuumTitle'>what kind of space:</div>
			<label  className='contENDLESS'  key='contENDLESS'>
				<input type='radio' name='continuum'  value={qeConsts.contENDLESS}
					checked={s.continuum == qeConsts.contENDLESS}
					onChange={onChange}
					style={{fontWeight:
						(s.continuum == qeConsts.contENDLESS)
						? 'bold'
						: 'normal'}}/>
				Endless &nbsp;
				<small>wrapping around from right to left</small>
			</label>
			<label  className='contWELL'  key='contWELL'>
				<input type='radio' name='continuum'  value={qeConsts.contWELL}
					checked={s.continuum == qeConsts.contWELL}
					onChange={onChange}
					style={{fontWeight: (s.continuum == qeConsts.contWELL) ? 'bold' : 'normal'}}/>
				Well &nbsp;
				<small>with walls on the ends that a
				<br/>wave packet will bounce against</small>
			</label>
		</section>;
	}


	renderSpaceLength() {
		return <section className='spaceLength'>
			<label className='spaceLengthLabel'>
				Space Length: &nbsp;
				<input value={this.state.spaceLength} placeholder='Fill in length'
					onChange={ev => this.setState({spaceLength: ev.target.value}) }
					size='4' />
				&nbsp; nm
				<div className='note'>
					<small>Total length, in nanometers, of space, resulting in &nbsp;
					{(this.state.spaceLength / this.state.N).toPrecision(4)}&nbsp;nm
					distance between points.</small>
				</div>
			</label>
		</section>;
	}


	// this is just the stuff INSIDE the dialog.  It's all a big grid.
	render() {
		return (
			<article className='dialog ResolutionDialog'>
				{/* all these are a big grid */}
				<h3>Reconfigure the Space</h3>
				{this.renderNSlider()}
				{this.renderContinuum()}
				{this.renderSpaceLength()}
				<section className='okCancel'>
					<button className='cancelButton' onClick={this.cancel}>
							Cancel
					</button>
					<button className='okButton' onClick={this.OK}>
							Recreate Space
					</button>
				</section>

			</article>
		);
	}
}

