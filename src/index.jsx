import React from 'react';
import ReactDOM from 'react-dom/client';

// ⚠️ Syncfusion CSS — REQUIRED. Use material-dark to match the dark theme.
// Switch to 'material' if you want the light theme.
import '@syncfusion/ej2-base/styles/material-dark.css';
import '@syncfusion/ej2-buttons/styles/material-dark.css';
import '@syncfusion/ej2-inputs/styles/material-dark.css';
import '@syncfusion/ej2-popups/styles/material-dark.css';
import '@syncfusion/ej2-navigations/styles/material-dark.css';
import '@syncfusion/ej2-react-pdfviewer/styles/material-dark.css';

import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);