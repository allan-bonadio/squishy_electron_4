/*
** index js -- root JS file for Squishy Electron
** Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
*/

// uncomment this only for debugging re-render bugs
//import './wdyr'; // <--- wdyr must be first import

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import ErrorBoundary from './widgets/ErrorBoundary.js';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<ErrorBoundary>
		<App />
	</ErrorBoundary>
);

// wasted so much time on this
//   <React.StrictMode>
//   </React.StrictMode>
