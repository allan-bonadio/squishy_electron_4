/*
** resolution dialog -- what you get from the resolution tab in CP
** Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
*/

import React from 'react';
//import PropTypes from 'prop-types';

import qe from '../engine/qe.js';
import CommonDialog from '../widgets/CommonDialog.js';
import {powerToIndex} from '../utils/powers.js';
import LogSlider from '../widgets/LogSlider.js';
//import listOfViewClasses from '../gl/listOfViewClasses.js';
//import SquishPanel from '../SquishPanel.js';
import {recreateMainSpace, eSpaceCreatedPromise} from '../engine/eEngine.js';
import {getASetting} from '../utils/storeSettings.js';
import ControlPanel from './ControlPanel.js';


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
	static openResDialog(okCallback, cancelCallback) {
		// there is no more than 1 resolution dialog open at a time so I can store this stuff here
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
	static openResolutionDialog() {
		// freeze the frame while this is going on ...
		const timeWasAdvancing = ControlPanel.isTimeAdvancing;
		ControlPanel.isTimeAdvancing = false;

		// pass our state upward to load into the dialog
		ResolutionDialog.openResDialog(
			// OK callback
			finalParams => {
				// this is the 0-th dimension of the space, the x axis
				finalParams.label = 'x';
				recreateMainSpace(finalParams);

				// do i really have to wait?  I think the promise only works the first time.
				// In fact, don't all components vaporize as a result of this?
				eSpaceCreatedPromise
				.then(space => {
					ControlPanel.isTimeAdvancing = timeWasAdvancing;
				});
			},  // end of OK callback

			// cancel callback
			() => {
				ControlPanel.isTimeAdvancing = timeWasAdvancing;
			}
		);
	}

	/* ******************************************************************* rendering */

	renderNSlider() {
		const s = this.state;
		return <>
			<LogSlider
				unique='resolutionSlider'
				className='resolutionSlider'
				label='Datapoints'
				minLabel='faster'
				maxLabel='more accurate'

				current={s.N}
				original={s.origN}
				sliderMin={window.isDevel ? 4 : 32 /* evaluate now to make sure isDevel defined */}
				sliderMax={1024 /* MAX_SLIDER_RES */}

				stepsPerDecade={16}
				willRoundPowers={true}

				handleChange={this.handleResChange}
			/>
		</>;
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
		return <div className='continuum'>
			what kind of space:
			<label  key='contENDLESS'>
				<input type='radio' name='continuum'  value={qe.contENDLESS}
					checked={s.continuum == qe.contENDLESS}
					onChange={onChange}
					style={{fontWeight:
						(this.props.continuum == qe.contENDLESS)
						? 'bold'
						: 'normal'}}/>
				Endless
				<br /><small>wrapping around from right to left</small>
			</label>
			<label  key='contWELL'>
				<input type='radio' name='continuum'  value={qe.contWELL}
					checked={s.continuum == qe.contWELL}
					onChange={onChange}
					style={{fontWeight: (this.props.continuum == qe.contWELL) ? 'bold' : 'normal'}}/>
				Well
				<br /><small>with walls on the ends that wave packet will bounce against</small>
			</label>
			{/* <label  key='contDISCRETE'><input type='radio' name='continuum'  value={qe.contDISCRETE}
					checked={s.continuum == qe.contDISCRETE}
					onChange={onChange}
					style={{fontWeight:
						(this.props.continuum == qe.contDISCRETE)
						? 'bold'
						: 'normal'}}
						disabled />
				Discreet Quanta (not developed yet)</label> */}
		</div>;
	}

//					style={{float: 'left', width: '45%', paddingRight: '2em'}} >
//					style={{float: 'left', width: '45%', paddingRight: '2em'}} >



	render() {
		return (
			<article className='dialog ResolutionDialog'>

				<h3>Reconfigure the Space</h3>

				<section className='dialogSection NSlider' key='NSlider'>
					{this.renderNSlider()}
				</section>

				<section className='dialogSection continuumRadios'  key='continuumRadios'>
					{this.renderContinuum()}
				</section>

				<section className='dialogSection spaceLength'  key='spaceLength'>
					<label>Space Length: &nbsp;
						<input value={this.state.spaceLength} placeholder='Fill in length'
							onChange={ev => this.setState({spaceLength: ev.target.value}) } />
						nm
						<br />
						<small>Total length, in nanometers, of space, resulting
						in {(this.state.spaceLength /(this.state.N - 1)).toPrecision(3)}nm
						separation between points</small>
					</label>
				</section>

				<section className='dialogSection buttons' key='buttons' >
					<button className='cancelButton' onClick={this.cancel}>
							Cancel
					</button>
					<button className='okButton'
						onClick={this.OK}>
							Recreate Space
					</button>
				</section>

			</article>
		);
	}
}

