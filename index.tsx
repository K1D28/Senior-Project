import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

console.log('index.tsx: Loading...');
console.log('React version:', React.version);
console.log('Environment:', import.meta.env.MODE);
console.log('VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
  throw new Error("Could not find root element to mount to");
}

console.log('Root element found, initializing React...');

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
  console.log('React app rendered successfully');
} catch (error) {
  console.error('Error rendering React app:', error);
  rootElement.innerHTML = `<div style="padding: 20px; color: red;">Error loading app: ${error instanceof Error ? error.message : String(error)}</div>`;
}
