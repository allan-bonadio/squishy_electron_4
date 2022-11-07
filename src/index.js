// uncomment this only for debugging re-render bugs
//import './wdyr'; // <--- wdyr must be first import

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
//import {interpretCppException} from './utils/errors';
//
// before ANYTHING happens
//window.addEventListener("error", ev => {
//	console.error(`window error handler`, ev);
//	debugger;
//
//	let ex = interpretCppException(ev.error);
//
//	let style = "position: fixed; padding: 5em; "
//		+ "min-width: 25em; left: 30%; right: 30%; "
//		+ "min-height: 10em; top: 20%; right: 40%; "
//		+ "border: 3px #aaa outset; color: #000; background-color: #f44; "
//		+ "text-align: center; z-index: 100; overflow-wrap: break-word; ";
//
//	let html = `
//	<h3>Sorry, Squishy Electron got an error.</h3>
//	<p>${ex.stack || ex.message || JSON.stringify(ex)}</p>
//	<p><i><small>:${ev.lineno}:${ev.colno}</small></i></p>
//	<button onclick='location=location' style='padding: 1em; border-radius: 1em;'>reload</button>`;
//
//	let asideEl = document.createElement('aside');
//	asideEl.setAttribute('style', style);
//	asideEl.innerHTML = html;
//	document.body.insertAdjacentElement('beforeend', asideEl);
//
//});


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// wasted so much time on this
//   <React.StrictMode>
//   </React.StrictMode>



// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.info);
