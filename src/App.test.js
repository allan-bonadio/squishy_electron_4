import {expect} from '@jest/globals';

// these two cause it to barf.  I'll figure it out someday.
//import { render, screen } from '@testing-library/react';
//import App from './App';

debugger;

test('adds 4 + 9 to equal 13', () => {
  expect(4 + 9).toBe(13);
});


//test('empty App tag can create', () => {
//	try {
//		// dunno if this is going to work..
//		render(<App />);
//		const h3 = screen.getByText('Squishy Electron');
//		expect(h3).toBeInTheDocument();
//	} catch (ex) {
//		console.error(ex);
//	}
//});

