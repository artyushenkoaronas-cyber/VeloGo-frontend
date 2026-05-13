import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

window.addEventListener('error', (e) => {
  document.body.innerHTML = `<div style="padding:40px;color:#fff;background:#0f0f0f;min-height:100vh;font-family:monospace"><h2 style="color:#f87171;margin-bottom:16px">JS Error</h2><pre style="color:#fca5a5;font-size:13px;white-space:pre-wrap">${e.message}\n${e.filename}:${e.lineno}\n${e.error?.stack || ''}</pre></div>`;
});

window.addEventListener('unhandledrejection', (e) => {
  document.body.innerHTML = `<div style="padding:40px;color:#fff;background:#0f0f0f;min-height:100vh;font-family:monospace"><h2 style="color:#f87171;margin-bottom:16px">Unhandled Promise</h2><pre style="color:#fca5a5;font-size:13px;white-space:pre-wrap">${e.reason?.message || e.reason}\n${e.reason?.stack || ''}</pre></div>`;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
