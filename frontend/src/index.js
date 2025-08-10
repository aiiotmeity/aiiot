import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Get the root element
const container = document.getElementById('root');

// Create root and render app
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);