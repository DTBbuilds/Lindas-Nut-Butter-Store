import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { CartProvider } from './contexts/CartContext';
import * as serviceWorker from './serviceWorker';

const root = ReactDOM.createRoot(document.getElementById('root'));
// Global error handler to suppress extension errors
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('Could not establish connection. Receiving end does not exist')) {
    // Suppress content.js error from extensions
    event.preventDefault(); // Prevent it from being logged to the console by the browser's default handler
    console.warn('Suppressed browser extension error:', event.message);
    return;
  }
});

root.render(
  <React.StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note that this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorker.unregister(); // Use unregister() to disable service worker in development
