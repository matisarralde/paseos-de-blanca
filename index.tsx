
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  const errorElement = document.createElement('pre');
  errorElement.textContent = 'An error occurred during rendering: ' + error.message + '\n' + error.stack;
  document.body.innerHTML = '';
  document.body.appendChild(errorElement);
  console.error(error);
}
