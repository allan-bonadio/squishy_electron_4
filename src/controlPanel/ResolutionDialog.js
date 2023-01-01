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


// yeah, these are IN ADDITION TO the storeSettings criteria, cuz that's only powers of 2
const MIN_2SLIDER_RES = process.env.NODE_ENV == 'development' ? 4 : 32;
const MAX_2SLIDER_RES = 1024;

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
		CommonDialog.startClosingDialog();
	}

	// called when user clicks Cancel, before dialog is hidden in App
	cancel =
	ev => {
		ResolutionDialog.cancelCallback();
		CommonDialog.startClosingDialog();
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
				sliderMin={MIN_2SLIDER_RES}
				sliderMax={MAX_2SLIDER_RES}

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
		console.info(`handleResChange(N=${N}, powerIndex=$powerIndex) `)
	}

	renderContinuum() {
		const s = this.state;
		const onChange = ev => this.setState({continuum: +ev.target.value});
		return <>
			what kind of space:
			<label  key='contENDLESS'><input type='radio' name='continuum'  value={qe.contENDLESS}
					checked={s.continuum == qe.contENDLESS}
					onChange={onChange}
					style={{fontWeight:
						(this.props.continuum == qe.contENDLESS)
						? 'bold'
						: 'normal'}}/>
				Endless, wrapping around</label>
			<label  key='contWELL'><input type='radio' name='continuum'  value={qe.contWELL}
					checked={s.continuum == qe.contWELL}
					onChange={onChange}
					style={{fontWeight:
						(this.props.continuum == qe.contWELL)
						? 'bold'
						: 'normal'}}/>
				Well with Walls</label>
			{/* <label  key='contDISCRETE'><input type='radio' name='continuum'  value={qe.contDISCRETE}
					checked={s.continuum == qe.contDISCRETE}
					onChange={onChange}
					style={{fontWeight:
						(this.props.continuum == qe.contDISCRETE)
						? 'bold'
						: 'normal'}}
						disabled />
				Discreet Quanta (not developed yet)</label> */}
		</>;
	}

	render() {
		return (
			<article className='dialog ResolutionDialog'>

				<h3>Reconfigure the Space</h3>

				<section className='dialogSection' key='NSlider'>
					{this.renderNSlider()}
				</section>

				<section className='dialogSection'  key='continuumRadios'
					style={{float: 'left', width: '45%', paddingRight: '2em'}} >
					{this.renderContinuum()}
				</section>

				<section className='dialogSection' key='setButton'
					style={{padding: '1em', margin: '1em', textAlign: 'right'}}>
					<button className='cancelButton round' onClick={this.cancel}>
							Cancel
					</button>
					<button className='setResolutionOKButton round'
						onClick={this.OK}>
							Recreate Space
					</button>
				</section>

			</article>
		);
	}
}

