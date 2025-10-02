/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import { AppProvider } from './AppContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);