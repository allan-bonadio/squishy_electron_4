/*
** errors - helpers for error handling and debugging
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

import qe from '../engine/qe';

/* ****************************************************** diagnostics */

export function dumpJsStack(where = 'somewhere') {
	console.info(`${where} traceback: ${(new Error()).stack.replace(/^.*\n.*at dumpJsStack.*\n/, '\n')}`);
}


/* ****************************************************** error/exception handling from C++ */

class cppError extends Error {
	constructor(exNumber) {
		super('from C++: ' + window.UTF8ToString(qe.getCppExceptionMessage(exNumber)));

// 		name = 'cppError';
		this.code = exNumber;  // nobody uses this yet
	}

	name = 'cppError';
}

export function interpretCppException(ex) {
	if (typeof ex != 'number')
		return ex;

	return new cppError(ex);
}

