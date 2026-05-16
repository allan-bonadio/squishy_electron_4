/*
** Spinner -- a circular spinning thing
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

import PropTypes from 'prop-types';

const propTypes = {
   width: PropTypes.number.isRequired,
   height: PropTypes.number.isRequired,

}

function Spinner(props) {
	cfpt(propTypes, props);

	return <div className='spinnerBox'
						style={{width: props.width+'px', height: props.height+'px'}} >
			<img className='spinner' alt='spinner'
				src='/images/eclipseOnTransparent.gif' />
		</div>;
}

export default Spinner;
