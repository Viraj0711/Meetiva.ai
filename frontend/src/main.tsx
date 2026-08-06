import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Reticle — dev-only instrumentation (tree-shaken in production)
if (import.meta.env.DEV) {
  import('./reticle-dev');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
