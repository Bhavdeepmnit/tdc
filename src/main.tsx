import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Client entry point. Mounts <App> into #root in React StrictMode.
 * The PWA service worker is auto-registered by vite-plugin-pwa (injectRegister).
 */
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found in index.html');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
